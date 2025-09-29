import {
  UserModel,
  StudentModel,
  InstructorModel,
  CollaboratorModel,
} from "../models/user.schema";
import { User as UserType } from "../types/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthService {
  /**
   * Register a new user
   * @param email - User's email
   * @param password - User's password
   * @param userType - User type
   * @param deviceInfo - Device information from request
   * @param additionalData - Additional data specific to user type
   * @returns { user: UserType, accessToken: string, refreshToken: string }
   */
  async register(
    email: string,
    password: string,
    userType: string,
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      deviceType?: string;
    },
    additionalData?: any
  ): Promise<{ user: UserType; accessToken: string; refreshToken: string }> {
    try {
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        throw new Error("Email already in use!");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with appropriate discriminator model
      let newUser;
      const baseUserData = {
        email,
        password: hashedPassword,
        userType,
        provider: "credentials",
        accounts: additionalData?.accounts || {}, // Use provided accounts or empty object
      };

      // Merge additional data based on user type
      let userData: any = { ...baseUserData };
      
      if (additionalData) {
        // Common fields that apply to all user types
        if (additionalData.firstName) userData.firstName = additionalData.firstName;
        if (additionalData.lastName) userData.lastName = additionalData.lastName;
        if (additionalData.phone) userData.phone = additionalData.phone;
        if (additionalData.whatsappNumber) userData.whatsappNumber = additionalData.whatsappNumber;
        if (additionalData.profilePicture) userData.profilePicture = additionalData.profilePicture;
        if (additionalData.address) userData.address = additionalData.address;
        
        // Type-specific fields
        if (userType === "instructor" && additionalData.instructorData) {
          const instructorData = additionalData.instructorData;
          userData.bio = instructorData.bio;
          userData.currentPosition = instructorData.currentPosition;
          userData.currentCompany = instructorData.currentCompany;
          userData.previousExperience = instructorData.previousExperience || [];
          userData.rating = 0; // Default rating for new instructors
          userData.totalStudents = 0; // Default total students
          userData.reviews = []; // Empty reviews array
          userData.ownedCourses = []; // Empty courses array
        }
      }

      switch (userType) {
        case "student":
          newUser = new StudentModel(userData);
          break;
        case "instructor":
          newUser = new InstructorModel(userData);
          break;
        case "collaborator":
          newUser = new CollaboratorModel(userData);
          break;
        default:
          newUser = new UserModel(userData);
      }

      await newUser.save();
      const accessToken = await this.generateAccessToken(newUser._id);
      const refreshToken = await this.generateRefreshToken(newUser._id);

      // Add refresh token to user's refreshTokens array
      if (refreshToken) {
        await UserModel.findByIdAndUpdate(newUser._id, {
          $push: {
            refreshTokens: {
              token: refreshToken,
              deviceInfo: {
                userAgent: deviceInfo?.userAgent || "Unknown",
                ipAddress: deviceInfo?.ipAddress || "Unknown",
                deviceType:
                  deviceInfo?.deviceType ||
                  this.detectDeviceType(deviceInfo?.userAgent),
              },
              createdAt: new Date(),
              lastUsed: new Date(),
              isActive: true,
            },
          },
        });
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
   * @param deviceInfo - Device information from request
   * @returns { user: UserType, accessToken: string, refreshToken: string }
   */
  async login(
    email: string,
    password: string,
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      deviceType?: string;
    }
  ): Promise<{ user: UserType; accessToken: string; refreshToken: string }> {
    try {
      const user = await UserModel.findOne({ email }).select("+password");
      if (!user) {
        throw new Error("User not found!");
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials!");
      }
      const accessToken = await this.generateAccessToken(user._id);
      const refreshToken = await this.generateRefreshToken(user._id);

      // Add refresh token to user's refreshTokens array
      await UserModel.findByIdAndUpdate(user._id, {
        $push: {
          refreshTokens: {
            token: refreshToken,
            deviceInfo: {
              userAgent: deviceInfo?.userAgent || "Unknown",
              ipAddress: deviceInfo?.ipAddress || "Unknown",
              deviceType:
                deviceInfo?.deviceType ||
                this.detectDeviceType(deviceInfo?.userAgent),
            },
            createdAt: new Date(),
            lastUsed: new Date(),
            isActive: true,
          },
        },
      });

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
   * @param userType - User type
   * @param profilePicture - User's profile picture
   * @param deviceInfo - Device information from request
   * @returns { user: UserType, accessToken: string, refreshToken: string }
   */
  async createUserWithOAuth(
    email: string,
    fullName: string,
    provider: string,
    userType: string,
    profilePicture: string,
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      deviceType?: string;
    }
  ): Promise<{ user: UserType; accessToken: string; refreshToken: string }> {
    try {
      if (!email || !fullName || !provider) {
        throw new Error("All fields are required!");
      }
      const user = await UserModel.findOne({ email });
      if (user) {
        throw new Error("User already exists!");
      }

      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);

      // Create OAuth account data
      const oauthAccount = {
        email,
        name: fullName,
        image: profilePicture,
        email_verified: true,
      };

      const accounts = {
        google: provider === "google" ? oauthAccount : undefined,
        linkedin: provider === "linkedin" ? oauthAccount : undefined,
        github: undefined, // GitHub is for account linking, not OAuth login
        instagram: undefined,
      };

      // Create user with appropriate discriminator model
      let newUser;
      const userData = {
        email,
        firstName: fullName.split(" ")[0],
        lastName: fullName.split(" ").slice(1).join(" "),
        profilePicture,
        password: hashedPassword,
        userType,
        provider,
        accounts,
      };

      switch (userType) {
        case "student":
          newUser = new StudentModel(userData);
          break;
        case "instructor":
          newUser = new InstructorModel(userData);
          break;
        case "collaborator":
          newUser = new CollaboratorModel(userData);
          break;
        default:
          newUser = new UserModel(userData);
      }

      await newUser.save();

      const accessToken = await this.generateAccessToken(newUser._id);
      const refreshToken = await this.generateRefreshToken(newUser._id);

      // Add refresh token to user's refreshTokens array
      await UserModel.findByIdAndUpdate(newUser._id, {
        $push: {
          refreshTokens: {
            token: refreshToken,
            deviceInfo: {
              userAgent: deviceInfo?.userAgent || "Unknown",
              ipAddress: deviceInfo?.ipAddress || "Unknown",
              deviceType:
                deviceInfo?.deviceType ||
                this.detectDeviceType(deviceInfo?.userAgent),
            },
            createdAt: new Date(),
            lastUsed: new Date(),
            isActive: true,
          },
        },
      });

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
   * @param deviceInfo - Device information from request
   * @returns { user: UserType, accessToken: string, refreshToken: string }
   */
  async oauthSignIn(
    email: string,
    fullName: string,
    provider: string,
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      deviceType?: string;
    }
  ): Promise<{ user: UserType; accessToken: string; refreshToken: string }> {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new Error("User not found!");
      }

      const accessToken = await this.generateAccessToken(user._id);
      const refreshToken = await this.generateRefreshToken(user._id);

      // Add refresh token to user's refreshTokens array
      await UserModel.findByIdAndUpdate(user._id, {
        $push: {
          refreshTokens: {
            token: refreshToken,
            deviceInfo: {
              userAgent: deviceInfo?.userAgent || "Unknown",
              ipAddress: deviceInfo?.ipAddress || "Unknown",
              deviceType:
                deviceInfo?.deviceType ||
                this.detectDeviceType(deviceInfo?.userAgent),
            },
            createdAt: new Date(),
            lastUsed: new Date(),
            isActive: true,
          },
        },
      });

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

      // Find user and validate refresh token
      const user = await UserModel.findOne({
        _id: decoded.userId,
        "refreshTokens.token": refreshToken,
        "refreshTokens.isActive": true,
      });

      if (!user) {
        throw new Error("Invalid refresh token!");
      }

      // Update lastUsed timestamp for this refresh token
      await UserModel.updateOne(
        {
          _id: decoded.userId,
          "refreshTokens.token": refreshToken,
        },
        {
          $set: { "refreshTokens.$.lastUsed": new Date() },
        }
      );

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

  /**
   * Detect device type from user agent
   * @param userAgent - User agent string
   * @returns Device type
   */
  private detectDeviceType(userAgent?: string): string {
    if (!userAgent) return "unknown";

    const ua = userAgent.toLowerCase();

    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return "tablet";
    } else if (
      ua.includes("desktop") ||
      ua.includes("windows") ||
      ua.includes("macintosh") ||
      ua.includes("linux")
    ) {
      return "desktop";
    } else {
      return "web";
    }
  }

  /**
   * Revoke a specific refresh token
   * @param userId - User ID
   * @param refreshToken - Refresh token to revoke
   */
  async revokeRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    await UserModel.updateOne(
      {
        _id: userId,
        "refreshTokens.token": refreshToken,
      },
      {
        $set: { "refreshTokens.$.isActive": false },
      }
    );
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId - User ID
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: { "refreshTokens.$[].isActive": false },
      }
    );
  }

  /**
   * Get active refresh tokens for a user
   * @param userId - User ID
   * @returns Array of active refresh tokens
   */
  async getActiveRefreshTokens(userId: string): Promise<any[]> {
    const user = await UserModel.findById(userId).select("refreshTokens");
    if (!user) return [];

    return user.refreshTokens.filter((token) => token.isActive);
  }

  /**
   * Clean up expired refresh tokens (older than 7 days)
   * @param userId - User ID
   */
  async cleanupExpiredRefreshTokens(userId: string): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await UserModel.updateOne(
      { _id: userId },
      {
        $pull: {
          refreshTokens: {
            createdAt: { $lt: sevenDaysAgo },
          },
        },
      }
    );
  }
}
