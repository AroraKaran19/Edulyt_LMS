import userSchema from "../models/user.schema";
import { User as UserType } from "../types/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthService {
  /**
   * Register a new user
   * @param email - User's email
   * @param password - User's password
   * @returns { user: UserType, accessToken: string, refreshToken: string }
   */
  async register(
    email: string,
    password: string,
    role: string
  ): Promise<{ user: UserType; accessToken: string; refreshToken: string }> {
    try {
      const existingUser = await userSchema.findOne({ email });
      if (existingUser) {
        throw new Error("Email already in use!");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new userSchema({
        email,
        password: hashedPassword,
        role,
      });
      await newUser.save();
      const accessToken = await this.generateAccessToken(newUser._id);
      const refreshToken = await this.generateRefreshToken(newUser._id);

      // Update refresh token in database
      if (refreshToken) {
        await userSchema.findByIdAndUpdate(newUser._id, { refreshToken });
      }

      return { user: newUser, accessToken, refreshToken };
    } catch (error) {
      console.log(error);
      throw new Error("Internal server error!");
    }
  }

  /**
   * Login a user
   * @param email - User's email
   * @param password - User's password
   * @returns { user: UserType, accessToken: string, refreshToken: string }
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: UserType; accessToken: string; refreshToken: string }> {
    try {
      const user = await userSchema.findOne({ email }).select("+password");
      if (!user) {
        throw new Error("User not found!");
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials!");
      }
      const accessToken = await this.generateAccessToken(user._id);
      const refreshToken = await this.generateRefreshToken(user._id);
      await userSchema.findByIdAndUpdate(user._id, { refreshToken });
      return { user, accessToken, refreshToken };
    } catch (error) {
      console.log(error);
      throw new Error("Internal server error!");
    }
  }

  /**
   * Create a new user with OAuth
   * @param email - User's email
   * @param fullName - User's full name
   * @param provider - User's provider
   * @returns { user: UserType, accessToken: string, refreshToken: string }
   */
  async createUserWithOAuth(
    email: string,
    fullName: string,
    provider: string,
    role: string,
    profilePicture: string
  ): Promise<{ user: UserType; accessToken: string; refreshToken: string }> {
    try {
      if (!email || !fullName || !provider || !role) {
        throw new Error("All fields are required!");
      }
      const user = await userSchema.findOne({ email });
      if (user) {
        throw new Error("User already exists!");
      }
      let username = fullName.toLowerCase().replace(/ /g, "");
      while (await userSchema.findOne({ username })) {
        username = username + Math.random().toString(36).substring(2, 5);
      }
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const newUser = new userSchema({
        email,
        username,
        fullName,
        provider,
        role,
        profilePicture,
        password: hashedPassword,
      });
      await newUser.save();

      const accessToken = await this.generateAccessToken(newUser._id);
      const refreshToken = await this.generateRefreshToken(newUser._id);
      await userSchema.findByIdAndUpdate(newUser._id, { refreshToken });

      return { user: newUser, accessToken, refreshToken };
    } catch (error) {
      console.log(error);
      throw new Error("Internal server error!");
    }
  }

  /**
   * Login a user with OAuth
   * @param email - User's email
   * @param fullName - User's full name
   * @param provider - User's provider
   * @returns { user: UserType, accessToken: string, refreshToken: string }
   */
  async oauthSignIn(
    email: string,
    fullName: string,
    provider: string
  ): Promise<{ user: UserType; accessToken: string; refreshToken: string }> {
    try {
      const user = await userSchema.findOne({ email });
      if (!user) {
        throw new Error("User not found!");
      }

      const accessToken = await this.generateAccessToken(user._id);
      const refreshToken = await this.generateRefreshToken(user._id);
      await userSchema.findByIdAndUpdate(user._id, { refreshToken });

      return { user, accessToken, refreshToken };
    } catch (error) {
      console.log(error);
      throw new Error("Internal server error!");
    }
  }

  /**
   * Refresh a token
   * @param refreshToken - User's refresh token
   * @returns { accessToken: string }
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as {
        userId: string;
      };
      const accessToken = await this.generateAccessToken(decoded.userId);
      return { accessToken };
    } catch (error) {
      console.log(error);
      throw new Error("Internal server error!");
    }
  }

  async generateAccessToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
  }
}
