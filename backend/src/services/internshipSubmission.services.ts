import mongoose from "mongoose";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipQuestionModel } from "../models/internshipQuestion.schema";
import { InternshipModel } from "../models/internship.schema";
import { AppError } from "../middlewares/error.middleware";
import type {
  SnapshotQuestion,
  TaskTemplateSnapshot,
  ExamTemplateSnapshot,
} from "../types/internship-submission";
import {
  computeCertificationExamWindowUtc,
  isInstantWithinWindowUtc,
  parseProgramDurationMonthsFromAnswers,
} from "../lib/certificationExamSchedule";
import {
  assertS3ObjectContentLengthAtMost,
  extractS3KeyFromUrl,
} from "./upload.services";
import {
  INTERNSHIP_SUBMISSION_MAX_FILE_BYTES,
  INTERNSHIP_SUBMISSION_MAX_COMMENT_CHARS,
  INTERNSHIP_SUBMISSION_S3_PREFIX,
} from "../constants/internshipSubmissionUpload";

async function resolveExamTypeFromSnapshot(
  snap: ExamTemplateSnapshot,
  fallbackExamId?: string,
): Promise<"entrance" | "certification"> {
  if (snap.examType === "certification") return "certification";
  if (snap.examType === "entrance") return "entrance";
  const id = (fallbackExamId ?? snap.examId ?? "").trim();
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return "entrance";
  const ex = await InternshipExamModel.findById(id).select("examType").lean();
  const t = (ex as { examType?: string } | null)?.examType;
  return t === "certification" ? "certification" : "entrance";
}

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
  const rawNeg = (q as { negativeScore?: unknown }).negativeScore;
  const base: SnapshotQuestion = {
    questionId: String(q._id),
    questionText: String(q.questionText ?? ""),
    type: q.type as "mcq" | "file_upload",
    score: typeof q.score === "number" ? q.score : 0,
    // File-upload questions are reviewer-graded — penalty is meaningless there.
    negativeScore:
      q.type === "mcq" && typeof rawNeg === "number" && rawNeg > 0
        ? rawNeg
        : 0,
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

function assertWithinExamSnapshotWindow(snap: ExamTemplateSnapshot): void {
  const start = coerceDate(snap.examStartAt);
  const end = coerceDate(snap.examEndAt);
  const now = Date.now();
  if (isInstantWithinWindowUtc(now, start, end)) return;
  if (start && now < start.getTime()) {
    throw new AppError("The exam window has not opened yet", 403);
  }
  if (end && now > end.getTime()) {
    throw new AppError("The exam window has closed", 403);
  }
}

async function buildExamSnapshot(
  examId: string,
  window: { examStartAt?: Date; examEndAt?: Date },
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
    examResultAt?: unknown;
    examType?: string;
  };

  const examResultAt = coerceDate(e.examResultAt);

  if (!examResultAt) {
    throw new AppError(
      "Exam template is missing examResultAt — cannot create submission snapshot",
      400,
    );
  }

  const examType: "entrance" | "certification" =
    e.examType === "certification" ? "certification" : "entrance";

  return {
    examId: String(exam._id),
    examType,
    title: String(exam.title ?? ""),
    description: String(exam.description ?? ""),
    questions,
    totalScore: typeof exam.totalScore === "number" ? exam.totalScore : 0,
    thresholdScore:
      typeof e.thresholdScore === "number" ? e.thresholdScore : undefined,
    examStartAt: window.examStartAt,
    examEndAt: window.examEndAt,
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

    // Enforce the task window, scheduled cohort-wide from the batch internship
    // start date:
    //   visibleFrom = internshipStartDate + unlockAfterDays
    //   dueAt       = visibleFrom + dueDays
    const enrollment = await InternshipEnrollmentModel.findById(enrollmentId)
      .select("-applicationAnswers -applicationSubmittedAt")
      .lean();
    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }
    if (String(enrollment.status) === "pending_documentation") {
      throw new AppError(
        "Submit your Aadhar and photo to unlock task submissions.",
        403,
        "DOCUMENTATION_PENDING",
      );
    }
    // Anchor to the batch start date; fall back to enrolment date only when the
    // batch snapshot lacks a start date (defensive — normally always set).
    const rawAnchor =
      enrollment.batchSnapshot?.internshipStartDate ??
      enrollment.enrolledAt ??
      enrollment.createdAt;
    const anchor =
      rawAnchor instanceof Date
        ? rawAnchor
        : rawAnchor
          ? new Date(rawAnchor)
          : null;
    if (anchor) {
      const task = await InternshipTaskModel.findById(body.taskId)
        .select("unlockAfterDays dueDays")
        .lean();
      if (task) {
        const MS_PER_DAY = 86_400_000;
        const unlockAfterDays =
          typeof task.unlockAfterDays === "number" ? task.unlockAfterDays : 0;
        const dueDays = typeof task.dueDays === "number" ? task.dueDays : 0;
        const visibleFrom = new Date(
          anchor.getTime() + unlockAfterDays * MS_PER_DAY,
        );
        // `dueDays` is the window length after unlock, not an anchor offset.
        const dueAt = new Date(visibleFrom.getTime() + dueDays * MS_PER_DAY);
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

    const examDoc = await InternshipExamModel.findById(body.examId).lean();
    if (!examDoc || !examDoc.isActive) {
      throw new AppError("Exam template not found or inactive", 404);
    }
    const examType =
      (examDoc as { examType?: string }).examType === "certification"
        ? "certification"
        : "entrance";

    const internship = await InternshipModel.findById(internshipId)
      .select("batches certificationThreshold")
      .lean();
    if (!internship) {
      throw new AppError("Internship not found", 404);
    }

    type BatchLean = {
      _id: unknown;
      entranceExamTemplateId?: unknown;
      certificationExamTemplateId?: unknown;
      entranceExamStartAt?: Date;
      entranceExamEndAt?: Date;
    };
    const batches = (internship as { batches?: BatchLean[] }).batches ?? [];
    const batch = batches.find((b) => String(b._id) === batchId);
    if (!batch) {
      throw new AppError("Batch not found for this internship", 400);
    }

    const enrollment =
      await InternshipEnrollmentModel.findById(enrollmentId).lean();
    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }
    if (String(enrollment.user) !== String(userId)) {
      throw new AppError("Forbidden", 403);
    }

    let window: { examStartAt?: Date; examEndAt?: Date };

    if (examType === "certification") {
      const certId = batch.certificationExamTemplateId;
      if (!certId || String(certId) !== String(body.examId)) {
        throw new AppError(
          "This certification exam is not assigned to your cohort",
          403,
        );
      }
      if (String(enrollment.status) === "pending_documentation") {
        throw new AppError(
          "Submit your Aadhar and photo to unlock the certification exam.",
          403,
          "DOCUMENTATION_PENDING",
        );
      }
      if (String(enrollment.status) !== "enrolled") {
        throw new AppError(
          "You must be actively enrolled to take the certification exam",
          403,
        );
      }
      const monthsStored = enrollment.programDurationMonths;
      const months =
        typeof monthsStored === "number" && monthsStored >= 1
          ? monthsStored
          : parseProgramDurationMonthsFromAnswers(
              enrollment.applicationAnswers &&
                typeof enrollment.applicationAnswers === "object" &&
                !Array.isArray(enrollment.applicationAnswers)
                ? (enrollment.applicationAnswers as Record<string, unknown>)
                : null,
            );
      if (!months) {
        throw new AppError(
          "Program duration is not set on your enrollment — contact support",
          400,
        );
      }
      const startRaw = enrollment.batchSnapshot?.internshipStartDate;
      const progStart =
        startRaw instanceof Date
          ? startRaw
          : startRaw
            ? new Date(startRaw as string | number)
            : null;
      if (!progStart || Number.isNaN(progStart.getTime())) {
        throw new AppError("Invalid cohort start date on enrollment", 500);
      }
      window = computeCertificationExamWindowUtc(progStart, months);
    } else {
      const entId = batch.entranceExamTemplateId;
      if (!entId || String(entId) !== String(body.examId)) {
        throw new AppError(
          "This entrance exam is not assigned to your cohort",
          403,
        );
      }
      window = {
        examStartAt: coerceDate(batch.entranceExamStartAt),
        examEndAt: coerceDate(batch.entranceExamEndAt),
      };
    }

    const now = new Date();
    if (
      !isInstantWithinWindowUtc(
        now.getTime(),
        window.examStartAt,
        window.examEndAt,
      )
    ) {
      if (window.examStartAt && now.getTime() < window.examStartAt.getTime()) {
        throw new AppError("The exam window has not opened yet", 403);
      }
      if (window.examEndAt && now.getTime() > window.examEndAt.getTime()) {
        throw new AppError("The exam window has closed", 403);
      }
    }

    snapshot = await buildExamSnapshot(body.examId, window);
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
  fileUrl?: string;
  learnerComment?: string;
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

  const snapFor = String(
    (sub as { submissionFor?: unknown }).submissionFor ?? "",
  );
  if (snapFor === "exam") {
    assertWithinExamSnapshotWindow(
      sub.toObject().templateSnapshot as ExamTemplateSnapshot,
    );
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
  userId: mongoose.Types.ObjectId,
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    throw new AppError("Invalid submissionId", 400);
  }
  const sub = await InternshipSubmissionModel.findById(submissionId);
  if (!sub) throw new AppError("Submission not found", 404);
  if (String(sub.userId) !== String(userId)) {
    throw new AppError("Forbidden", 403);
  }
  if (sub.status !== "draft") {
    throw new AppError("Cannot update answers on a submitted submission", 400);
  }

  const snapFor = String(
    (sub as { submissionFor?: unknown }).submissionFor ?? "",
  );
  if (snapFor === "exam") {
    assertWithinExamSnapshotWindow(
      sub.toObject().templateSnapshot as ExamTemplateSnapshot,
    );
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

  type FileResp = {
    question: string;
    currentFile: string;
    learnerComment?: string;
    uploadHistory: unknown[];
    status: string;
  };

  const existing = (sub.fileResponses as FileResp[]).findIndex(
    (r) => r.question === body.question,
  );
  const prior: FileResp | null =
    existing >= 0 ? (sub.fileResponses[existing] as FileResp) : null;

  const trimmedIncomingFile =
    typeof body.fileUrl === "string" ? body.fileUrl.trim() : null;

  const finalComment =
    typeof body.learnerComment === "string"
      ? body.learnerComment.trim()
      : (prior?.learnerComment ?? "").trim();

  const finalFile =
    trimmedIncomingFile !== null
      ? trimmedIncomingFile
      : (prior?.currentFile ?? "").trim();

  if (finalComment.length > INTERNSHIP_SUBMISSION_MAX_COMMENT_CHARS) {
    throw new AppError(
      `Written answer must be at most ${INTERNSHIP_SUBMISSION_MAX_COMMENT_CHARS} characters`,
      400,
    );
  }

  if (!finalFile && !finalComment) {
    throw new AppError(
      "Provide an uploaded file and/or a written answer for this question.",
      400,
    );
  }

  if (trimmedIncomingFile !== null && trimmedIncomingFile !== "") {
    const key = extractS3KeyFromUrl(trimmedIncomingFile);
    if (
      !key ||
      !key.startsWith(`${INTERNSHIP_SUBMISSION_S3_PREFIX}/`)
    ) {
      throw new AppError(
        "Upload internship answers only through the in-app file picker (invalid storage path).",
        400,
      );
    }
    await assertS3ObjectContentLengthAtMost(
      key,
      INTERNSHIP_SUBMISSION_MAX_FILE_BYTES,
    );
  }

  if (existing >= 0) {
    const r = sub.fileResponses[existing] as FileResp;
    r.learnerComment = finalComment;
    if (trimmedIncomingFile !== null) {
      if (trimmedIncomingFile) {
        (r.uploadHistory as unknown[]).push({
          file: trimmedIncomingFile,
          uploadedAt: new Date(),
        });
        r.currentFile = trimmedIncomingFile;
      } else {
        r.currentFile = "";
      }
    }
    r.status = "submitted";
  } else {
    const cf =
      trimmedIncomingFile !== null && trimmedIncomingFile
        ? trimmedIncomingFile
        : "";
    (sub.fileResponses as unknown[]).push({
      question: body.question,
      currentFile: cf,
      learnerComment: finalComment,
      uploadHistory:
        trimmedIncomingFile !== null && trimmedIncomingFile
          ? [
              {
                file: trimmedIncomingFile,
                uploadedAt: new Date(),
              },
            ]
          : [],
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

  const submitFor = String(
    (sub as { submissionFor?: unknown }).submissionFor ?? "",
  );
  if (submitFor === "exam") {
    assertWithinExamSnapshotWindow(
      sub.toObject().templateSnapshot as ExamTemplateSnapshot,
    );
  }

  const snapshot = sub.toObject().templateSnapshot as
    | TaskTemplateSnapshot
    | ExamTemplateSnapshot;

  const fileQuestionIds = snapshot.questions
    .filter((q) => q.type === "file_upload")
    .map((q) => q.questionId);
  const fileRespsByQ = new Map(
    (
      sub.fileResponses as {
        question: string;
        currentFile?: string;
        learnerComment?: string;
      }[]
    ).map((r) => [r.question, r]),
  );
  for (const qid of fileQuestionIds) {
    const fr = fileRespsByQ.get(qid);
    const hasFile = !!(fr?.currentFile && String(fr.currentFile).trim());
    const hasComment = !!(
      fr?.learnerComment && String(fr.learnerComment).trim()
    );
    if (!fr || (!hasFile && !hasComment)) {
      throw new AppError(
        "Complete every file-upload question with an upload and/or a written answer.",
        400,
      );
    }
  }

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
    const wasAttempted = selected.size > 0;
    const negative =
      typeof snapshotQ.negativeScore === "number" && snapshotQ.negativeScore > 0
        ? snapshotQ.negativeScore
        : 0;

    resp.isCorrect = isCorrect;
    resp.awardedScore = isCorrect
      ? snapshotQ.score
      : wasAttempted
        ? -negative
        : 0;
    mcqTotal += resp.awardedScore;
  }

  // Sum up already-awarded file scores (shouldn't exist on first submit,
  // but keeps totalAwardedScore in sync if re-calling this path)
  const fileTotal = (sub.fileResponses as { awardedScore?: number }[]).reduce(
    (s, r) => s + (r.awardedScore ?? 0),
    0,
  );

  // Determine status after auto-grade
  const hasFileQuestions = snapshot.questions.some(
    (q) => q.type === "file_upload",
  );

  const examSnap = snapshot as ExamTemplateSnapshot;
  const examType = await resolveExamTypeFromSnapshot(
    examSnap,
    String((sub as { examId?: unknown }).examId ?? examSnap.examId),
  );

  sub.totalAwardedScore = mcqTotal + fileTotal;
  // Certification exams always require admin review (final sign-off via
  // finalizeCertificationExamReview), even when MCQ-only.
  if (submitFor === "exam" && examType === "certification") {
    sub.status = "submitted";
  } else {
    sub.status = hasFileQuestions ? "submitted" : "fully_reviewed";
  }
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

  const subFor = String(
    (sub as { submissionFor?: unknown }).submissionFor ?? "",
  );
  const examType =
    subFor === "exam"
      ? await resolveExamTypeFromSnapshot(
          snapshot as ExamTemplateSnapshot,
          String((sub as { examId?: unknown }).examId ?? ""),
        )
      : null;

  if (subFor === "exam" && examType === "certification") {
    // File scoring done; admin still must call finalizeCertificationExamReview.
    sub.status = "partially_reviewed";
  } else {
    sub.status = allReviewed ? "fully_reviewed" : "partially_reviewed";
  }

  await sub.save();

  // Accrue success points the first time this task submission reaches
  // fully_reviewed (guard against double-increment on re-reviews).
  if (
    allReviewed &&
    !wasAlreadyFullyReviewed &&
    sub.status === "fully_reviewed"
  ) {
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

/**
 * Admin / instructor: close certification exam review (after learner submit and
 * any file uploads scored). MCQ-only exams use this directly after submit.
 */
export async function finalizeCertificationExamReview(
  submissionId: string,
  _reviewerId: mongoose.Types.ObjectId,
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    throw new AppError("Invalid submissionId", 400);
  }
  const sub = await InternshipSubmissionModel.findById(submissionId);
  if (!sub) throw new AppError("Submission not found", 404);

  if (String((sub as { submissionFor?: unknown }).submissionFor) !== "exam") {
    throw new AppError("Only exam submissions can be finalized here", 400);
  }

  const snap = sub.toObject().templateSnapshot as ExamTemplateSnapshot;
  const examType = await resolveExamTypeFromSnapshot(
    snap,
    String((sub as { examId?: unknown }).examId ?? ""),
  );
  if (examType !== "certification") {
    throw new AppError(
      "Only certification exams use this final review step",
      400,
    );
  }

  const st = String(sub.status);
  if (!["submitted", "partially_reviewed"].includes(st)) {
    throw new AppError(
      "Submission is not awaiting certification finalization",
      400,
    );
  }

  const fileQs = snap.questions.filter((q) => q.type === "file_upload");
  const fileResps = sub.fileResponses as { question: string; status: string }[];

  for (const q of fileQs) {
    const fr = fileResps.find((r) => r.question === q.questionId);
    if (!fr || fr.status !== "reviewed") {
      throw new AppError(
        "All file-upload answers must be reviewed before finalizing certification",
        400,
      );
    }
  }

  sub.status = "fully_reviewed";
  await sub.save();

  // Cert exam: credit `totalAwardedScore` to the learner's
  // `internshipSuccessPoints` (the same accumulator tasks write to).
  // Idempotency note — `finalizeCertificationExamReview` transitions a sub
  // out of "submitted" / "partially_reviewed", so the status guard prevents
  // a re-run from awarding twice.
  await accrueSuccessPointsIfPassed({
    submissionFor: String(
      (sub as { submissionFor?: unknown }).submissionFor ?? "",
    ),
    enrollmentId: (sub as { enrollmentId?: unknown }).enrollmentId,
    totalAwardedScore: sub.totalAwardedScore,
    templateSnapshot: sub.toObject().templateSnapshot,
  });

  // Queue the cert job if the learner has passed the exam *and* met the
  // configured percentage-of-total threshold. The eligibility service
  // re-reads `internshipSuccessPoints` so it picks up the credit above.
  try {
    const examPassed =
      snap.thresholdScore == null ||
      sub.totalAwardedScore >= snap.thresholdScore;
    if (examPassed) {
      const { computeInternshipEligibility } = await import(
        "./internshipEligibility.services"
      );
      const eligibility = await computeInternshipEligibility(
        String(sub.enrollmentId),
      );
      if (eligibility.meetsThreshold) {
        const { createCertificateJobService } = await import(
          "./certificateJob.services"
        );
        await createCertificateJobService({
          enrollmentId: String(sub.enrollmentId),
          certificateType: "internship",
          studentName: "",
          courseName: "",
          completionDate: new Date(),
        });
      }
    }
  } catch (certErr) {
    console.error("[Certificate] Failed to queue internship certificate job:", certErr);
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
 * Called whenever a submission transitions to `fully_reviewed`.
 *
 * Awards `totalAwardedScore` into the learner's `internshipSuccessPoints`
 * when:
 *   • a **task** submission's score >= its snapshot `scoreThreshold`, OR
 *   • a **certification exam** submission's score >= its snapshot
 *     `thresholdScore`.
 *
 * Entrance-exam submissions never contribute (they're a gate event only).
 * Runs via `$inc` so concurrent updates are safe.
 */
async function accrueSuccessPointsIfPassed(sub: {
  submissionFor: string;
  enrollmentId: unknown;
  totalAwardedScore: number;
  templateSnapshot: unknown;
}): Promise<void> {
  let threshold = 0;

  if (sub.submissionFor === "task") {
    const snapshot = sub.templateSnapshot as { scoreThreshold?: number } | null;
    threshold =
      typeof snapshot?.scoreThreshold === "number"
        ? snapshot.scoreThreshold
        : 0;
  } else if (sub.submissionFor === "exam") {
    const snapshot = sub.templateSnapshot as {
      examType?: string;
      thresholdScore?: number;
    } | null;
    // Only certification exams count — entrance is gate-only.
    if (snapshot?.examType !== "certification") return;
    threshold =
      typeof snapshot?.thresholdScore === "number" ? snapshot.thresholdScore : 0;
  } else {
    return;
  }

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
