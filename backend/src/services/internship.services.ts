import mongoose from "mongoose";
import { InternshipModel } from "../models/internship.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
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
import { AppError } from "../middlewares/error.middleware";
import { isApplicationWindowOpenIst } from "../utils/applicationWindow";
import { calculateFinalDiscountedPrice } from "../utils/lib/calculateDiscount";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function coerceDocumentationDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const d = new Date(typeof v === "string" || typeof v === "number" ? v : String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Every batch must have a valid post-result documentation window (IST stored as UTC). */
function assertDocumentationSubmissionWindow(
  start: unknown,
  end: unknown,
  context?: string,
): void {
  const s = coerceDocumentationDate(start);
  const e = coerceDocumentationDate(end);
  const prefix = context ? `${context}: ` : "";
  if (!s || !e) {
    throw new AppError(
      `${prefix}Documentation submission window (start and end) is required.`,
      400,
    );
  }
  if (e.getTime() <= s.getTime()) {
    throw new AppError(
      `${prefix}Documentation submission end must be after start.`,
      400,
    );
  }
}

/** Validate the documentation window of every batch in the payload. */
function assertBatchDocumentationWindows(
  batches: Internship["batches"] | undefined,
): void {
  if (!Array.isArray(batches)) return;
  batches.forEach((b, i) => {
    const label =
      typeof (b as { name?: unknown }).name === "string" &&
      (b as { name: string }).name.trim()
        ? `Batch "${(b as { name: string }).name.trim()}"`
        : `Batch ${i + 1}`;
    assertDocumentationSubmissionWindow(
      (b as { documentationStartAt?: unknown }).documentationStartAt,
      (b as { documentationEndAt?: unknown }).documentationEndAt,
      label,
    );
  });
}

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
    let internshipStartDate: string | undefined;
    const rawStart = row.internshipStartDate;
    if (rawStart instanceof Date) {
      internshipStartDate = rawStart.toISOString();
    } else if (typeof rawStart === "string" && rawStart.length > 0) {
      const d = new Date(rawStart);
      internshipStartDate = Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    }

    return {
      _id: row._id != null ? String(row._id) : undefined,
      isActive: row.isActive !== false,
      internshipStartDate,
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
  return {
    price: typeof p.price === "number" && !Number.isNaN(p.price) ? p.price : 0,
    discount: p.discount as InternshipBatchPlan["discount"],
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
  const batchAny = b as {
    entranceExamTemplateId?: unknown;
    entranceExamStartAt?: unknown;
    entranceExamEndAt?: unknown;
    certificationExamTemplateId?: unknown;
  };
  if (batchAny.entranceExamTemplateId != null) {
    row.entranceExamTemplateId = String(batchAny.entranceExamTemplateId);
  }
  if (batchAny.entranceExamStartAt != null) {
    const d = new Date(batchAny.entranceExamStartAt as string | Date);
    if (!Number.isNaN(d.getTime())) row.entranceExamStartAt = d;
  }
  if (batchAny.entranceExamEndAt != null) {
    const d = new Date(batchAny.entranceExamEndAt as string | Date);
    if (!Number.isNaN(d.getTime())) row.entranceExamEndAt = d;
  }
  if (batchAny.certificationExamTemplateId != null) {
    row.certificationExamTemplateId = String(batchAny.certificationExamTemplateId);
  }
  if (Array.isArray(b.taskTemplateIds)) {
    row.taskTemplateIds = b.taskTemplateIds.map((id) => String(id));
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
    certificationThreshold:
      typeof doc.certificationThreshold === "number" &&
      !Number.isNaN(doc.certificationThreshold)
        ? Math.max(0, doc.certificationThreshold)
        : 0,
    brochure: String(doc.brochure ?? ""),
    jobDescription: doc.jobDescription != null ? String(doc.jobDescription) : "",
    whatsappGroupLink:
      doc.whatsappGroupLink != null ? String(doc.whatsappGroupLink) : "",
    offerLetterDesignation:
      doc.offerLetterDesignation != null
        ? String(doc.offerLetterDesignation)
        : "",
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
 * Public list: active internships where the given user is a mentor.
 * Backs the "Internships They Mentor" block on the public instructor /
 * mentor profile page. Unpaginated (capped) — an instructor only ever
 * mentors a handful of internships.
 */
export const listInternshipsByMentorService = async (
  mentorId: string,
): Promise<InternshipPublicListing[]> => {
  if (!mongoose.Types.ObjectId.isValid(mentorId)) return [];

  const docs = await InternshipModel.find({
    isActive: true,
    mentors: new mongoose.Types.ObjectId(mentorId),
  })
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
    .limit(24)
    .populate(
      "mentors",
      "-password -refreshTokens -permissions -accounts -phone -whatsappNumber -address -dob -reviews -ownedCourses -previousExperience",
    )
    .lean();

  return (docs as unknown as Record<string, unknown>[]).map(
    mapLeanDocToPublicListing,
  );
};

/**
 * Stats for a mentor's public profile: how many active internships they
 * mentor, and how many learners are currently `enrolled` across them.
 */
export const getMentorInternshipStatsService = async (
  mentorId: string,
): Promise<{ totalInternships: number; enrolledStudents: number }> => {
  if (!mongoose.Types.ObjectId.isValid(mentorId)) {
    return { totalInternships: 0, enrolledStudents: 0 };
  }

  const internshipDocs = await InternshipModel.find({
    isActive: true,
    mentors: new mongoose.Types.ObjectId(mentorId),
  })
    .select("_id")
    .lean();

  const totalInternships = internshipDocs.length;
  if (totalInternships === 0) {
    return { totalInternships: 0, enrolledStudents: 0 };
  }

  const enrolledStudents = await InternshipEnrollmentModel.countDocuments({
    internship: { $in: internshipDocs.map((d) => d._id) },
    status: "enrolled",
  });

  return { totalInternships, enrolledStudents };
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

/** Public enroll page: cohorts + entrance exam window (no admin auth). */
export type InternshipEnrollPreviewEntranceExam = {
  title: string;
  examStartAt: string | null;
  examEndAt: string | null;
  examResultAt: string | null;
};

export type InternshipEnrollPreviewBatch = {
  _id: string;
  name: string;
  applicationLastDate: string;
  internshipStartDate: string;
  status: string;
  isActive: boolean;
  entranceExam: InternshipEnrollPreviewEntranceExam | null;
  /** Set when the batch has an active `plan` (direct seat purchase). */
  plan?: { listPrice: number; amount: number };
};

export type InternshipEnrollPreview = {
  internship: {
    _id: string;
    title: string;
    slug: string;
    whatsappGroupLink?: string;
  };
  batches: InternshipEnrollPreviewBatch[];
};

const toIso = (d: unknown): string => {
  if (d == null) return "";
  const t = new Date(d as string | Date).getTime();
  if (Number.isNaN(t)) return "";
  return new Date(t).toISOString();
};

/**
 * Lean data for public enrollment: open batches with optional entrance exam windows.
 */
export const getInternshipEnrollPreviewService = async (
  slug: string,
): Promise<InternshipEnrollPreview | null> => {
  const doc = await InternshipModel.findOne({ slug, isActive: true })
    .select("title slug batches discount whatsappGroupLink")
    .lean();
  if (!doc || doc._id == null) return null;

  const batchesRaw = Array.isArray(doc.batches) ? doc.batches : [];
  const examIdSet = new Set<string>();
  for (const b of batchesRaw) {
    const br = b as Record<string, unknown>;
    if (br.entranceExamTemplateId != null) {
      const id = String(br.entranceExamTemplateId);
      if (mongoose.Types.ObjectId.isValid(id)) examIdSet.add(id);
    }
  }

  const examMap = new Map<string, { title: string; examResultAt?: Date }>();
  if (examIdSet.size > 0) {
    const exams = await InternshipExamModel.find({
      _id: { $in: [...examIdSet].map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select("title examResultAt")
      .lean();
    for (const e of exams) {
      const row = e as {
        _id: unknown;
        title?: string;
        examResultAt?: Date;
      };
      examMap.set(String(row._id), {
        title: String(row.title ?? "Entrance exam"),
        examResultAt: row.examResultAt,
      });
    }
  }

  const batches: InternshipEnrollPreviewBatch[] = [];
  for (const b of batchesRaw) {
    const br = b as Record<string, unknown>;
    const isActive = br.isActive !== false;
    const status =
      br.status === "inactive" ||
      br.status === "completed" ||
      br.status === "active"
        ? (br.status as string)
        : "active";
    if (!isActive || status !== "active") continue;
    if (br._id == null) continue;

    const appLast = br.applicationLastDate;
    if (
      !isApplicationWindowOpenIst(
        appLast as Date | string | null | undefined,
      )
    ) {
      continue;
    }

    const batchId = String(br._id);
    const eid =
      br.entranceExamTemplateId != null
        ? String(br.entranceExamTemplateId)
        : null;

    let entranceExam: InternshipEnrollPreviewEntranceExam | null = null;
    if (eid && examMap.has(eid)) {
      const ex = examMap.get(eid)!;
      const winStart = br.entranceExamStartAt;
      const winEnd = br.entranceExamEndAt;
      const startIso =
        winStart instanceof Date && !Number.isNaN(winStart.getTime())
          ? winStart.toISOString()
          : null;
      const endIso =
        winEnd instanceof Date && !Number.isNaN(winEnd.getTime())
          ? winEnd.toISOString()
          : null;
      entranceExam = {
        title: ex.title,
        examStartAt: startIso,
        examEndAt: endIso,
        examResultAt: ex.examResultAt ? ex.examResultAt.toISOString() : null,
      };
    }

    const planDoc = br.plan as InternshipBatchPlan | null | undefined;
    let plan:
      | { listPrice: number; amount: number }
      | undefined;
    if (planDoc && planDoc.isActive !== false) {
      const listPrice = Number(planDoc.price) || 0;
      const internshipDisc = (doc as { discount?: CourseDiscount | null })
        .discount;
      const amount = calculateFinalDiscountedPrice(
        listPrice,
        internshipDisc ?? null,
        planDoc.discount,
      );
      plan = { listPrice, amount };
    }

    batches.push({
      _id: batchId,
      name: String(br.name ?? "Cohort"),
      applicationLastDate: toIso(br.applicationLastDate),
      internshipStartDate: toIso(br.internshipStartDate),
      status,
      isActive,
      entranceExam,
      ...(plan ? { plan } : {}),
    });
  }

  return {
    internship: {
      _id: String(doc._id),
      title: String(doc.title ?? ""),
      slug: String((doc as { slug?: string }).slug ?? ""),
      whatsappGroupLink:
        (doc as { whatsappGroupLink?: string }).whatsappGroupLink != null
          ? String((doc as { whatsappGroupLink?: string }).whatsappGroupLink).trim()
          : "",
    },
    batches,
  };
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
  assertBatchDocumentationWindows(data.batches);
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

  const existingSnap = await InternshipModel.findById(id)
    .select("batches")
    .lean();
  if (!existingSnap) return null;

  let payload: Partial<Internship> = { ...data };
  if (Array.isArray(data.batches)) {
    // The documentation window is required on every batch in the payload.
    assertBatchDocumentationWindows(data.batches);
    if (actingUserId) {
      const prev = existingSnap.batches ?? [];
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

/**
 * Duplicate an internship (admin).
 * Creates a fully independent copy: new _id, new batch _ids, unique slug,
 * "Copy of …" title, isActive=false, zeroed analytics.
 */
export const duplicateInternshipService = async (
  id: string,
  createdBy: string,
): Promise<InternshipResponse> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid internship ID", 400);
  }

  const original = await InternshipModel.findById(id).lean();
  if (!original) throw new AppError("Internship not found", 404);

  // Build a unique slug: append -copy, then -copy-2, -copy-3 … until free
  const baseSlug = `${(original as any).slug}-copy`;
  let candidateSlug = baseSlug;
  let suffix = 2;
  while (await InternshipModel.exists({ slug: candidateSlug })) {
    candidateSlug = `${baseSlug}-${suffix++}`;
  }

  // Strip doc-level fields that must not carry over, then override
  const {
    _id,
    __v,
    createdAt,
    updatedAt,
    slug: _slug,
    isActive: _isActive,
    analytics: _analytics,
    batches: originalBatches,
    ...rest
  } = original as any;

  // Give each batch a fresh _id so they are independent subdocuments
  const batches = (originalBatches ?? []).map((b: any) => ({
    ...b,
    _id: new mongoose.Types.ObjectId(),
    analytics: { totalRatings: 0, totalReviews: 0, totalEnrollments: 0, averageRating: 0 },
    createdBy: new mongoose.Types.ObjectId(createdBy),
  }));

  const copy = await InternshipModel.create({
    ...rest,
    title: `Copy of ${(original as any).title}`,
    slug: candidateSlug,
    isActive: false,
    analytics: { totalRatings: 0, totalReviews: 0, totalEnrollments: 0, averageRating: 0 },
    batches,
    createdBy: new mongoose.Types.ObjectId(createdBy),
  });

  const populated = await InternshipModel.findById(copy._id)
    .populate("testimonials", "name currentRole feedback verified")
    .populate("partnerColleges", "name location website image")
    .populate("faqs", "question answer")
    .populate(
      "mentors",
      "-password -refreshTokens -permissions -accounts -phone -whatsappNumber -address -dob -reviews -ownedCourses -previousExperience",
    )
    .populate("createdBy", "name email")
    .lean();

  return populated as unknown as InternshipResponse;
};
