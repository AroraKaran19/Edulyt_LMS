import mongoose from "mongoose";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { InternshipQuestionModel } from "../models/internshipQuestion.schema";
import { InternshipModel } from "../models/internship.schema";
import { AppError } from "../middlewares/error.middleware";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolvePinnedTaskTemplateIds(
  internshipId?: string,
  batchId?: string,
): Promise<mongoose.Types.ObjectId[]> {
  if (
    !internshipId ||
    !batchId ||
    !mongoose.Types.ObjectId.isValid(internshipId) ||
    !mongoose.Types.ObjectId.isValid(batchId)
  ) {
    return [];
  }
  const doc = await InternshipModel.findById(internshipId)
    .select("batches.taskTemplateIds batches._id")
    .lean();
  if (!doc || !Array.isArray((doc as { batches?: unknown[] }).batches)) {
    return [];
  }
  const batches = (
    doc as {
      batches: { _id?: unknown; taskTemplateIds?: unknown[] }[];
    }
  ).batches;
  const batch = batches.find((b) => String(b._id) === batchId);
  const raw = batch?.taskTemplateIds;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(String(id));
      } catch {
        return null;
      }
    })
    .filter((x): x is mongoose.Types.ObjectId => x != null);
}

export type UpsertInternshipTaskBody = {
  title: string;
  description?: string;
  questions: string[];
  unlockAfterDays: number;
  dueDays: number;
  /** Minimum total points to pass; must be <= computed totalScore. Default 0. */
  scoreThreshold?: number;
  isActive?: boolean;
};

export type InternshipTaskQuestionSummary = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
  category: string | null;
};

export type InternshipTaskDetailAdmin = {
  _id: string;
  title: string;
  description: string;
  questions: InternshipTaskQuestionSummary[];
  totalScore: number;
  scoreThreshold: number;
  unlockAfterDays: number;
  dueDays: number;
  isActive: boolean;
  createdBy: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeQuestionIdOrder(raw: unknown): mongoose.Types.ObjectId[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new AppError("At least one question is required", 400);
  }
  const seen = new Set<string>();
  const out: mongoose.Types.ObjectId[] = [];
  for (const id of raw) {
    const s = String(id).trim();
    if (!s) continue;
    if (!mongoose.Types.ObjectId.isValid(s)) {
      throw new AppError(`Invalid question id: ${s}`, 400);
    }
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(new mongoose.Types.ObjectId(s));
  }
  if (out.length === 0) {
    throw new AppError("At least one question is required", 400);
  }
  return out;
}

async function resolveQuestionsForTask(
  questionOids: mongoose.Types.ObjectId[],
): Promise<number> {
  const found = await InternshipQuestionModel.find({
    _id: { $in: questionOids },
  })
    .select("usageType score")
    .lean();

  if (found.length !== questionOids.length) {
    throw new AppError("One or more questions were not found", 400);
  }

  for (const q of found) {
    const ut = String(q.usageType ?? "");
    if (!["task", "both"].includes(ut)) {
      throw new AppError(
        "Each linked question must have usage type task or both",
        400,
      );
    }
  }

  const byId = new Map(
    found.map((q) => [
      String(q._id),
      typeof q.score === "number" ? q.score : 0,
    ]),
  );
  return questionOids.reduce(
    (sum, oid) => sum + (byId.get(String(oid)) ?? 0),
    0,
  );
}

function parseNonNegInt(value: unknown, field: string): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseInt(value, 10)
        : NaN;
  if (Number.isNaN(n) || n < 0 || !Number.isFinite(n)) {
    throw new AppError(`${field} must be a non-negative integer`, 400);
  }
  return Math.floor(n);
}

function parseScoreThreshold(value: unknown, totalScore: number): number {
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseFloat(String(value).trim())
        : NaN;
  if (Number.isNaN(raw) || !Number.isFinite(raw) || raw < 0) {
    throw new AppError(
      "scoreThreshold must be a non-negative number",
      400,
    );
  }
  if (raw > totalScore) {
    throw new AppError(
      "scoreThreshold cannot be greater than the template total score",
      400,
    );
  }
  return raw;
}

