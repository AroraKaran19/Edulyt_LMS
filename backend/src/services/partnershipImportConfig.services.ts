import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { PartnershipImportConfigModel } from "../models/partnershipImportConfig.schema";
import type {
  PartnershipImportConfig,
  PartnershipImportKind,
} from "../types/partnershipImportConfig";
import type {
  CollaborationBenefit,
  CollaborationCheckoutResolve,
} from "../types/collaborationDomain";
import { CollaborationWhitelistModel } from "../models/collaborationWhitelist.schema";

function toCourseObjectIds(ids: unknown): mongoose.Types.ObjectId[] {
  if (!Array.isArray(ids)) return [];
  const out: mongoose.Types.ObjectId[] = [];
  for (const id of ids) {
    const s = String(id);
    if (mongoose.Types.ObjectId.isValid(s)) {
      out.push(new mongoose.Types.ObjectId(s));
    }
  }
  return out;
}

function sanitizeConfigForApi(
  doc: PartnershipImportConfig | null
): PartnershipImportConfig | null {
  if (!doc) return null;
  if (doc.kind === "discount") {
    return {
      ...doc,
      enrollmentAccess: undefined,
      benefit: doc.benefit,
      courses: doc.courses ?? [],
    };
  }
  return {
    ...doc,
    benefit: undefined,
    enrollmentAccess: doc.enrollmentAccess,
    courses: doc.courses ?? [],
  };
}

export async function listPartnershipImportConfigsService(
  page = 1,
  limit = 20,
  search = "",
  isActive?: boolean
): Promise<{
  configs: PartnershipImportConfig[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const skip = (page - 1) * limit;
  const filters: Record<string, unknown> = {};
  if (typeof isActive === "boolean") {
    filters.isActive = isActive;
  }
  if (search.trim()) {
    filters.title = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  const [total, raw] = await Promise.all([
    PartnershipImportConfigModel.countDocuments(filters),
    PartnershipImportConfigModel.find(filters)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const configs = raw
    .map((d) => sanitizeConfigForApi(d as PartnershipImportConfig))
    .filter((d): d is PartnershipImportConfig => d !== null);

  return {
    configs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

const COURSE_POPULATE = {
  path: "courses" as const,
  select: "title audience",
};

export async function getPartnershipImportConfigByIdService(
  id: string
): Promise<PartnershipImportConfig | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const doc = await PartnershipImportConfigModel.findById(id)
    .populate(COURSE_POPULATE)
    .lean();
  return sanitizeConfigForApi(doc as PartnershipImportConfig | null);
}

export async function createPartnershipImportConfigService(
  data: Partial<PartnershipImportConfig>,
  createdBy?: string
): Promise<PartnershipImportConfig> {
  if (!data.title?.trim()) {
    throw new AppError("title is required", 400);
  }
  if (!data.kind || (data.kind !== "course_allot" && data.kind !== "discount")) {
    throw new AppError("kind must be course_allot or discount", 400);
  }

  const doc = new PartnershipImportConfigModel({
    title: data.title.trim(),
    kind: data.kind as PartnershipImportKind,
    isActive: data.isActive !== false,
    courses: toCourseObjectIds(data.courses),
    enrollmentAccess:
      data.kind === "course_allot" ? data.enrollmentAccess : undefined,
    benefit: data.kind === "discount" ? data.benefit : undefined,
    createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
  });

  const saved = await doc.save();
  const populated = await PartnershipImportConfigModel.findById(saved._id)
    .populate(COURSE_POPULATE)
    .lean();
  return sanitizeConfigForApi(
    populated as PartnershipImportConfig | null
  ) as PartnershipImportConfig;
}

export async function updatePartnershipImportConfigService(
  id: string,
  data: Partial<PartnershipImportConfig>
): Promise<PartnershipImportConfig | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid config ID", 400);
  }

  const existing = await PartnershipImportConfigModel.findById(id);
  if (!existing) {
    throw new AppError("Partnership import config not found", 404);
  }

  const nextKind = (data.kind ?? existing.kind) as PartnershipImportKind;

  const updatePayload: Record<string, unknown> = {};

  if (data.title !== undefined) updatePayload.title = data.title.trim();
  if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
  if (data.kind !== undefined) updatePayload.kind = data.kind;

  if (nextKind === "discount") {
    updatePayload.enrollmentAccess = undefined;
    if (data.benefit !== undefined) {
      updatePayload.benefit = data.benefit;
    }
    if (data.courses !== undefined) {
      updatePayload.courses = toCourseObjectIds(data.courses);
    }
  } else {
    updatePayload.benefit = undefined;
    if (data.courses !== undefined) updatePayload.courses = data.courses;
    if (data.enrollmentAccess !== undefined) {
      updatePayload.enrollmentAccess = data.enrollmentAccess;
    }
  }

  const updated = await PartnershipImportConfigModel.findByIdAndUpdate(
    id,
    { $set: updatePayload },
    { new: true, runValidators: true }
  )
    .populate(COURSE_POPULATE)
    .lean();

  return sanitizeConfigForApi(updated as PartnershipImportConfig | null);
}

export async function deletePartnershipImportConfigService(
  id: string
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid config ID", 400);
  }

  const oid = new mongoose.Types.ObjectId(id);
  await CollaborationWhitelistModel.deleteMany({
    partnershipImportConfigId: oid,
  });

  const res = await PartnershipImportConfigModel.findByIdAndDelete(id);
  return !!res;
}

/**
 * Checkout: discount from CSV partnership import (user must have benefit_applied row).
 */
export async function resolvePartnershipImportDiscountForCheckoutService(
  email: string | undefined,
  courseIds: string[] = []
): Promise<CollaborationCheckoutResolve> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) {
    return { applies: false };
  }

  const wanted = new Set(courseIds.map(String).filter(Boolean));
  if (wanted.size === 0) {
    return { applies: false };
  }

  const entries = await CollaborationWhitelistModel.find({
    email: trimmed,
    status: "benefit_applied",
    isActive: true,
  })
    .select("partnershipImportConfigId")
    .lean();

  if (!entries.length) {
    return { applies: false };
  }

  for (const e of entries) {
    const cfg = await PartnershipImportConfigModel.findOne({
      _id: e.partnershipImportConfigId,
      isActive: true,
      kind: "discount",
    })
      .select("title benefit courses")
      .lean();

    if (!cfg?.benefit) continue;

    const allowed = new Set(
      (cfg.courses ?? []).map((c: unknown) => String(c))
    );
    const appliesToCourse = [...wanted].some((id) => allowed.has(id));
    if (!appliesToCourse) continue;

    const benefit = cfg.benefit as CollaborationBenefit;
    return {
      applies: true,
      partnershipImportConfigId: String(cfg._id),
      title: cfg.title,
      benefit,
      enrollmentAccess: undefined,
      collaborationDomainId: undefined,
    };
  }

  return { applies: false };
}
