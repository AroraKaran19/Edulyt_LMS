import {
  Enrollment,
  EnrollmentStats,
  CourseEnrollmentStats,
  UserEnrollmentStats,
  DetailedEnrollmentProgress,
} from "../types/enrollment";
import { EnrollmentModel } from "../models/enrollment.schema";
import { AppError } from "../middlewares/error.middleware";
import { ProgressService } from "./progress.service";
import mongoose from "mongoose";

// Create a new enrollment
export const createEnrollment = async (
  userId: string,
  courseId: string,
  enrollmentSource: "direct" | "gift" | "promotion" = "direct",
  giftFrom?: string,
  promotionCode?: string
): Promise<Enrollment> => {
  try {
    // Check if user is already enrolled in active or completed status
    const existingEnrollment = await EnrollmentModel.findOne({
      userId,
      courseId,
      status: { $in: ["active", "completed"] },
    });
    if (existingEnrollment) {
      throw new AppError("User is already enrolled in this course", 400);
    }

    const enrollment = new EnrollmentModel({
      userId,
      courseId,
      enrollmentSource,
      giftFrom,
      promotionCode,
    });

    await enrollment.save();
    return enrollment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create enrollment", 500);
  }
};

// Get user's enrollments
export const getUserEnrollments = async (userId: string, status?: string) => {
  try {
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    return await EnrollmentModel.find(query)
      .populate(
        "courseId",
        "title thumbnail category shortDescription duration"
      )
      .sort({ enrolledAt: -1 });
  } catch (error) {
    throw new AppError("Failed to fetch user enrollments", 500);
  }
};

// Get course enrollments
export const getCourseEnrollments = async (
  courseId: string,
  status?: string
) => {
  try {
    const query: any = { courseId };
    if (status) {
      query.status = status;
    }

    return await EnrollmentModel.find(query)
      .populate("userId", "firstName lastName email profilePicture")
      .sort({ enrolledAt: -1 });
  } catch (error) {
    throw new AppError("Failed to fetch course enrollments", 500);
  }
};

// Get specific enrollment
export const getEnrollment = async (userId: string, courseId: string) => {
  try {
    return await EnrollmentModel.findOne({ userId, courseId })
      .populate("courseId")
      .populate("userId");
  } catch (error) {
    throw new AppError("Failed to fetch enrollment", 500);
  }
};

// Update enrollment progress
export const updateEnrollmentProgress = async (
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  completed: boolean,
  score?: number,
  timeSpent?: number
) => {
  try {
    const enrollment = await EnrollmentModel.findOne({ userId, courseId });
    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    // Use the new progress service
    await ProgressService.updateLessonProgress(
      enrollment._id.toString(),
      moduleId,
      lessonId,
      completed,
      score,
      timeSpent
    );

    // Return updated enrollment
    return await EnrollmentModel.findById(enrollment._id);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update enrollment progress", 500);
  }
};

// Mark enrollment as completed
export const completeEnrollment = async (userId: string, courseId: string) => {
  try {
    const enrollment = await EnrollmentModel.findOne({ userId, courseId });
    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    await (enrollment as any).markAsCompleted();
    return enrollment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to complete enrollment", 500);
  }
};

// Update enrollment status
export const updateEnrollmentStatus = async (
  userId: string,
  courseId: string,
  status: "active" | "completed" | "dropped" | "paused"
) => {
  try {
    const enrollment = await EnrollmentModel.findOneAndUpdate(
      { userId, courseId },
      { status, lastUpdated: new Date() },
      { new: true }
    );

    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    return enrollment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update enrollment status", 500);
  }
};

