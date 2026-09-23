import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { CaApplicationModel } from "../models/caApplication.schema";
import { CaCourseVoucherModel, type CaCourseVoucherPlan } from "../models/caCourseVoucher.schema";
import { CourseModel } from "../models/course.schema";
import { EnrollmentModel } from "../models/enrollment.schema";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type CoursePlanFields = {
  plans?: { elite?: { price?: number } | null; essential?: { price?: number } | null };
};

/** Every course grants elite when it offers one, essential otherwise. */
export const coursePlanForVoucher = (course: CoursePlanFields): CaCourseVoucherPlan =>
  course.plans?.elite ? "elite" : "essential";

/** Mongo $or clause: matches only courses whose grantable plan actually costs something. */
const NOT_FREE_FILTER = {
  $or: [
    { "plans.elite": { $ne: null }, "plans.elite.price": { $gt: 0 } },
    { "plans.elite": null, "plans.essential.price": { $gt: 0 } },
  ],
};

interface CaVoucherEligibility {
  eligible: boolean;
  applicationId: mongoose.Types.ObjectId | null;
  cooldownUntil: string | null;
}

/**
 * Shared gate for GET /me (display) and POST /me/request (enforcement): the CA
 * must be approved or attached, hold no live (pending or approved) voucher, and
 * be past the 24h cooldown on their latest decline, if any.
 */
const checkCaVoucherEligibility = async (
  userId: mongoose.Types.ObjectId,
): Promise<CaVoucherEligibility> => {
  const application = await CaApplicationModel.findOne(
    { userId, status: { $in: ["approved", "attached"] } },
    { _id: 1 },
  ).lean();
  if (!application) return { eligible: false, applicationId: null, cooldownUntil: null };

  const applicationId = application._id as mongoose.Types.ObjectId;
  const [activeVoucher, latestDeclined] = await Promise.all([
    CaCourseVoucherModel.exists({ applicationId, active: true }),
    CaCourseVoucherModel.findOne({ applicationId, status: "declined" })
      .sort({ decidedAt: -1 })
      .select({ decidedAt: 1 })
      .lean(),
  ]);

  let cooldownUntil: string | null = null;
  if (latestDeclined?.decidedAt) {
    const until = new Date(new Date(latestDeclined.decidedAt).getTime() + COOLDOWN_MS);
    if (until.getTime() > Date.now()) cooldownUntil = until.toISOString();
  }

  return { eligible: !activeVoucher && !cooldownUntil, applicationId, cooldownUntil };
};

export interface CaVoucherMeStatus {
  eligible: boolean;
  hasVoucher: boolean;
  cooldownUntil: string | null;
  request: {
    id: string;
    status: "pending" | "approved" | "declined" | "revoked";
    course: { id: string; title: string; thumbnail: string | null; slug: string };
    plan: CaCourseVoucherPlan;
    declineReason: string | null;
    decidedAt: string | null;
  } | null;
}

export const getCaVoucherMeStatus = async (userId: string): Promise<CaVoucherMeStatus> => {
  const uid = new mongoose.Types.ObjectId(userId);
  const [elig, latestVoucher] = await Promise.all([
    checkCaVoucherEligibility(uid),
    CaCourseVoucherModel.findOne({ userId: uid }).sort({ createdAt: -1 }).lean(),
  ]);

  let request: CaVoucherMeStatus["request"] = null;
  if (latestVoucher) {
    const course = await CourseModel.findById(latestVoucher.courseId, {
      thumbnail: 1,
      slug: 1,
    }).lean();
    request = {
      id: String(latestVoucher._id),
      status: latestVoucher.status,
      course: {
        id: String(latestVoucher.courseId),
        title: latestVoucher.courseTitle,
        thumbnail: (course as { thumbnail?: string } | null)?.thumbnail ?? null,
        slug: (course as { slug?: string } | null)?.slug ?? "",
      },
      plan: latestVoucher.plan,
      declineReason: latestVoucher.declineReason ?? null,
      decidedAt: latestVoucher.decidedAt ? new Date(latestVoucher.decidedAt).toISOString() : null,
    };
  }

  return {
    eligible: elig.eligible,
    hasVoucher: elig.applicationId !== null,
    cooldownUntil: elig.cooldownUntil,
    request,
  };
};

export interface CaVoucherCourseOption {
  id: string;
  title: string;
  thumbnail: string | null;
  slug: string;
  plan: CaCourseVoucherPlan;
}

export const listEligibleCoursesForVoucher = async (
  userId: string,
  opts: { search?: unknown; page?: unknown; limit?: unknown },
): Promise<{ courses: CaVoucherCourseOption[]; total: number; page: number; totalPages: number }> => {
  const uid = new mongoose.Types.ObjectId(userId);
  const page = Math.max(1, Math.floor(Number(opts.page)) || 1);
  const limit = Math.min(50, Math.max(1, Math.floor(Number(opts.limit)) || 12));

  const enrolled = await EnrollmentModel.find(
    { userId: uid, status: { $nin: ["dropped", "revoked"] } },
    { courseId: 1 },
  ).lean();
  const excludeIds = enrolled.map((e) => e.courseId).filter(Boolean);

  const filter: Record<string, unknown> = {
    brand: "airkrit",
    isActive: true,
    ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}),
    ...NOT_FREE_FILTER,
  };

  const search = String(opts.search ?? "").trim();
  if (search) {
    filter.title = { $regex: `^${escapeRegex(search)}`, $options: "i" };
  }

  const [docs, total] = await Promise.all([
    CourseModel.find(filter, { title: 1, thumbnail: 1, slug: 1, plans: 1 })
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CourseModel.countDocuments(filter),
  ]);

  const courses = docs.map((c) => ({
    id: String(c._id),
    title: c.title,
    thumbnail: c.thumbnail ?? null,
    slug: c.slug,
    plan: coursePlanForVoucher(c as CoursePlanFields),
  }));

  return { courses, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

/** Creates a pending voucher request. Race-safe: a duplicate live voucher hits E11000, mapped to 409. */
export const requestCaVoucher = async (userId: string, courseId: unknown) => {
  if (!mongoose.isValidObjectId(courseId)) {
    throw new AppError("Choose a course", 400);
  }
  const uid = new mongoose.Types.ObjectId(userId);

  const elig = await checkCaVoucherEligibility(uid);
  if (!elig.applicationId || !elig.eligible) {
    throw new AppError("No voucher available to request right now", 409, "CA_VOUCHER_UNAVAILABLE");
  }

  const course = await CourseModel.findOne(
    { _id: courseId, brand: "airkrit", isActive: true },
    { title: 1, plans: 1 },
  ).lean();
  if (!course) throw new AppError("Course not found", 400);

  const plan = coursePlanForVoucher(course as CoursePlanFields);
  const price = (course as CoursePlanFields).plans?.[plan]?.price ?? 0;
  if (price <= 0) throw new AppError("This course is not eligible for the voucher", 400);

  const alreadyEnrolled = await EnrollmentModel.exists({
    userId: uid,
    courseId: (course as { _id: unknown })._id,
    status: { $nin: ["dropped", "revoked"] },
  });
  if (alreadyEnrolled) throw new AppError("You are already enrolled in this course", 400);

  try {
    return await CaCourseVoucherModel.create({
      applicationId: elig.applicationId,
      userId: uid,
      courseId: (course as { _id: unknown })._id,
      courseTitle: (course as { title: string }).title,
      plan,
      status: "pending",
      active: true,
      requestedAt: new Date(),
    });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      throw new AppError("No voucher available to request right now", 409, "CA_VOUCHER_UNAVAILABLE");
    }
    throw err;
  }
};
