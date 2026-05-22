import { AppError } from "../middlewares/error.middleware";
import { CollaborationDomainModel } from "../models";
import { CollegeModel } from "../models/college.schema";
import { enqueueCollaborationAllotmentForExistingUsersMatchingDomain } from "./collaborationAllotmentExistingUsers.services";
import {
  CollaborationBenefit,
  CollaborationCheckoutResolve,
  CollaborationDomain,
  CollaborationEnrollmentAccess,
  CollaborationKind,
} from "../types/collaborationDomain";
import mongoose from "mongoose";
import { hostMatchesCollaborationDomain } from "../utils/collaborationDomainMatching";
import { resolvePartnershipImportDiscountForCheckoutService } from "./partnershipImportConfig.services";

/**
 * Validates the bound college and returns its id + current name. The
 * domain's `title` (display name) is always a snapshot of this name.
 */
async function resolveCollegeForDomain(
  collegeId: unknown
): Promise<{ id: mongoose.Types.ObjectId; name: string }> {
  const s = String(collegeId ?? "");
  if (!mongoose.Types.ObjectId.isValid(s)) {
    throw new AppError("A valid college must be selected", 400);
  }
  const college = await CollegeModel.findById(s)
    .select("name isActive")
    .lean();
  if (!college) {
    throw new AppError("Selected college not found", 404);
  }
  if (college.isActive === false) {
    throw new AppError("Selected college is inactive", 400);
  }
  const name = String(college.name ?? "").trim();
  if (!name) {
    throw new AppError("Selected college has no name", 400);
  }
  return { id: new mongoose.Types.ObjectId(s), name };
}

const COLLEGE_POPULATE = {
  path: "college" as const,
  select: "name location",
};

/**
 * API shape: discount rows expose linked courses + benefit; course allot never exposes benefit.
 */
