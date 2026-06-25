import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { UserModel } from "../models";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  changeUserPassword,
  loginUser,
  registerUser,
  removeRefreshTokenFamily,
  resetUserPassword,
  revokeRefreshTokenFamily,
} from "../services/auth.services";
import { createRefreshToken, rotateRefreshToken } from "../utils/refreshToken";
import { ACCESS_TOKEN_TTL, REFRESH_GRACE_MS } from "../constants/tokens";
import {
  ACCOUNT_DISABLED_MESSAGE,
  PARTNER_USE_PORTAL_LOGIN_MESSAGE,
} from "../constants/authMessages";
import { enqueueCollaborationAllotmentAfterRegister } from "../services/collaborationAllotment.services";
import { tryPartnershipImportWhitelistAfterRegister } from "../services/collaborationWhitelist.services";
import { downloadImageAndUploadToS3 } from "../services/upload.services";
import { tryAwardRegistrationBonus } from "../services/successPoints.services";
import bcrypt from "bcryptjs";
import { DeviceInfo, Student, User } from "../types";

const detectDeviceType = (userAgent: string) => {
  if (userAgent.includes("Mobile")) {
    return "mobile";
  } else if (userAgent.includes("Tablet")) {
    return "tablet";
  } else if (userAgent.includes("Desktop")) {
    return "desktop";
  } else {
    return "web";
  }
};

const buildDeviceInfo = (req: Request): DeviceInfo => ({
  userAgent: req.headers["user-agent"],
  ipAddress: req.ip,
  deviceType: detectDeviceType(req.headers["user-agent"] || ""),
});

const protectedUser = (user: User) => {
  return {
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    provider: user.provider,
    profilePicture: user.profilePicture,
    phone: user.phone,
    ...(user.userType === "student" && {
      enrollments: (user as Student).enrollments,
      collegeName: (user as Student).collegeName,
      degreeName: (user as Student).degreeName,
      fatherOccupation: (user as Student).fatherOccupation,
    }),
  };
};

async function finalizeCredentialLogin(
  req: Request,
  res: Response,
  user: User,
) {
  const userId = String(user._id ?? "");
  if (!userId) {
    throw new AppError("User record is missing an id", 500);
  }
  const protectedLoggedInUser = protectedUser(user);
  const accessToken = await generateAccessToken(userId);
  const { plaintext: refreshToken, entry } = createRefreshToken(
    buildDeviceInfo(req),
  );
  await UserModel.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: entry },
  });
  // No welcome bonus here — it's granted once at registration, not on login.
  sendSuccessResponse(
    res,
    { user: protectedLoggedInUser, accessToken, refreshToken },
    "User logged in successfully",
  );
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    email,
    password,
    confirmPassword,
    userType = "student",
    provider = "credentials",
    firstName,
    lastName,
    ...restData
  } = req.body;

  if (!email || !password || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }

  if (!firstName || firstName.trim() === "") {
    throw new AppError("First name is required", 400);
  }

  if (password !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new AppError("User already exists!", 400);
  }

  const newUser = await registerUser({
    email,
    password,
    userType,
    provider,
    firstName: firstName.trim(),
    lastName: lastName?.trim() || "",
    ...restData, // Spread any additional fields (phone, address, bio, etc.)
  });
  if (!newUser) {
    throw new AppError("Failed to register user", 500);
  }

  void enqueueCollaborationAllotmentAfterRegister(newUser._id, email, userType);
  void tryPartnershipImportWhitelistAfterRegister(newUser._id, email, userType);

  const protectedNewUser = protectedUser(newUser);

  const accessToken = await generateAccessToken(newUser._id);
  // One-time welcome bonus is granted at registration (never on login).
  try {
    await tryAwardRegistrationBonus(String(newUser._id), newUser.userType);
  } catch (e) {
    // A bonus failure must never block account creation.
    console.error("Registration bonus failed:", e);
  }

  sendSuccessResponse(
    res,
    { user: protectedNewUser, accessToken },
    "User registered successfully",
    201,
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await loginUser(email, password);
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  await finalizeCredentialLogin(req, res, user);
});

