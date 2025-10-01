import { InstructorModel } from "../models/user.schema";
import { User as UserType } from "../types/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../middlewares/error.middleware";

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

  /**
   * Get all instructors with pagination and filtering
   * @param options - Query options for pagination and filtering
   * @returns Paginated instructors list
   */
  async getAllInstructors(options: {
    page: number;
    limit: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const { page, limit, search, status, sortBy, sortOrder } = options;

    // Build query
    const query: any = { userType: "instructor" };

    // Add search filter
    if (search && search.trim() !== "") {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { currentPosition: { $regex: search, $options: "i" } },
        { currentCompany: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter
    if (status && status.trim() !== "") {
      query.status = status;
    }

    // Build sort object
    const sort: any = {};
    const validSortFields = ["firstName", "lastName", "email", "createdAt", "updatedAt", "rating", "totalStudents"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    sort[sortField] = sortDirection;

    // Execute query
    const instructors = await InstructorModel.find(query)
      .select("-password -refreshTokens -__v")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await InstructorModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      instructors,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get instructor by ID
   * @param id - Instructor ID
   * @returns Instructor details
   */
  async getInstructorById(id: string) {
    if (!id) {
      throw new AppError("Instructor ID is required", 400);
    }

    const instructor = await InstructorModel.findOne({ _id: id, userType: "instructor" })
      .select("-password -refreshTokens -__v")
      .lean();

    if (!instructor) {
      throw new AppError("Instructor not found", 404);
    }

    return instructor;
  }

  /**
   * Update instructor by ID
   * @param id - Instructor ID
   * @param updateData - Data to update
   * @returns Updated instructor
   */
  async updateInstructor(id: string, updateData: any) {
    if (!id) {
      throw new AppError("Instructor ID is required", 400);
    }

    // Check if instructor exists
    const existingInstructor = await InstructorModel.findOne({ _id: id, userType: "instructor" });
    if (!existingInstructor) {
      throw new AppError("Instructor not found", 404);
    }

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.refreshTokens;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.userType; // Prevent changing user type

    // Update the instructor
    const updatedInstructor = await InstructorModel.findOneAndUpdate(
      { _id: id, userType: "instructor" },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-password -refreshTokens -__v");

    if (!updatedInstructor) {
      throw new AppError("Failed to update instructor", 500);
    }

    return updatedInstructor;
  }

  /**
   * Delete instructor by ID
   * @param id - Instructor ID
   * @returns Success message
   */
  async deleteInstructor(id: string) {
    if (!id) {
      throw new AppError("Instructor ID is required", 400);
    }

    // Check if instructor exists
    const existingInstructor = await InstructorModel.findOne({ _id: id, userType: "instructor" });
    if (!existingInstructor) {
      throw new AppError("Instructor not found", 404);
    }

    // Check if instructor has courses
    if (existingInstructor.ownedCourses && existingInstructor.ownedCourses.length > 0) {
      throw new AppError("Cannot delete instructor with active courses. Please transfer or delete courses first.", 400);
    }

    // Delete the instructor
    await InstructorModel.findOneAndDelete({ _id: id, userType: "instructor" });

    return { message: "Instructor deleted successfully" };
  }
}