import { AppError } from "../middlewares/error.middleware";
import { EnrollmentModel } from "../models/enrollment.schema";
import {
  StudentModel,
  CourseModel,
  CourseLessonModel,
  CourseModuleModel,
  UserModel,
} from "../models";
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
import { parseIstDateOnly, todayIst, ymdIst } from "../utils/ist";

/**
 * Check if an enrollment is still valid (not expired)
 * Trial enrollments expire based on trialExpiresAt
 * Non-trial enrollments expire at validUntil (default 4 years if unset; collaboration
 * enrollments set validUntil from the domain's duration in days)
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
  /** When set (e.g. collaboration allotments), enrollment expires at this instant. */
  validUntil?: Date;
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
          [gifter.firstName, gifter.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() ||
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

    // Fetch the course once: used for the courseName snapshot here AND the
    // instructor analytics update below.
    const course = await CourseModel.findById(enrollmentData.courseId);

    const enrollment = new EnrollmentModel({
      ...enrollmentData,
      ...(giftFromSnapshot ? { giftFromSnapshot } : {}),
      // Snapshot the course title so enrollment history survives course deletion/unlink.
      courseName: course?.title || undefined,
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
      { new: true },
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
      { new: true },
    );

    // Update instructor totals using the course fetched above.
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
          { new: true },
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
      500,
    );
  }
};