/**
 * Credential login for portal partners only (rejects non-partner accounts).
 */
export const partnerLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await loginUser(email, password);
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  if (user.userType !== "partner") {
    throw new AppError(
      "This login is only for partner accounts. Use the main Airkrit login.",
      403,
    );
  }

  await finalizeCredentialLogin(req, res, user);
});

export const oauthSignin = asyncHandler(async (req: Request, res: Response) => {
  const { email, fullName, provider, providerDetails } = req.body;
  if (!email || !fullName || !provider) {
    throw new AppError("All fields are required", 400);
  }
  if (provider !== "google" && provider !== "linkedin") {
    throw new AppError("Only Google and LinkedIn OAuth are supported", 400);
  }

  let user = await UserModel.findOne({ email });
  if (!user) {
    // create a new user
    const originalImageUrl =
      providerDetails?.picture || providerDetails?.image || "";
    let profilePictureUrl = originalImageUrl;

    // Download OAuth profile image and store on S3 for reliability
    if (originalImageUrl) {
      const s3Url = await downloadImageAndUploadToS3(
        originalImageUrl,
        "profile-images",
      );
      if (s3Url) profilePictureUrl = s3Url;
    }

    let accountDetails: User["accounts"]["google" | "linkedin"] = {};
    if (provider === "google") {
      accountDetails = {
        id: providerDetails?.id,
        name: providerDetails?.name,
        email: providerDetails?.email,
        image: profilePictureUrl,
        email_verified: providerDetails?.email_verified,
        access_token: providerDetails?.access_token,
      };
    } else if (provider === "linkedin") {
      accountDetails = {
        sub: providerDetails?.sub,
        name: providerDetails?.name,
        given_name: providerDetails?.given_name,
        family_name: providerDetails?.family_name,
        image: profilePictureUrl,
        locale: providerDetails?.locale,
        providerAccountId: providerDetails?.providerAccountId,
        id_token: providerDetails?.id_token,
        email: providerDetails?.email,
        email_verified: providerDetails?.email_verified,
        accessToken: providerDetails?.access_token,
      };
    }

    const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
    const newUser = await registerUser({
      email,
      firstName: providerDetails?.name?.split(" ")[0] || "",
      lastName: providerDetails?.name?.split(" ")[1] || "",
      password: hashedPassword,
      provider,
      profilePicture: profilePictureUrl,
      userType: "student",
      accounts: {
        [provider]: accountDetails,
      },
    });
    user = newUser;
    void enqueueCollaborationAllotmentAfterRegister(
      newUser._id,
      email,
      "student",
    );
    void tryPartnershipImportWhitelistAfterRegister(
      newUser._id,
      email,
      "student",
    );
    // OAuth sign-up is a registration → grant the one-time welcome bonus.
    try {
      await tryAwardRegistrationBonus(String(newUser._id), newUser.userType);
    } catch (e) {
      // A bonus failure must never block account creation.
      console.error("Registration bonus failed:", e);
    }
  } else {
    if (user.userType === "partner") {
      throw new AppError(PARTNER_USE_PORTAL_LOGIN_MESSAGE, 403);
    }
    if (user.provider !== provider) {
      throw new AppError(
        "User already registered with different provider!",
        401,
      );
    }
    if (user.status !== "active") {
      throw new AppError(ACCOUNT_DISABLED_MESSAGE, 403);
    }
  }

  if (!user) {
    throw new AppError("Failed to create user", 500);
  }

  const protectedOAuthUser = protectedUser(user);

  const accessToken = await generateAccessToken(user._id);
  const { plaintext: refreshToken, entry } = createRefreshToken(
    buildDeviceInfo(req),
  );

  await UserModel.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: entry },
  });
  // The welcome bonus is granted only when a new account is created above —
  // existing users signing in via OAuth get nothing here.
  sendSuccessResponse(
    res,
    { user: protectedOAuthUser, accessToken, refreshToken },
    "User logged in successfully",
  );
});

