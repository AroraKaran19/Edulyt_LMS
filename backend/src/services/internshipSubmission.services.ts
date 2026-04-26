import mongoose from "mongoose";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipQuestionModel } from "../models/internshipQuestion.schema";
import { AppError } from "../middlewares/error.middleware";
import type {
  SnapshotQuestion,
  TaskTemplateSnapshot,
  ExamTemplateSnapshot,
} from "../types/internship-submission";

// ─── Snapshot builders ────────────────────────────────────────────────────────

async function buildSnapshotQuestion(
  questionId: mongoose.Types.ObjectId,
): Promise<SnapshotQuestion> {
  const q = await InternshipQuestionModel.findById(questionId).lean();
  if (!q) {
    throw new AppError(
      `Question ${String(questionId)} not found — cannot create snapshot`,
      404,
    );
  }
  const base: SnapshotQuestion = {
    questionId: String(q._id),
    questionText: String(q.questionText ?? ""),
    type: q.type as "mcq" | "file_upload",
    score: typeof q.score === "number" ? q.score : 0,
    referenceFile:
      typeof q.referenceFile === "string" ? q.referenceFile : undefined,
  };
  if (q.type === "mcq" && Array.isArray(q.options)) {
    base.options = (
      q.options as { _id?: unknown; text?: unknown; isCorrect?: unknown }[]
    ).map((o) => ({
      optionId: o._id != null ? String(o._id) : "",
      text: typeof o.text === "string" ? o.text : "",
      isCorrect: !!o.isCorrect,
    }));
  }
  return base;
}

async function buildTaskSnapshot(
  taskId: string,
): Promise<TaskTemplateSnapshot> {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new AppError("Invalid task template id", 400);
  }
  const task = await InternshipTaskModel.findById(taskId).lean();
  if (!task) {
    throw new AppError("Task template not found", 404);
  }
  if (!task.isActive) {
    throw new AppError("Task template is not active", 400);
  }
  const questionIds = Array.isArray(task.questions)
    ? task.questions.map((q) => new mongoose.Types.ObjectId(String(q)))
    : [];

  const questions = await Promise.all(
    questionIds.map((oid) => buildSnapshotQuestion(oid)),
  );

  return {
    taskId: String(task._id),
    title: String(task.title ?? ""),
    description: String(task.description ?? ""),
    questions,
    totalScore: typeof task.totalScore === "number" ? task.totalScore : 0,
    scoreThreshold:
      typeof (task as { scoreThreshold?: number }).scoreThreshold === "number"
        ? (task as { scoreThreshold: number }).scoreThreshold
        : 0,
    unlockAfterDays:
      typeof task.unlockAfterDays === "number" ? task.unlockAfterDays : 0,
    dueDays: typeof task.dueDays === "number" ? task.dueDays : 0,
    snapshotAt: new Date(),
  };
}

function coerceDate(raw: unknown): Date | undefined {
  if (raw == null) return undefined;
  const d =
    raw instanceof Date
      ? raw
      : typeof raw === "string" || typeof raw === "number"
        ? new Date(raw)
        : undefined;
  if (!d || Number.isNaN(d.getTime())) return undefined;
  return d;
}

