import mongoose from "mongoose";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipQuestionModel } from "../models/internshipQuestion.schema";
import { AppError } from "../middlewares/error.middleware";

export type ExamType = "entrance" | "certification";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolvePinnedExamTemplateIds(
  internshipId?: string,
  batchId?: string,
  examType?: ExamType,
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
    .select(
      "batches.entranceExamTemplateId batches.certificationExamTemplateId batches._id",
    )
    .lean();
  if (!doc || !Array.isArray((doc as { batches?: unknown[] }).batches)) {
    return [];
  }
  const batches = (
    doc as {
      batches: {
        _id?: unknown;
        entranceExamTemplateId?: unknown;
        certificationExamTemplateId?: unknown;
      }[];
    }
  ).batches;
  const batch = batches.find((b) => String(b._id) === batchId);
  if (!batch) return [];

  const candidates: unknown[] = [];
  if (examType === "entrance" || !examType) {
    if (batch.entranceExamTemplateId != null)
      candidates.push(batch.entranceExamTemplateId);
  }
  if (examType === "certification" || !examType) {
    if (batch.certificationExamTemplateId != null)
      candidates.push(batch.certificationExamTemplateId);
  }

  return candidates
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(String(id));
      } catch {
        return null;
      }
    })
    .filter((x): x is mongoose.Types.ObjectId => x != null);
}

export type ExamListRow = {
  _id: string;
  title: string;
  examType: ExamType;
  questionCount: number;
  totalScore: number;
  thresholdScore?: number;
  examResultAt?: Date;
  isActive: boolean;
  updatedAt?: Date;
};

/**
 * Paginated exam templates for admin pickers and exam bank.
 * When `internshipId` + `batchId` match an embedded batch, linked templates sort first.
 *
 * `statusFilter` — when set (`all` | `active` | `inactive`), controls visibility by status.
 * When omitted, legacy `includeInactive` applies: false → active only, true → all.
 */
export async function listInternshipExamTemplatesAdmin(
  page: number,
  limit: number,
  search?: string,
  internshipId?: string,
  batchId?: string,
  includeInactive = false,
  statusFilter?: "all" | "active" | "inactive",
  examType?: ExamType,
): Promise<{
  exams: ExamListRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const p = Math.max(1, page);
  const l = Math.min(50, Math.max(1, limit));
  const skip = (p - 1) * l;

  const filter: Record<string, unknown> = {};
  if (statusFilter === "active") {
    filter.isActive = true;
  } else if (statusFilter === "inactive") {
    filter.isActive = false;
  } else if (statusFilter === "all") {
    // no isActive constraint
  } else if (!includeInactive) {
    filter.isActive = true;
  }

  if (examType) {
    filter.examType = examType;
  }

  if (search?.trim()) {
    filter.title = new RegExp(escapeRegex(search.trim()), "i");
  }

  const pinnedIds = await resolvePinnedExamTemplateIds(
    internshipId,
    batchId,
    examType,
  );

  const total = await InternshipExamModel.countDocuments(filter);

  const mapRow = (r: {
    _id: unknown;
    title?: string;
    examType?: string;
    totalScore?: number;
    thresholdScore?: number | null;
    examResultAt?: Date;
    isActive?: boolean;
    updatedAt?: Date;
    questions?: unknown[];
    questionCount?: number;
  }): ExamListRow => ({
    _id: String(r._id),
    title: String(r.title ?? ""),
    examType: r.examType === "certification" ? "certification" : "entrance",
    questionCount:
      typeof r.questionCount === "number"
        ? r.questionCount
        : Array.isArray(r.questions)
          ? r.questions.length
          : 0,
    totalScore: typeof r.totalScore === "number" ? r.totalScore : 0,
    thresholdScore:
      typeof r.thresholdScore === "number" && !Number.isNaN(r.thresholdScore)
        ? r.thresholdScore
        : undefined,
    examResultAt: r.examResultAt instanceof Date ? r.examResultAt : undefined,
    isActive: r.isActive !== false,
    updatedAt: r.updatedAt,
  });

  if (pinnedIds.length === 0) {
    const rows = await InternshipExamModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(l)
      .select(
        "title examType totalScore thresholdScore examResultAt isActive updatedAt questions",
      )
      .lean();
    return {
      exams: rows.map((r) => mapRow(r)),
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
        examType: 1,
        totalScore: 1,
        thresholdScore: 1,
        examResultAt: 1,
        isActive: 1,
        updatedAt: 1,
        questionCount: 1,
      },
    },
  ];

  const rows = await InternshipExamModel.aggregate<{
    _id: mongoose.Types.ObjectId;
    title: string;
    examType?: string;
    totalScore: number;
    thresholdScore?: number;
    examResultAt?: Date;
    isActive?: boolean;
    updatedAt?: Date;
    questionCount: number;
  }>(pipeline);

  return {
    exams: rows.map((r) => mapRow(r)),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}

