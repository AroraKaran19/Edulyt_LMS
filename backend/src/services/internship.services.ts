import mongoose from "mongoose";
import { InternshipModel } from "../models/internship.schema";
import {
  Internship,
  InternshipAnalytics,
  InternshipBatchPlan,
  InternshipBatches,
  InternshipPublicListing,
  InternshipResponse,
  ListPublicInternshipsResult,
} from "../types/internship";
import type { CourseDiscount, Discount } from "../types";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const emptyInternshipAnalytics = (): InternshipAnalytics => ({
  totalRatings: 0,
  totalReviews: 0,
  totalEnrollments: 0,
  averageRating: 0,
});

function normalizeInternshipAnalytics(raw: unknown): InternshipAnalytics {
  const d = emptyInternshipAnalytics();
  if (!raw || typeof raw !== "object") return d;
  const a = raw as Record<string, unknown>;
  return {
    totalRatings: typeof a.totalRatings === "number" ? a.totalRatings : 0,
    totalReviews: typeof a.totalReviews === "number" ? a.totalReviews : 0,
    totalEnrollments:
      typeof a.totalEnrollments === "number" ? a.totalEnrollments : 0,
    averageRating: typeof a.averageRating === "number" ? a.averageRating : 0,
  };
}

/** Slim row for public list / carousel — avoids perks, SEO blobs, full batch plans, etc. */
function mapLeanDocToPublicListing(
  doc: Record<string, unknown>,
): InternshipPublicListing {
  const batchesRaw = Array.isArray(doc.batches) ? doc.batches : [];
  const batches = batchesRaw.map((b) => {
    const row = b as Record<string, unknown>;
    const plan = row.plan as Record<string, unknown> | null | undefined;
    return {
      _id: row._id != null ? String(row._id) : undefined,
      isActive: row.isActive !== false,
      plan:
        plan && typeof plan === "object"
          ? {
              price:
                typeof plan.price === "number" && !Number.isNaN(plan.price)
                  ? plan.price
                  : 0,
            }
          : undefined,
    };
  });

  let planLegacy: InternshipPublicListing["plan"];
  const rootPlan = doc.plan;
  if (rootPlan != null && typeof rootPlan === "object") {
    const o = rootPlan as Record<string, unknown>;
    planLegacy = {
      price:
        typeof o.price === "number" && !Number.isNaN(o.price)
          ? o.price
          : undefined,
      discount: o.discount as Discount | undefined,
    };
  } else {
    planLegacy = undefined;
  }

  return {
    _id: doc._id != null ? String(doc._id) : undefined,
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    thumbnail: String(doc.thumbnail ?? ""),
    analytics: normalizeInternshipAnalytics(doc.analytics),
    mentors: Array.isArray(doc.mentors)
      ? (doc.mentors as InternshipPublicListing["mentors"])
      : [],
    batches,
    discount:
      doc.discount != null && typeof doc.discount === "object"
        ? (doc.discount as CourseDiscount)
        : undefined,
    plan: planLegacy,
  };
}

function normalizeInternshipBatchPlan(
  raw: unknown,
): InternshipBatchPlan | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const p = raw as Record<string, unknown>;
  const features = Array.isArray(p.features)
    ? p.features.map((f) => {
        const x = f as Record<string, unknown>;
        return {
          title: String(x?.title ?? ""),
          provided: Boolean(x?.provided),
          showHover:
            typeof x?.showHover === "string"
              ? x.showHover
              : String(x?.showHover ?? ""),
        };
      })
    : [];
  return {
    title: String(p.title ?? ""),
    price: typeof p.price === "number" && !Number.isNaN(p.price) ? p.price : 0,
    features:
      features.length > 0
        ? features
        : [{ title: "", provided: true, showHover: "" }],
    discount: p.discount as InternshipBatchPlan["discount"],
    isPopular: Boolean(p.isPopular),
    isActive: p.isActive !== false,
  };
}

