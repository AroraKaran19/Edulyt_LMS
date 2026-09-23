import mongoose from "mongoose";
import { CaApplicationModel, CaTaskModel, CaTaskSubmissionModel, InternshipQuestionModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { isCaTaskOpenForApplication } from "../lib/caTasks";
import { awardWalletSuccessPoints } from "./successPoints.services";
import type {
  CaTaskAdminDetail,
  CaTaskAdminRow,
  CaTaskAttemptQuestion,
  CaTaskFileResponse,
  CaTaskMcqResponse,
  CaTaskMineStatus,
  CaTaskSnapshot,
  CaTaskSnapshotQuestion,
  CaTaskSubmission,
  UpsertCaTaskBody,
} from "../types/caTask";

const parseNonNegInt = (value: unknown, field: string): number => {
  const n = typeof value === "number" ? value : typeof value === "string" ? parseInt(value, 10) : NaN;
  if (Number.isNaN(n) || n < 0 || !Number.isFinite(n)) {
    throw new AppError(`${field} must be a non-negative integer`, 400);
  }
  return Math.floor(n);
};

const normalizeQuestionIds = (raw: unknown): mongoose.Types.ObjectId[] => {
  if (!Array.isArray(raw) || raw.length === 0) throw new AppError("Select at least one question", 400);
  const seen = new Set<string>();
  const out: mongoose.Types.ObjectId[] = [];
  for (const id of raw) {
    const s = String(id).trim();
    if (!s || !mongoose.Types.ObjectId.isValid(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(new mongoose.Types.ObjectId(s));
  }
  if (out.length === 0) throw new AppError("Select at least one question", 400);
  return out;
};

/**
 * Validates and sums the question bank selection. Task questions are reused
 * as-is from the internship bank; only their usage type and score matter here.
 */
async function resolveCaTaskQuestions(
  questionOids: mongoose.Types.ObjectId[],
): Promise<number> {
  const found = await InternshipQuestionModel.find({ _id: { $in: questionOids } })
    .select("usageType score")
    .lean<{ _id: mongoose.Types.ObjectId; usageType: string; score: number }[]>();
  if (found.length !== questionOids.length) {
    throw new AppError("One or more questions were not found", 400);
  }
  for (const q of found) {
    if (!["task", "both"].includes(String(q.usageType))) {
      throw new AppError("Each linked question must have usage type task or both", 400);
    }
  }
  const byId = new Map(found.map((q) => [String(q._id), typeof q.score === "number" ? q.score : 0]));
  return questionOids.reduce((sum, oid) => sum + (byId.get(String(oid)) ?? 0), 0);
}

async function computeCaTaskFields(body: UpsertCaTaskBody) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) throw new AppError("Title is required", 400);
  const description = typeof body.description === "string" ? body.description.trim() : "";

  const startFromDay = parseNonNegInt(body.startFromDay, "startFromDay");
  const endOnDay = parseNonNegInt(body.endOnDay, "endOnDay");
  if (endOnDay < startFromDay) {
    throw new AppError("endOnDay must be on or after startFromDay", 400);
  }

  const questionOids = normalizeQuestionIds(body.questionIds);
  const totalScore = await resolveCaTaskQuestions(questionOids);

  const passScore = parseNonNegInt(body.passScore ?? 0, "passScore");
  if (passScore > totalScore) {
    throw new AppError("passScore cannot be greater than the total question score", 400);
  }
  const successPoints = parseNonNegInt(body.successPoints ?? 0, "successPoints");

  return {
    title,
    description,
    questions: questionOids,
    totalScore,
    passScore,
    successPoints,
    startFromDay,
    endOnDay,
    isActive: body.isActive !== false,
  };
}

const toAdminRow = (doc: {
  _id: unknown;
  title: string;
  description?: string;
  questions?: unknown[];
  totalScore?: number;
  passScore?: number;
  successPoints?: number;
  startFromDay?: number;
  endOnDay?: number;
  isActive?: boolean;
  updatedAt?: Date;
}): CaTaskAdminRow => ({
  id: String(doc._id),
  title: doc.title,
  description: doc.description ?? "",
  questionCount: Array.isArray(doc.questions) ? doc.questions.length : 0,
  totalScore: doc.totalScore ?? 0,
  passScore: doc.passScore ?? 0,
  successPoints: doc.successPoints ?? 0,
  startFromDay: doc.startFromDay ?? 0,
  endOnDay: doc.endOnDay ?? 0,
  isActive: doc.isActive !== false,
  updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : "",
});

/** Sorted by `startFromDay`, matching the admin list's default reading order. */
export const listCaTasksAdmin = async (): Promise<CaTaskAdminRow[]> => {
  const rows = await CaTaskModel.find({}).sort({ startFromDay: 1 }).limit(500).lean();
  return rows.map(toAdminRow);
};

export const getCaTaskAdmin = async (id: string): Promise<CaTaskAdminDetail> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid task id", 400);
  const doc = await CaTaskModel.findById(id)
    .populate("questions", "questionText type usageType score isActive category")
    .lean<any>();
  if (!doc) throw new AppError("Task not found", 404);
  const questions = (Array.isArray(doc.questions) ? doc.questions : [])
    .filter((q: any) => q && typeof q === "object" && "questionText" in q)
    .map((q: any) => ({
      id: String(q._id),
      questionText: String(q.questionText ?? ""),
      type: String(q.type ?? ""),
      score: typeof q.score === "number" ? q.score : 0,
      category: typeof q.category === "string" && q.category.trim() ? q.category : null,
    }));
  return { ...toAdminRow(doc), questions, createdAt: new Date(doc.createdAt).toISOString() };
};