export function sanitizeCollaborationDomainForApi(
  doc: CollaborationDomain | null
): CollaborationDomain | null {
  if (!doc) return null;
  if (
    doc.collaborationKind !== "discount" &&
    doc.collaborationKind !== "course_allot"
  ) {
    return null;
  }
  if (doc.collaborationKind === "discount") {
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

/** Normalize `user@college.edu` → `@college.edu` (matches stored `domain`). */
export const emailToCollaborationDomain = (email: string): string | null => {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 0 || at === trimmed.length - 1) return null;
  const host = trimmed.slice(at + 1);
  if (!host || !host.includes(".")) return null;
  return `@${host}`;
};

async function findCollaborationDomainDocForEmail(
  email: string,
  collaborationKind: "course_allot" | "discount"
): Promise<CollaborationDomain | null> {
  const domainKey = emailToCollaborationDomain(email);
  if (!domainKey) return null;
  const host = domainKey.slice(1);

  const base: Record<string, unknown> = {
    isActive: true,
    collaborationKind,
  };

  const exact = await CollaborationDomainModel.findOne({
    ...base,
    domain: domainKey,
  }).lean();

  if (exact?._id) {
    return exact as CollaborationDomain;
  }

  const wildcards = await CollaborationDomainModel.find({
    ...base,
    domain: { $regex: /^@\*\./ },
  }).lean();

  for (const w of wildcards) {
    const d = w.domain as string;
    if (hostMatchesCollaborationDomain(host, d)) {
      return w as CollaborationDomain;
    }
  }

  return null;
}

/** Checkout: one active partnership row (discount or course_allot) — exact domain wins, then wildcard. */
async function findCollaborationDomainForCheckoutEmail(
  email: string
): Promise<CollaborationDomain | null> {
  const domainKey = emailToCollaborationDomain(email);
  if (!domainKey) return null;
  const host = domainKey.slice(1);

  const exact = await CollaborationDomainModel.findOne({
    isActive: true,
    domain: domainKey,
    collaborationKind: { $in: ["discount", "course_allot"] },
  }).lean();

  if (
    exact?._id &&
    (exact.collaborationKind === "discount" ||
      exact.collaborationKind === "course_allot")
  ) {
    return exact as CollaborationDomain;
  }

  const wildcards = await CollaborationDomainModel.find({
    isActive: true,
    domain: { $regex: /^@\*\./ },
    collaborationKind: { $in: ["discount", "course_allot"] },
  })
    .sort({ updatedAt: -1 })
    .lean();

  for (const w of wildcards) {
    const d = w.domain as string;
    if (hostMatchesCollaborationDomain(host, d)) {
      return w as CollaborationDomain;
    }
  }

  return null;
}

/**
 * Lookup for registration / jobs: active course-allot partnership for this email
 * (exact domain or wildcard e.g. @*.test.com).
 */
export const findActiveCourseAllotDomainByEmail = async (
  email: string
): Promise<CollaborationDomain | null> => {
  const doc = await findCollaborationDomainDocForEmail(email, "course_allot");
  if (!doc?.collaborationKind) {
    return null;
  }
  return sanitizeCollaborationDomainForApi(doc);
};

export const listCollaborationDomainsService = async (
  page: number,
  limit: number,
  search: string,
  isActive?: boolean
): Promise<{
  collaborationDomains: CollaborationDomain[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  let filters: Record<string, unknown> = {
    collaborationKind: { $in: ["course_allot", "discount"] },
  };

  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: "i" } },
      {
        domain: {
          $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      },
    ];
  }

  if (isActive !== undefined) {
    filters.isActive = isActive;
  }

  const total = await CollaborationDomainModel.countDocuments(filters);
  const raw = await CollaborationDomainModel.find(filters)
    .populate("courses", "title slug thumbnail")
    .populate("createdBy", "firstName lastName email")
    .populate(COLLEGE_POPULATE)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const collaborationDomains = raw
    .map((d) => sanitizeCollaborationDomainForApi(d as CollaborationDomain))
    .filter((d): d is CollaborationDomain => d !== null);

  return {
    collaborationDomains,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getCollaborationDomainByIdService = async (
  collaborationDomainId: string
): Promise<CollaborationDomain | null> => {
  if (!mongoose.Types.ObjectId.isValid(collaborationDomainId)) {
    return null;
  }

  const collaborationDomain = await CollaborationDomainModel.findById(
    collaborationDomainId
  )
    .populate("courses", "title slug thumbnail")
    .populate("createdBy", "firstName lastName email")
    .populate(COLLEGE_POPULATE)
    .lean();

  const raw = collaborationDomain as CollaborationDomain | null;
  if (!raw?.collaborationKind) {
    return null;
  }

  return sanitizeCollaborationDomainForApi(raw);
};

const parseCourseObjectIds = (
  ids: unknown,
  requireNonEmpty: boolean
): mongoose.Types.ObjectId[] => {
  if (!Array.isArray(ids)) {
    throw new AppError("courses must be an array of course IDs", 400);
  }
  if (requireNonEmpty && ids.length === 0) {
    throw new AppError(
      "At least one course is required for this collaboration domain",
      400
    );
  }
  if (ids.length === 0) {
    return [];
  }
  const out: mongoose.Types.ObjectId[] = [];
  for (const id of ids) {
    const s = String(id);
    if (!mongoose.Types.ObjectId.isValid(s)) {
      throw new AppError(`Invalid course ID: ${s}`, 400);
    }
    out.push(new mongoose.Types.ObjectId(s));
  }
  return out;
};

export const createCollaborationDomainService = async (
  collaborationData: Partial<CollaborationDomain>,
  createdBy: mongoose.Types.ObjectId | string
): Promise<CollaborationDomain> => {
  if (!collaborationData.domain?.trim()) {
    throw new AppError("Domain is required", 400);
  }

  const kind = collaborationData.collaborationKind;
  if (kind !== "course_allot" && kind !== "discount") {
    throw new AppError(
      "collaborationKind is required and must be course_allot or discount",
      400
    );
  }

  // The bound college is required and supplies the display name (`title`).
  const college = await resolveCollegeForDomain(collaborationData.college);

  const rawCourses = collaborationData.courses ?? [];
  const courses = parseCourseObjectIds(rawCourses, true);

  if (kind === "discount") {
    if (!collaborationData.benefit) {
      throw new AppError(
        "Discount partnerships require a benefit (percentage or fixed)",
        400
      );
    }
  } else {
    if (!collaborationData.enrollmentAccess) {
      throw new AppError(
        "Course allot requires enrollment access (full, partial, or top-N)",
        400
      );
    }
  }

  const collaborationDomain = new CollaborationDomainModel({
    title: college.name,
    college: college.id,
    domain: collaborationData.domain.trim(),
    isActive: collaborationData.isActive !== false,
    collaborationKind: kind,
    courses,
    enrollmentAccess:
      kind === "course_allot"
        ? (collaborationData.enrollmentAccess as CollaborationEnrollmentAccess)
        : undefined,
    benefit:
      kind === "discount"
        ? (collaborationData.benefit as CollaborationBenefit)
        : undefined,
    createdBy,
  });

  try {
    const saved = await collaborationDomain.save();

    const populated = (await saved.populate([
      { path: "courses", select: "title slug thumbnail" },
      { path: "createdBy", select: "firstName lastName email" },
      { path: "college", select: "name location" },
    ])) as unknown as CollaborationDomain;

    if (
      saved.collaborationKind === "course_allot" &&
      saved.isActive !== false &&
      saved.domain
    ) {
      void enqueueCollaborationAllotmentForExistingUsersMatchingDomain(
        String(saved._id),
        saved.domain
      ).catch((e: unknown) => {
        console.error(
          "[Collaboration] Failed to enqueue jobs for existing users matching new domain:",
          e
        );
      });
    }

    return sanitizeCollaborationDomainForApi(populated) as CollaborationDomain;
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) {
      throw new AppError(
        "A collaboration domain with this email domain already exists",
        400
      );
    }
    throw e;
  }
};

