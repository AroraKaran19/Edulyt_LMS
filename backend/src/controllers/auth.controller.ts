import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { CrmProfileModel, UserModel } from "../models";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  changeUserPassword,
  createVerifiedUser,
  listUserSessions,
  loginUser,
  registerUser,
  removeRefreshTokenFamily,
  resetUserPassword,
  revokeOtherRefreshTokenFamilies,
  revokeRefreshTokenFamily,
} from "../services/auth.services";
import {
  resendSignupOtp,
  startSignupVerification,
  verifySignupOtp,
} from "../services/signupVerification.services";
import { validatePassword } from "../utils/passwordValidation";
import { createRefreshToken, rotateRefreshToken } from "../utils/refreshToken";
import { ACCESS_TOKEN_TTL, REFRESH_GRACE_MS } from "../constants/tokens";
import {
  ACCOUNT_DISABLED_MESSAGE,
  PARTNER_USE_PORTAL_LOGIN_MESSAGE,
} from "../constants/authMessages";
import { SIGNUP_MESSAGES } from "../constants/signupVerificationMessages";
import { enqueueCollaborationAllotmentAfterRegister } from "../services/collaborationAllotment.services";
import { tryPartnershipImportWhitelistAfterRegister } from "../services/collaborationWhitelist.services";
import { downloadImageAndUploadToS3 } from "../services/upload.services";
import { tryAwardRegistrationBonus } from "../services/successPoints.services";
import {
  RESET_REQUESTED_MESSAGE,
  RESET_TOKEN_TTL_MINUTES,
  requestPasswordReset,
} from "../services/passwordReset.services";
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

const firstHeader = (value?: string | string[]): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Login/refresh requests are proxied by the Next.js server (NextAuth), so the
 * raw `user-agent`/`req.ip` describe *that server* (e.g. "axios/1.12.2", "::1"),
 * not the end user's browser. When the auth layer forwards the real browser
 * values we prefer them; otherwise we fall back to the request's own headers.
 */
const buildDeviceInfo = (req: Request): DeviceInfo => {
  const userAgent =
    firstHeader(req.headers["x-client-user-agent"]) ||
    firstHeader(req.headers["user-agent"]) ||
    "";
  const forwardedFor = firstHeader(req.headers["x-forwarded-for"]);
  const ipAddress = forwardedFor?.split(",")[0].trim() || req.ip;
  return {
    userAgent,
    ipAddress,
    deviceType: detectDeviceType(userAgent),
  };
};

/**
 * Async because the campus-ambassador hint now lives on `CrmProfile` rather
 * than on the user document. One indexed read, and only for students, rather
 * than a denormalised copy on User that would drift with no way to tell which
 * copy was wrong.
 */
const protectedUser = async (user: User) => {
  const crmProfile =
    user.userType === "student"
      ? await CrmProfileModel.findOne(
          { userId: user._id },
          { code: 1, codeActive: 1, ambassadorKind: 1 },
        ).lean()
      : null;

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
      /*
       * Lets the dashboard show the campus-ambassador tab without an extra
       * request. Sent only while their link is live, so one field answers both
       * "are they one" and "which kind", and a demoted ambassador loses the tab.
       */
      crmAmbassadorKind:
        crmProfile?.code && crmProfile.codeActive !== false
          ? crmProfile.ambassadorKind
          : undefined,
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
  const protectedLoggedInUser = await protectedUser(user);
  const { plaintext: refreshToken, entry } = createRefreshToken(
    buildDeviceInfo(req),
  );
  const accessToken = await generateAccessToken(userId, entry.family);
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

  // Password rules are enforced here too, so a doomed signup fails before we
  // email a code rather than after the learner has typed it in.
  validatePassword(password);

  const started = await startSignupVerification({
    email,
    password,
    userType,
    provider,
    firstName,
    lastName,
    extra: restData, // Any additional fields (phone, address, bio, etc.)
  });

  sendSuccessResponse(res, started, SIGNUP_MESSAGES.CODE_SENT, 200);
});

/**
 * Second half of registration: confirms the emailed code and creates the
 * account. Everything that used to hang off `register` now happens here,
 * because until this point no user exists.
 */
export const verifyRegistrationOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { pendingId, otp } = req.body;

    if (!pendingId || !otp) {
      throw new AppError(SIGNUP_MESSAGES.OTP_REQUIRED, 400);
    }

    const verified = await verifySignupOtp(String(pendingId), String(otp));

    const newUser = await createVerifiedUser({
      email: verified.email,
      password: verified.passwordHash, // already hashed - do not re-hash
      userType: verified.userType as User["userType"],
      provider: verified.provider as User["provider"],
      firstName: verified.firstName,
      lastName: verified.lastName,
      ...verified.extra,
    });

    void enqueueCollaborationAllotmentAfterRegister(
      newUser._id,
      verified.email,
      verified.userType,
    );
    void tryPartnershipImportWhitelistAfterRegister(
      newUser._id,
      verified.email,
      verified.userType,
    );

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
      { user: await protectedUser(newUser), accessToken },
      SIGNUP_MESSAGES.REGISTERED,
      201,
    );
  },
);