// ─── Upsert / detail / delete ────────────────────────────────────────────────

export type UpsertInternshipExamBody = {
  title: string;
  description?: string;
  examType: ExamType;
  questions?: string[];
  /** Merit-pool minimum; required; must be ≤ totalScore. */
  thresholdScore: number;
  /** Required. ISO string or Date. */
  examResultAt: string | Date;
  isActive?: boolean;
};

/** Body accepted when updating an existing exam — only mutable fields. */
export type UpdateInternshipExamBody = {
  questions?: string[];
  thresholdScore?: number;
  examResultAt: string | Date;
  isActive?: boolean;
};

export type InternshipExamQuestionSummary = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
};

export type InternshipExamDetailAdmin = {
  _id: string;
  title: string;
  description: string;
  examType: ExamType;
  questions: InternshipExamQuestionSummary[];
  totalScore: number;
  thresholdScore?: number;
  examResultAt: Date;
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
  if (!Array.isArray(raw)) return [];
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
  return out;
}

async function resolveQuestionsForExam(
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
    if (!["exam", "both"].includes(ut)) {
      throw new AppError(
        "Each linked question must have usage type exam or both",
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

function parseOptionalThresholdScore(
  value: unknown,
  totalScore: number,
): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseFloat(String(value).trim())
        : NaN;
  if (Number.isNaN(raw) || !Number.isFinite(raw) || raw < 0) {
    throw new AppError("thresholdScore must be a non-negative number", 400);
  }
  // Only enforce the ceiling when questions have actually been added
  if (totalScore > 0 && raw > totalScore) {
    throw new AppError(
      "thresholdScore cannot be greater than the template total score",
      400,
    );
  }
  return raw;
}

function parseOptionalPositiveInt(
  value: unknown,
  field: string,
): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseInt(String(value).trim(), 10)
        : NaN;
  if (Number.isNaN(n) || !Number.isFinite(n) || n < 1) {
    throw new AppError(`${field} must be a positive integer when set`, 400);
  }
  return Math.floor(n);
}

function parseInstant(value: unknown, field: string): Date {
  const d =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : new Date(NaN);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`${field} must be a valid date-time`, 400);
  }
  return d;
}

async function computeExamFields(body: UpsertInternshipExamBody): Promise<{
  title: string;
  description: string;
  examType: ExamType;
  questions: mongoose.Types.ObjectId[];
  totalScore: number;
  thresholdScore?: number;
  examResultAt: Date;
  isActive: boolean;
}> {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    throw new AppError("title is required", 400);
  }
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  if (
    !body.examType ||
    !["entrance", "certification"].includes(body.examType)
  ) {
    throw new AppError("examType must be entrance or certification", 400);
  }
  const examType = body.examType as ExamType;
  const questionOids = normalizeQuestionIdOrder(body.questions);
  const totalScore = await resolveQuestionsForExam(questionOids);

  if (body.thresholdScore == null) {
    throw new AppError("thresholdScore is required", 400);
  }
  const thresholdScore = parseOptionalThresholdScore(
    body.thresholdScore,
    totalScore,
  );
  if (thresholdScore === undefined) {
    throw new AppError(
      "thresholdScore must be a valid non-negative number",
      400,
    );
  }

  const resRaw = body.examResultAt;
  if (resRaw == null || resRaw === "") {
    throw new AppError("examResultAt is required", 400);
  }
  const examResultAt = parseInstant(resRaw, "examResultAt");

  return {
    title,
    description,
    examType,
    questions: questionOids,
    totalScore,
    thresholdScore,
    examResultAt,
    isActive: body.isActive !== false,
  };
}

function serializePopulatedQuestion(
  q: Record<string, unknown>,
): InternshipExamQuestionSummary {
  return {
    _id: String(q._id),
    questionText: String(q.questionText ?? ""),
    type: String(q.type ?? ""),
    usageType: String(q.usageType ?? ""),
    score: typeof q.score === "number" ? q.score : 0,
    isActive: q.isActive !== false,
  };
}