async function buildExamSnapshot(
  examId: string,
): Promise<ExamTemplateSnapshot> {
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    throw new AppError("Invalid exam template id", 400);
  }
  const exam = await InternshipExamModel.findById(examId).lean();
  if (!exam) {
    throw new AppError("Exam template not found", 404);
  }
  if (!exam.isActive) {
    throw new AppError("Exam template is not active", 400);
  }
  const questionIds = Array.isArray(exam.questions)
    ? exam.questions.map((q) => new mongoose.Types.ObjectId(String(q)))
    : [];

  const questions = await Promise.all(
    questionIds.map((oid) => buildSnapshotQuestion(oid)),
  );

  const e = exam as {
    thresholdScore?: number;
    examStartAt?: unknown;
    examEndAt?: unknown;
    examResultAt?: unknown;
  };

  const examStartAt = coerceDate(e.examStartAt);
  const examEndAt = coerceDate(e.examEndAt);
  const examResultAt = coerceDate(e.examResultAt);

  if (!examResultAt) {
    throw new AppError(
      "Exam template is missing examResultAt — cannot create submission snapshot",
      400,
    );
  }

  return {
    examId: String(exam._id),
    title: String(exam.title ?? ""),
    description: String(exam.description ?? ""),
    questions,
    totalScore: typeof exam.totalScore === "number" ? exam.totalScore : 0,
    thresholdScore:
      typeof e.thresholdScore === "number" ? e.thresholdScore : undefined,
    examStartAt,
    examEndAt,
    examResultAt,
    snapshotAt: new Date(),
  };
}

// ─── Create submission ────────────────────────────────────────────────────────

export type CreateSubmissionBody = {
  submissionFor: "exam" | "task";
  /** Required when submissionFor is "exam" */
  examId?: string;
  /** Required when submissionFor is "task" */
  taskId?: string;
  internshipId: string;
  batchId: string;
  enrollmentId: string;
};

export async function createInternshipSubmission(
  body: CreateSubmissionBody,
  userId: mongoose.Types.ObjectId,
): Promise<Record<string, unknown>> {
  const { submissionFor, internshipId, batchId, enrollmentId } = body;

  if (!mongoose.Types.ObjectId.isValid(internshipId)) {
    throw new AppError("Invalid internshipId", 400);
  }
  if (!enrollmentId || !mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollmentId", 400);
  }

  let snapshot: TaskTemplateSnapshot | ExamTemplateSnapshot;
  let templateRef: { examId?: string; taskId?: string } = {};

  if (submissionFor === "task") {
    if (!body.taskId)
      throw new AppError("taskId is required for task submissions", 400);

    // Check if a submission already exists for this user × task × batch
    const existing = await InternshipSubmissionModel.findOne({
      userId,
      taskId: body.taskId,
      batchId,
    });
    if (existing) {
      throw new AppError("A submission for this task already exists", 409);
    }

    // Enforce the task window: enrolledAt + unlockAfterDays ≤ now < enrolledAt + dueDays
    const enrollment =
      await InternshipEnrollmentModel.findById(enrollmentId).lean();
    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }
    const enrolledAt =
      enrollment.enrolledAt instanceof Date
        ? enrollment.enrolledAt
        : enrollment.createdAt instanceof Date
          ? enrollment.createdAt
          : null;
    if (enrolledAt) {
      const task = await InternshipTaskModel.findById(body.taskId)
        .select("unlockAfterDays dueDays")
        .lean();
      if (task) {
        const MS_PER_DAY = 86_400_000;
        const unlockAfterDays =
          typeof task.unlockAfterDays === "number" ? task.unlockAfterDays : 0;
        const dueDays = typeof task.dueDays === "number" ? task.dueDays : 0;
        const visibleFrom = new Date(
          enrolledAt.getTime() + unlockAfterDays * MS_PER_DAY,
        );
        const dueAt = new Date(enrolledAt.getTime() + dueDays * MS_PER_DAY);
        const now = new Date();
        if (now < visibleFrom) {
          throw new AppError(
            `This task is not yet available. It unlocks on ${visibleFrom.toISOString().slice(0, 10)}.`,
            403,
          );
        }
        if (now >= dueAt) {
          throw new AppError(
            `The submission window for this task has closed. It was due by ${dueAt.toISOString().slice(0, 10)}.`,
            403,
          );
        }
      }
    }

    snapshot = await buildTaskSnapshot(body.taskId);
    templateRef = { taskId: body.taskId };
  } else if (submissionFor === "exam") {
    if (!body.examId)
      throw new AppError("examId is required for exam submissions", 400);

    const existing = await InternshipSubmissionModel.findOne({
      userId,
      examId: body.examId,
      batchId,
    });
    if (existing) {
      throw new AppError("A submission for this exam already exists", 409);
    }

    snapshot = await buildExamSnapshot(body.examId);
    templateRef = { examId: body.examId };
  } else {
    throw new AppError("submissionFor must be exam or task", 400);
  }

  const doc = await InternshipSubmissionModel.create({
    submissionFor,
    ...templateRef,
    templateSnapshot: snapshot,
    internshipId: new mongoose.Types.ObjectId(internshipId),
    batchId,
    userId,
    enrollmentId: new mongoose.Types.ObjectId(enrollmentId),
    mcqResponses: [],
    fileResponses: [],
    totalAwardedScore: 0,
    status: "draft",
  });

  return serializeSubmission(doc.toObject());
}