async function computeTaskFields(body: UpsertInternshipTaskBody): Promise<{
  title: string;
  description: string;
  questions: mongoose.Types.ObjectId[];
  totalScore: number;
  scoreThreshold: number;
  unlockAfterDays: number;
  dueDays: number;
  isActive: boolean;
}> {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    throw new AppError("title is required", 400);
  }
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  const unlockAfterDays = parseNonNegInt(
    body.unlockAfterDays,
    "unlockAfterDays",
  );
  // `dueDays` is the submission window length measured from the unlock date
  // (dueAt = internshipStartDate + unlockAfterDays + dueDays), so it is
  // independent of `unlockAfterDays` — any non-negative value is valid.
  const dueDays = parseNonNegInt(body.dueDays, "dueDays");
  const questionOids = normalizeQuestionIdOrder(body.questions);
  const totalScore = await resolveQuestionsForTask(questionOids);
  const scoreThreshold = parseScoreThreshold(
    body.scoreThreshold ?? 0,
    totalScore,
  );
  return {
    title,
    description,
    questions: questionOids,
    totalScore,
    scoreThreshold,
    unlockAfterDays,
    dueDays,
    isActive: body.isActive !== false,
  };
}

function serializePopulatedQuestion(
  q: Record<string, unknown>,
): InternshipTaskQuestionSummary {
  const cat = q.category;
  return {
    _id: String(q._id),
    questionText: String(q.questionText ?? ""),
    type: String(q.type ?? ""),
    usageType: String(q.usageType ?? ""),
    score: typeof q.score === "number" ? q.score : 0,
    isActive: q.isActive !== false,
    category: typeof cat === "string" && cat.trim() ? cat : null,
  };
}

function serializeCreatedBy(
  u: unknown,
): InternshipTaskDetailAdmin["createdBy"] {
  if (!u || typeof u !== "object") return null;
  const o = u as Record<string, unknown>;
  if (o._id == null) return null;
  return {
    _id: String(o._id),
    name: typeof o.name === "string" ? o.name : undefined,
    firstName: typeof o.firstName === "string" ? o.firstName : undefined,
    lastName: typeof o.lastName === "string" ? o.lastName : undefined,
    email: typeof o.email === "string" ? o.email : undefined,
  };
}

/**
 * Paginated task templates for admin pickers. When `internshipId` + `batchId`
 * match an embedded batch, templates already linked on that batch sort first,
 * then the rest by `updatedAt`.
 */
