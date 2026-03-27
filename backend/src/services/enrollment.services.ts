import { AppError } from "../middlewares/error.middleware";
import { EnrollmentModel } from "../models/enrollment.schema";
import { StudentModel, CourseModel, UserModel } from "../models";
import {
  Enrollment,
  EnrollmentProgressSummary,
  DetailedEnrollmentProgress,
  UserEnrollmentStats,
  CourseEnrollmentStats,
  LastContentAccessed,
  PartialAccessControl,
} from "../types";
import mongoose from "mongoose";
import {
  createCertificateService,
  getLatestCertificateService,
} from "./certificate.services";
import { createCertificateJobService } from "./certificateJob.services";

/**
 * Check if an enrollment is still valid (not expired)
 * Trial enrollments expire based on trialExpiresAt
 * Non-trial enrollments expire after 4 years (validUntil)
 */
export const isEnrollmentValid = (enrollment: Enrollment): boolean => {
  if (!enrollment) return false;

  // Check if trial enrollment has expired
  if (enrollment.isTrial && enrollment.trialExpiresAt) {
    return new Date() < new Date(enrollment.trialExpiresAt);
  }

  // Check if non-trial enrollment has expired (4-year validity)
  if (!enrollment.isTrial && enrollment.validUntil) {
    return new Date() < new Date(enrollment.validUntil);
  }

  // If no expiration date is set, consider it valid (for backward compatibility)
  return true;
};