// ─── Save answers (draft) ─────────────────────────────────────────────────────

export type SaveMCQAnswerBody = {
  question: string;
  selectedOptions: string[];
};

export type SaveFileAnswerBody = {
  question: string;
  fileUrl: string;
};

export async function saveMCQAnswer(
  submissionId: string,
  body: SaveMCQAnswerBody,
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    throw new AppError("Invalid submissionId", 400);
  }
  const sub = await InternshipSubmissionModel.findById(submissionId);
  if (!sub) throw new AppError("Submission not found", 404);
  if (sub.status !== "draft") {
    throw new AppError("Cannot update answers on a submitted submission", 400);
  }

  const snapshot = sub.toObject().templateSnapshot as
    | TaskTemplateSnapshot
    | ExamTemplateSnapshot;
  const snapshotQ = snapshot.questions.find(
    (q) => q.questionId === body.question,
  );
  if (!snapshotQ) {
    throw new AppError(
      "Question not found in this submission's template snapshot",
      400,
    );
  }
  if (snapshotQ.type !== "mcq") {
    throw new AppError("This question is not an MCQ", 400);
  }

  const existing = (sub.mcqResponses as { question: string }[]).findIndex(
    (r) => r.question === body.question,
  );
  const response = {
    question: body.question,
    selectedOptions: body.selectedOptions,
  };

  if (existing >= 0) {
    sub.mcqResponses[existing] = response as never;
  } else {
    (sub.mcqResponses as unknown[]).push(response);
  }

  await sub.save();
  return serializeSubmission(sub.toObject());
}

export async function saveFileAnswer(
  submissionId: string,
  body: SaveFileAnswerBody,
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    throw new AppError("Invalid submissionId", 400);
  }
  const sub = await InternshipSubmissionModel.findById(submissionId);
  if (!sub) throw new AppError("Submission not found", 404);
  if (sub.status !== "draft") {
    throw new AppError("Cannot update answers on a submitted submission", 400);
  }

  const snapshot = sub.toObject().templateSnapshot as
    | TaskTemplateSnapshot
    | ExamTemplateSnapshot;
  const snapshotQ = snapshot.questions.find(
    (q) => q.questionId === body.question,
  );
  if (!snapshotQ) {
    throw new AppError(
      "Question not found in this submission's template snapshot",
      400,
    );
  }
  if (snapshotQ.type !== "file_upload") {
    throw new AppError("This question is not a file-upload question", 400);
  }

  const fileEntry = { file: body.fileUrl, uploadedAt: new Date() };
  const existing = (
    sub.fileResponses as {
      question: string;
      currentFile: string;
      uploadHistory: unknown[];
      status: string;
    }[]
  ).findIndex((r) => r.question === body.question);

  if (existing >= 0) {
    const r = sub.fileResponses[existing] as {
      currentFile: string;
      uploadHistory: unknown[];
      status: string;
    };
    (r.uploadHistory as unknown[]).push(fileEntry);
    r.currentFile = body.fileUrl;
    r.status = "submitted";
  } else {
    (sub.fileResponses as unknown[]).push({
      question: body.question,
      currentFile: body.fileUrl,
      uploadHistory: [fileEntry],
      status: "submitted",
    });
  }

  await sub.save();
  return serializeSubmission(sub.toObject());
}

