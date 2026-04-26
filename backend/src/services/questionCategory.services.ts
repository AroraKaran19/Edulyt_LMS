import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { QuestionCategoryModel } from "../models/questionCategory.schema";
import { QuestionCategory } from "../types/questionCategory";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type QuestionCategoryRow = {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function serialize(doc: Record<string, unknown>): QuestionCategoryRow {
  return {
    _id: String(doc._id),
    name: String(doc.name ?? ""),
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt as Date | string | undefined,
    updatedAt: doc.updatedAt as Date | string | undefined,
  };
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createQuestionCategoryService(
  name: string,
  createdBy: mongoose.Types.ObjectId
): Promise<QuestionCategoryRow> {
  if (!name?.trim()) {
    throw new AppError("Category name is required", 400);
  }

  const existing = await QuestionCategoryModel.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
  }).lean();

  if (existing) {
    throw new AppError("A category with this name already exists", 409);
  }

  const doc = await QuestionCategoryModel.create({
    name: name.trim(),
    createdBy,
    isActive: true,
  });

  return serialize(doc.toObject() as unknown as Record<string, unknown>);
}

// ─── List (admin) ─────────────────────────────────────────────────────────────

export async function listQuestionCategoriesService(opts: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}): Promise<{
  categories: QuestionCategoryRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (opts.isActive !== undefined) {
    filter.isActive = opts.isActive;
  }
  if (opts.search?.trim()) {
    filter.name = new RegExp(escapeRegex(opts.search.trim()), "i");
  }

  const [total, docs] = await Promise.all([
    QuestionCategoryModel.countDocuments(filter),
    QuestionCategoryModel.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    categories: (docs as Record<string, unknown>[]).map(serialize),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ─── Get by ID ────────────────────────────────────────────────────────────────

export async function getQuestionCategoryByIdService(
  id: string
): Promise<QuestionCategoryRow> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category id", 400);
  }
  const doc = await QuestionCategoryModel.findById(id).lean();
  if (!doc) {
    throw new AppError("Question category not found", 404);
  }
  return serialize(doc as Record<string, unknown>);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateQuestionCategoryService(
  id: string,
  updates: { name?: string; isActive?: boolean }
): Promise<QuestionCategoryRow> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category id", 400);
  }
  if (!updates.name?.trim() && updates.isActive === undefined) {
    throw new AppError("Provide at least name or isActive to update", 400);
  }

  const set: Record<string, unknown> = {};
  if (updates.name?.trim()) {
    // Guard duplicate name (excluding current doc)
    const conflict = await QuestionCategoryModel.findOne({
      _id: { $ne: new mongoose.Types.ObjectId(id) },
      name: { $regex: new RegExp(`^${escapeRegex(updates.name.trim())}$`, "i") },
    }).lean();
    if (conflict) {
      throw new AppError("A category with this name already exists", 409);
    }
    set.name = updates.name.trim();
  }
  if (updates.isActive !== undefined) {
    set.isActive = updates.isActive;
  }

  const updated = await QuestionCategoryModel.findByIdAndUpdate(
    id,
    { $set: set },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw new AppError("Question category not found", 404);
  }
  return serialize(updated as Record<string, unknown>);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteQuestionCategoryService(
  id: string
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category id", 400);
  }
  const res = await QuestionCategoryModel.findByIdAndDelete(id);
  if (!res) {
    throw new AppError("Question category not found", 404);
  }
}