export const createCaTaskAdmin = async (
  body: UpsertCaTaskBody,
  createdBy: mongoose.Types.ObjectId,
): Promise<CaTaskAdminDetail> => {
  const fields = await computeCaTaskFields(body);
  const created = await CaTaskModel.create({ ...fields, createdBy });
  return getCaTaskAdmin(String(created._id));
};

export const updateCaTaskAdmin = async (
  id: string,
  body: UpsertCaTaskBody,
): Promise<CaTaskAdminDetail> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid task id", 400);
  const fields = await computeCaTaskFields(body);
  const updated = await CaTaskModel.findByIdAndUpdate(id, { $set: fields }, { new: true, runValidators: true }).lean();
  if (!updated) throw new AppError("Task not found", 404);
  return getCaTaskAdmin(id);
};

export const deleteCaTaskAdmin = async (id: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid task id", 400);
  const res = await CaTaskModel.findByIdAndDelete(id);
  if (!res) throw new AppError("Task not found", 404);
};

interface AttachedApplication {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  joiningDate: Date | null;
  endDate: Date | null;
}

export interface CaTaskMineRow {
  id: string;
  title: string;
  successPoints: number;
  startFromDay: number;
  endOnDay: number;
  opensAt: string | null;
  deadline: string | null;
  status: CaTaskMineStatus;
  score: number | null;
}

export interface CaTaskAttemptView {
  task: { id: string; title: string; description: string; totalScore: number; passScore: number; successPoints: number };
  opensAt: string | null;
  deadline: string | null;
  status: CaTaskMineStatus;
  submission: {
    submittedAt: string;
    totalAwardedScore: number;
    passed: boolean;
    status: "submitted" | "reviewed";
    mcqResponses: CaTaskMcqResponse[];
    fileResponses: Omit<CaTaskFileResponse, "reviewedBy">[];
  } | null;
  /** Always present, before and after submission, so the attempt page never needs a client-side cache fallback. Never carries `isCorrect`. */
  questions: CaTaskAttemptQuestion[];
}

const computeStatus = (
  win: ReturnType<typeof isCaTaskOpenForApplication>,
  submission: Pick<CaTaskSubmission, "status" | "passed"> | null,
  now = new Date(),
): CaTaskMineStatus => {
  if (submission) {
    if (submission.status === "submitted") return "in-review";
    return submission.passed ? "passed" : "failed";
  }
  if (!win) return "upcoming";
  if (now.getTime() < win.opensAt.getTime()) return "upcoming";
  if (now.getTime() > win.deadline.getTime()) return "missed";
  return "open";
};