// ─── Submit (finalize + auto-grade MCQ) ──────────────────────────────────────

export async function submitSubmission(
  submissionId: string,
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    throw new AppError("Invalid submissionId", 400);
  }
  const sub = await InternshipSubmissionModel.findById(submissionId);
  if (!sub) throw new AppError("Submission not found", 404);
  if (sub.status !== "draft") {
    throw new AppError("Submission has already been finalized", 400);
  }

  const snapshot = sub.toObject().templateSnapshot as
    | TaskTemplateSnapshot
    | ExamTemplateSnapshot;

  // Build a quick lookup: questionId → snapshot question
  const qMap = new Map<string, SnapshotQuestion>(
    snapshot.questions.map((q) => [q.questionId, q]),
  );

  // Auto-grade MCQ responses using snapshot options (no live DB lookup needed)
  let mcqTotal = 0;
  for (const resp of sub.mcqResponses as {
    question: string;
    selectedOptions: string[];
    isCorrect?: boolean;
    awardedScore?: number;
  }[]) {
    const snapshotQ = qMap.get(resp.question);
    if (!snapshotQ || snapshotQ.type !== "mcq" || !snapshotQ.options) continue;

    const correctIds = new Set(
      snapshotQ.options.filter((o) => o.isCorrect).map((o) => o.optionId),
    );
    const selected = new Set(resp.selectedOptions);
    const isCorrect =
      correctIds.size === selected.size &&
      [...selected].every((id) => correctIds.has(id));

    resp.isCorrect = isCorrect;
    resp.awardedScore = isCorrect ? snapshotQ.score : 0;
    mcqTotal += resp.awardedScore;
  }

  // Sum up already-awarded file scores (shouldn't exist on first submit,
  // but keeps totalAwardedScore in sync if re-calling this path)
  const fileTotal = (sub.fileResponses as { awardedScore?: number }[]).reduce(
    (s, r) => s + (r.awardedScore ?? 0),
    0,
  );

  // Determine status
  const hasFileQuestions =
    snapshot.questions.some((q) => q.type === "file_upload") &&
    (sub.fileResponses as unknown[]).length > 0;

  sub.totalAwardedScore = mcqTotal + fileTotal;
  sub.status = hasFileQuestions ? "submitted" : "fully_reviewed";
  (sub as { submittedAt?: Date }).submittedAt = new Date();

  await sub.save();

  // ── Entrance exam: automatically advance enrollment status based on score ──
  const submissionFor = String(
    (sub as { submissionFor?: unknown }).submissionFor ?? "",
  );

  if (submissionFor === "exam") {
    const snap = sub.toObject().templateSnapshot as ExamTemplateSnapshot & {
      thresholdScore?: number;
    };
    const threshold =
      typeof snap.thresholdScore === "number" ? snap.thresholdScore : 0;
    const passed = sub.totalAwardedScore >= threshold;

    // Transition the enrollment: qualified → in_merit_pool, otherwise → exam_attempted
    const newStatus = passed ? "in_merit_pool" : "exam_attempted";
    await InternshipEnrollmentModel.findOneAndUpdate(
      {
        _id: (sub as { enrollmentId?: unknown }).enrollmentId,
        status: "exam_registered", // guard: only advance from the expected status
      },
      {
        $set: {
          status: newStatus,
          examScore: sub.totalAwardedScore,
          examAttemptedAt: new Date(),
        },
      },
    );
  }

  // For task submissions with no file questions the review is instantaneous —
  // accrue success points now if the learner passed.
  if (!hasFileQuestions && submissionFor !== "exam") {
    await accrueSuccessPointsIfPassed({
      submissionFor,
      enrollmentId: (sub as { enrollmentId?: unknown }).enrollmentId,
      totalAwardedScore: sub.totalAwardedScore,
      templateSnapshot: sub.toObject().templateSnapshot,
    });
  }

  return serializeSubmission(sub.toObject());
}

