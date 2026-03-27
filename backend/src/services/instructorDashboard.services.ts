import mongoose from "mongoose";
import {
  CertificateModel,
  CourseModel,
  EnrollmentModel,
  LiveClassModel,
  QnAModel,
} from "../models";

export interface InstructorCourseSummary {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  /** Learners with status active, completed, or paused (same scope as before). */
  totalLearners: number;
  activeLearners: number;
  completedLearners: number;
  /** Rounded mean `progress.overallCompletion` for enrollments in those statuses. */
  avgProgress: number;
  newEnrollments30d: number;
  pendingQnaCount: number;
}

/** Latest learner question across the instructor’s courses (dashboard teaser). */
export interface InstructorRecentQna {
  _id: string;
  message: string;
  createdAt: Date;
  approved: boolean;
  /** True when this thread should surface as needing instructor action. */
  notifyInstructor: boolean;
  course: { _id: string; title: string; slug?: string };
  authorName: string;
  replyCount: number;
  lessonId?: string | null;
  contentId?: string | null;
}

/** High-signal teaching & business metrics for the instructor home view. */
export interface InstructorDashboardSummary {
  coursesCount: number;
  /** Distinct learners across all courses (active / completed / paused). */
  uniqueLearners: number;
  /** Mean of `progress.overallCompletion` across enrollments (excl. dropped/revoked). */
  averageLearnerProgress: number;
  activeEnrollments: number;
  completedEnrollments: number;
  /** Enrollments with `enrolledAt` in the last 30 days. */
  newEnrollmentsLast30Days: number;
  certificatesIssued: number;
  /** Approved threads where notifyInstructor is true (or legacy empty-reply match). */
  pendingQnaCount: number;
  liveSessionsCount: number;
  upcomingLiveSessions: number;
}

export interface InstructorDashboardData {
  summary: InstructorDashboardSummary;
  courses: InstructorCourseSummary[];
  recentQnas: InstructorRecentQna[];
}

