import { Request, Response } from "express";
import { UserModel } from "../models/user.schema";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { AuthService } from "../services/auth.service";
import {
  asyncHandler,
  AppError,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { EnrollmentModel } from "../models/enrollment.schema";

dotenv.config();

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Extract device information from request
   * @param req - Express request object
   * @returns Device information object
   */
  private extractDeviceInfo(req: Request) {
    return {
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
      deviceType: undefined, // Will be auto-detected from user agent
    };
  }

  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, confirmPassword, userType = "student", instructorData, ...additionalData } = req.body;

    if (!email || !password || !confirmPassword) {
      throw new AppError("All fields are required", 400);
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    if (password !== confirmPassword) {
      throw new AppError("Passwords do not match", 400);
    }

    // Extract device information from request
    const deviceInfo = this.extractDeviceInfo(req);

    // Prepare additional data for the service
    const serviceAdditionalData = {
      ...additionalData,
      instructorData
    };

    const { user, accessToken, refreshToken } = await this.authService.register(
      email,
      password,
      userType,
      deviceInfo,
      serviceAdditionalData
    );

    const data = {
      user,
      accessToken,
      refreshToken,
    };

    sendSuccessResponse(res, data, "User created successfully", 201);
  });

  /**
   * Login a user
   * @param req - Express request object
   * @param res - Express response object
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Email and password are required!", 400);
    }

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      throw new AppError("User not found!", 401);
    }

    // Check if user is registered with OAuth provider
    if (user.provider !== "credentials") {
      throw new AppError(
        `User is registered with ${user.provider.toUpperCase()}!`,
        401
      );
    }

    // get enrolled courses list
    const enrolledCourses = await EnrollmentModel.find({ userId: user._id });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials!", 401);
    }

    // Extract device information from request
    const deviceInfo = this.extractDeviceInfo(req);

    const { accessToken, refreshToken } = await this.authService.login(
      email,
      password,
      deviceInfo
    );

    const data = {
      user: { ...user.toObject(), enrolledCourses },
      accessToken,
      refreshToken,
    };

    sendSuccessResponse(res, data, "Login successful");
  });

  /**
   * Login a user with OAuth
   * @param req - Express request object
   * @param res - Express response object
   */
  oauthSignIn = asyncHandler(async (req: Request, res: Response) => {
    const { email, fullName, provider, userType = "student", profilePicture } = req.body;

    if (!email || !fullName || !provider) {
      throw new AppError("All fields are required", 400);
    }

    // Only allow Google and LinkedIn for OAuth login
    if (provider !== "google" && provider !== "linkedin") {
      throw new AppError("Only Google and LinkedIn OAuth are supported", 400);
    }

    // Extract device information from request
    const deviceInfo = this.extractDeviceInfo(req);

    const user = await UserModel.findOne({ email });
    if (!user) {
      // Create a new user
      const { user, accessToken, refreshToken } =
        await this.authService.createUserWithOAuth(
          email,
          fullName,
          provider,
          userType,
          profilePicture,
          deviceInfo
        );

      // Fetch enrolled courses for new user (will be empty array for new users)
      const enrolledCourses = await EnrollmentModel.find({ userId: user._id });

      const data = {
        user: { ...(user as any).toObject(), enrolledCourses },
        accessToken,
        refreshToken,
      };

      sendSuccessResponse(res, data, "User created successfully");
      return;
    }

    // Check if user has the same OAuth provider
    if (user.provider === provider) {
      // Login the user
      const { accessToken, refreshToken } = await this.authService.oauthSignIn(
        email,
        fullName,
        provider,
        deviceInfo
      );

      const enrolledCourses = await EnrollmentModel.find({ userId: user._id });

      sendSuccessResponse(
        res,
        {
          user: { ...user.toObject(), enrolledCourses } ,
          accessToken,
          refreshToken,
        },
        "Login successful"
      );
    } else {
      // return error
      throw new AppError(
        "User already registered with different provider!",
        401
      );
    }
  });

  /**
   * Refresh a token
   * @param req - Express request object
   * @param res - Express response object
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    const { accessToken } = await this.authService.refreshToken(refreshToken);

    const data = { accessToken };

    sendSuccessResponse(res, data, "Token refreshed");
  });
}