// ─── Review a file response (admin / instructor) ──────────────────────────────

export type ReviewFileBody = {
  awardedScore: number;
  reviewNote?: string;
  status?: "reviewed" | "re_upload_requested";
};

export async function reviewFileResponse(
  submissionId: string,
  questionId: string,
  body: ReviewFileBody,
  reviewerId: mongoose.Types.ObjectId,
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    throw new AppError("Invalid submissionId", 400);
  }
  const sub = await InternshipSubmissionModel.findById(submissionId);
  if (!sub) throw new AppError("Submission not found", 404);
  if (sub.status === "draft") {
    throw new AppError("Submission has not been submitted yet", 400);
  }

  const snapshot = sub.toObject().templateSnapshot as
    | TaskTemplateSnapshot
    | ExamTemplateSnapshot;
  const snapshotQ = snapshot.questions.find((q) => q.questionId === questionId);
  if (!snapshotQ) {
    throw new AppError("Question not found in submission snapshot", 400);
  }
  if (body.awardedScore > snapshotQ.score) {
    throw new AppError(
      `awardedScore (${body.awardedScore}) cannot exceed question score (${snapshotQ.score})`,
      400,
    );
  }

  const fileResp = (
    sub.fileResponses as {
      question: string;
      awardedScore?: number;
      reviewedBy?: unknown;
      reviewedAt?: Date;
      reviewNote?: string;
      status: string;
    }[]
  ).find((r) => r.question === questionId);

  if (!fileResp) {
    throw new AppError("No file response found for this question", 404);
  }

  fileResp.awardedScore = body.awardedScore;
  fileResp.reviewedBy = reviewerId;
  fileResp.reviewedAt = new Date();
  fileResp.reviewNote = body.reviewNote ?? "";
  fileResp.status = body.status ?? "reviewed";

  // Recompute totalAwardedScore
  const mcqTotal = (sub.mcqResponses as { awardedScore?: number }[]).reduce(
    (s, r) => s + (r.awardedScore ?? 0),
    0,
  );
  const fileTotal = (sub.fileResponses as { awardedScore?: number }[]).reduce(
    (s, r) => s + (r.awardedScore ?? 0),
    0,
  );
  sub.totalAwardedScore = mcqTotal + fileTotal;

  // Update overall status
  const fileResps = sub.fileResponses as { status: string }[];
  const allReviewed = fileResps.every(
    (r) => r.status === "reviewed" || r.status === "re_upload_requested",
  );
  const wasAlreadyFullyReviewed = sub.status === "fully_reviewed";
  sub.status = allReviewed ? "fully_reviewed" : "partially_reviewed";

  await sub.save();

  // Accrue success points the first time this task submission reaches
  // fully_reviewed (guard against double-increment on re-reviews).
  if (allReviewed && !wasAlreadyFullyReviewed) {
    await accrueSuccessPointsIfPassed({
      submissionFor: String(
        (sub as { submissionFor?: unknown }).submissionFor ?? "",
      ),
      enrollmentId: (sub as { enrollmentId?: unknown }).enrollmentId,
      totalAwardedScore: sub.totalAwardedScore,
      templateSnapshot: sub.toObject().templateSnapshot,
    });
  }

  return serializeSubmission(sub.toObject());
}

// ─── Get submission ───────────────────────────────────────────────────────────

export async function getSubmissionById(
  submissionId: string,
  /** When true, strips isCorrect from snapshot options (learner view). */
  redactAnswers = false,
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    throw new AppError("Invalid submissionId", 400);
  }
  const sub = await InternshipSubmissionModel.findById(submissionId)
    .populate("userId", "firstName lastName email name")
    .lean();
  if (!sub) throw new AppError("Submission not found", 404);

  const plain = serializeSubmission(sub as Record<string, unknown>);

  if (redactAnswers) {
    const snap = plain.templateSnapshot as
      | { questions: { options?: { isCorrect?: boolean }[] }[] }
      | undefined;
    if (snap?.questions) {
      for (const q of snap.questions) {
        if (q.options) {
          for (const o of q.options) {
            delete o.isCorrect;
          }
        }
      }
    }
  }

  return plain;
}