export const updateCollaborationDomainService = async (
  collaborationDomainId: string,
  collaborationData: Partial<CollaborationDomain>
): Promise<CollaborationDomain | null> => {
  if (!mongoose.Types.ObjectId.isValid(collaborationDomainId)) {
    throw new AppError("Invalid collaboration domain ID", 400);
  }

  const existing = await CollaborationDomainModel.findById(
    collaborationDomainId
  ).lean();
  if (!existing) {
    throw new AppError("Collaboration domain not found", 404);
  }

  if (!existing.collaborationKind) {
    throw new AppError(
      "Collaboration domain is missing collaborationKind and cannot be updated",
      400
    );
  }

  const nextKind: CollaborationKind =
    collaborationData.collaborationKind ?? existing.collaborationKind;

  if (nextKind !== "course_allot" && nextKind !== "discount") {
    throw new AppError("collaborationKind must be course_allot or discount", 400);
  }

  const nextBenefit =
    collaborationData.benefit === undefined
      ? (existing.benefit as CollaborationBenefit | undefined)
      : collaborationData.benefit === null
        ? undefined
        : (collaborationData.benefit as CollaborationBenefit);

  let nextCourses: mongoose.Types.ObjectId[];
  if (nextKind === "discount") {
    if (collaborationData.courses !== undefined) {
      nextCourses = parseCourseObjectIds(collaborationData.courses, true);
    } else {
      const raw = existing.courses ?? [];
      if (!Array.isArray(raw) || raw.length === 0) {
        throw new AppError(
          "At least one course is required for discount partnerships",
          400
        );
      }
      nextCourses = raw.map((id) => {
        const idStr =
          id && typeof id === "object" && "_id" in (id as object)
            ? String((id as { _id: unknown })._id)
            : String(id);
        if (!mongoose.Types.ObjectId.isValid(idStr)) {
          throw new AppError("Invalid course ID on collaboration domain", 400);
        }
        return new mongoose.Types.ObjectId(idStr);
      });
    }
  } else if (collaborationData.courses !== undefined) {
    nextCourses = parseCourseObjectIds(collaborationData.courses, true);
  } else {
    const raw = existing.courses ?? [];
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new AppError(
        "At least one course is required for course allot partnerships",
        400
      );
    }
    nextCourses = raw.map((id) => {
      const idStr =
        id && typeof id === "object" && "_id" in (id as object)
          ? String((id as { _id: unknown })._id)
          : String(id);
      if (!mongoose.Types.ObjectId.isValid(idStr)) {
        throw new AppError("Invalid course ID on collaboration domain", 400);
      }
      return new mongoose.Types.ObjectId(idStr);
    });
  }

  let nextEA: CollaborationEnrollmentAccess | undefined;
  if (nextKind === "course_allot") {
    nextEA =
      collaborationData.enrollmentAccess !== undefined
        ? (collaborationData.enrollmentAccess as CollaborationEnrollmentAccess)
        : (existing.enrollmentAccess as CollaborationEnrollmentAccess | undefined);
    if (!nextEA) {
      throw new AppError(
        "Enrollment access is required for course allot partnerships",
        400
      );
    }
  }

  if (nextKind === "discount" && !nextBenefit) {
    throw new AppError(
      "Discount partnerships require a benefit (percentage or fixed)",
      400
    );
  }

  if (
    (nextKind === "course_allot" || nextKind === "discount") &&
    nextCourses.length === 0
  ) {
    throw new AppError(
      nextKind === "discount"
        ? "At least one course is required for discount partnerships"
        : "At least one course is required for course allot partnerships",
      400
    );
  }

  const update: Record<string, unknown> = {};

  // College drives the display name — re-resolve it whenever the bound
  // college changes so `title` stays an accurate snapshot.
  if (collaborationData.college !== undefined) {
    const college = await resolveCollegeForDomain(collaborationData.college);
    update.college = college.id;
    update.title = college.name;
  } else if (collaborationData.title !== undefined) {
    update.title = collaborationData.title.trim();
  }
  if (collaborationData.domain !== undefined) {
    update.domain = collaborationData.domain.trim();
  }
  if (collaborationData.isActive !== undefined) {
    update.isActive = collaborationData.isActive;
  }

  update.collaborationKind = nextKind;

  if (nextKind === "discount") {
    update.courses = nextCourses;
    update.benefit = nextBenefit;
  } else {
    update.courses = nextCourses;
    update.enrollmentAccess = nextEA;
  }

  const mongoUpdate: mongoose.UpdateQuery<Record<string, unknown>> = {
    $set: update,
  };

  if (nextKind === "discount") {
    mongoUpdate.$unset = { enrollmentAccess: "" };
  } else {
    mongoUpdate.$unset = { benefit: "" };
  }

  try {
    const updatedCollaborationDomain =
      await CollaborationDomainModel.findByIdAndUpdate(
        collaborationDomainId,
        mongoUpdate,
        { new: true, runValidators: true }
      )
        .populate("courses", "title slug thumbnail")
        .populate("createdBy", "firstName lastName email")
        .populate(COLLEGE_POPULATE)
        .lean();

    return sanitizeCollaborationDomainForApi(
      updatedCollaborationDomain as CollaborationDomain | null
    );
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) {
      throw new AppError(
        "A collaboration domain with this email domain already exists",
        400
      );
    }
    throw e;
  }
};