const gradeMcq = (
  snapshotQuestion: CaTaskSnapshotQuestion,
  selectedOptions: string[],
): CaTaskMcqResponse => {
  const correctIds = new Set((snapshotQuestion.options ?? []).filter((o) => o.isCorrect).map((o) => o.optionId));
  const selected = new Set(selectedOptions);
  const isCorrect = correctIds.size === selected.size && [...selected].every((id) => correctIds.has(id));
  return {
    question: snapshotQuestion.questionId,
    selectedOptions,
    isCorrect,
    awardedScore: isCorrect ? snapshotQuestion.score : 0,
  };
};

/** Points are credited once a submission's outcome is decided, mirrored into `caPoints`. */
async function awardCaTaskPoints(
  application: Pick<AttachedApplication, "_id" | "userId">,
  submissionId: mongoose.Types.ObjectId,
  points: number,
): Promise<void> {
  if (points <= 0) return;
  try {
    await awardWalletSuccessPoints(String(application.userId), points, "ca_task");
    await CaApplicationModel.updateOne({ _id: application._id }, { $inc: { caPoints: points } });
  } catch (error) {
    await CaTaskSubmissionModel.updateOne({ _id: submissionId }, { $set: { pointsAwardedAt: null } });
    throw error;
  }
}

export const listCaTasksMine = async (
  applicationId: mongoose.Types.ObjectId,
  joiningDate: Date | null,
  endDate: Date | null,
): Promise<CaTaskMineRow[]> => {
  const submissions = await CaTaskSubmissionModel.find(
    { applicationId },
    { taskId: 1, status: 1, passed: 1, totalAwardedScore: 1 },
  ).lean();
  const byTaskId = new Map(submissions.map((s) => [String(s.taskId), s]));

  const activeTasks = await CaTaskModel.find({ isActive: true }).sort({ startFromDay: 1 }).lean();
  const submittedButInactive = submissions.length
    ? await CaTaskModel.find({
        _id: { $in: submissions.map((s) => s.taskId) },
        isActive: false,
      }).lean()
    : [];
  const tasks = [...activeTasks, ...submittedButInactive].sort((a, b) => a.startFromDay - b.startFromDay);

  return tasks.map((task) => {
    const win = isCaTaskOpenForApplication(task, joiningDate, endDate);
    const submission = byTaskId.get(String(task._id)) ?? null;
    return {
      id: String(task._id),
      title: task.title,
      successPoints: task.successPoints,
      startFromDay: task.startFromDay,
      endOnDay: task.endOnDay,
      opensAt: win ? win.opensAt.toISOString() : null,
      deadline: win ? win.deadline.toISOString() : null,
      status: computeStatus(win, submission),
      score: submission ? submission.totalAwardedScore : null,
    };
  });
};

/** Strips `isCorrect` (and anything else the CA should not see) off every option. */
const sanitizeAttemptQuestions = (questions: CaTaskSnapshotQuestion[]): CaTaskAttemptQuestion[] =>
  questions.map((q) => ({
    questionId: q.questionId,
    questionText: q.questionText,
    type: q.type,
    score: q.score,
    options: q.options?.map((o) => ({ optionId: o.optionId, text: o.text })),
  }));

const buildAttemptView = (
  task: { title: string; description: string; totalScore: number; passScore: number; successPoints: number },
  win: ReturnType<typeof isCaTaskOpenForApplication>,
  submission: CaTaskSubmission | null,
  questions: CaTaskSnapshotQuestion[],
): CaTaskAttemptView => ({
  task: { id: "", title: task.title, description: task.description, totalScore: task.totalScore, passScore: task.passScore, successPoints: task.successPoints },
  opensAt: win ? win.opensAt.toISOString() : null,
  deadline: win ? win.deadline.toISOString() : null,
  status: computeStatus(win, submission),
  submission: submission
    ? {
        submittedAt: new Date(submission.submittedAt).toISOString(),
        totalAwardedScore: submission.totalAwardedScore,
        passed: submission.passed,
        status: submission.status,
        mcqResponses: submission.mcqResponses,
        fileResponses: submission.fileResponses.map(({ reviewedBy: _reviewedBy, ...rest }) => rest),
      }
    : null,
  questions: sanitizeAttemptQuestions(questions),
});