// Create new enrollment
export const CreateEnrollmentService = async (enrollmentData: {
  userId: string;
  courseId: string;
  enrollmentSource?: "direct" | "gift" | "promotion" | "trial";
  promotionCode?: string;
  giftFrom?: string;
  planType?: "elite" | "essential";
  accessControl?: PartialAccessControl;
  /** Collaboration domain top-N rule (first N contents per lesson). */
  collaborationTopNSettings?: { contentsPerLesson: number };
  isTrial?: boolean;
  trialDurationDays?: number;
}): Promise<Enrollment | null> => {
  try {
    let giftFromSnapshot: { displayName: string; email?: string } | undefined;
    if (enrollmentData.enrollmentSource === "gift" && enrollmentData.giftFrom) {
      const gifter = await UserModel.findById(enrollmentData.giftFrom)
        .select("firstName lastName email")
        .lean();
      if (gifter) {
        const displayName =
          [gifter.firstName, gifter.lastName].filter(Boolean).join(" ").trim() ||
          gifter.email ||
          "Unknown";
        giftFromSnapshot = {
          displayName,
          ...(gifter.email ? { email: gifter.email } : {}),
        };
      }
    }

    // Check if enrollment already exists
    const existingEnrollment = await EnrollmentModel.findOne({
      userId: enrollmentData.userId,
      courseId: enrollmentData.courseId,
      status: { $nin: ["dropped", "revoked"] },
    });

    if (existingEnrollment) {
      throw new AppError("User is already enrolled in this course", 400);
    }

    const enrollment = new EnrollmentModel({
      ...enrollmentData,
      ...(giftFromSnapshot ? { giftFromSnapshot } : {}),
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
      accessControl: enrollmentData.accessControl || undefined,
      collaborationTopNSettings:
        enrollmentData.collaborationTopNSettings || undefined,
    });

    const savedEnrollment = await enrollment.save();

    // Add enrollment ID to student's enrollments array
    await StudentModel.findByIdAndUpdate(
      enrollmentData.userId,
      { $push: { enrollments: savedEnrollment._id } },
      { new: true }
    );

    // Update course analytics (total enrollments and active enrollments)
    await CourseModel.findByIdAndUpdate(
      enrollmentData.courseId,
      {
        $inc: {
          "analytics.totalEnrollments": 1,
          "analytics.activeEnrollments": 1,
          enrollments: 1,
        },
      },
      { new: true }
    );

    // Get course to access instructors
    const course = await CourseModel.findById(enrollmentData.courseId);

    if (course && course.instructor) {
      // Extract instructor IDs
      const instructorIds: string[] = [];

      if (Array.isArray(course.instructor)) {
        for (const instructor of course.instructor) {
          if (typeof instructor === "string") {
            instructorIds.push(instructor);
          } else if (
            instructor &&
            typeof instructor === "object" &&
            "_id" in instructor
          ) {
            instructorIds.push((instructor as any)._id.toString());
          }
        }
      } else {
        const instructor = course.instructor as any;
        if (typeof instructor === "string") {
          instructorIds.push(instructor);
        } else if (
          instructor &&
          typeof instructor === "object" &&
          "_id" in instructor
        ) {
          instructorIds.push(instructor._id.toString());
        }
      }

      // Update totalStudents for each instructor
      for (const instructorId of instructorIds) {
        await UserModel.findByIdAndUpdate(
          instructorId,
          { $inc: { totalStudents: 1 } },
          { new: true }
        );
      }
    }

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
      .populate({
        path: "courseId",
        select:
          "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified",
        populate: {
          path: "instructor",
          select: "firstName lastName email profilePicture",
        },
      })
      .lean();

    const enrollmentData = enrollment as Enrollment;

    // Check if enrollment is still valid
    if (enrollmentData && !isEnrollmentValid(enrollmentData)) {
      // Mark as expired by updating status (optional - you might want to handle this differently)
      // For now, we'll just return it but the frontend/API should check validity
      return enrollmentData;
    }

    return enrollmentData;
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
  limit: number = 10,
  search?: string,
  sortBy?: string
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
      ["active", "completed", "dropped", "revoked", "paused"].includes(status)
    ) {
      filters.status = status;
    } else if (!status) {
      filters.status = { $nin: ["dropped", "revoked"] };
    }

    // Build sort object based on sortBy parameter
    let sortObj: any = { enrolledAt: -1 }; // Default sort
    if (sortBy) {
      switch (sortBy) {
        case "recent":
          sortObj = { enrolledAt: -1 };
          break;
        case "progress-desc":
          sortObj = { "progress.overallCompletion": -1 };
          break;
        case "progress-asc":
          sortObj = { "progress.overallCompletion": 1 };
          break;
        case "name-asc":
          sortObj = { "courseId.title": 1 };
          break;
        case "name-desc":
          sortObj = { "courseId.title": -1 };
          break;
        case "duration-asc":
          sortObj = { "courseId.duration": 1 };
          break;
        case "duration-desc":
          sortObj = { "courseId.duration": -1 };
          break;
        default:
          sortObj = { enrolledAt: -1 };
      }
    }

    const enrollments = await EnrollmentModel.find(filters)
      .populate({
        path: "courseId",
        select:
          "title thumbnail description category duration slug instructor plans analytics isFeatured isCertified",
        match: search
          ? {
              $or: [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
              ],
            }
          : {},
        populate: [
          {
            path: "instructor",
            select: "firstName lastName email profilePicture",
          },
          {
            path: "category",
            select: "name",
          },
        ],
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter out enrollments where courseId is null (due to search match)
    const filteredEnrollments = enrollments.filter(
      (enrollment) => enrollment.courseId
    );

    const total = await EnrollmentModel.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    return {
      enrollments: filteredEnrollments as Enrollment[],
      total,
      totalPages,
      page,
    };
  } catch (error) {
    console.error("Database error in GetUserEnrollmentsService:", error);
    throw new AppError("Failed to get user enrollments", 500);
  }
};

/**
 * Get course IDs enrolled per user for multiple users (batch)
 * Returns Record<userId, courseId[]>
 */
export const GetEnrollmentsByUserIdsService = async (
  userIds: string[]
): Promise<Record<string, string[]>> => {
  if (!userIds?.length) return {};

  const validIds = userIds.filter(
    (id) => id && mongoose.Types.ObjectId.isValid(id)
  );
  if (validIds.length === 0) return {};

  try {
    const enrollments = await EnrollmentModel.find({
      userId: { $in: validIds },
      status: { $in: ["active", "completed", "paused"] },
    })
      .select("userId courseId")
      .lean();

    const result: Record<string, string[]> = {};
    for (const e of enrollments) {
      const uid = String(e.userId);
      const cid =
        typeof e.courseId === "object" && (e.courseId as any)?._id
          ? String((e.courseId as any)._id)
          : e.courseId
          ? String(e.courseId)
          : "";
      if (!cid) continue;
      if (!result[uid]) result[uid] = [];
      if (!result[uid].includes(cid)) result[uid].push(cid);
    }
    return result;
  } catch (error) {
    console.error("Database error in GetEnrollmentsByUserIdsService:", error);
    throw new AppError("Failed to get batch enrollments", 500);
  }
};

// Helper function to calculate course structure totals
const calculateCourseStructureTotals = async (
  courseId: string
): Promise<{
  totalModules: number;
  totalLessons: number;
  totalContents: number;
}> => {
  let totalContents = 0;
  let totalModules = 0;
  let totalLessons = 0;

  try {
    const course = await CourseModel.findById(courseId)
      .select("modules")
      .populate({
        path: "modules",
        select: "lessons isActive",
        populate: {
          path: "lessons",
          select: "contents isActive",
          populate: {
            path: "contents",
            select: "_id isActive",
          },
        },
      })
      .lean();

    if (course && course.modules && Array.isArray(course.modules)) {
      // Filter out null modules and only count active ones
      const activeModules = course.modules.filter(
        (m: any) => m !== null && m !== undefined && m.isActive !== false
      );
      totalModules = activeModules.length;

      activeModules.forEach((module: any) => {
        if (module.lessons && Array.isArray(module.lessons)) {
          // Filter out null lessons and only count active ones
          const activeLessons = module.lessons.filter(
            (l: any) => l !== null && l !== undefined && l.isActive !== false
          );
          totalLessons += activeLessons.length;

          activeLessons.forEach((lesson: any) => {
            if (lesson.contents && Array.isArray(lesson.contents)) {
              // Filter out null contents and only count active ones
              const activeContents = lesson.contents.filter(
                (c: any) =>
                  c !== null && c !== undefined && c.isActive !== false
              );
              totalContents += activeContents.length;
            }
          });
        }
      });
    }
  } catch (error) {
    console.error(
      `[calculateCourseStructureTotals] Error for course ${courseId}:`,
      error
    );
    throw error;
  }

  return { totalModules, totalLessons, totalContents };
};

// Recalculate progress for an enrollment (useful for fixing existing enrollments)
export const RecalculateEnrollmentProgressService = async (
  enrollmentId: string
): Promise<Enrollment | null> => {
  try {
    const enrollment = await EnrollmentModel.findById(enrollmentId);
    if (!enrollment || !enrollment.courseId) {
      return null;
    }

    const { totalModules, totalLessons, totalContents } =
      await calculateCourseStructureTotals(enrollment.courseId.toString());

    const completedContents = enrollment.completedContents || [];
    const completedContentsCount = completedContents.length;

    // Calculate overall completion
    let overallCompletion = 0;
    if (totalContents > 0) {
      overallCompletion = Math.round(
        (completedContentsCount / totalContents) * 100
      );
      if (overallCompletion > 100) {
        overallCompletion = 100;
      }
    }

    // Calculate completed modules and lessons
    const completedModuleIds = new Set(
      completedContents.map((c) => c.moduleId).filter(Boolean)
    );
    const completedLessonIds = new Set(
      completedContents.map((c) => c.lessonId).filter(Boolean)
    );

    const updatedProgress: EnrollmentProgressSummary = {
      overallCompletion,
      totalModules,
      completedModules: completedModuleIds.size,
      totalLessons,
      completedLessons: completedLessonIds.size,
      lastActivityAt: enrollment.progress?.lastActivityAt || new Date(),
    };

    // Check if course should be marked as completed
    let finalStatus = enrollment.status;
    let completedAt = enrollment.completedAt;

    if (overallCompletion >= 100 && enrollment.status !== "completed") {
      finalStatus = "completed";
      completedAt = new Date();
    }

    const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
      enrollmentId,
      {
        progress: updatedProgress,
        status: finalStatus,
        completedAt: completedAt,
        lastUpdated: new Date(),
      },
      { new: true }
    ).populate({
      path: "courseId",
      select:
        "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified",
      populate: {
        path: "instructor",
        select: "firstName lastName email profilePicture",
      },
    });

    // Automatically generate certificate when course reaches 100% completion
    // Only if course is certified and certificate doesn't already exist
    // Check if enrollment is completed (either just completed or already was completed)
    const isCompleted =
      finalStatus === "completed" || updatedProgress.overallCompletion >= 100;

    if (isCompleted && completedAt) {
      try {
        // DO NOT generate certificate for partial access users
        // Only generate certificates for users with FULL course access
        const hasFullAccess = !updatedEnrollment?.accessControl || 
          updatedEnrollment.accessControl.accessType === "full";

        if (!hasFullAccess) {
          console.log(`Skipping certificate generation for enrollment ${enrollmentId} - user has partial access`);
        } else {
          // Check if certificate already exists
          const existingCertificate = await getLatestCertificateService(
            enrollmentId
          );

          if (!existingCertificate) {
            // Get course details (already populated above)
            const course = updatedEnrollment?.courseId as any;

            if (course && course.isCertified) {
              // Create certificate generation job (non-blocking)
              try {
                await createCertificateJobService({
                  enrollmentId: enrollmentId.toString(),
                  studentName: "", // Will be fetched by worker
                  courseName: "", // Will be fetched by worker
                  completionDate: completedAt,
                });
                console.log(`Certificate generation job created for enrollment ${enrollmentId}`);
              } catch (jobError) {
                console.error("Error creating certificate job:", jobError);
                // Job creation failure shouldn't prevent enrollment completion
              }
            }
          }
        }
      } catch (certError) {
        // Log error but don't fail the enrollment update
        console.error("Error auto-generating certificate:", certError);
        // Certificate generation failure shouldn't prevent enrollment completion
      }
    }

    return updatedEnrollment as Enrollment;
  } catch (error) {
    console.error(
      "Database error in RecalculateEnrollmentProgressService:",
      error
    );
    throw new AppError("Failed to recalculate enrollment progress", 500);
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

    // Handle completed content with timestamp tracking
    let updatedCompletedContents = [...(enrollment.completedContents || [])];

    if (progressData.completed && progressData.contentId) {
      // Check if content is already marked as completed
      const existingCompletion = updatedCompletedContents.find(
        (completion) => completion.contentId === progressData.contentId
      );

      // Get actual content duration from course structure
      let actualContentDurationMinutes = progressData.timeSpent || 0;
      try {
        if (!enrollment.courseId) {
          throw new Error("Course ID is missing");
        }

        let courseIdString: string;
        if (
          typeof enrollment.courseId === "object" &&
          enrollment.courseId !== null &&
          "_id" in enrollment.courseId
        ) {
          courseIdString = (enrollment.courseId as any)._id.toString();
        } else {
          courseIdString = enrollment.courseId.toString();
        }

        // Fetch course with content details to get actual duration
        const course = await CourseModel.findById(courseIdString)
          .select("modules")
          .populate({
            path: "modules",
            select: "lessons",
            populate: {
              path: "lessons",
              select: "contents",
              populate: {
                path: "contents",
                select: "_id duration type",
              },
            },
          })
          .lean();

        if (course && course.modules) {
          // Find the content in the course structure
          for (const module of course.modules as any[]) {
            if (!module || !module.lessons) continue;
            for (const lesson of module.lessons) {
              if (!lesson || !lesson.contents) continue;
              const content = lesson.contents.find(
                (c: any) =>
                  c && c._id && c._id.toString() === progressData.contentId
              );
              if (content && content.type === "video" && content.duration) {
                // Duration is in seconds, convert to minutes
                actualContentDurationMinutes = Math.round(
                  content.duration / 60
                );
                break;
              }
            }
            if (actualContentDurationMinutes > (progressData.timeSpent || 0)) {
              break;
            }
          }
        }
      } catch (error) {
        // If we can't fetch duration, use the provided timeSpent
        console.error("Error fetching content duration:", error);
      }

      // Use the maximum of: provided timeSpent or actual content duration
      const finalTimeSpent = Math.max(
        progressData.timeSpent || 0,
        actualContentDurationMinutes
      );

      // Only add if not already completed (avoid duplicate entries)
      if (!existingCompletion) {
        updatedCompletedContents.push({
          contentId: progressData.contentId,
          completedAt: new Date(),
          moduleId: progressData.moduleId,
          lessonId: progressData.lessonId,
          contentType: progressData.contentType,
          timeSpent: finalTimeSpent,
        });
      } else {
        // Update existing completion with the maximum timeSpent
        existingCompletion.timeSpent = Math.max(
          existingCompletion.timeSpent || 0,
          finalTimeSpent
        );
      }
    }

    // ALWAYS recalculate progress from course structure and completed contents
    // This ensures progress is accurate even if it wasn't calculated before
    let totalContents = 0;
    let totalModules = 0;
    let totalLessons = 0;

    try {
      if (!enrollment.courseId) {
        throw new Error("Course ID is missing from enrollment");
      }

      // Handle both ObjectId and string formats
      let courseIdString: string;
      if (
        typeof enrollment.courseId === "object" &&
        enrollment.courseId !== null &&
        "_id" in enrollment.courseId
      ) {
        courseIdString = (enrollment.courseId as any)._id.toString();
      } else {
        courseIdString = enrollment.courseId.toString();
      }

      const structureTotals = await calculateCourseStructureTotals(
        courseIdString
      );
      totalModules = structureTotals.totalModules;
      totalLessons = structureTotals.totalLessons;
      totalContents = structureTotals.totalContents;

      // If totals are 0 or less than completed contents, something went wrong - use fallback
      if (
        (totalContents === 0 ||
          totalContents < updatedCompletedContents.length) &&
        updatedCompletedContents.length > 0
      ) {
        // Fallback: conservative estimate - must be > completedContents to avoid false 100%
        const uniqueModules = new Set(
          updatedCompletedContents.map((c) => c.moduleId).filter(Boolean)
        );
        const uniqueLessons = new Set(
          updatedCompletedContents.map((c) => c.lessonId).filter(Boolean)
        );

        totalContents = Math.max(
          updatedCompletedContents.length + 1,
          uniqueLessons.size * 2,
          1
        );
        totalModules = Math.max(uniqueModules.size || totalModules, 1);
        totalLessons = Math.max(uniqueLessons.size || totalLessons, 1);
      }
    } catch (error) {
      console.error("Error calculating total contents:", error);
      // If calculation fails, use fallback based on completed contents
      const uniqueModules = new Set(
        updatedCompletedContents.map((c) => c.moduleId).filter(Boolean)
      );
      const uniqueLessons = new Set(
        updatedCompletedContents.map((c) => c.lessonId).filter(Boolean)
      );

      // Use existing values if available, otherwise estimate from completed contents
      totalModules =
        updatedProgress.totalModules > 0
          ? updatedProgress.totalModules
          : Math.max(uniqueModules.size, 1);
      totalLessons =
        updatedProgress.totalLessons > 0
          ? updatedProgress.totalLessons
          : Math.max(uniqueLessons.size, 1);
      totalContents =
        updatedProgress.totalModules > 0 && updatedProgress.totalLessons > 0
          ? Math.max(
              updatedCompletedContents.length + 1,
              updatedProgress.totalLessons * 2
            )
          : Math.max(updatedCompletedContents.length + 1, 1);
    }

    // CRITICAL: Ensure we ALWAYS have valid totals if there are completed contents
    const completedContentsCount = updatedCompletedContents.length;

    // If totals are still 0 but we have completed contents, use conservative fallback
    // Never set totalContents = completedContentsCount — that would wrongly show 100%
    if (totalContents === 0 && completedContentsCount > 0) {
      const uniqueModules = new Set(
        updatedCompletedContents.map((c) => c.moduleId).filter(Boolean)
      );
      const uniqueLessons = new Set(
        updatedCompletedContents.map((c) => c.lessonId).filter(Boolean)
      );

      // Use conservative minimum so we never falsely mark course complete
      // (totalContents must be > completedContentsCount)
      totalContents = Math.max(
        completedContentsCount + 1,
        uniqueLessons.size || 1
      );
      totalModules = Math.max(uniqueModules.size || totalModules, 1);
      totalLessons = Math.max(uniqueLessons.size || totalLessons, 1);
    }

    // Update progress summary with calculated totals (ALWAYS update, even if 0)
    updatedProgress.totalModules = totalModules;
    updatedProgress.totalLessons = totalLessons;

    // Calculate overall completion - this should NEVER be 0 if we have completed contents
    if (totalContents > 0) {
      updatedProgress.overallCompletion = Math.round(
        (completedContentsCount / totalContents) * 100
      );
      // Cap at 100%
      if (updatedProgress.overallCompletion > 100) {
        updatedProgress.overallCompletion = 100;
      }
    } else if (completedContentsCount > 0) {
      // totalContents is 0 but we have completed contents — use conservative estimate
      // Never set 100% when we don't know the real total
      totalContents = Math.max(completedContentsCount + 1, 1);
      updatedProgress.overallCompletion = Math.round(
        (completedContentsCount / totalContents) * 100
      );
    } else {
      // No completed contents and no total contents - set to 0
      updatedProgress.overallCompletion = 0;
    }

    // Calculate completed modules and lessons
    // A lesson is completed ONLY when ALL contents in that lesson are completed
    // A module is completed ONLY when ALL lessons in that module are completed
    let completedLessonsCount = 0;
    let completedModulesCount = 0;

    try {
      if (!enrollment.courseId) {
        throw new Error("Course ID is missing from enrollment");
      }

      // Handle both ObjectId and string formats
      let courseIdString: string;
      if (
        typeof enrollment.courseId === "object" &&
        enrollment.courseId !== null &&
        "_id" in enrollment.courseId
      ) {
        courseIdString = (enrollment.courseId as any)._id.toString();
      } else {
        courseIdString = enrollment.courseId.toString();
      }

      // Get course structure to check lesson/module completion
      const course = await CourseModel.findById(courseIdString)
        .select("modules")
        .populate({
          path: "modules",
          select: "lessons isActive",
          populate: {
            path: "lessons",
            select: "contents isActive",
            populate: {
              path: "contents",
              select: "_id isActive",
            },
          },
        })
        .lean();

      if (course && course.modules && Array.isArray(course.modules)) {
        const activeModules = course.modules.filter(
          (m: any) => m !== null && m !== undefined && m.isActive !== false
        );

        // Create a Set of completed content IDs for quick lookup
        const completedContentIds = new Set(
          updatedCompletedContents.map((c) => c.contentId)
        );

        activeModules.forEach((module: any) => {
          if (module.lessons && Array.isArray(module.lessons)) {
            const activeLessons = module.lessons.filter(
              (l: any) => l !== null && l !== undefined && l.isActive !== false
            );

            let moduleLessonsCompleted = 0;

            activeLessons.forEach((lesson: any) => {
              if (lesson.contents && Array.isArray(lesson.contents)) {
                const activeContents = lesson.contents.filter(
                  (c: any) =>
                    c !== null && c !== undefined && c.isActive !== false
                );

                // Check if ALL contents in this lesson are completed
                const allContentsCompleted =
                  activeContents.length > 0 &&
                  activeContents.every((content: any) =>
                    completedContentIds.has(content._id.toString())
                  );

                if (allContentsCompleted) {
                  completedLessonsCount++;
                  moduleLessonsCompleted++;
                }
              }
            });

            // A module is completed if ALL its lessons are completed
            if (
              activeLessons.length > 0 &&
              moduleLessonsCompleted === activeLessons.length
            ) {
              completedModulesCount++;
            }
          }
        });
      }
    } catch (error) {
      console.error("Error calculating completed lessons/modules:", error);
      // Fallback: use simple count (any content = lesson completed)
      const completedModuleIds = new Set(
        updatedCompletedContents.map((c) => c.moduleId).filter(Boolean)
      );
      const completedLessonIds = new Set(
        updatedCompletedContents.map((c) => c.lessonId).filter(Boolean)
      );
      completedLessonsCount = completedLessonIds.size;
      completedModulesCount = completedModuleIds.size;
    }

    updatedProgress.completedModules = completedModulesCount;
    updatedProgress.completedLessons = completedLessonsCount;

    // Recalculate if we have completed contents but progress is still 0
    // (e.g. due to rounding). Never use totalContents = completedContentsCount — that wrongly yields 100%
    if (completedContentsCount > 0 && updatedProgress.overallCompletion === 0) {
      if (totalContents === 0) {
        totalContents = Math.max(completedContentsCount + 1, 1);
        updatedProgress.totalModules = Math.max(
          updatedProgress.totalModules,
          completedModulesCount || 1
        );
        updatedProgress.totalLessons = Math.max(
          updatedProgress.totalLessons,
          completedLessonsCount || 1
        );
      }
      updatedProgress.overallCompletion = Math.round(
        (completedContentsCount / totalContents) * 100
      );
      if (updatedProgress.overallCompletion > 100)
        updatedProgress.overallCompletion = 100;
    }

    // Automatically mark course as completed when overallCompletion reaches 100%
    let finalStatus = enrollment.status;
    let completedAt = enrollment.completedAt;

    if (
      updatedProgress.overallCompletion >= 100 &&
      enrollment.status !== "completed"
    ) {
      finalStatus = "completed";
      completedAt = new Date();
    }

    // Calculate total time spent from all completed contents (in minutes, then convert to seconds)
    // This ensures accuracy and avoids double-counting
    const totalTimeSpentMinutes = updatedCompletedContents.reduce(
      (total, completion) => total + (completion.timeSpent || 0),
      0
    );
    const newTotalTimeSpent = totalTimeSpentMinutes * 60; // Convert minutes to seconds

    // Ensure module/lesson counts are set when we have completed contents
    // (Do NOT force overallCompletion to 100% — that was a bug)
    if (updatedCompletedContents.length > 0) {
      if (updatedProgress.totalModules === 0) {
        const uniqueModules = new Set(
          updatedCompletedContents.map((c) => c.moduleId).filter(Boolean)
        );
        updatedProgress.totalModules = Math.max(uniqueModules.size, 1);
      }
      if (updatedProgress.totalLessons === 0) {
        const uniqueLessons = new Set(
          updatedCompletedContents.map((c) => c.lessonId).filter(Boolean)
        );
        updatedProgress.totalLessons = Math.max(uniqueLessons.size, 1);
      }
    }

    // Use dot notation to ensure Mongoose properly updates nested progress object
    const updateData: any = {
      "progress.overallCompletion": updatedProgress.overallCompletion,
      "progress.totalModules": updatedProgress.totalModules,
      "progress.completedModules": updatedProgress.completedModules,
      "progress.totalLessons": updatedProgress.totalLessons,
      "progress.completedLessons": updatedProgress.completedLessons,
      "progress.lastActivityAt": updatedProgress.lastActivityAt || new Date(),
      completedContents: updatedCompletedContents,
      lastContentAccessed,
      lastUpdated: new Date(),
      lastActivityAt: new Date(),
      totalTimeSpent: newTotalTimeSpent,
      status: finalStatus,
    };

    if (completedAt) {
      updateData.completedAt = completedAt;
    }

    const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
      enrollmentId,
      updateData,
      { new: true, runValidators: true }
    ).select("-__v"); // Don't use lean() - we need the Mongoose document for proper ObjectId handling

    // Automatically generate certificate when course reaches 100% completion
    // Only if course is certified and certificate doesn't already exist
    // Check if enrollment is completed (either just completed or already was completed)
    const isCompleted =
      finalStatus === "completed" || updatedProgress.overallCompletion >= 100;

    if (isCompleted && completedAt) {
      try {
        // Use updatedEnrollment to get the latest enrollment data
        const enrollmentForCert = updatedEnrollment || enrollment;
        
        // Check if certificate already exists
        const existingCertificate = await getLatestCertificateService(
          enrollmentId
        );

        if (existingCertificate) {
          console.log(`Certificate already exists for enrollment ${enrollmentId}`);
        } else if (enrollmentForCert.isTrial) {
          console.log(`Skipping certificate generation for trial enrollment ${enrollmentId}`);
        } else {
          // DO NOT generate certificate for partial access users
          // Only generate certificates for users with FULL course access
          const hasFullAccess = !enrollmentForCert.accessControl || 
            enrollmentForCert.accessControl.accessType === "full";

        if (!hasFullAccess) {
          console.log(`Skipping certificate generation for enrollment ${enrollmentId} - user has partial access`);
        } else {
          // Get course and user details for certificate generation
          const courseId = enrollmentForCert.courseId?.toString() || enrollment.courseId?.toString();
          const userId = enrollmentForCert.userId?.toString() || enrollment.userId?.toString();
          
          if (!courseId || !userId) {
            console.error(`Missing courseId or userId for enrollment ${enrollmentId}`);
          } else {
            const course = await CourseModel.findById(courseId)
              .populate("instructor", "firstName lastName")
              .lean();

            const user = await UserModel.findById(userId)
              .select("firstName lastName")
              .lean();

            if (!course) {
              console.error(`Course not found for enrollment ${enrollmentId}, courseId: ${courseId}`);
            } else if (!user) {
              console.error(`User not found for enrollment ${enrollmentId}, userId: ${userId}`);
            } else if (!course.isCertified) {
              console.log(`Course ${courseId} is not certified, skipping certificate generation`);
            } else {
              // Get student full name
              const studentName = `${user.firstName || ""} ${
                user.lastName || ""
              }`.trim();

              if (!studentName) {
                console.error(`Student name is empty for enrollment ${enrollmentId}`);
              } else {
                // Get course name
                const courseName = course.title || "";

                // Get key topics from course (if available in course structure)
                // You might need to extract this from course modules/lessons
                let keyTopics: string | undefined;
                // For now, we'll leave it undefined - can be enhanced later

                console.log(`Creating certificate generation job for enrollment ${enrollmentId}`);
                
                // Create certificate generation job (non-blocking)
                try {
                  await createCertificateJobService({
                    enrollmentId: enrollmentId.toString(),
                    studentName: "", // Will be fetched by worker
                    courseName: "", // Will be fetched by worker
                    completionDate: completedAt,
                    keyTopics,
                  });
                  console.log(`Certificate generation job created for enrollment ${enrollmentId}`);
                } catch (jobError) {
                  console.error("Error creating certificate job:", jobError);
                  // Job creation failure shouldn't prevent enrollment completion
                }
              }
            }
          }
        }
        }
      } catch (certError) {
        // Log error but don't fail the enrollment update
        console.error("Error auto-generating certificate:", certError);
        if (certError instanceof Error) {
          console.error("Certificate error details:", certError.message, certError.stack);
        }
        // Certificate generation failure shouldn't prevent enrollment completion
      }
    }

    return updatedEnrollment as Enrollment;
  } catch (error) {
    console.error("Database error in UpdateEnrollmentProgressService:", error);
    throw new AppError("Failed to update enrollment progress", 500);
  }
};

