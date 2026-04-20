import mongoose from "mongoose";
import { InternshipQuestionModel } from "../models/internshipQuestion.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { AppError } from "../middlewares/error.middleware";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type CreateInternshipQuestionBody = {
  questionText: string;
  type: "mcq" | "file_upload";
  usageType: "exam" | "task" | "both";
  score: number;
  isActive?: boolean;
  options?: { text: string; isCorrect: boolean }[];
  referenceFile?: string;
};

export type InternshipQuestionDetail = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
  referenceFile?: string;
  options?: { _id?: string; text: string; isCorrect: boolean }[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function serializeQuestionDoc(doc: Record<string, unknown>): InternshipQuestionDetail {
  const type = String(doc.type ?? "");
  const base: InternshipQuestionDetail = {
    _id: String(doc._id),
    questionText: String(doc.questionText ?? ""),
    type,
    usageType: String(doc.usageType ?? ""),
    score: typeof doc.score === "number" ? doc.score : 0,
    isActive: doc.isActive !== false,
    referenceFile:
      typeof doc.referenceFile === "string" ? doc.referenceFile : "",
    createdAt: doc.createdAt as Date | string | undefined,
    updatedAt: doc.updatedAt as Date | string | undefined,
  };
  if (type === "mcq" && Array.isArray(doc.options)) {
    base.options = (doc.options as Record<string, unknown>[]).map((opt) => ({
      _id: opt._id != null ? String(opt._id) : undefined,
      text: String(opt.text ?? ""),
      isCorrect: !!opt.isCorrect,
    }));
  }
  return base;
}

function buildQuestionUpdateFields(
  body: CreateInternshipQuestionBody,
): Record<string, unknown> {
  const { questionText, type, usageType } = body;
  const rawScore = body.score as unknown;
  const score =
    typeof rawScore === "number"
      ? rawScore
      : typeof rawScore === "string"
        ? parseFloat(rawScore)
        : NaN;
  if (!questionText?.trim()) {
    throw new AppError("questionText is required", 400);
  }
  if (!["mcq", "file_upload"].includes(type)) {
    throw new AppError("type must be mcq or file_upload", 400);
  }
  if (!["exam", "task", "both"].includes(usageType)) {
    throw new AppError("usageType must be exam, task, or both", 400);
  }
  if (Number.isNaN(score) || score < 0) {
    throw new AppError("score must be a non-negative number", 400);
  }

  const doc: Record<string, unknown> = {
    questionText: questionText.trim(),
    type,
    usageType,
    score,
    isActive: body.isActive !== false,
  };

  if (type === "mcq") {
    const opts = body.options ?? [];
    if (opts.length < 2) {
      throw new AppError("MCQ requires at least two options", 400);
    }
    if (!opts.some((o) => o.isCorrect)) {
      throw new AppError("MCQ requires at least one correct option", 400);
    }
    for (const o of opts) {
      if (!o?.text?.trim()) {
        throw new AppError("Each MCQ option needs non-empty text", 400);
      }
    }
    doc.options = opts.map((o) => ({
      text: String(o.text).trim(),
      isCorrect: !!o.isCorrect,
    }));
    doc.referenceFile = "";
  } else {
    doc.options = [];
    doc.referenceFile =
      typeof body.referenceFile === "string"
        ? body.referenceFile.trim()
        : "";
  }
  return doc;
}

export async function getInternshipQuestionByIdAdmin(
  id: string,
): Promise<InternshipQuestionDetail> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid question id", 400);
  }
  const doc = await InternshipQuestionModel.findById(id).lean();
  if (!doc) {
    throw new AppError("Question not found", 404);
  }
  return serializeQuestionDoc(doc as Record<string, unknown>);
}

export async function updateInternshipQuestionAdmin(
  id: string,
  body: CreateInternshipQuestionBody,
): Promise<InternshipQuestionDetail> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid question id", 400);
  }
  const fields = buildQuestionUpdateFields(body);
  const updated = await InternshipQuestionModel.findByIdAndUpdate(
    id,
    { $set: fields },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) {
    throw new AppError("Question not found", 404);
  }
  return serializeQuestionDoc(updated as Record<string, unknown>);
}

export async function deleteInternshipQuestionAdmin(id: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid question id", 400);
  }
  const oid = new mongoose.Types.ObjectId(id);
  const [inExam, inTask] = await Promise.all([
    InternshipExamModel.exists({ questions: oid }),
    InternshipTaskModel.exists({ questions: oid }),
  ]);
  if (inExam || inTask) {
    throw new AppError(
      "This question is linked to an exam or task template. Remove it from those templates before deleting.",
      400,
    );
  }
  const res = await InternshipQuestionModel.findByIdAndDelete(id);
  if (!res) {
    throw new AppError("Question not found", 404);
  }
}

export async function createInternshipQuestionAdmin(
  body: CreateInternshipQuestionBody,
  createdBy: mongoose.Types.ObjectId,
): Promise<{
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
}> {
  const fields = buildQuestionUpdateFields(body);
  const doc = { ...fields, createdBy };
  const created = await InternshipQuestionModel.create(doc);
  return {
    _id: String(created._id),
    questionText: String(created.questionText ?? ""),
    type: String(created.type ?? ""),
    usageType: String(created.usageType ?? ""),
    score: typeof created.score === "number" ? created.score : 0,
    isActive: created.isActive !== false,
  };
}

export async function listInternshipQuestionsAdmin(
  page: number,
  limit: number,
  search?: string,
  questionType?: "mcq" | "file_upload",
  /** When set, only questions usable for that context (includes `both`). */
  usageFor?: "task" | "exam",
): Promise<{
  questions: {
    _id: string;
    questionText: string;
    type: string;
    usageType: string;
    score: number;
    isActive: boolean;
    updatedAt?: Date | string;
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
    filter.questionText = new RegExp(escapeRegex(search.trim()), "i");
  }
  if (questionType === "mcq" || questionType === "file_upload") {
    filter.type = questionType;
  }
  if (usageFor === "task") {
    filter.usageType = { $in: ["task", "both"] };
  } else if (usageFor === "exam") {
    filter.usageType = { $in: ["exam", "both"] };
  }

  const total = await InternshipQuestionModel.countDocuments(filter);
  const rows = await InternshipQuestionModel.find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(l)
    .select("questionText type usageType score isActive updatedAt")
    .lean();

  return {
    questions: rows.map((r) => ({
      _id: String(r._id),
      questionText: String(r.questionText ?? ""),
      type: String(r.type ?? ""),
      usageType: String(r.usageType ?? ""),
      score: typeof r.score === "number" ? r.score : 0,
      isActive: r.isActive !== false,
      updatedAt: r.updatedAt,
    })),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}
