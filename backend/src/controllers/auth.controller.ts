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
  resetUserPassword,
} from "../services/auth.services";
import { downloadImageAndUploadToS3 } from "../services/upload.services";
import bcrypt from "bcryptjs";
import { Student, User } from "../types";

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

const protectedUser = (user: User) => {
  return {
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    provider: user.provider,
    profilePicture: user.profilePicture,
    ...(user.userType === "student" && {
      enrollments: (user as Student).enrollments,
    }),
  };
};

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
    ...restData // Spread any additional fields (phone, address, bio, etc.)
  });
  if (!newUser) {
    throw new AppError("Failed to register user", 500);
  }

  const protectedNewUser = protectedUser(newUser);

  const accessToken = await generateAccessToken(newUser._id);

  newUser.refreshTokens.push({
    token: accessToken,
    deviceInfo: {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
      deviceType: detectDeviceType(req.headers["user-agent"] || ""),
    },
    createdAt: new Date(),
    lastUsed: new Date(),
    isActive: true,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
  });
  await newUser.save();

  sendSuccessResponse(
    res,
    { user: protectedNewUser, accessToken },
    "User registered successfully",
    201
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

  const protectedLoggedInUser = protectedUser(user);

  const accessToken = await generateAccessToken(user._id);

  await UserModel.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        token: accessToken,
        deviceInfo: {
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
          deviceType: detectDeviceType(req.headers["user-agent"] || ""),
        },
      },
    },
    createdAt: new Date(),
    lastUsed: new Date(),
    isActive: true,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
  });
  sendSuccessResponse(
    res,
    { user: protectedLoggedInUser, accessToken },
    "User logged in successfully"
  );
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
        "profile-images"
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
  } else {
    if (user.provider !== provider) {
      throw new AppError(
        "User already registered with different provider!",
        401
      );
    }
  }

  if (!user) {
    throw new AppError("Failed to create user", 500);
  }

  const protectedOAuthUser = protectedUser(user);

  const accessToken = await generateAccessToken(user._id);

  await UserModel.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        token: accessToken,
        deviceInfo: {
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
          deviceType: detectDeviceType(req.headers["user-agent"] || ""),
        },
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: true,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      },
    },
  });
  sendSuccessResponse(
    res,
    { user: protectedOAuthUser, accessToken },
    "User logged in successfully"
  );
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    // User is already verified by middleware, get from req.user
    const user = req.user;

    if (!user) {
      throw new AppError("User not found", 401);
    }

    // Generate new access token
    const newAccessToken = await generateAccessToken(user._id!);

    // Get the old access token from the request
    const oldAccessToken = req.headers.authorization?.substring(7); // Remove 'Bearer ' prefix

    if (oldAccessToken) {
      // Deactivate the old token and add the new one
      await UserModel.findByIdAndUpdate(
        user._id,
        {
          $set: {
            "refreshTokens.$[elem].isActive": false,
            "refreshTokens.$[elem].lastUsed": new Date(),
          },
        },
        {
          arrayFilters: [{ "elem.token": oldAccessToken }],
        }
      );

      // Add the new access token to the refreshTokens array
      await UserModel.findByIdAndUpdate(user._id, {
        $push: {
          refreshTokens: {
            token: newAccessToken,
            deviceInfo: {
              userAgent: req.headers["user-agent"],
              ipAddress: req.ip,
              deviceType: detectDeviceType(req.headers["user-agent"] || ""),
            },
            createdAt: new Date(),
            lastUsed: new Date(),
            isActive: true,
            expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
          },
        },
      });
    }

    sendSuccessResponse(
      res,
      { accessToken: newAccessToken },
      "Token refreshed successfully"
    );
  }
);

export const generateAccessToken = async (userId: string) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not set", 500);
  }
  try {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
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
      "Reset password link"
    );
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { newPassword, token } = req.body;

    if (!newPassword || !token) {
      throw new AppError("Invalid request", 400);
    }

    await resetUserPassword(token, newPassword);
    sendSuccessResponse(res, null, "Password reset successfully");
  }
);

export const generateResetUserPasswordToken = (
  userId: string,
  email: string
) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not set", 500);
  }
  const resetPasswordToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: "10m" } // 10 minutes
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
  }
);
