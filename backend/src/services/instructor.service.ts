import { InstructorModel } from "../models/user.schema";
import { User as UserType } from "../types/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class InstructorService {
  /**
   * Register a new instructor
   * @param instructorData - Instructor registration data
   * @param deviceInfo - Device information from request
   * @returns { user: UserType, accessToken: string, refreshToken: string }
   */
  async registerInstructor(
    instructorData: any,
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      deviceType?: string;
    }
  ): Promise<{ user: UserType; accessToken: string; refreshToken: string }> {
    try {
      const existingUser = await InstructorModel.findOne({ email: instructorData.email });
      if (existingUser) {
        throw new Error("Email already in use!");
      }

      const hashedPassword = await bcrypt.hash(instructorData.password, 10);

      const userData = {
        email: instructorData.email,
        password: hashedPassword,
        userType: "instructor",
        provider: "credentials",
        accounts: {},
        firstName: instructorData.firstName,
        lastName: instructorData.lastName,
        phone: instructorData.phone,
        whatsappNumber: instructorData.whatsappNumber,
        profilePicture: instructorData.profilePicture,
        address: instructorData.address,
        bio: instructorData.bio,
        currentPosition: instructorData.currentPosition,
        currentCompany: instructorData.currentCompany,
        previousExperience: instructorData.previousExperience || [],
        linkedinUrl: instructorData.linkedinUrl,
        rating: 0,
        totalStudents: 0,
        reviews: [],
        ownedCourses: [],
      };

      const newInstructor = new InstructorModel(userData);
      await newInstructor.save();

      const accessToken = await this.generateAccessToken(newInstructor._id);
      const refreshToken = await this.generateRefreshToken(newInstructor._id);

      // Add refresh token to user's refreshTokens array
      if (refreshToken) {
        await InstructorModel.findByIdAndUpdate(newInstructor._id, {
          $push: {
            refreshTokens: {
              token: refreshToken,
              deviceInfo: {
                userAgent: deviceInfo?.userAgent || "Unknown",
                ipAddress: deviceInfo?.ipAddress || "Unknown",
                deviceType: deviceInfo?.deviceType || this.detectDeviceType(deviceInfo?.userAgent),
              },
              createdAt: new Date(),
              lastUsed: new Date(),
              isActive: true,
            },
          },
        });
      }

      return { user: newInstructor, accessToken, refreshToken };
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
    
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return "tablet";
    } else if (ua.includes("desktop") || ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) {
      return "desktop";
    } else {
      return "web";
    }
  }
}