function serializeCreatedBy(
  u: unknown,
): InternshipExamDetailAdmin["createdBy"] {
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

export async function getInternshipExamByIdAdmin(
  id: string,
): Promise<InternshipExamDetailAdmin> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid exam id", 400);
  }
  const doc = await InternshipExamModel.findById(id)
    .populate("questions", "questionText type usageType score isActive")
    .populate("createdBy", "firstName lastName email name")
    .lean();

  if (!doc) {
    throw new AppError("Exam template not found", 404);
  }

  const rawQuestions = (
    Array.isArray(doc.questions) ? doc.questions : []
  ) as unknown[];
  const questions = rawQuestions
    .filter(
      (q): q is Record<string, unknown> =>
        q != null && typeof q === "object" && "questionText" in q && "_id" in q,
    )
    .map((q) => serializePopulatedQuestion(q));

  const thresholdScore = doc.thresholdScore;
  const examResultAt = (doc as { examResultAt?: Date }).examResultAt;
  const rawExamType = (doc as { examType?: string }).examType;
  const examType: ExamType =
    rawExamType === "certification" ? "certification" : "entrance";

  return {
    _id: String(doc._id),
    title: String(doc.title ?? ""),
    description: String(doc.description ?? ""),
    examType,
    questions,
    totalScore: typeof doc.totalScore === "number" ? doc.totalScore : 0,
    thresholdScore:
      typeof thresholdScore === "number" ? thresholdScore : undefined,
    examResultAt:
      examResultAt instanceof Date && !Number.isNaN(examResultAt.getTime())
        ? examResultAt
        : (() => {
            throw new AppError("examResultAt is missing on exam template", 500);
          })(),
    isActive: doc.isActive !== false,
    createdBy: serializeCreatedBy(doc.createdBy),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createInternshipExamAdmin(
  body: UpsertInternshipExamBody,
  createdBy: mongoose.Types.ObjectId,
): Promise<InternshipExamDetailAdmin> {
  const fields = await computeExamFields(body);
  const created = await InternshipExamModel.create({
    ...fields,
    createdBy,
  });
  return getInternshipExamByIdAdmin(String(created._id));
}

export async function updateInternshipExamAdmin(
  id: string,
  body: UpdateInternshipExamBody,
): Promise<InternshipExamDetailAdmin> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid exam id", 400);
  }

  const questionOids = normalizeQuestionIdOrder(body.questions);
  const totalScore = await resolveQuestionsForExam(questionOids);

  const resRaw = body.examResultAt;
  if (resRaw == null || resRaw === "") {
    throw new AppError("examResultAt is required", 400);
  }
  const examResultAt = parseInstant(resRaw, "examResultAt");

  const thresholdScore = parseOptionalThresholdScore(
    body.thresholdScore,
    totalScore,
  );

  const $set: Record<string, unknown> = {
    questions: questionOids,
    totalScore,
    ...(thresholdScore !== undefined ? { thresholdScore } : {}),
    examResultAt,
    isActive: body.isActive !== false,
  };
  const $unset: Record<string, ""> = {};
  $unset.maxAttempts = "";
  $unset.duration = "";

  const updated = await InternshipExamModel.findByIdAndUpdate(
    id,
    { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) {
    throw new AppError("Exam template not found", 404);
  }
  return getInternshipExamByIdAdmin(id);
}

export async function deleteInternshipExamAdmin(id: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid exam id", 400);
  }
  const res = await InternshipExamModel.findByIdAndDelete(id);
  if (!res) {
    throw new AppError("Exam template not found", 404);
  }
  // Clear the single entrance or certification slot that referenced this template
  const isEntrance =
    (res as { examType?: string }).examType !== "certification";
  const matchField = isEntrance
    ? "batches.entranceExamTemplateId"
    : "batches.certificationExamTemplateId";
  const unsetField = isEntrance
    ? "batches.$[elem].entranceExamTemplateId"
    : "batches.$[elem].certificationExamTemplateId";
  await InternshipModel.updateMany(
    { [matchField]: res._id },
    { $unset: { [unsetField]: "" } },
    {
      arrayFilters: [
        {
          [`elem.${isEntrance ? "entranceExamTemplateId" : "certificationExamTemplateId"}`]:
            res._id,
        },
      ],
    },
  );
}