export const getCaTaskAttempt = async (
  applicationId: mongoose.Types.ObjectId,
  joiningDate: Date | null,
  endDate: Date | null,
  taskId: string,
): Promise<CaTaskAttemptView> => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) throw new AppError("Invalid task id", 400);
  const submission = await CaTaskSubmissionModel.findOne({ taskId, applicationId }).lean<CaTaskSubmission | null>();

  if (submission) {
    const task = await CaTaskModel.findById(submission.taskId).lean();
    const liveWin = task ? isCaTaskOpenForApplication(task, joiningDate, endDate) : null;
    const view = buildAttemptView(
      { title: submission.templateSnapshot.title, description: submission.templateSnapshot.description, totalScore: submission.templateSnapshot.totalScore, passScore: submission.templateSnapshot.passScore, successPoints: submission.templateSnapshot.successPoints },
      liveWin,
      submission,
      submission.templateSnapshot.questions,
    );
    return { ...view, task: { ...view.task, id: String(submission.taskId) } };
  }

  const task = await CaTaskModel.findById(taskId)
    .populate("questions", "questionText type score options")
    .lean<any>();
  if (!task || !task.isActive) throw new AppError("Task not found", 404);
  const win = isCaTaskOpenForApplication(task, joiningDate, endDate);
  if (!win || !win.visible) throw new AppError("Task not found", 404);
  const questions: CaTaskSnapshotQuestion[] = (task.questions ?? []).map((q: any) => ({
    questionId: String(q._id),
    questionText: q.questionText,
    type: q.type,
    score: q.score,
    options: Array.isArray(q.options)
      ? q.options.map((o: any) => ({ optionId: String(o._id), text: o.text, isCorrect: Boolean(o.isCorrect) }))
      : undefined,
  }));
  const view = buildAttemptView(task, win, null, questions);
  return { ...view, task: { ...view.task, id: String(task._id) } };
};

type SubmitAnswer = { questionId: string; selectedOptions?: string[]; fileUrl?: string; comment?: string };