function normalizeBatchDoc(
  b: Record<string, unknown>,
  legacyRootPlan?: Record<string, unknown> | null,
  batchIndex = 0,
): InternshipBatches {
  const row: InternshipBatches = {
    name: String(b.name ?? ""),
    applicationLastDate: b.applicationLastDate as Date,
    examDate: b.examDate as Date,
    internshipStartDate: b.internshipStartDate as Date,
    status:
      b.status === "inactive" ||
      b.status === "completed" ||
      b.status === "active"
        ? (b.status as InternshipBatches["status"])
        : "active",
    createdBy: String(b.createdBy ?? ""),
    isActive: Boolean(b.isActive ?? true),
  };
  if (b._id != null) row._id = String(b._id);
  if (Array.isArray(b.reviews)) {
    row.reviews = b.reviews.map((id) => String(id));
  }
  if (b.analytics != null && typeof b.analytics === "object") {
    row.analytics = normalizeInternshipAnalytics(b.analytics);
  }
  const planSource =
    b.plan != null && typeof b.plan === "object"
      ? b.plan
      : legacyRootPlan && batchIndex === 0
        ? legacyRootPlan
        : undefined;
  if (planSource != null) {
    const normalized = normalizeInternshipBatchPlan(planSource);
    if (normalized) row.plan = normalized;
  }
  return row;
}

/**
 * Embedded `batchSchema` requires `createdBy` on each item. The client does not send it;
 * it is set from the authenticated admin (`createInternship` / `updateInternship` controllers).
 */
const withBatchCreatedBy = (
  batches: Partial<Internship["batches"][number]>[] | undefined,
  userId: string,
): Internship["batches"] => {
  const list = Array.isArray(batches) ? batches : [];
  return list.map((b) => ({
    ...b,
    createdBy: userId,
  })) as Internship["batches"];
};