/**
 * Rotating refresh endpoint.
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    const tokenHash = (req as any).refreshTokenHash as string | undefined;
    const entry = (req as any).refreshTokenEntry as
      | User["refreshTokens"][number]
      | undefined;

    if (!user || !tokenHash || !entry) {
      throw new AppError("Invalid refresh token", 401);
    }

    const now = new Date();

    // Expired by either clock → revoke the lineage and force re-login.
    if (
      now > new Date(entry.absoluteExpiresAt) ||
      now > new Date(entry.idleExpiresAt)
    ) {
      await revokeRefreshTokenFamily(user._id, entry.family);
      throw new AppError("Refresh token expired", 401);
    }

    // Already rotated. Inside the grace window this is a concurrent/retry call
    // and is allowed; beyond it, the token was replayed → assume theft.
    if (!entry.isActive) {
      const rotatedAt = entry.rotatedAt
        ? new Date(entry.rotatedAt).getTime()
        : 0;
      if (now.getTime() - rotatedAt > REFRESH_GRACE_MS) {
        await revokeRefreshTokenFamily(user._id, entry.family);
        throw new AppError("Refresh token reuse detected", 401);
      }
    }

    const newAccessToken = await generateAccessToken(String(user._id));
    const { plaintext: newRefreshToken, entry: child } = rotateRefreshToken(
      entry.family,
      new Date(entry.absoluteExpiresAt),
      buildDeviceInfo(req),
    );

    // Invalidate the presented token (keep it for the grace window) ...
    await UserModel.updateOne(
      { _id: user._id, "refreshTokens.tokenHash": tokenHash },
      {
        $set: {
          "refreshTokens.$.isActive": false,
          "refreshTokens.$.rotatedAt": now,
          "refreshTokens.$.lastUsed": now,
        },
      },
    );
    // ... and add the rotated child.
    await UserModel.updateOne(
      { _id: user._id },
      { $push: { refreshTokens: child } },
    );
    // Opportunistic hygiene: drop entries past their absolute cap so the array
    // can't grow without bound (separate update — can't $push and $pull at once).
    await UserModel.updateOne(
      { _id: user._id },
      { $pull: { refreshTokens: { absoluteExpiresAt: { $lt: now } } } },
    );

    sendSuccessResponse(
      res,
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      "Token refreshed successfully",
    );
  },
);

/**
 * Logout. `verifyTokenForRefresh` has located the user and the matching token
 * entry; we drop that token's whole family so the session is dead server-side
 * (not just the client cookie). Only this device's lineage is removed — other
 * sessions stay signed in.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const entry = (req as any).refreshTokenEntry as
    | User["refreshTokens"][number]
    | undefined;

  if (!user || !entry) {
    throw new AppError("Invalid refresh token", 401);
  }

  await removeRefreshTokenFamily(user._id, entry.family);

  sendSuccessResponse(res, null, "Logged out successfully");
});

export const generateAccessToken = async (userId: string) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not set", 500);
  }
  try {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });
  } catch (error) {
    throw new AppError("Failed to generate access token", 500);
  }
};

export const generateResetPasswordToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      // If user not found, still send the fake confirmation
      sendSuccessResponse(res, null, "Reset password link");
      return;
    }

    const resetPasswordToken = generateResetUserPasswordToken(user._id, email);
    if (!process.env.FRONTEND_URL) {
      throw new AppError("FRONTEND_URL is not set", 500);
    }

    sendSuccessResponse(
      res,
      {
        link: `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`,
      },
      "Reset password link",
    );
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { newPassword, token } = req.body;

    if (!newPassword || !token) {
      throw new AppError("Invalid request", 400);
    }

    await resetUserPassword(token, newPassword);
    sendSuccessResponse(res, null, "Password reset successfully");
  },
);

export const generateResetUserPasswordToken = (
  userId: string,
  email: string,
) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not set", 500);
  }
  const resetPasswordToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }, // 10 minutes
  );
  return resetPasswordToken;
};

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { newPassword, oldPassword } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not found", 404);
    }

    if (!newPassword || !oldPassword) {
      throw new AppError("Invalid request", 400);
    }

    await changeUserPassword(userId, newPassword, oldPassword);

    sendSuccessResponse(res, null, "Password changed successfully");
  },
);
