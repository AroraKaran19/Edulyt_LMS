import { Request, Response } from "express";
import userSchema from "../models/user.schema";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { AuthService } from "../services/auth.service";
import {
  asyncHandler,
  AppError,
  sendSuccessResponse,
} from "../middlewares/error.middleware";

dotenv.config();

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, confirmPassword, role = "user" } = req.body;

    if (!email || !password || !confirmPassword) {
      throw new AppError("All fields are required", 400);
    }

    const existingUser = await userSchema.findOne({ email });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    if (password !== confirmPassword) {
      throw new AppError("Passwords do not match", 400);
    }

    const { user, accessToken, refreshToken } = await this.authService.register(
      email,
      password,
      role
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

    const user = await userSchema.findOne({ email }).select("+password");
    if (!user) {
      throw new AppError("User not found!", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials!", 401);
    }

    const { accessToken, refreshToken } = await this.authService.login(
      email,
      password
    );

    const data = {
      user,
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
    const { email, fullName, provider, role, profilePicture } = req.body;

    if (!email || !fullName || !provider || !role) {
      throw new AppError("All fields are required", 400);
    }

    const user = await userSchema.findOne({ email });
    if (!user) {
      // Create a new user
      const { user, accessToken, refreshToken } =
        await this.authService.createUserWithOAuth(
          email,
          fullName,
          provider,
          role,
          profilePicture
        );

      const data = {
        user,
        accessToken,
        refreshToken,
      };

      sendSuccessResponse(
        res,
        data,
        "User created successfully"
      );
      return;
    }

    if (user.provider === provider) {
      // Login the user
      const { accessToken, refreshToken } = await this.authService.oauthSignIn(
        email,
        fullName,
        provider
      );

      sendSuccessResponse(
        res,
        {
          user,
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