// Update enrollment status
export const UpdateEnrollmentStatusService = async (
  enrollmentId: string,
  status: "active" | "completed" | "dropped" | "revoked" | "paused"
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
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $nin: ["dropped", "revoked"] },
        },
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
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $nin: ["dropped", "revoked"] },
        },
      },
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

/**
 * Get time spent per day for a user from completedContents (admin only).
 * Returns array of { date: string (YYYY-MM-DD), minutes: number }.
 */
export const getTimeSpentPerDayService = async (
  userId: string,
  fromDate: Date,
  toDate: Date
): Promise<{ date: string; minutes: number }[]> => {
  try {
    const result = await EnrollmentModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$completedContents" },
      {
        $match: {
          "completedContents.completedAt": {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      {
        $addFields: {
          completionDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$completedContents.completedAt",
            },
          },
        },
      },
      {
        $group: {
          _id: "$completionDate",
          minutes: {
            $sum: { $ifNull: ["$completedContents.timeSpent", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          minutes: 1,
          _id: 0,
        },
      },
    ]);

    return result as { date: string; minutes: number }[];
  } catch (error) {
    console.error("Database error in getTimeSpentPerDayService:", error);
    throw new AppError("Failed to get time spent per day", 500);
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
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $nin: ["dropped", "revoked"] },
        },
      },
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

    const enrollments = await EnrollmentModel.find({
      userId,
      status: { $nin: ["dropped", "revoked"] },
    })
      .populate({
        path: "courseId",
        select:
          "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified",
        populate: {
          path: "instructor",
          select: "firstName lastName email profilePicture",
        },
      })
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EnrollmentModel.countDocuments({
      userId,
      status: { $nin: ["dropped", "revoked"] },
    });
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

// Get user dashboard statistics
export const GetUserDashboardStatsService = async (
  userId: string
): Promise<{
  totalTimeSpent: number; // in minutes
  averageTimePerSession: number; // in minutes
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalProgress: number; // average progress across all courses
  dailyGoal: {
    target: number;
    completed: number;
    streak: number;
  };
  recentActivity: {
    lastActivityAt: Date | null;
    coursesAccessedToday: number;
  };
}> => {
  try {
    const enrollments = await EnrollmentModel.find({
      userId,
      status: { $nin: ["dropped", "revoked"] },
    }).lean();

    // Calculate basic stats
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(
      (enrollment) => enrollment.status === "completed"
    ).length;
    const inProgressCourses = enrollments.filter(
      (enrollment) => enrollment.status === "active"
    ).length;

    // Calculate total time spent from completedContents (more accurate)
    // This ensures we use actual content durations, not just tracked time
    let totalTimeSpentMinutes = 0;

    for (const enrollment of enrollments) {
      if (
        enrollment.completedContents &&
        enrollment.completedContents.length > 0
      ) {
        // Sum up timeSpent from completedContents (already in minutes)
        const enrollmentTimeSpent = enrollment.completedContents.reduce(
          (total, completion) => total + (completion.timeSpent || 0),
          0
        );
        totalTimeSpentMinutes += enrollmentTimeSpent;
      } else {
        // Fallback: use totalTimeSpent from enrollment (convert from seconds to minutes)
        totalTimeSpentMinutes += Math.round(
          (enrollment.totalTimeSpent || 0) / 60
        );
      }
    }

    const totalTimeSpent = totalTimeSpentMinutes;

    // Calculate average progress
    const totalProgress =
      enrollments.length > 0
        ? enrollments.reduce((total, enrollment) => {
            return total + (enrollment.progress?.overallCompletion || 0);
          }, 0) / enrollments.length
        : 0;

    // Calculate average time per session
    // Use courses that actually have time spent (from completedContents) for more accurate average
    const coursesWithTimeSpent = enrollments.filter((enrollment) => {
      // Check if enrollment has time spent from completedContents
      if (
        enrollment.completedContents &&
        enrollment.completedContents.length > 0
      ) {
        const enrollmentTimeSpent = enrollment.completedContents.reduce(
          (total, completion) => total + (completion.timeSpent || 0),
          0
        );
        return enrollmentTimeSpent > 0;
      }
      // Fallback: check totalTimeSpent
      return (enrollment.totalTimeSpent || 0) > 0;
    }).length;

    let averageTimePerSession = 0;
    if (coursesWithTimeSpent > 0) {
      // Calculate average based on courses with time spent
      averageTimePerSession = Math.round(totalTimeSpent / coursesWithTimeSpent);
      // Ensure at least 1 minute if there's any time spent
      if (totalTimeSpent > 0 && averageTimePerSession === 0) {
        averageTimePerSession = 1;
      }
    } else if (totalTimeSpent > 0) {
      // If there's time spent but no courses with time (edge case), show at least 1
      averageTimePerSession = 1;
    }

    // Calculate daily goal progress (episodes/content accessed today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const coursesAccessedToday = enrollments.filter((enrollment) => {
      const lastActivity = enrollment.lastActivityAt;
      if (!lastActivity) return false;
      const activityDate = new Date(lastActivity);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === today.getTime();
    }).length;

    // Calculate streak (consecutive days with activity)
    let streak = 0;
    const checkDate = new Date(today);
    for (let i = 0; i < 30; i++) {
      // Check last 30 days
      const hasActivity = enrollments.some((enrollment) => {
        const lastActivity = enrollment.lastActivityAt;
        if (!lastActivity) return false;

        const activityDate = new Date(lastActivity);
        if (isNaN(activityDate.getTime())) return false;

        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === checkDate.getTime();
      });

      if (hasActivity) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i > 0) {
        // Don't break streak on first day if no activity
        break;
      } else {
        break;
      }
    }

    // Get most recent activity
    const lastActivityAt = enrollments.reduce((latest, enrollment) => {
      const activityDate = enrollment.lastActivityAt;
      if (!activityDate) return latest;

      const activityDateObj = new Date(activityDate);
      if (!latest || activityDateObj > latest) {
        return activityDateObj;
      }
      return latest;
    }, null as Date | null);

    return {
      totalTimeSpent,
      averageTimePerSession,
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalProgress: Math.round(totalProgress),
      dailyGoal: {
        target: 10, // Default target: 10 episodes/content per day
        completed: coursesAccessedToday,
        streak,
      },
      recentActivity: {
        lastActivityAt,
        coursesAccessedToday,
      },
    };
  } catch (error) {
    console.error("Database error in GetUserDashboardStatsService:", error);
    throw new AppError("Failed to get dashboard statistics", 500);
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

/**
 * Admin-only: Revoke enrollment by enrollmentId or orderId (for paid enrollments).
 * Resolves enrollment from order when orderId is provided.
 */
export const revokeEnrollmentAdminService = async (
  enrollmentId?: string,
  orderId?: string
): Promise<{ revoked: boolean; enrollmentId: string }> => {
  if (!enrollmentId && !orderId) {
    throw new AppError("Either enrollmentId or orderId is required", 400);
  }

  let targetEnrollmentId = enrollmentId;

  if (!targetEnrollmentId && orderId) {
    const { OrderModel } = await import("../models");
    const order = await OrderModel.findById(orderId)
      .select("userId courseId paymentStatus")
      .lean();
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    if (order.paymentStatus !== "success") {
      throw new AppError(
        `Order has payment status "${order.paymentStatus}". Only orders with successful payment can be revoked.`,
        400
      );
    }
    const inactiveStatuses = ["dropped", "revoked"];
    let enrollment = await EnrollmentModel.findOne({
      userId: order.userId,
      courseId: order.courseId,
      status: { $nin: inactiveStatuses },
    }).select("_id");
    if (!enrollment) {
      const revokedOrDropped = await EnrollmentModel.findOne({
        userId: order.userId,
        courseId: order.courseId,
        status: { $in: inactiveStatuses },
      }).select("_id");
      if (revokedOrDropped) {
        throw new AppError("Enrollment is already revoked", 400);
      }
      throw new AppError(
        "Enrollment not found for this order. The enrollment may not have been created (e.g. if payment completed outside normal flow).",
        404
      );
    }
    targetEnrollmentId = enrollment._id.toString();
  }

  const enrollment = await EnrollmentModel.findById(targetEnrollmentId);
  if (!enrollment) {
    throw new AppError("Enrollment not found", 404);
  }
  if (enrollment.status === "revoked" || enrollment.status === "dropped") {
    throw new AppError("Enrollment is already revoked", 400);
  }

  await EnrollmentModel.findByIdAndUpdate(targetEnrollmentId, {
    status: "revoked",
    lastUpdated: new Date(),
  });
  return { revoked: true, enrollmentId: targetEnrollmentId! };
};