export const deleteCollaborationDomainService = async (
  collaborationDomainId: string
): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(collaborationDomainId)) {
    throw new AppError("Invalid collaboration domain ID", 400);
  }

  const result = await CollaborationDomainModel.findByIdAndDelete(
    collaborationDomainId
  );
  return !!result;
};

export const resolveCollaborationForCheckoutService = async (
  email: string | undefined,
  courseIds: string[]
): Promise<CollaborationCheckoutResolve> => {
  const validIds = courseIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length !== courseIds.length || validIds.length === 0) {
    return { applies: false };
  }

  const tryPartnershipImportDiscount = () =>
    resolvePartnershipImportDiscountForCheckoutService(email, validIds);

  const domainKey = email ? emailToCollaborationDomain(email) : null;
  if (!domainKey) {
    return tryPartnershipImportDiscount();
  }

  const doc = await findCollaborationDomainForCheckoutEmail(email!);

  if (!doc) {
    return tryPartnershipImportDiscount();
  }

  if (doc.collaborationKind !== "discount" && doc.collaborationKind !== "course_allot") {
    return tryPartnershipImportDiscount();
  }

  if (doc.collaborationKind === "discount") {
    if (!doc.benefit) {
      return tryPartnershipImportDiscount();
    }
    const discountCourses = doc.courses ?? [];
    if (Array.isArray(discountCourses) && discountCourses.length > 0) {
      const allowed = new Set(discountCourses.map((c) => String(c)));
      const hitsCart = validIds.some((id) => allowed.has(id));
      if (!hitsCart) {
        return tryPartnershipImportDiscount();
      }
    }
    return {
      applies: true,
      collaborationDomainId: String(doc._id),
      title: doc.title,
      benefit: doc.benefit,
      enrollmentAccess: undefined,
    };
  }

  const courseList = doc.courses ?? [];
  const hasLinkedCourses = Array.isArray(courseList) && courseList.length > 0;
  if (!hasLinkedCourses) {
    return tryPartnershipImportDiscount();
  }

  const allowed = new Set(courseList.map((c) => String(c)));
  const allCovered = validIds.every((id) => allowed.has(id));
  if (!allCovered) {
    return tryPartnershipImportDiscount();
  }

  const pip = await tryPartnershipImportDiscount();
  if (pip.applies && pip.benefit) {
    return pip;
  }

  return {
    applies: true,
    collaborationDomainId: String(doc._id),
    title: doc.title,
    benefit: undefined,
    enrollmentAccess: doc.enrollmentAccess as CollaborationEnrollmentAccess,
  };
};