// Get enrollment statistics for a course
export const getCourseEnrollmentStats = async (
  courseId: string
): Promise<CourseEnrollmentStats> => {
  try {
    const stats = await EnrollmentModel.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          activeEnrollments: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          avgCompletionRate: { $avg: "$progress.overallCompletion" },
          avgTimeToComplete: {
            $avg: {
              $cond: [
                { $ne: ["$completedAt", null] },
                {
                  $divide: [
                    { $subtract: ["$completedAt", "$enrolledAt"] },
                    1000 * 60 * 60 * 24, // Convert to days
                  ],
                },
                null,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      avgCompletionRate: 0,
      avgTimeToComplete: null,
    };

    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEnrollments = await EnrollmentModel.countDocuments({
      courseId: new mongoose.Types.ObjectId(courseId),
      enrolledAt: { $gte: thirtyDaysAgo },
    });

    return {
      courseId,
      totalEnrollments: result.totalEnrollments,
      activeEnrollments: result.activeEnrollments,
      completedEnrollments: result.completedEnrollments,
      completionRate:
        result.totalEnrollments > 0
          ? Math.round(
              (result.completedEnrollments / result.totalEnrollments) * 100
            )
          : 0,
      averageTimeToComplete: result.avgTimeToComplete,
      recentEnrollments,
    };
  } catch (error) {
    throw new AppError("Failed to fetch course enrollment statistics", 500);
  }
};

// Get enrollment statistics for a user
export const getUserEnrollmentStats = async (
  userId: string
): Promise<UserEnrollmentStats> => {
  try {
    const stats = await EnrollmentModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          completedCourses: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          inProgressCourses: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          avgCompletionRate: { $avg: "$progress.overallCompletion" },
          totalTimeSpent: { $sum: "$totalTimeSpent" },
          categories: { $addToSet: "$course.category" },
        },
      },
    ]);

    const result = stats[0] || {
      totalEnrollments: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      avgCompletionRate: 0,
      totalTimeSpent: 0,
      categories: [],
    };

    return {
      userId,
      totalEnrollments: result.totalEnrollments,
      completedCourses: result.completedCourses,
      inProgressCourses: result.inProgressCourses,
      averageCompletionRate: Math.round(result.avgCompletionRate || 0),
      totalTimeSpent: result.totalTimeSpent || 0,
      favoriteCategories: result.categories,
    };
  } catch (error) {
    throw new AppError("Failed to fetch user enrollment statistics", 500);
  }
};

// Get overall enrollment statistics
export const getOverallEnrollmentStats = async (): Promise<EnrollmentStats> => {
  try {
    const stats = await EnrollmentModel.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          activeEnrollments: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          droppedEnrollments: {
            $sum: { $cond: [{ $eq: ["$status", "dropped"] }, 1, 0] },
          },
          avgCompletionRate: { $avg: "$progress.overallCompletion" },
          avgTimeToComplete: {
            $avg: {
              $cond: [
                { $ne: ["$completedAt", null] },
                {
                  $divide: [
                    { $subtract: ["$completedAt", "$enrolledAt"] },
                    1000 * 60 * 60 * 24, // Convert to days
                  ],
                },
                null,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      droppedEnrollments: 0,
      avgCompletionRate: 0,
      avgTimeToComplete: null,
    };

    return {
      totalEnrollments: result.totalEnrollments,
      activeEnrollments: result.activeEnrollments,
      completedEnrollments: result.completedEnrollments,
      droppedEnrollments: result.droppedEnrollments,
      averageCompletionRate: Math.round(result.avgCompletionRate || 0),
      averageTimeToComplete: result.avgTimeToComplete,
    };
  } catch (error) {
    throw new AppError("Failed to fetch overall enrollment statistics", 500);
  }
};

// Get detailed progress for an enrollment
export const getDetailedProgress = async (
  userId: string,
  courseId: string
): Promise<DetailedEnrollmentProgress> => {
  try {
    const enrollment = await EnrollmentModel.findOne({ userId, courseId });
    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    return await ProgressService.getDetailedProgress(enrollment._id.toString());
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get detailed progress", 500);
  }
};

// Get progress summaries for multiple enrollments (for dashboard)
export const getProgressSummaries = async (enrollmentIds: string[]) => {
  try {
    return await ProgressService.getProgressSummaries(enrollmentIds);
  } catch (error) {
    throw new AppError("Failed to get progress summaries", 500);
  }
};

// Delete enrollment
export const deleteEnrollment = async (userId: string, courseId: string) => {
  try {
    const enrollment = await EnrollmentModel.findOneAndDelete({
      userId,
      courseId,
    });
    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }
    return enrollment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to delete enrollment", 500);
  }
};