export async function listInternshipTasksAdmin(
  page: number,
  limit: number,
  search?: string,
  status: "all" | "active" | "inactive" = "all",
  internshipId?: string,
  batchId?: string,
): Promise<{
  tasks: {
    _id: string;
    title: string;
    questionCount: number;
    totalScore: number;
    scoreThreshold: number;
    unlockAfterDays: number;
    dueDays: number;
    isActive: boolean;
    updatedAt?: Date;
  }[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const p = Math.max(1, page);
  const l = Math.min(50, Math.max(1, limit));
  const skip = (p - 1) * l;

  const filter: Record<string, unknown> = {};
  if (search?.trim()) {
    filter.title = new RegExp(escapeRegex(search.trim()), "i");
  }
  if (status === "active") {
    filter.isActive = true;
  } else if (status === "inactive") {
    filter.isActive = false;
  }

  const pinnedIds = await resolvePinnedTaskTemplateIds(internshipId, batchId);

  const total = await InternshipTaskModel.countDocuments(filter);

  if (pinnedIds.length === 0) {
    const rows = await InternshipTaskModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(l)
      .select(
        "title totalScore scoreThreshold unlockAfterDays dueDays isActive updatedAt questions",
      )
      .lean();

    return {
      tasks: rows.map((r) => ({
        _id: String(r._id),
        title: String(r.title ?? ""),
        questionCount: Array.isArray(r.questions) ? r.questions.length : 0,
        totalScore: typeof r.totalScore === "number" ? r.totalScore : 0,
        scoreThreshold:
          typeof r.scoreThreshold === "number" ? r.scoreThreshold : 0,
        unlockAfterDays:
          typeof r.unlockAfterDays === "number" ? r.unlockAfterDays : 0,
        dueDays: typeof r.dueDays === "number" ? r.dueDays : 0,
        isActive: r.isActive !== false,
        updatedAt: r.updatedAt,
      })),
      total,
      page: p,
      totalPages: Math.max(1, Math.ceil(total / l)),
    };
  }

  const pipeline: mongoose.PipelineStage[] = [
    { $match: filter },
    {
      $addFields: {
        _batchPin: {
          $cond: [{ $in: ["$_id", pinnedIds] }, 1, 0],
        },
        questionCount: {
          $size: { $ifNull: ["$questions", []] },
        },
      },
    },
    { $sort: { _batchPin: -1, updatedAt: -1 } },
    { $skip: skip },
    { $limit: l },
    {
      $project: {
        _id: 1,
        title: 1,
        totalScore: 1,
        scoreThreshold: 1,
        unlockAfterDays: 1,
        dueDays: 1,
        isActive: 1,
        updatedAt: 1,
        questionCount: 1,
      },
    },
  ];

  const rows = await InternshipTaskModel.aggregate<{
    _id: mongoose.Types.ObjectId;
    title: string;
    totalScore: number;
    scoreThreshold: number;
    unlockAfterDays: number;
    dueDays: number;
    isActive?: boolean;
    updatedAt?: Date;
    questionCount: number;
  }>(pipeline);

  return {
    tasks: rows.map((r) => ({
      _id: String(r._id),
      title: String(r.title ?? ""),
      questionCount:
        typeof r.questionCount === "number" ? r.questionCount : 0,
      totalScore: typeof r.totalScore === "number" ? r.totalScore : 0,
      scoreThreshold:
        typeof r.scoreThreshold === "number" ? r.scoreThreshold : 0,
      unlockAfterDays:
        typeof r.unlockAfterDays === "number" ? r.unlockAfterDays : 0,
      dueDays: typeof r.dueDays === "number" ? r.dueDays : 0,
      isActive: r.isActive !== false,
      updatedAt: r.updatedAt,
    })),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}

export async function getInternshipTaskByIdAdmin(
  id: string,
): Promise<InternshipTaskDetailAdmin> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }
  const doc = await InternshipTaskModel.findById(id)
    .populate(
      "questions",
      "questionText type usageType score isActive category",
    )
    .populate("createdBy", "firstName lastName email name")
    .lean();

  if (!doc) {
    throw new AppError("Task template not found", 404);
  }

  const rawQuestions = (Array.isArray(doc.questions) ? doc.questions : []) as unknown[];
  const questions = rawQuestions
    .filter(
      (q): q is Record<string, unknown> =>
        q != null &&
        typeof q === "object" &&
        "questionText" in q &&
        "_id" in q,
    )
    .map((q) => serializePopulatedQuestion(q));

  return {
    _id: String(doc._id),
    title: String(doc.title ?? ""),
    description: String(doc.description ?? ""),
    questions,
    totalScore: typeof doc.totalScore === "number" ? doc.totalScore : 0,
    scoreThreshold:
      typeof doc.scoreThreshold === "number" ? doc.scoreThreshold : 0,
    unlockAfterDays:
      typeof doc.unlockAfterDays === "number" ? doc.unlockAfterDays : 0,
    dueDays: typeof doc.dueDays === "number" ? doc.dueDays : 0,
    isActive: doc.isActive !== false,
    createdBy: serializeCreatedBy(doc.createdBy),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createInternshipTaskAdmin(
  body: UpsertInternshipTaskBody,
  createdBy: mongoose.Types.ObjectId,
): Promise<InternshipTaskDetailAdmin> {
  const fields = await computeTaskFields(body);
  const created = await InternshipTaskModel.create({
    ...fields,
    createdBy,
  });
  return getInternshipTaskByIdAdmin(String(created._id));
}

export async function updateInternshipTaskAdmin(
  id: string,
  body: UpsertInternshipTaskBody,
): Promise<InternshipTaskDetailAdmin> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }
  const fields = await computeTaskFields(body);
  const updated = await InternshipTaskModel.findByIdAndUpdate(
    id,
    { $set: fields },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) {
    throw new AppError("Task template not found", 404);
  }
  return getInternshipTaskByIdAdmin(id);
}

export async function deleteInternshipTaskAdmin(id: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }
  const res = await InternshipTaskModel.findByIdAndDelete(id);
  if (!res) {
    throw new AppError("Task template not found", 404);
  }
  // Remove the deleted template from every internship batch that referenced it
  await InternshipModel.updateMany(
    { "batches.taskTemplateIds": res._id },
    { $pull: { "batches.$[].taskTemplateIds": res._id } },
  );
}
