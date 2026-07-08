import { ACCOUNT_DISABLED_MESSAGE } from "../constants/authMessages";
import { AppError } from "../middlewares/error.middleware";
import {
  CollaboratorModel,
  InstructorModel,
  PartnerModel,
  StudentModel,
  UserModel,
} from "../models";
import { User } from "../types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validatePassword } from "../utils/passwordValidation";

export const registerUser = async (userData: Partial<User>) => {
  // Validate password before hashing
  if (userData.password) {
    validatePassword(userData.password);
  }
  
  const hashedPassword = await bcrypt.hash(userData.password!, 10);
  const newUserData: Partial<User> = {
    ...userData,
    password: hashedPassword,
  };

  try {
    let newUser: any;
    switch (newUserData.userType) {
      case "student":
        newUser = new StudentModel(newUserData);
        break;
      case "instructor":
        newUser = new InstructorModel(newUserData);
        break;
      case "collaborator":
        newUser = new CollaboratorModel(newUserData);
        break;
      case "partner":
        newUser = new PartnerModel(newUserData);
        break;
      default:
        newUser = new StudentModel(newUserData);
        break;
    }
    await newUser.save();
    return newUser;
  } catch (error) {
    throw new AppError("Internal server error", 500);
  }
};

export const loginUser = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail }).select(
    "+password",
  );
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.provider !== "credentials") {
    throw new AppError(
      `User is registered with ${user.provider.toUpperCase()}!`,
      401
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  if (user.status !== "active") {
    throw new AppError(ACCOUNT_DISABLED_MESSAGE, 403);
  }

  // Remove password from the returned user object
  const userWithoutPassword = user.toObject();
  delete (userWithoutPassword as any).password;

  return userWithoutPassword;
};

export const oauthSignIn = async (
  email: string,
  firstName: string,
  lastName: string,
  provider: User["provider"],
  userType = "student" as User["userType"],
  profilePicture: string
) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      const newUser = await registerUser({
        email,
        firstName,
        lastName,
        provider,
        userType,
        profilePicture,
      });
      return newUser;
    }

    if (user.provider !== provider) {
      throw new AppError(
        `User is registered with ${user.provider.toUpperCase()}!`,
        401
      );
    }

    return user;
  } catch (error) {
    throw new AppError("Internal server error", 500);
  }
};

export const logoutUser = async (userId: string) => {
  try {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    });
  } catch (error) {
    throw new AppError("Internal server error", 500);
  }
};

export const cleanupExpiredTokens = async () => {
  try {
    const now = new Date();
    // Remove tokens past their absolute (hard) cap from all users without any further processing.
    await UserModel.updateMany(
      { "refreshTokens.absoluteExpiresAt": { $lt: now } },
      { $pull: { refreshTokens: { absoluteExpiresAt: { $lt: now } } } },
    );
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
  }
};

/**
 * Reuse detection response: when a rotated refresh token is replayed beyond its
 * grace window, the whole lineage is assumed compromised and revoked.
 */
export const revokeRefreshTokenFamily = async (
  userId: unknown,
  family: string,
) => {
  try {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { "refreshTokens.$[elem].isActive": false } },
      { arrayFilters: [{ "elem.family": family }] },
    );
  } catch (error) {
    console.error("Error revoking refresh token family:", error);
  }
};

/**
 * On explicit logout, drop every refresh token in the current lineage. This
 * kills the session server-side (not just the client cookie) and prevents the
 * array from accumulating orphaned entries across login/logout cycles. Only the
 * current device's family is removed — other sessions stay signed in.
 */
export const removeRefreshTokenFamily = async (
  userId: unknown,
  family: string,
) => {
  try {
    await UserModel.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: { family } } },
    );
  } catch (error) {
    console.error("Error removing refresh token family:", error);
  }
};

/** One active login session (a refresh-token `family`), summarized for display. */
export type SessionSummary = {
  family: string;
  deviceInfo?: { userAgent?: string; ipAddress?: string; deviceType?: string };
  createdAt: Date;
  lastActive: Date;
  current: boolean;
};

/**
 * The user's live login sessions, one per refresh-token family (= per device).
 * A family with several rotated tokens collapses to a single entry; expired
 * lineages are dropped. `current` marks the family that made this request.
 */
export const listUserSessions = async (
  userId: unknown,
  currentFamily?: string,
): Promise<SessionSummary[]> => {
  const user = await UserModel.findById(userId).select("refreshTokens").lean();
  if (!user) return [];
  const now = Date.now();

  type Acc = {
    family: string;
    deviceInfo?: SessionSummary["deviceInfo"];
    createdAt: number;
    lastActive: number;
  };
  const byFamily = new Map<string, Acc>();

  for (const rt of (user.refreshTokens ?? []) as unknown as {
    family: string;
    deviceInfo?: SessionSummary["deviceInfo"];
    createdAt?: Date | string;
    lastUsed?: Date | string;
    idleExpiresAt?: Date | string;
    absoluteExpiresAt?: Date | string;
  }[]) {
    const idle = rt.idleExpiresAt ? new Date(rt.idleExpiresAt).getTime() : 0;
    const abs = rt.absoluteExpiresAt
      ? new Date(rt.absoluteExpiresAt).getTime()
      : 0;
    // Skip expired lineages — they're not live sessions.
    if (idle < now || abs < now) continue;

    const created = rt.createdAt ? new Date(rt.createdAt).getTime() : now;
    const used = rt.lastUsed ? new Date(rt.lastUsed).getTime() : created;
    const prev = byFamily.get(rt.family);
    if (!prev) {
      byFamily.set(rt.family, {
        family: rt.family,
        deviceInfo: rt.deviceInfo,
        createdAt: created,
        lastActive: used,
      });
    } else {
      prev.createdAt = Math.min(prev.createdAt, created);
      if (used >= prev.lastActive) {
        prev.lastActive = used;
        prev.deviceInfo = rt.deviceInfo; // most-recent device details win
      }
    }
  }

  return [...byFamily.values()]
    .map((s) => ({
      family: s.family,
      deviceInfo: s.deviceInfo,
      createdAt: new Date(s.createdAt),
      lastActive: new Date(s.lastActive),
      current: Boolean(currentFamily) && s.family === currentFamily,
    }))
    .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
};

/** Sign out every device except the given family (used by "log out others"). */
export const revokeOtherRefreshTokenFamilies = async (
  userId: unknown,
  keepFamily: string,
) => {
  await UserModel.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { family: { $ne: keepFamily } } } },
  );
};

export const resetUserPassword = async (token: string, newPassword: string) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not set", 500);
  }

  // Verify the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
    userId: string;
    email: string;
  };

  if (!decoded.userId || !decoded.email) {
    throw new AppError("Invalid token", 400);
  }

  const user = await UserModel.findById(decoded.userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  await (UserModel as any).resetPassword(decoded.userId, newPassword);
};

export const changeUserPassword = async (
  userId: string,
  newPassword: string,
  oldPassword: string
) => {
  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
};