// Get specific enrollment
export const GetEnrollmentService = async (
  enrollmentId: string,
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
  sortBy?: string,
  /** Exclude enrollments whose course is retired or deleted. Off by default: My
   *  Programs deliberately still lists them as "no longer available". */
  courseActive?: boolean,
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

    // Course-level narrowing (title search and/or availability) resolves to a
    // concrete courseId list BEFORE the enrollment query, so skip/limit and
    // countDocuments operate on the already-narrowed enrollment set.
    let narrowedCourseIds: mongoose.Types.ObjectId[] | null = null;

    // Case-insensitive **substring** on `title` only. No description (noisy),
    // no text/fuzzy/typo-tolerant index — just escaped regex.
    if (search) {
      const q = String(search).trim();
      if (q) {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matchingCourses = await CourseModel.find(
          { title: { $regex: escaped, $options: "i" } },
          { _id: 1 },
        ).lean();
        narrowedCourseIds = matchingCourses.map((c: any) => c._id);
      }
    }

    // `courseActive` callers (the Home "New Courses" row) want only courses a
    // learner can still open. Retired courses (isActive === false) are excluded,
    // and so are deleted ones for free: their courseId is unlinked to null, which
    // matches no Course and therefore no `$in` entry. Doing this here rather than
    // after the query keeps `total` consistent with the page contents. The
    // candidate set is the user's own enrolled courses, resolved through the
    // { userId, courseId } index — never the whole catalogue.
    if (courseActive) {
      const candidateIds =
        narrowedCourseIds ??
        (await EnrollmentModel.distinct("courseId", { userId }));
      // `$ne: false` not `true`: `isActive` only defaults to true, so documents
      // predating the field must still count as available.
      const courseQuery: any = {
        _id: { $in: candidateIds },
        isActive: { $ne: false },
      };
      const openCourses = await CourseModel.find(courseQuery, {
        _id: 1,
      }).lean();
      narrowedCourseIds = openCourses.map((c: any) => c._id);
    }

    if (narrowedCourseIds) {
      filters.courseId = { $in: narrowedCourseIds };
    }

    const enrollments = await EnrollmentModel.find(filters)
      .populate({
        path: "courseId",
        select:
          // `isActive` is deliberately included: a learner can hold an
          // enrollment in a course that has since been disabled. The watch page
          // gates on `isActive`, so without this flag the UI renders a normal
          // card whose "Continue" leads to a dead end.
          "title thumbnail description category duration slug instructor plans analytics isFeatured isCertified isActive modules deactivatedModules deactivatedLessons",
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

    // Keep ALL enrollments — including those whose course was deleted/unlinked
    // (courseId === null). The frontend renders these as a disabled "course no
    // longer available" card from the courseName snapshot. Dropping them here is
    // what previously made the stat count (which includes them) disagree with the
    // visible list. The lessonCount/moduleCount enrichment below already guards
    // against a null course.
    const filteredEnrollments = enrollments;

    // Add lightweight counts for dashboard cards without populating full modules tree.
    const courseIds = Array.from(
      new Set(
        filteredEnrollments
          .map((e) => String((e as any).courseId?._id ?? (e as any).courseId))
          .filter((id) => mongoose.Types.ObjectId.isValid(id)),
      ),
    ).map((id) => new mongoose.Types.ObjectId(id));

    // Lessons live as separate documents keyed by moduleId; module.lessons[] may be stale.
    // Compute ACTIVE lessonCount by:
    // - courseId -> modules[] excluding course.deactivatedModules
    // - only modules with CourseModule.isActive === true
    // - exclude lesson ids present in course.deactivatedLessons
    const moduleIdsByCourseId = new Map<string, mongoose.Types.ObjectId[]>();
    const allDeactivatedLessonIds: mongoose.Types.ObjectId[] = [];
    for (const e of filteredEnrollments as any[]) {
      const c = e.courseId;
      if (!c?._id || !Array.isArray(c.modules)) continue;
      const cid = String(c._id);
      const deactivatedModuleIds = new Set(
        Array.isArray(c.deactivatedModules)
          ? c.deactivatedModules.map((x: unknown) => String(x))
          : [],
      );
      const mids = c.modules
        .map((m: unknown) => String(m))
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
        .filter((id: string) => !deactivatedModuleIds.has(id))
        .map((id: string) => new mongoose.Types.ObjectId(id));
      moduleIdsByCourseId.set(cid, mids);

      const deactivatedLessons = Array.isArray(c.deactivatedLessons)
        ? c.deactivatedLessons
        : [];
      for (const lid of deactivatedLessons) {
        const s = String(lid);
        if (mongoose.Types.ObjectId.isValid(s)) {
          allDeactivatedLessonIds.push(new mongoose.Types.ObjectId(s));
        }
      }
    }

    const allModuleIdsRaw = Array.from(moduleIdsByCourseId.values()).flat();

    const activeModules = await CourseModuleModel.find({
      _id: { $in: allModuleIdsRaw },
      isActive: true,
    })
      .select("_id")
      .lean();
    const activeModuleIdSet = new Set(
      activeModules.map((m) => String((m as any)._id)),
    );

    // Filter out inactive modules
    for (const [cid, mids] of moduleIdsByCourseId.entries()) {
      moduleIdsByCourseId.set(
        cid,
        mids.filter((mid) => activeModuleIdSet.has(String(mid))),
      );
    }

    const allModuleIds = Array.from(moduleIdsByCourseId.values()).flat();
    const lessonCountsByModule = await CourseLessonModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          moduleId: { $in: allModuleIds },
          ...(allDeactivatedLessonIds.length > 0
            ? { _id: { $nin: allDeactivatedLessonIds } }
            : {}),
        },
      },
      { $group: { _id: "$moduleId", count: { $sum: 1 } } },
    ]);

    const lessonCountByModuleId = new Map<string, number>();
    for (const row of lessonCountsByModule) {
      lessonCountByModuleId.set(String(row._id), Number(row.count) || 0);
    }

    const lessonCountByCourseId = new Map<string, number>();
    for (const [cid, mids] of moduleIdsByCourseId.entries()) {
      let sum = 0;
      for (const mid of mids) {
        sum += lessonCountByModuleId.get(String(mid)) ?? 0;
      }
      lessonCountByCourseId.set(cid, sum);
    }

    for (const e of filteredEnrollments as any[]) {
      const c = e.courseId;
      if (!c) continue;
      const cid = String(c._id ?? c);
      const moduleCount = Array.isArray(c.modules) ? c.modules.length : 0;
      c.moduleCount = moduleCount;
      c.lessonCount = lessonCountByCourseId.get(cid) ?? 0;
    }

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
  userIds: string[],
): Promise<Record<string, string[]>> => {
  if (!userIds?.length) return {};

  const validIds = userIds.filter(
    (id) => id && mongoose.Types.ObjectId.isValid(id),
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

// Active (visible) view of a course's structure.
//
// IMPORTANT: A module/lesson/content can be hidden PER COURSE via the arrays
// course.deactivatedModules / deactivatedLessons / deactivatedContents (lessons
// and contents have no isActive flag of their own). Progress MUST be computed
// against this filtered structure — the frontend already hides deactivated items
// from students, so counting them in the denominator would make 100% impossible.
export type ActiveCourseStructure = {
  totalModules: number;
  totalLessons: number;
  totalContents: number;
  activeContentIds: Set<string>;
  // module -> lesson -> active content ids, used for lesson/module roll-up
  modules: { lessons: string[][] }[];
};

export const getActiveCourseStructure = async (
  courseId: string,
): Promise<ActiveCourseStructure> => {
  const structure: ActiveCourseStructure = {
    totalModules: 0,
    totalLessons: 0,
    totalContents: 0,
    activeContentIds: new Set<string>(),
    modules: [],
  };

  try {
    const course = await CourseModel.findById(courseId)
      .select(
        "modules deactivatedModules deactivatedLessons deactivatedContents",
      )
      .populate({
        path: "modules",
        select: "lessons isActive",
        populate: {
          path: "lessons",
          select: "contents",
          populate: {
            path: "contents",
            select: "_id",
          },
        },
      })
      .lean();

    if (!course || !Array.isArray(course.modules)) {
      return structure;
    }

    const toIdSet = (arr: unknown): Set<string> =>
      new Set(
        (Array.isArray(arr) ? arr : []).map((x: unknown) => String(x)),
      );
    const deactivatedModules = toIdSet((course as any).deactivatedModules);
    const deactivatedLessons = toIdSet((course as any).deactivatedLessons);
    const deactivatedContents = toIdSet((course as any).deactivatedContents);

    for (const module of course.modules as any[]) {
      // Skip globally inactive modules AND per-course deactivated modules.
      if (!module || module.isActive === false) continue;
      if (deactivatedModules.has(String(module._id))) continue;

      const moduleLessons: string[][] = [];
      const lessons = Array.isArray(module.lessons) ? module.lessons : [];

      for (const lesson of lessons) {
        if (!lesson) continue;
        // Skip per-course deactivated (hidden) lessons.
        if (deactivatedLessons.has(String(lesson._id))) continue;

        const contents = Array.isArray(lesson.contents) ? lesson.contents : [];
        const activeContentIds: string[] = [];

        for (const content of contents) {
          if (!content || !content._id) continue;
          const cid = String(content._id);
          // Skip per-course deactivated (hidden) contents.
          if (deactivatedContents.has(cid)) continue;
          activeContentIds.push(cid);
          structure.activeContentIds.add(cid);
        }

        moduleLessons.push(activeContentIds);
        structure.totalLessons += 1;
        structure.totalContents += activeContentIds.length;
      }

      structure.modules.push({ lessons: moduleLessons });
      structure.totalModules += 1;
    }
  } catch (error) {
    console.error(
      `[getActiveCourseStructure] Error for course ${courseId}:`,
      error,
    );
    throw error;
  }

  return structure;
};

// Roll a completed-content set up against the active course structure.
// A lesson is complete only when ALL its active contents are complete; a module
// is complete only when ALL its active lessons are complete. The numerator counts
// ONLY currently-active contents, so a content the student finished before it was
// hidden cannot leave progress stuck below 100%.
export const computeProgressFromStructure = (
  structure: ActiveCourseStructure,
  completedContentIds: Set<string>,
): EnrollmentProgressSummary => {
  let completedContents = 0;
  let completedLessons = 0;
  let completedModules = 0;

  for (const module of structure.modules) {
    let lessonsCompletedInModule = 0;

    for (const lessonContentIds of module.lessons) {
      const done = lessonContentIds.filter((id) =>
        completedContentIds.has(id),
      ).length;
      completedContents += done;

      if (lessonContentIds.length > 0 && done === lessonContentIds.length) {
        completedLessons += 1;
        lessonsCompletedInModule += 1;
      }
    }

    if (
      module.lessons.length > 0 &&
      lessonsCompletedInModule === module.lessons.length
    ) {
      completedModules += 1;
    }
  }

  const overallCompletion =
    structure.totalContents > 0
      ? Math.min(
          100,
          Math.round((completedContents / structure.totalContents) * 100),
        )
      : 0;

  return {
    overallCompletion,
    totalModules: structure.totalModules,
    completedModules,
    totalLessons: structure.totalLessons,
    completedLessons,
    lastActivityAt: new Date(),
  };
};

// Recalculate progress for an enrollment (useful for fixing existing enrollments)
export const RecalculateEnrollmentProgressService = async (
  enrollmentId: string,
): Promise<Enrollment | null> => {
  try {
    const enrollment = await EnrollmentModel.findById(enrollmentId);
    if (!enrollment || !enrollment.courseId) {
      return null;
    }

    const completedContentIds = new Set<string>(
      (enrollment.completedContents || [])
        .map((c) => c.contentId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    );

    const structure = await getActiveCourseStructure(
      enrollment.courseId.toString(),
    );
    const updatedProgress = computeProgressFromStructure(
      structure,
      completedContentIds,
    );
    updatedProgress.lastActivityAt =
      enrollment.progress?.lastActivityAt || new Date();

    const overallCompletion = updatedProgress.overallCompletion;

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
      { new: true },
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
        const hasFullAccess =
          !updatedEnrollment?.accessControl ||
          updatedEnrollment.accessControl.accessType === "full";

        if (!hasFullAccess) {
          console.log(
            `Skipping certificate generation for enrollment ${enrollmentId} - user has partial access`,
          );
        } else {
          // Check if certificate already exists
          const existingCertificate =
            await getLatestCertificateService(enrollmentId);

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
                console.log(
                  `Certificate generation job created for enrollment ${enrollmentId}`,
                );
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
      error,
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
  },
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
        (completion) => completion.contentId === progressData.contentId,
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
                  c && c._id && c._id.toString() === progressData.contentId,
              );
              if (content && content.type === "video" && content.duration) {
                // Duration is in seconds, convert to minutes
                actualContentDurationMinutes = Math.round(
                  content.duration / 60,
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
        actualContentDurationMinutes,
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
          finalTimeSpent,
        );
      }
    }

    // ALWAYS recalculate progress from the ACTIVE (visible) course structure.
    // Hidden modules/lessons/contents (course.deactivated*) are excluded so they
    // do not inflate the denominator and block students from reaching 100%.
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

      const completedContentIds = new Set<string>(
        updatedCompletedContents
          .map((c) => c.contentId)
          .filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
      );

      const structure = await getActiveCourseStructure(courseIdString);
      const summary = computeProgressFromStructure(
        structure,
        completedContentIds,
      );

      updatedProgress.overallCompletion = summary.overallCompletion;
      updatedProgress.totalModules = summary.totalModules;
      updatedProgress.completedModules = summary.completedModules;
      updatedProgress.totalLessons = summary.totalLessons;
      updatedProgress.completedLessons = summary.completedLessons;
    } catch (error) {
      console.error("Error recalculating enrollment progress:", error);
      // Preserve existing progress numbers on failure rather than zeroing them.
      updatedProgress.overallCompletion =
        enrollment.progress?.overallCompletion ?? 0;
      updatedProgress.totalModules = enrollment.progress?.totalModules ?? 0;
      updatedProgress.completedModules =
        enrollment.progress?.completedModules ?? 0;
      updatedProgress.totalLessons = enrollment.progress?.totalLessons ?? 0;
      updatedProgress.completedLessons =
        enrollment.progress?.completedLessons ?? 0;
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
      0,
    );
    const newTotalTimeSpent = totalTimeSpentMinutes * 60; // Convert minutes to seconds

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
      { new: true, runValidators: true },
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
        const existingCertificate =
          await getLatestCertificateService(enrollmentId);

        if (existingCertificate) {
          console.log(
            `Certificate already exists for enrollment ${enrollmentId}`,
          );
        } else if (enrollmentForCert.isTrial) {
          console.log(
            `Skipping certificate generation for trial enrollment ${enrollmentId}`,
          );
        } else {
          // DO NOT generate certificate for partial access users
          // Only generate certificates for users with FULL course access
          const hasFullAccess =
            !enrollmentForCert.accessControl ||
            enrollmentForCert.accessControl.accessType === "full";

          if (!hasFullAccess) {
            console.log(
              `Skipping certificate generation for enrollment ${enrollmentId} - user has partial access`,
            );
          } else {
            // Get course and user details for certificate generation
            const courseId =
              enrollmentForCert.courseId?.toString() ||
              enrollment.courseId?.toString();
            const userId =
              enrollmentForCert.userId?.toString() ||
              enrollment.userId?.toString();

            if (!courseId || !userId) {
              console.error(
                `Missing courseId or userId for enrollment ${enrollmentId}`,
              );
            } else {
              const course = await CourseModel.findById(courseId)
                .populate("instructor", "firstName lastName")
                .lean();

              const user = await UserModel.findById(userId)
                .select("firstName lastName")
                .lean();

              if (!course) {
                console.error(
                  `Course not found for enrollment ${enrollmentId}, courseId: ${courseId}`,
                );
              } else if (!user) {
                console.error(
                  `User not found for enrollment ${enrollmentId}, userId: ${userId}`,
                );
              } else if (!course.isCertified) {
                console.log(
                  `Course ${courseId} is not certified, skipping certificate generation`,
                );
              } else {
                // Get student full name
                const studentName = `${user.firstName || ""} ${
                  user.lastName || ""
                }`.trim();

                if (!studentName) {
                  console.error(
                    `Student name is empty for enrollment ${enrollmentId}`,
                  );
                } else {
                  // Get course name
                  const courseName = course.title || "";

                  // Get key topics from course (if available in course structure)
                  // You might need to extract this from course modules/lessons
                  let keyTopics: string | undefined;
                  // For now, we'll leave it undefined - can be enhanced later

                  console.log(
                    `Creating certificate generation job for enrollment ${enrollmentId}`,
                  );

                  // Create certificate generation job (non-blocking)
                  try {
                    await createCertificateJobService({
                      enrollmentId: enrollmentId.toString(),
                      studentName: "", // Will be fetched by worker
                      courseName: "", // Will be fetched by worker
                      completionDate: completedAt,
                      keyTopics,
                    });
                    console.log(
                      `Certificate generation job created for enrollment ${enrollmentId}`,
                    );
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
          console.error(
            "Certificate error details:",
            certError.message,
            certError.stack,
          );
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
  status: "active" | "completed" | "dropped" | "revoked" | "paused",
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
      { new: true },
    ).populate(
      "courseId",
      "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified",
    );

    return updatedEnrollment as Enrollment;
  } catch (error) {
    console.error("Database error in UpdateEnrollmentStatusService:", error);
    throw new AppError("Failed to update enrollment status", 500);
  }
};

// Pause enrollment
export const PauseEnrollmentService = async (
  enrollmentId: string,
): Promise<Enrollment | null> => {
  return UpdateEnrollmentStatusService(enrollmentId, "paused");
};

// Resume enrollment
export const ResumeEnrollmentService = async (
  enrollmentId: string,
): Promise<Enrollment | null> => {
  return UpdateEnrollmentStatusService(enrollmentId, "active");
};

// Issue certificate
export const IssueCertificateService = async (
  enrollmentId: string,
): Promise<Enrollment | null> => {
  try {
    const enrollment = await EnrollmentModel.findById(enrollmentId);
    if (!enrollment) {
      return null;
    }

    if (enrollment.status !== "completed") {
      throw new AppError(
        "Enrollment must be completed to issue certificate",
        400,
      );
    }

    const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
      enrollmentId,
      {
        certificateIssued: true,
        certificateIssuedAt: new Date(),
        lastUpdated: new Date(),
      },
      { new: true },
    ).populate(
      "courseId",
      "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified",
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
  userId: string,
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
  courseId: string,
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
  enrollmentId: string,
): Promise<DetailedEnrollmentProgress | null> => {
  try {
    const enrollment = await EnrollmentModel.findById(enrollmentId)
      .populate(
        "courseId",
        "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified",
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
  toDate: Date,
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
  period: number = 30,
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
  limit: number = 10,
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
  userId: string,
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
      (enrollment) => enrollment.status === "completed",
    ).length;
    const inProgressCourses = enrollments.filter(
      (enrollment) => enrollment.status === "active",
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
          0,
        );
        totalTimeSpentMinutes += enrollmentTimeSpent;
      } else {
        // Fallback: use totalTimeSpent from enrollment (convert from seconds to minutes)
        totalTimeSpentMinutes += Math.round(
          (enrollment.totalTimeSpent || 0) / 60,
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
          0,
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

    // Calculate daily goal progress (episodes/content accessed today).
    // The learner's "day" is the IST calendar day, not the server's: `setHours`
    // here would snap to UTC midnight, so studying between 00:00 and 05:30 IST
    // counted as the previous day and silently broke the streak.
    const todayYmd = todayIst();

    const coursesAccessedToday = enrollments.filter(
      (enrollment) => ymdIst(enrollment.lastActivityAt) === todayYmd,
    ).length;

    // Calculate streak (consecutive IST days with activity)
    const activityDays = new Set<string>();
    for (const enrollment of enrollments) {
      const day = ymdIst(enrollment.lastActivityAt);
      if (day) activityDays.add(day);
    }

    let streak = 0;
    // IST has no DST, so stepping back exactly 24h from an IST midnight always
    // lands on the previous IST midnight.
    let cursor = parseIstDateOnly(todayYmd);
    for (let i = 0; i < 30 && cursor; i++) {
      const day = ymdIst(cursor);
      if (!day || !activityDays.has(day)) break;
      streak++;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get most recent activity
    const lastActivityAt = enrollments.reduce(
      (latest, enrollment) => {
        const activityDate = enrollment.lastActivityAt;
        if (!activityDate) return latest;

        const activityDateObj = new Date(activityDate);
        if (!latest || activityDateObj > latest) {
          return activityDateObj;
        }
        return latest;
      },
      null as Date | null,
    );

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
  enrollmentId: string,
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
  orderId?: string,
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
        400,
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
        404,
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