function authorNameFromPopulatedUser(userId: unknown): string {
  if (userId && typeof userId === "object" && "firstName" in userId) {
    const u = userId as {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    return n || u.email || "Learner";
  }
  return "Learner";
}

export const getInstructorDashboardService = async (
  instructorUserId: string
): Promise<InstructorDashboardData> => {
  const emptySummary = (): InstructorDashboardSummary => ({
    coursesCount: 0,
    uniqueLearners: 0,
    averageLearnerProgress: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    newEnrollmentsLast30Days: 0,
    certificatesIssued: 0,
    pendingQnaCount: 0,
    liveSessionsCount: 0,
    upcomingLiveSessions: 0,
  });

  if (!mongoose.Types.ObjectId.isValid(instructorUserId)) {
    return { summary: emptySummary(), courses: [], recentQnas: [] };
  }

  const oid = new mongoose.Types.ObjectId(instructorUserId);

  const courses = await CourseModel.find({ instructor: oid })
    .select("title slug thumbnail")
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  const courseIds = courses.map((c) => c._id);

  let distinctLearners = 0;
  let averageLearnerProgress = 0;
  let activeEnrollments = 0;
  let completedEnrollments = 0;
  let newEnrollmentsLast30Days = 0;
  let certificatesIssued = 0;
  let pendingQnaCount = 0;
  let recentQnas: InstructorRecentQna[] = [];
  const statsByCourse = new Map<
    string,
    {
      totalLearners: number;
      activeLearners: number;
      completedLearners: number;
      avgProgress: number;
      new30: number;
    }
  >();
  const pendingQnaByCourse = new Map<string, number>();

  if (courseIds.length > 0) {
    /** Same filter for counts, per-course totals, and dashboard Q&A teaser. */
    const qnaNeedsInstructorAttention: Record<string, unknown> = {
      approved: true,
      $or: [
        { notifyInstructor: true },
        {
          notifyInstructor: { $exists: false },
          $expr: { $eq: [{ $size: { $ifNull: ["$replies", []] } }, 0] },
        },
      ],
    };

    const activeStatuses = ["active", "completed", "paused"];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    distinctLearners = (
      await EnrollmentModel.distinct("userId", {
        courseId: { $in: courseIds },
        status: { $in: activeStatuses },
      })
    ).length;

    const enrollStats = await EnrollmentModel.aggregate<{
      avgProgress: number | null;
      active: number;
      completed: number;
      new30: number;
    }>([
      {
        $match: {
          courseId: { $in: courseIds },
          status: { $nin: ["dropped", "revoked"] },
        },
      },
      {
        $group: {
          _id: null,
          avgProgress: { $avg: "$progress.overallCompletion" },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          new30: {
            $sum: {
              $cond: [{ $gte: ["$enrolledAt", thirtyDaysAgo] }, 1, 0],
            },
          },
        },
      },
    ]);
    const es = enrollStats[0];
    if (es) {
      averageLearnerProgress = Math.round(es.avgProgress ?? 0);
      activeEnrollments = es.active;
      completedEnrollments = es.completed;
      newEnrollmentsLast30Days = es.new30;
    }

    certificatesIssued = await CertificateModel.countDocuments({
      courseId: { $in: courseIds },
    });

    /**
     * Threads where `notifyInstructor` is true (last message not from admin/course instructor).
     * Legacy docs without the field: treat as needing attention only if there are no replies yet.
     */
    pendingQnaCount = await QnAModel.countDocuments({
      courseId: { $in: courseIds },
      ...qnaNeedsInstructorAttention,
    });

    const perCourseStats = await EnrollmentModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      totalLearners: number;
      activeLearners: number;
      completedLearners: number;
      avgProgress: number | null;
      new30: number;
    }>([
      {
        $match: {
          courseId: { $in: courseIds },
          status: { $in: activeStatuses },
        },
      },
      {
        $group: {
          _id: "$courseId",
          totalLearners: { $sum: 1 },
          activeLearners: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          completedLearners: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          avgProgress: { $avg: "$progress.overallCompletion" },
          new30: {
            $sum: { $cond: [{ $gte: ["$enrolledAt", thirtyDaysAgo] }, 1, 0] },
          },
        },
      },
    ]);
    for (const g of perCourseStats) {
      statsByCourse.set(String(g._id), {
        totalLearners: g.totalLearners,
        activeLearners: g.activeLearners,
        completedLearners: g.completedLearners,
        avgProgress: Math.round(g.avgProgress ?? 0),
        new30: g.new30,
      });
    }

    const pendingAgg = await QnAModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          courseId: { $in: courseIds },
          ...qnaNeedsInstructorAttention,
        },
      },
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]);
    for (const p of pendingAgg) {
      pendingQnaByCourse.set(String(p._id), p.count);
    }

    const recentQnasRaw = await QnAModel.find({
      courseId: { $in: courseIds },
      ...qnaNeedsInstructorAttention,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "firstName lastName email profilePicture")
      .populate("courseId", "title slug")
      .lean();

    recentQnas = recentQnasRaw.map((q) => {
      const cid = q.courseId as unknown;
      let course = { _id: "", title: "Course", slug: undefined as string | undefined };
      if (cid && typeof cid === "object" && "_id" in cid) {
        const c = cid as {
          _id: mongoose.Types.ObjectId;
          title?: string;
          slug?: string;
        };
        course = {
          _id: String(c._id),
          title: c.title ?? "Course",
          slug: c.slug,
        };
      }
      return {
        _id: String(q._id),
        message: q.message,
        createdAt: q.createdAt as Date,
        approved: q.approved,
        /** All items in this list matched the attention-needed filter. */
        notifyInstructor: true,
        course,
        authorName: authorNameFromPopulatedUser(q.userId),
        replyCount: Array.isArray(q.replies) ? q.replies.length : 0,
        lessonId: q.lessonId ? String(q.lessonId) : null,
        contentId: q.contentId ? String(q.contentId) : null,
      };
    });
  }

  const courseSummaries: InstructorCourseSummary[] = courses.map((c) => {
    const id = String(c._id);
    const st = statsByCourse.get(id);
    return {
      _id: id,
      title: (c as { title?: string }).title ?? "Untitled",
      slug: (c as { slug?: string }).slug ?? "",
      thumbnail: (c as { thumbnail?: string }).thumbnail,
      totalLearners: st?.totalLearners ?? 0,
      activeLearners: st?.activeLearners ?? 0,
      completedLearners: st?.completedLearners ?? 0,
      avgProgress: st?.avgProgress ?? 0,
      newEnrollments30d: st?.new30 ?? 0,
      pendingQnaCount: pendingQnaByCourse.get(id) ?? 0,
    };
  });

  const liveSessionsCount = await LiveClassModel.countDocuments({
    instructor: oid,
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const upcomingLiveSessions = await LiveClassModel.countDocuments({
    instructor: oid,
    startDate: { $gte: startOfToday },
  });

  return {
    summary: {
      coursesCount: courses.length,
      uniqueLearners: distinctLearners,
      averageLearnerProgress,
      activeEnrollments,
      completedEnrollments,
      newEnrollmentsLast30Days,
      certificatesIssued,
      pendingQnaCount,
      liveSessionsCount,
      upcomingLiveSessions,
    },
    courses: courseSummaries,
    recentQnas,
  };
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Paginated Q&A across all courses the instructor teaches (admin-approved only). */
export const getInstructorAllQnasService = async (
  instructorUserId: string,
  page: number,
  limit: number,
  search: string
): Promise<{
  qnas: unknown[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const empty = (): {
    qnas: unknown[];
    total: number;
    page: number;
    totalPages: number;
  } => ({ qnas: [], total: 0, page, totalPages: 0 });

  if (!mongoose.Types.ObjectId.isValid(instructorUserId)) {
    return empty();
  }
  const oid = new mongoose.Types.ObjectId(instructorUserId);
  const owned = await CourseModel.find({ instructor: oid }).select("_id").lean();
  const courseIds = owned.map((c) => c._id);
  if (courseIds.length === 0) {
    return empty();
  }

  const safePage = page > 0 ? page : 1;
  const safeLimit = Math.min(Math.max(limit || 20, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const filters: Record<string, unknown> = {
    courseId: { $in: courseIds },
    approved: true,
  };
  const q = search?.trim();
  if (q) {
    const rx = escapeRegex(q);
    filters.$or = [
      { message: { $regex: rx, $options: "i" } },
      { "replies.message": { $regex: rx, $options: "i" } },
    ];
  }

  const total = await QnAModel.countDocuments(filters);
  const totalPages = Math.ceil(total / safeLimit) || 0;

  const rawQnas = await QnAModel.find(filters)
    .populate("userId", "firstName lastName email profilePicture")
    .populate("courseId", "title slug")
    .populate("replies.userId", "firstName lastName email profilePicture")
    .skip(skip)
    .limit(safeLimit)
    .sort({ createdAt: -1 })
    .lean();

  const qnas = rawQnas.map((qna: Record<string, unknown>) => {
    const replies = (
      (qna.replies as { createdAt?: Date }[]) || []
    ).sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime()
    );
    return {
      ...qna,
      totalReplies: replies.length,
      replies: replies.slice(0, 40),
    };
  });

  return {
    qnas,
    total,
    page: safePage,
    totalPages,
  };
};