/** Issues a fresh code for a signup still awaiting verification. */
export const resendRegistrationOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { pendingId } = req.body;

    if (!pendingId) {
      throw new AppError(SIGNUP_MESSAGES.PENDING_ID_REQUIRED, 400);
    }

    const started = await resendSignupOtp(String(pendingId));

    sendSuccessResponse(res, started, SIGNUP_MESSAGES.CODE_RESENT, 200);
  },
);

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

  // Normalized: accounts are stored lowercased, so a provider returning
  // different casing must not create a second account for the same person.
  const normalizedEmail = String(email).trim().toLowerCase();

  let user = await UserModel.findOne({ email: normalizedEmail });
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
      email: normalizedEmail,
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

  const protectedOAuthUser = await protectedUser(user);

  const { plaintext: refreshToken, entry } = createRefreshToken(
    buildDeviceInfo(req),
  );
  const accessToken = await generateAccessToken(user._id, entry.family);

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

    const newAccessToken = await generateAccessToken(
      String(user._id),
      entry.family,
    );
    const { plaintext: newRefreshToken, entry: child } = rotateRefreshToken(
      entry.family,
      new Date(entry.absoluteExpiresAt),
      // Keep the device details captured at login. Rotation runs through the
      // Next.js proxy, so rebuilding from this request would overwrite the real
      // browser identity with the proxy's ("axios", "::1").
      entry.deviceInfo,
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
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        /*
         * Returned so the client session picks up field changes without a
         * re-login: a student attached as a campus ambassador after signing in
         * would otherwise keep a stale session until they signed out. `user` is
         * already loaded on the request, so this costs no extra query.
         */
        user: await protectedUser(user),
      },
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

/**
 * @route GET /api/auth/sessions
 * @desc  The signed-in user's active login sessions (one per device), with the
 *        current device flagged. Access-token auth (verifyUser).
 */
export const getMySessionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new AppError("Unauthorized", 401);
    const sessions = await listUserSessions(user._id, req.currentFamily);
    sendSuccessResponse(res, { sessions }, "Sessions fetched");
  },
);

/**
 * @route POST /api/auth/sessions/revoke  Body: { family }
 * @desc  Sign out a specific device by revoking its refresh-token family.
 */
export const revokeSessionController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new AppError("Unauthorized", 401);
    const { family } = req.body as { family?: string };
    if (!family || typeof family !== "string") {
      throw new AppError("family is required", 400);
    }
    await removeRefreshTokenFamily(user._id, family);
    sendSuccessResponse(res, null, "Session signed out");
  },
);

/**
 * @route POST /api/auth/sessions/revoke-others
 * @desc  Sign out every device except the one making this request.
 */
export const revokeOtherSessionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new AppError("Unauthorized", 401);
    // Without a known current family we can't tell which session to keep, so
    // revoking "others" would sign the user out everywhere. Ask them to
    // re-authenticate (their next token refresh embeds the family).
    if (!req.currentFamily) {
      throw new AppError(
        "Please sign out and sign back in to manage other sessions.",
        409,
      );
    }
    await revokeOtherRefreshTokenFamilies(user._id, req.currentFamily);
    sendSuccessResponse(res, null, "Signed out of all other devices");
  },
);

export const generateAccessToken = async (userId: string, family?: string) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not set", 500);
  }
  try {
    // `family` (the refresh-token lineage / session id) lets verifyUser mark
    // which session made the request — used by the Active Sessions screen.
    return jwt.sign(
      { userId, ...(family ? { family } : {}) },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );
  } catch (error) {
    throw new AppError("Failed to generate access token", 500);
  }
};

/**
 * Emails a password reset link.
 *
 * The response carries no token and no hint about whether the address is
 * registered. Both of those were true here before: the link came back in the
 * response body, so naming an address was enough to take over the account, and
 * the two branches returned different payloads.
 */
export const generateResetPasswordToken = asyncHandler(
  async (req: Request, res: Response) => {
    if (!process.env.FRONTEND_URL) {
      throw new AppError("FRONTEND_URL is not set", 500);
    }
    const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, "");

    await requestPasswordReset(req.body?.email, (userId, email) => {
      const token = generateResetUserPasswordToken(userId, email);
      return `${frontendUrl}/reset-password?token=${token}`;
    });

    sendSuccessResponse(res, null, RESET_REQUESTED_MESSAGE);
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
  // Shares one constant with the email's "expires in N minutes" line, so the
  // copy cannot drift from the token it describes.
  const resetPasswordToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: `${RESET_TOKEN_TTL_MINUTES}m` },
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
