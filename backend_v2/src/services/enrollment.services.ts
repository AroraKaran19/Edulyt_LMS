import { AppError } from "../middlewares/error.middleware";
import { EnrollmentModel } from "../models/enrollment.schema";
import {
  Enrollment,
  EnrollmentProgressSummary,
  DetailedEnrollmentProgress,
  UserEnrollmentStats,
  CourseEnrollmentStats,
  LastContentAccessed,
} from "../types";
import mongoose from "mongoose";

// Create new enrollment
export const CreateEnrollmentService = async (enrollmentData: {
  userId: string;
  courseId: string;
  enrollmentSource?: "direct" | "gift" | "promotion";
  promotionCode?: string;
  giftFrom?: string;
}): Promise<Enrollment | null> => {
  try {
    // Check if enrollment already exists
    const existingEnrollment = await EnrollmentModel.findOne({
      userId: enrollmentData.userId,
      courseId: enrollmentData.courseId,
      status: { $ne: "dropped" },
    });

    if (existingEnrollment) {
      throw new AppError("User is already enrolled in this course", 400);
    }

    const enrollment = new EnrollmentModel({
      ...enrollmentData,
      enrolledAt: new Date(),
      status: "active",
      progress: {
        overallCompletion: 0,
        totalModules: 0,
        completedModules: 0,
        totalLessons: 0,
        completedLessons: 0,
        lastActivityAt: new Date(),
      },
      lastUpdated: new Date(),
      totalTimeSpent: 0,
    });

    const savedEnrollment = await enrollment.save();
    return savedEnrollment as Enrollment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in CreateEnrollmentService:", error);
    throw new AppError(
      `Failed to create enrollment: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

// Get specific enrollment
export const GetEnrollmentService = async (
  enrollmentId: string
): Promise<Enrollment | null> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return null;
    }

    const enrollment = await EnrollmentModel.findById(enrollmentId)
      .populate("userId", "firstName lastName email profilePicture userType")
      .populate(
        "courseId",
        "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified"
      )
      .lean();

    return enrollment as Enrollment;
  } catch (error) {
    console.error("Database error in GetEnrollmentService:", error);
    throw new AppError("Failed to get enrollment", 500);
  }
};

// Get user enrollments
export const GetUserEnrollmentsService = async (
  userId: string,
  status?: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  enrollments: Enrollment[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    const skip = (page - 1) * limit;
    let filters: any = { userId };

    if (
      status &&
      ["active", "completed", "dropped", "paused"].includes(status)
    ) {
      filters.status = status;
    }

    const enrollments = await EnrollmentModel.find(filters)
      .populate(
        "courseId",
        "title thumbnail description category duration slug instructor plans analytics isFeatured isCertified"
      )
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EnrollmentModel.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    return {
      enrollments: enrollments as Enrollment[],
      total,
      totalPages,
      page,
    };
  } catch (error) {
    console.error("Database error in GetUserEnrollmentsService:", error);
    throw new AppError("Failed to get user enrollments", 500);
  }
};

// Update enrollment progress
export const UpdateEnrollmentProgressService = async (
  enrollmentId: string,
  progressData: {
    moduleId?: string;
    lessonId?: string;
    contentId?: string;
    contentType?: "video" | "quiz" | "document";
    lastPosition?: number;
    completed?: boolean;
    timeSpent?: number;
  }
): Promise<Enrollment | null> => {
  try {
    const enrollment = await EnrollmentModel.findById(enrollmentId);
    if (!enrollment) {
      return null;
    }

    // Update last accessed content
    const lastContentAccessed: LastContentAccessed = {
      moduleId: progressData.moduleId || "",
      lessonId: progressData.lessonId || "",
      contentId: progressData.contentId || "",
      contentType: progressData.contentType || "video",
      lastPosition: progressData.lastPosition,
      timestamp: new Date(),
    };

    // Update progress summary
    const updatedProgress: EnrollmentProgressSummary = {
      ...enrollment.progress,
      lastActivityAt: new Date(),
    };

    // If lesson completed, update counters
    if (progressData.completed) {
      updatedProgress.completedLessons += 1;
      // Recalculate overall completion
      if (updatedProgress.totalLessons > 0) {
        updatedProgress.overallCompletion =
          (updatedProgress.completedLessons / updatedProgress.totalLessons) *
          100;
      }
    }

    // Update total time spent
    const additionalTimeSpent = progressData.timeSpent || 0;
    const newTotalTimeSpent =
      (enrollment.totalTimeSpent || 0) + additionalTimeSpent;

    const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
      enrollmentId,
      {
        progress: updatedProgress,
        lastContentAccessed,
        lastUpdated: new Date(),
        lastActivityAt: new Date(),
        totalTimeSpent: newTotalTimeSpent,
      },
      { new: true }
    ).populate(
      "courseId",
      "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified"
    );

    return updatedEnrollment as Enrollment;
  } catch (error) {
    console.error("Database error in UpdateEnrollmentProgressService:", error);
    throw new AppError("Failed to update enrollment progress", 500);
  }
};

// Update enrollment status
export const UpdateEnrollmentStatusService = async (
  enrollmentId: string,
  status: "active" | "completed" | "dropped" | "paused"
): Promise<Enrollment | null> => {
  try {
    const updateData: any = {
      status,
      lastUpdated: new Date(),
    };

    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
      enrollmentId,
      updateData,
      { new: true }
    ).populate(
      "courseId",
      "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified"
    );

    return updatedEnrollment as Enrollment;
  } catch (error) {
    console.error("Database error in UpdateEnrollmentStatusService:", error);
    throw new AppError("Failed to update enrollment status", 500);
  }
};

// Pause enrollment
export const PauseEnrollmentService = async (
  enrollmentId: string
): Promise<Enrollment | null> => {
  return UpdateEnrollmentStatusService(enrollmentId, "paused");
};

// Resume enrollment
export const ResumeEnrollmentService = async (
  enrollmentId: string
): Promise<Enrollment | null> => {
  return UpdateEnrollmentStatusService(enrollmentId, "active");
};

// Issue certificate
export const IssueCertificateService = async (
  enrollmentId: string
): Promise<Enrollment | null> => {
  try {
    const enrollment = await EnrollmentModel.findById(enrollmentId);
    if (!enrollment) {
      return null;
    }

    if (enrollment.status !== "completed") {
      throw new AppError(
        "Enrollment must be completed to issue certificate",
        400
      );
    }

    const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
      enrollmentId,
      {
        certificateIssued: true,
        certificateIssuedAt: new Date(),
        lastUpdated: new Date(),
      },
      { new: true }
    ).populate(
      "courseId",
      "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified"
    );

    return updatedEnrollment as Enrollment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in IssueCertificateService:", error);
    throw new AppError("Failed to issue certificate", 500);
  }
};

// Get enrollment statistics for user
export const GetEnrollmentStatsService = async (
  userId: string
): Promise<UserEnrollmentStats> => {
  try {
    const stats = await EnrollmentModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
          totalTimeSpent: { $sum: "$totalTimeSpent" },
          averageCompletionRate: { $avg: "$progress.overallCompletion" },
        },
      },
    ]);

    const result = stats[0] || {
      totalEnrollments: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      totalTimeSpent: 0,
      averageCompletionRate: 0,
    };

    // Get favorite categories
    const categoryStats = await EnrollmentModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      { $group: { _id: "$course.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const favoriteCategories = categoryStats.map((stat) => stat._id);

    return {
      ...result,
      favoriteCategories,
    } as UserEnrollmentStats;
  } catch (error) {
    console.error("Database error in GetEnrollmentStatsService:", error);
    throw new AppError("Failed to get enrollment statistics", 500);
  }
};

// Get course enrollment statistics
export const GetCourseEnrollmentStatsService = async (
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
          averageCompletionRate: { $avg: "$progress.overallCompletion" },
          recentEnrollments: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$enrolledAt",
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      courseId,
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      completionRate: 0,
      recentEnrollments: 0,
    };

    return result as CourseEnrollmentStats;
  } catch (error) {
    console.error("Database error in GetCourseEnrollmentStatsService:", error);
    throw new AppError("Failed to get course enrollment statistics", 500);
  }
};

// Get detailed progress
export const GetDetailedProgressService = async (
  enrollmentId: string
): Promise<DetailedEnrollmentProgress | null> => {
  try {
    const enrollment = await EnrollmentModel.findById(enrollmentId)
      .populate(
        "courseId",
        "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified"
      )
      .populate("userId", "firstName lastName email profilePicture userType");

    if (!enrollment) {
      return null;
    }

    const detailedProgress: DetailedEnrollmentProgress = {
      enrollmentId,
      progress: enrollment.progress,
      lastContentAccessed: (enrollment as any).lastContentAccessed,
      moduleProgress: [], // This would be populated from a separate collection
    };

    return detailedProgress;
  } catch (error) {
    console.error("Database error in GetDetailedProgressService:", error);
    throw new AppError("Failed to get detailed progress", 500);
  }
};

// Get enrollment analytics
export const GetEnrollmentAnalyticsService = async (
  userId: string,
  period: number = 30
): Promise<any> => {
  try {
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    const analytics = await EnrollmentModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          recentEnrollments: {
            $sum: {
              $cond: [{ $gte: ["$enrolledAt", startDate] }, 1, 0],
            },
          },
          averageProgress: { $avg: "$progress.overallCompletion" },
          totalTimeSpent: { $sum: "$totalTimeSpent" },
          completionRate: {
            $avg: {
              $cond: [{ $eq: ["$status", "completed"] }, 100, 0],
            },
          },
        },
      },
    ]);

    return (
      analytics[0] || {
        totalEnrollments: 0,
        recentEnrollments: 0,
        averageProgress: 0,
        totalTimeSpent: 0,
        completionRate: 0,
      }
    );
  } catch (error) {
    console.error("Database error in GetEnrollmentAnalyticsService:", error);
    throw new AppError("Failed to get enrollment analytics", 500);
  }
};

// Get enrollment history
export const GetEnrollmentHistoryService = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  enrollments: Enrollment[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    const skip = (page - 1) * limit;

    const enrollments = await EnrollmentModel.find({ userId })
      .populate(
        "courseId",
        "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified"
      )
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EnrollmentModel.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);

    return {
      enrollments: enrollments as Enrollment[],
      total,
      totalPages,
      page,
    };
  } catch (error) {
    console.error("Database error in GetEnrollmentHistoryService:", error);
    throw new AppError("Failed to get enrollment history", 500);
  }
};

// Delete enrollment (soft delete)
export const DeleteEnrollmentService = async (
  enrollmentId: string
): Promise<boolean> => {
  try {
    const result = await EnrollmentModel.findByIdAndUpdate(enrollmentId, {
      status: "dropped",
      lastUpdated: new Date(),
    });

    return !!result;
  } catch (error) {
    console.error("Database error in DeleteEnrollmentService:", error);
    throw new AppError("Failed to delete enrollment", 500);
  }
};
