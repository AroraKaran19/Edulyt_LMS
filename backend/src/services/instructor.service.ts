import { CourseInstructor, User } from "../types";
import userModel from "../models/user.schema";
import { CourseModel } from "../models/course.schema";
import bcrypt from "bcryptjs";

export class InstructorService {
  /**
   * Get all instructors
   * @param page - Page number
   * @param limit - Limit number
   * @returns Instructors or null
   */
  async getAllInstructors(page: number, limit: number): Promise<User[] | null> {
    try {
      const instructors = await userModel
        .find({ role: "instructor" })
        .skip((page - 1) * limit)
        .limit(limit);
      return instructors;
    } catch (error) {
      console.error("Error getting all instructors:", error);
      throw error;
    }
  }

  /**
   * Get instructor by id
   * @param instructorId - Instructor id
   * @returns Instructor or null
   */
  async getInstructorById(instructorId: string): Promise<User | null> {
    try {
      const instructor = await userModel.findById(instructorId);
      return instructor;
    } catch (error) {
      console.error("Error getting instructor by id:", error);
      throw error;
    }
  }

  /**
   * Create instructor
   * @param instructorData - Instructor data
   * @returns Instructor
   */
  async createInstructor(
    instructorData: Partial<CourseInstructor>
  ): Promise<User> {
    try {
      const {
        email,
        fullName,
        profilePicture,
        password,
        currentPosition,
        currentCompany,
      } = instructorData;
      if (
        !email ||
        !fullName ||
        !profilePicture ||
        !password ||
        !currentPosition ||
        !currentCompany
      ) {
        throw new Error("All fields are required!");
      }
      const user = await userModel.findOne({ email });
      if (user) {
        throw new Error("User already exists!");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      let username = fullName.toLowerCase().replace(/ /g, "");
      while (await userModel.findOne({ username })) {
        username = username + Math.random().toString(36).substring(2, 5);
      }
      const newUser = new userModel({
        username,
        email,
        fullName,
        profilePicture,
        password: hashedPassword,
        role: "instructor",
        currentPosition,
        currentCompany,
        rating: 0,
        totalStudents: 0,
        reviews: [],
        ownedCourses: [],
      });
      await newUser.save();
      return newUser;
    } catch (error) {
      console.error("Error creating instructor:", error);
      throw error;
    }
  }

  /**
   * Update instructor
   * @param instructorId - Instructor id
   * @param instructorData - Instructor data
   * @returns Instructor or null
   */
  async updateInstructor(
    instructorId: string,
    instructorData: Partial<CourseInstructor>
  ): Promise<User | null> {
    try {
      if (!instructorId) {
        throw new Error("Instructor ID is required!");
      }
      if (!instructorData) {
        throw new Error("Instructor data is required!");
      }
      const instructor = await userModel.findByIdAndUpdate(
        instructorId,
        instructorData,
        { new: true }
      );
      return instructor;
    } catch (error) {
      console.error("Error updating instructor:", error);
      throw error;
    }
  }

  /**
   * Delete instructor
   * @param instructorId - Instructor id
   * @returns Instructor or null
   */
  async deleteInstructor(instructorId: string): Promise<User | null> {
    try {
      const instructor = await userModel.findById(instructorId);
      if (!instructor) {
        throw new Error("Instructor not found!");
      }
      // delete instructor from all courses
      await CourseModel.updateMany(
        { instructor: instructorId },
        { $pull: { instructor: instructorId } }
      );
      await userModel.findByIdAndDelete(instructorId);
      return instructor;
    } catch (error) {
      console.error("Error deleting instructor:", error);
      throw error;
    }
  }
}