// ─── List submissions (admin) ─────────────────────────────────────────────────

export async function listSubmissionsAdmin(
  page: number,
  limit: number,
  filters: {
    submissionFor?: "exam" | "task";
    status?: string;
    internshipId?: string;
    batchId?: string;
    userId?: string;
    taskId?: string;
    examId?: string;
    enrollmentId?: string;
  } = {},
): Promise<{
  submissions: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const p = Math.max(1, page);
  const l = Math.min(50, Math.max(1, limit));
  const skip = (p - 1) * l;

  const filter: Record<string, unknown> = {};
  if (filters.submissionFor) filter.submissionFor = filters.submissionFor;
  if (filters.status) filter.status = filters.status;
  if (filters.batchId) filter.batchId = filters.batchId;
  if (
    filters.internshipId &&
    mongoose.Types.ObjectId.isValid(filters.internshipId)
  ) {
    filter.internshipId = new mongoose.Types.ObjectId(filters.internshipId);
  }
  if (filters.userId && mongoose.Types.ObjectId.isValid(filters.userId)) {
    filter.userId = new mongoose.Types.ObjectId(filters.userId);
  }
  if (
    filters.enrollmentId &&
    mongoose.Types.ObjectId.isValid(filters.enrollmentId)
  ) {
    filter.enrollmentId = new mongoose.Types.ObjectId(filters.enrollmentId);
  }
  const tid = filters.taskId?.trim();
  if (tid) filter.taskId = tid;
  const eid = filters.examId?.trim();
  if (eid) filter.examId = eid;

  const total = await InternshipSubmissionModel.countDocuments(filter);
  const rows = await InternshipSubmissionModel.find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(l)
    .populate("userId", "firstName lastName email name")
    .lean();

  return {
    submissions: rows.map((r) =>
      serializeSubmission(r as Record<string, unknown>),
    ),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}

// ─── Success-points accrual ───────────────────────────────────────────────────

/**
 * Called whenever a **task** submission transitions to `fully_reviewed`.
 * If the learner's `totalAwardedScore` meets or exceeds the task's
 * `scoreThreshold` (stored in the snapshot), increment
 * `internshipSuccessPoints` on their enrollment by `totalAwardedScore`.
 *
 * Only runs for task submissions — exam results do NOT contribute to
 * success points (they are entrance-gate events, not accumulated progress).
 * Runs via `$inc` so concurrent updates are safe.
 */
async function accrueSuccessPointsIfPassed(sub: {
  submissionFor: string;
  enrollmentId: unknown;
  totalAwardedScore: number;
  templateSnapshot: unknown;
}): Promise<void> {
  if (sub.submissionFor !== "task") return;

  const snapshot = sub.templateSnapshot as { scoreThreshold?: number } | null;
  const threshold =
    typeof snapshot?.scoreThreshold === "number" ? snapshot.scoreThreshold : 0;

  if (sub.totalAwardedScore < threshold) return; // did not pass — no points

  await InternshipEnrollmentModel.findByIdAndUpdate(sub.enrollmentId, {
    $inc: { internshipSuccessPoints: sub.totalAwardedScore },
  });
}

// ─── Serializer ───────────────────────────────────────────────────────────────

function serializeSubmission(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...doc,
    _id: String(doc._id),
    internshipId: String(doc.internshipId),
    userId:
      doc.userId &&
      typeof doc.userId === "object" &&
      "_id" in (doc.userId as object)
        ? doc.userId
        : String(doc.userId),
    enrollmentId: String(doc.enrollmentId),
  };
}