export interface ListInternshipsResult {
  internships: InternshipResponse[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Normalize mongoose doc to clean Internship type.
 * Relations are ObjectId strings; embedded batches stay as-is.
 */
const toInternship = (doc: Record<string, unknown>): Internship => {
  const legacyRootPlan =
    doc.plan != null && typeof doc.plan === "object"
      ? (doc.plan as Record<string, unknown>)
      : null;
  return {
    _id: doc._id != null ? String(doc._id) : undefined,
    title: String(doc.title ?? ""),
    description: String(doc.description ?? ""),
    thumbnail: String(doc.thumbnail ?? ""),
    certification: Boolean(doc.certification),
    brochure: String(doc.brochure ?? ""),
    mode: (doc.mode as "online" | "offline" | "hybrid") ?? "online",
    perks: Array.isArray(doc.perks) ? doc.perks : [],
    features: Array.isArray(doc.features) ? doc.features : [],
    whyJoin: Array.isArray(doc.whyJoin) ? doc.whyJoin : [],
    preRequisites: Array.isArray(doc.preRequisites) ? doc.preRequisites : [],
    whoCanJoin: Array.isArray(doc.whoCanJoin) ? doc.whoCanJoin : [],
    internshipJourney: Array.isArray(doc.internshipJourney)
      ? doc.internshipJourney
      : [],
    batches: Array.isArray(doc.batches)
      ? doc.batches.map((b, i) =>
          normalizeBatchDoc(
            b as unknown as Record<string, unknown>,
            legacyRootPlan,
            i,
          ),
        )
      : [],
    testimonials: Array.isArray(doc.testimonials)
      ? doc.testimonials.map((t) => String(t))
      : [],
    partnerColleges: Array.isArray(doc.partnerColleges)
      ? doc.partnerColleges.map((p) => String(p))
      : [],
    faqs: Array.isArray(doc.faqs) ? doc.faqs.map((f) => String(f)) : [],
    mentors: Array.isArray(doc.mentors)
      ? doc.mentors.map((m) => String(m))
      : [],
    media: Array.isArray(doc.media) ? doc.media : [],
    slug: String(doc.slug ?? ""),
    metaTitle: doc.metaTitle != null ? String(doc.metaTitle) : undefined,
    metaDescription:
      doc.metaDescription != null ? String(doc.metaDescription) : undefined,
    keywords: Array.isArray(doc.keywords) ? doc.keywords : [],
    headerList: Array.isArray(doc.headerList)
      ? (doc.headerList as unknown[]).map((s) => String(s)).filter(Boolean)
      : [],
    audience:
      (doc.audience as "college-students" | "professionals") ??
      "college-students",
    featured: Boolean(doc.featured),
    discount:
      doc.discount != null && typeof doc.discount === "object"
        ? (doc.discount as CourseDiscount)
        : undefined,
    analytics: normalizeInternshipAnalytics(doc.analytics),
    isActive: Boolean(doc.isActive),
    createdAt: doc.createdAt as Date | undefined,
    updatedAt: doc.updatedAt as Date | undefined,
    createdBy: doc.createdBy != null ? String(doc.createdBy) : "",
  } as Internship;
};

/**
 * Build search filter: each word must match title OR description OR slug.
 * Multiple words use AND logic.
 */
const buildSearchFilter = (
  search?: string,
): mongoose.FilterQuery<Internship> => {
  if (!search?.trim()) return {};
  const words = search
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  if (words.length === 0) return {};

  const fields = ["title", "description", "slug"] as const;

  const perWord = words.map((word) => {
    const rx = escapeRegex(word);
    return {
      $or: fields.map((field) => ({
        [field]: { $regex: rx, $options: "i" as const },
      })),
    };
  });

  if (perWord.length === 1) {
    return perWord[0] as mongoose.FilterQuery<Internship>;
  }
  return { $and: perWord } as mongoose.FilterQuery<Internship>;
};

const totalPages = (total: number, limit: number) =>
  Math.max(0, Math.ceil(total / limit));

/**
 * Public list: active internships only, paginated + search.
 */
export const listInternshipsPublicService = async (
  page: number,
  limit: number,
  search?: string,
  audience?: "college-students" | "professionals",
): Promise<ListPublicInternshipsResult> => {
  const skip = (page - 1) * limit;
  const searchFilter = buildSearchFilter(search);
  const filters: mongoose.FilterQuery<Internship> = {
    isActive: true,
    ...searchFilter,
  };
  if (audience) {
    filters.audience = audience;
  }

  const total = await InternshipModel.countDocuments(filters);
  const docs = await InternshipModel.find(filters)
    .select({
      title: 1,
      slug: 1,
      thumbnail: 1,
      analytics: 1,
      batches: 1,
      plan: 1,
      discount: 1,
      mentors: 1,
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate(
      "mentors",
      "-password -refreshTokens -permissions -accounts -phone -whatsappNumber -address -dob -reviews -ownedCourses -previousExperience",
    )
    .lean();

  return {
    internships: (docs as unknown as Record<string, unknown>[]).map(
      mapLeanDocToPublicListing,
    ),
    total,
    page,
    totalPages: totalPages(total, limit),
  };
};

/**
 * Public list: active, featured internships only (marketing).
 */
export const listFeaturedInternshipsPublicService = async (
  page: number,
  limit: number,
  search?: string,
  audience?: "college-students" | "professionals",
): Promise<ListPublicInternshipsResult> => {
  const skip = (page - 1) * limit;
  const searchFilter = buildSearchFilter(search);
  const filters: mongoose.FilterQuery<Internship> = {
    isActive: true,
    featured: true,
    ...searchFilter,
  };
  if (audience) {
    filters.audience = audience;
  }

  const total = await InternshipModel.countDocuments(filters);
  const docs = await InternshipModel.find(filters)
    .select({
      title: 1,
      slug: 1,
      thumbnail: 1,
      analytics: 1,
      batches: 1,
      plan: 1,
      discount: 1,
      mentors: 1,
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate(
      "mentors",
      "-password -refreshTokens -permissions -accounts -phone -whatsappNumber -address -dob -reviews -ownedCourses -previousExperience",
    )
    .lean();

  return {
    internships: (docs as unknown as Record<string, unknown>[]).map(
      mapLeanDocToPublicListing,
    ),
    total,
    page,
    totalPages: totalPages(total, limit),
  };
};

/**
 * Admin list: all internships with filters (isActive, audience, search, featured).
 */
export const listInternshipsAdminService = async (
  page: number,
  limit: number,
  search?: string,
  isActive?: boolean,
  audience?: "college-students" | "professionals",
  featured?: boolean,
): Promise<ListInternshipsResult> => {
  const skip = (page - 1) * limit;
  const searchFilter = buildSearchFilter(search);
  const filters: mongoose.FilterQuery<Internship> = { ...searchFilter };

  if (typeof isActive === "boolean") {
    filters.isActive = isActive;
  }
  if (audience) {
    filters.audience = audience;
  }
  if (typeof featured === "boolean") {
    filters.featured = featured;
  }

  const total = await InternshipModel.countDocuments(filters);
  const docs = await InternshipModel.find(filters)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("testimonials", "name currentRole feedback verified")
    .populate("partnerColleges", "name location website image")
    .populate("faqs", "question answer")
    .populate(
      "mentors",
      "-password -refreshTokens -permissions -accounts -phone -whatsappNumber -address -dob -reviews -ownedCourses -previousExperience",
    )
    .populate("createdBy", "name email")
    .lean();

  return {
    internships: (docs as unknown as Record<string, unknown>[]).map(
      (doc) => doc as unknown as InternshipResponse,
    ),
    total,
    page,
    totalPages: totalPages(total, limit),
  };
};

/**
 * Get internship by ID (admin, with populated relations).
 */
export const getInternshipByIdAdminService = async (
  id: string,
): Promise<InternshipResponse | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await InternshipModel.findById(id)
    .populate("testimonials", "name currentRole feedback verified")
    .populate("partnerColleges", "name location website image")
    .populate("faqs", "question answer")
    .populate(
      "mentors",
      "-password -refreshTokens -permissions -accounts -phone -whatsappNumber -address -dob -reviews -ownedCourses -previousExperience",
    )
    .populate("createdBy", "name email")
    .lean();
  if (!doc) return null;
  return doc as unknown as InternshipResponse;
};

/**
 * Get internship by slug (public, with populated relations).
 */
export const getInternshipBySlugService = async (
  slug: string,
): Promise<InternshipResponse | null> => {
  const doc = await InternshipModel.findOne({ slug, isActive: true })
    .populate("testimonials", "name currentRole feedback verified")
    .populate("partnerColleges", "name location website image")
    .populate("faqs", "question answer")
    .populate(
      "mentors",
      "-password -refreshTokens -permissions -accounts -phone -whatsappNumber -address -dob -reviews -ownedCourses -previousExperience",
    )
    .populate("createdBy", "firstName lastName email")
    .lean();
  if (!doc) return null;
  return doc as unknown as InternshipResponse;
};

/**
 * Check slug availability (for uniqueness checks).
 */
export const checkSlugAvailabilityService = async (
  slug: string,
  excludeId?: string,
): Promise<{ available: boolean; message: string }> => {
  const filters: mongoose.FilterQuery<Internship> = { slug };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    filters._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }
  const existing = await InternshipModel.findOne(filters).lean();
  if (existing) {
    return {
      available: false,
      message: "Slug is already in use",
    };
  }
  return {
    available: true,
    message: "Slug is available",
  };
};

/**
 * Create internship (metadata + batches).
 */
export const createInternshipService = async (
  data: Partial<Internship>,
  createdBy: string,
): Promise<Internship> => {
  const { batches, ...rest } = data;
  const doc = await InternshipModel.create({
    ...rest,
    batches: withBatchCreatedBy(batches, createdBy),
    createdBy,
  });
  return toInternship(doc.toObject() as unknown as Record<string, unknown>);
};

/**
 * Update internship (admin).
 */
export const updateInternshipService = async (
  id: string,
  data: Partial<Internship>,
  actingUserId?: string,
): Promise<InternshipResponse | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  let payload: Partial<Internship> = { ...data };
  if (Array.isArray(data.batches) && actingUserId) {
    const existing = await InternshipModel.findById(id)
      .select("batches")
      .lean();
    const prev = existing?.batches ?? [];
    payload = {
      ...data,
      batches: data.batches.map((b, i) => {
        const prior = prev[i] as { createdBy?: unknown } | undefined;
        const existingId =
          prior?.createdBy != null ? String(prior.createdBy) : undefined;
        return {
          ...b,
          createdBy: existingId ?? actingUserId,
        };
      }) as Internship["batches"],
    };
  }

  const doc = await InternshipModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .populate("testimonials", "name currentRole feedback verified")
    .populate("partnerColleges", "name location website image")
    .populate("faqs", "question answer")
    .populate(
      "mentors",
      "-password -refreshTokens -permissions -accounts -phone -whatsappNumber -address -dob -reviews -ownedCourses -previousExperience",
    )
    .populate("createdBy", "name email")
    .lean();
  if (!doc) return null;
  return doc as unknown as InternshipResponse;
};

/**
 * Delete internship (admin).
 */
export const deleteInternshipService = async (id: string): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const res = await InternshipModel.findByIdAndDelete(id);
  return !!res;
};
