import mongoose from "mongoose";
import { CourseInternshipEnrollmentModel } from "../models/courseInternshipEnrollment.schema";
import { CourseInternshipModel } from "../models/courseInternship.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { computeTaskWindow } from "../lib/internshipTaskWindow";
import { AppError } from "../middlewares/error.middleware";
import type { Brand } from "../constants/brands";

export type CourseInternshipTaskRow = {
  _id: string;
  title: string;
  description: string;
  totalScore: number;
  questionCount: number;
  unlockAfterDays: number;
  dueDays: number;
  isUnlocked: boolean;
  isDue: boolean;
  /** True when the deadline was truncated to the learner's program end. */
  isClamped: boolean;
  visibleFrom: string;
  dueAt: string;
  closesAt: string;
};

/** The learner's own enrollments, most recently touched first. */
export const listMyCourseInternshipsService = async (
  userId: string,
  brands?: Brand[],
) => {
  const enrollments = await CourseInternshipEnrollmentModel.find({
    user: userId,
    ...(brands && brands.length > 0 ? { brand: { $in: brands } } : {}),
  })
    .select(
      "courseInternship course programSnapshot courseSnapshot startDate endDate durationMonths status",
    )
    .sort({ updatedAt: -1 })
    .lean();

  const now = Date.now();

  return (enrollments ?? []).map((e: Record<string, any>) => ({
    _id: String(e._id),
    title: e.programSnapshot?.title ?? "",
    courseTitle: e.courseSnapshot?.title ?? "",
    startDate: e.startDate,
    endDate: e.endDate,
    durationMonths: e.durationMonths,
    status: e.status,
    daysRemaining: Math.max(
      0,
      Math.ceil((new Date(e.endDate).getTime() - now) / 86_400_000),
    ),
  }));
};

/**
 * One enrollment plus its task rows.
 *
 * Every date is derived from `computeTaskWindow` with the learner's own
 * `startDate` standing in for a cohort start — the same module the internship
 * learner view, eligibility and submission guard use. Unreachable tasks are
 * dropped here rather than in the frontend, so the set the learner sees is
 * exactly the set they are measured against.
 */
export const getMyCourseInternshipService = async (
  userId: string,
  enrollmentId: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const enrollment = await CourseInternshipEnrollmentModel.findOne({
    _id: enrollmentId,
    user: userId,
  }).lean<Record<string, any> | null>();

  if (!enrollment) throw new AppError("Enrollment not found", 404);

  const program = await CourseInternshipModel.findById(
    enrollment.courseInternship,
  )
    .select(
      "title description thumbnail taskTemplateIds documentationRequired documentationDueOffsetDays",
    )
    .lean<Record<string, any> | null>();

  const templateIds: mongoose.Types.ObjectId[] = Array.isArray(
    program?.taskTemplateIds,
  )
    ? program.taskTemplateIds
    : [];

  const taskDocs =
    templateIds.length > 0
      ? await InternshipTaskModel.find({
          _id: { $in: templateIds },
          isActive: true,
        })
          .select("title description totalScore unlockAfterDays dueDays questions")
          .lean()
      : [];

  const startDate = new Date(enrollment.startDate);
  const endDate = new Date(enrollment.endDate);
  const now = Date.now();

  const tasks: CourseInternshipTaskRow[] = [];
  for (const task of taskDocs as Record<string, any>[]) {
    const win = computeTaskWindow(task, startDate, endDate);

    // Not reachable → never shown, and never counted. The two must stay in
    // lockstep; see docs/superpowers/specs/2026-07-28-internship-task-window-design.md
    if (!win.isReachable) continue;

    tasks.push({
      _id: String(task._id),
      title: String(task.title ?? ""),
      description: String(task.description ?? ""),
      totalScore: typeof task.totalScore === "number" ? task.totalScore : 0,
      questionCount: Array.isArray(task.questions) ? task.questions.length : 0,
      unlockAfterDays:
        typeof task.unlockAfterDays === "number" ? task.unlockAfterDays : 0,
      dueDays: typeof task.dueDays === "number" ? task.dueDays : 0,
      // Locked tasks are shown with their unlock date rather than hidden: on a
      // rolling programme the learner benefits from seeing what is ahead.
      isUnlocked: now >= win.visibleFrom.getTime(),
      // `closesAt` is IST end-of-day of the due date — the learner keeps the
      // whole of their due date, and any future submission guard agrees.
      isDue: now > win.closesAt.getTime(),
      isClamped: win.isClamped,
      visibleFrom: win.visibleFrom.toISOString(),
      dueAt: win.dueAt.toISOString(),
      closesAt: win.closesAt.toISOString(),
    });
  }

  tasks.sort(
    (a, b) =>
      new Date(a.visibleFrom).getTime() - new Date(b.visibleFrom).getTime(),
  );

  const documentationDueAt = program?.documentationRequired
    ? new Date(
        startDate.getTime() +
          Number(program.documentationDueOffsetDays ?? 7) * 86_400_000,
      ).toISOString()
    : null;

  return {
    _id: String(enrollment._id),
    title: enrollment.programSnapshot?.title ?? program?.title ?? "",
    description: program?.description ?? "",
    thumbnail: program?.thumbnail ?? "",
    courseTitle: enrollment.courseSnapshot?.title ?? "",
    startDate: enrollment.startDate,
    endDate: enrollment.endDate,
    durationMonths: enrollment.durationMonths,
    status: enrollment.status,
    daysRemaining: Math.max(
      0,
      Math.ceil((endDate.getTime() - now) / 86_400_000),
    ),
    documentation: {
      required: !!program?.documentationRequired,
      dueAt: documentationDueAt,
      status: enrollment.documentation?.status ?? "pending",
      files: enrollment.documentation?.files ?? [],
      rejectionNote: enrollment.documentationRejectionNote ?? "",
    },
    certificateUrl: enrollment.certificateUrl ?? "",
    offerLetterUrl: enrollment.offerLetterUrl ?? "",
    tasks,
  };
};