export const submitCaTaskAnswers = async (
  application: AttachedApplication,
  taskId: string,
  answersRaw: unknown,
): Promise<CaTaskAttemptView> => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) throw new AppError("Invalid task id", 400);
  const answers = (Array.isArray(answersRaw) ? answersRaw : []) as SubmitAnswer[];

  const existing = await CaTaskSubmissionModel.findOne({ taskId, applicationId: application._id }).lean<CaTaskSubmission | null>();
  if (existing) {
    if (existing.status === "reviewed") throw new AppError("This task has already been submitted", 409);

    const liveTask = await CaTaskModel.findById(taskId).lean();
    const deadlineWin = liveTask ? isCaTaskOpenForApplication(liveTask, application.joiningDate, application.endDate) : null;
    if (!deadlineWin || new Date().getTime() > deadlineWin.deadline.getTime()) {
      throw new AppError("The submission window for this task has closed", 403);
    }

    const rejectedIds = new Set(
      existing.fileResponses.filter((r) => r.status === "rejected").map((r) => r.question),
    );
    const toResubmit = answers.filter((a) => rejectedIds.has(a.questionId));
    if (toResubmit.length === 0) throw new AppError("Nothing to resubmit", 400);

    for (const answer of toResubmit) {
      const prev = existing.fileResponses.find((r) => r.question === answer.questionId);
      const file = typeof answer.fileUrl === "string" ? answer.fileUrl.trim() : "";
      const comment = typeof answer.comment === "string" ? answer.comment.trim() : "";
      if (!file && !comment) throw new AppError("Provide a file and/or a written answer", 400);
      const nextFile = file || prev?.currentFile || "";
      // Atomic per-answer update: conditioned on the answer still being the one
      // we read as rejected, so a concurrent review cannot be overwritten mid-flight.
      await CaTaskSubmissionModel.findOneAndUpdate(
        { _id: existing._id, "fileResponses.question": answer.questionId, "fileResponses.status": "rejected" },
        {
          $set: {
            "fileResponses.$.currentFile": nextFile,
            "fileResponses.$.learnerComment": comment,
            "fileResponses.$.status": "pending",
            "fileResponses.$.reviewNote": "",
          },
          ...(file
            ? { $push: { "fileResponses.$.uploadHistory": { file, uploadedAt: new Date() } } }
            : {}),
        },
      );
    }
    await CaTaskSubmissionModel.updateOne({ _id: existing._id }, { $set: { pendingReview: true } });
    return getCaTaskAttempt(application._id, application.joiningDate, application.endDate, taskId);
  }

  const task = await CaTaskModel.findById(taskId)
    .populate("questions", "questionText type score options")
    .lean<any>();
  if (!task || !task.isActive) throw new AppError("Task not found", 404);

  const win = isCaTaskOpenForApplication(task, application.joiningDate, application.endDate);
  if (!win || !win.submittable) {
    throw new AppError("This task is not open for submission right now", 403);
  }

  const snapshotQuestions: CaTaskSnapshotQuestion[] = (task.questions ?? []).map((q: any) => ({
    questionId: String(q._id),
    questionText: q.questionText,
    type: q.type,
    score: q.score,
    options: Array.isArray(q.options)
      ? q.options.map((o: any) => ({ optionId: String(o._id), text: o.text, isCorrect: Boolean(o.isCorrect) }))
      : undefined,
  }));
  const snapshot: CaTaskSnapshot = {
    taskId: String(task._id),
    title: task.title,
    description: task.description,
    questions: snapshotQuestions,
    totalScore: task.totalScore,
    passScore: task.passScore,
    successPoints: task.successPoints,
    snapshotAt: new Date(),
  };

  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));
  const mcqResponses: CaTaskMcqResponse[] = [];
  const fileResponses: CaTaskFileResponse[] = [];
  for (const q of snapshotQuestions) {
    const a = answerByQuestion.get(q.questionId);
    if (q.type === "mcq") {
      mcqResponses.push(gradeMcq(q, a?.selectedOptions ?? []));
    } else {
      const file = typeof a?.fileUrl === "string" ? a.fileUrl.trim() : "";
      const comment = typeof a?.comment === "string" ? a.comment.trim() : "";
      if (!file && !comment) {
        throw new AppError("Complete every file-upload question with an upload and/or a written answer", 400);
      }
      fileResponses.push({
        question: q.questionId,
        currentFile: file,
        learnerComment: comment,
        uploadHistory: file ? [{ file, uploadedAt: new Date() }] : [],
        status: "pending",
        awardedScore: 0,
      });
    }
  }

  const mcqTotal = mcqResponses.reduce((s, r) => s + r.awardedScore, 0);
  const hasFileQuestions = fileResponses.length > 0;
  const passed = !hasFileQuestions && mcqTotal >= task.passScore;

  let created: CaTaskSubmission;
  try {
    created = (await CaTaskSubmissionModel.create({
      taskId: task._id,
      applicationId: application._id,
      userId: application.userId,
      templateSnapshot: snapshot,
      mcqResponses,
      fileResponses,
      totalAwardedScore: mcqTotal,
      pendingReview: hasFileQuestions,
      status: hasFileQuestions ? "submitted" : "reviewed",
      passed,
      pointsAwardedAt: !hasFileQuestions && passed && task.successPoints > 0 ? new Date() : null,
      submittedAt: new Date(),
    })) as unknown as CaTaskSubmission;
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError("This task has already been submitted", 409);
    }
    throw error;
  }

  if (!hasFileQuestions && passed && task.successPoints > 0) {
    await awardCaTaskPoints(application, created._id, task.successPoints);
  }

  return getCaTaskAttempt(application._id, application.joiningDate, application.endDate, taskId);
};
