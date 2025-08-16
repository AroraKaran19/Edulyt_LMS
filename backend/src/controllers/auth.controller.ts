import { Request, Response } from "express";
import userSchema from "../models/user.schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthService } from "../services/auth.service";

dotenv.config();

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, confirmPassword, role } = req.body;
      if (!email || !password || !confirmPassword || !role) {
        return res
          .status(400)
          .json({ status: false, message: "All fields are required" });
      }
      const existingUser = await userSchema.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ status: false, message: "Email already in use" });
      }
      if (password !== confirmPassword) {
        return res
          .status(400)
          .json({ status: false, message: "Passwords do not match" });
      }
      const { user, accessToken, refreshToken } =
        await this.authService.register(email, password, role);
      return res.status(201).json({
        status: true,
        message: "User created successfully",
        user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error,
      });
    }
  };

  /**
   * Login a user
   * @param req - Express request object
   * @param res - Express response object
   */
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ status: false, message: "Email and password are required!" });
      }

      const user = await userSchema.findOne({ email }).select("+password");
      if (!user) {
        return res
          .status(401)
          .json({ status: false, message: "User not found!" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ status: false, message: "Invalid credentials!" });
      }

      const { accessToken, refreshToken } = await this.authService.login(
        email,
        password
      );

      return res.status(200).json({
        status: true,
        message: "Login successful",
        user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Internal server error!",
        error: error,
      });
    }
  };

  /**
   * Login a user with OAuth
   * @param req - Express request object
   * @param res - Express response object
   */
  oauthSignIn = async (req: Request, res: Response) => {
    try {
      const { email, fullName, provider, role, profilePicture } = req.body;
      if (!email || !fullName || !provider || !role) {
        return res
          .status(400)
          .json({ status: false, message: "All fields are required" });
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
        return res.status(200).json({
          status: true,
          message: "User created successfully",
          user,
          accessToken,
          refreshToken,
        });
      }
      if (user.provider === provider) {
        // Login the user
        const { accessToken, refreshToken } =
          await this.authService.oauthSignIn(email, fullName, provider);
        return res.status(200).json({
          status: true,
          message: "Login successful",
          user,
          accessToken,
          refreshToken,
        });
      } else {
        // return error
        return res
          .status(401)
          .json({
            status: false,
            message: "User already registered with different provider!",
          });
      }
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Internal server error!",
        error: error,
      });
    }
  };

  /**
   * Refresh a token
   * @param req - Express request object
   * @param res - Express response object
   */
  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const { accessToken } = await this.authService.refreshToken(refreshToken);
      return res
        .status(200)
        .json({ status: true, message: "Token refreshed", accessToken });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Internal server error!",
        error: error,
      });
    }
  };
}
