import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { CaApplicationModel } from "../models/caApplication.schema";
import { CaCourseVoucherModel, type CaCourseVoucherPlan } from "../models/caCourseVoucher.schema";
import { CourseModel } from "../models/course.schema";
import { EnrollmentModel } from "../models/enrollment.schema";
import { CreateEnrollmentService, revokeEnrollmentAdminService } from "./enrollment.services";
import { coursePlanForVoucher, type CoursePlanFields } from "./caVoucher.services";

export interface CaVoucherAdminActor {
  userId: mongoose.Types.ObjectId;
  name: string;
}

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const iso = (d: Date | string | null | undefined): string | null => (d ? new Date(d).toISOString() : null);

const assertId = (id: string): void => {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Request not found", 404);
};

type ApplicationLookup = { name?: string; email?: string; internId?: string | null };

interface VoucherWithApplication {
  _id: mongoose.Types.ObjectId;
  courseTitle: string;
  plan: CaCourseVoucherPlan;
  status: string;
  requestedAt: Date;
  decidedAt: Date | null;
  decidedBy?: { name?: string } | null;
  declineReason?: string | null;
  application?: ApplicationLookup;
}

const toRequestRow = (v: VoucherWithApplication) => ({
  id: String(v._id),
  caName: v.application?.name ?? "",
  caEmail: v.application?.email ?? "",
  internId: v.application?.internId ?? null,
  courseTitle: v.courseTitle,
  plan: v.plan,
  status: v.status,
  requestedAt: iso(v.requestedAt),
  decidedAt: iso(v.decidedAt),
  decidedByName: v.decidedBy?.name ?? null,
  declineReason: v.declineReason ?? null,
});

export interface ListCaVoucherRequestsQuery {
  status?: unknown;
  search?: unknown;
  page?: unknown;
  limit?: unknown;
}

const REQUEST_STATUSES = ["pending", "declined", "approved"];

export const listCaVoucherRequests = async (query: ListCaVoucherRequestsQuery) => {
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit)) || 20));
  const status = REQUEST_STATUSES.includes(query.status as string) ? (query.status as string) : null;
  const search = String(query.search ?? "").trim();

  const pipeline: mongoose.PipelineStage[] = [];
  if (status) pipeline.push({ $match: { status } });
  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: CaApplicationModel.collection.name,
        localField: "applicationId",
        foreignField: "_id",
        as: "application",
      },
    },
    { $unwind: { path: "$application", preserveNullAndEmptyArrays: true } },
  );
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    pipeline.push({
      $match: { $or: [{ "application.name": rx }, { "application.email": rx }, { courseTitle: rx }] },
    });
  }
  pipeline.push({
    $facet: {
      rows: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      total: [{ $count: "count" }],
    },
  });

  const [result, pending] = await Promise.all([
    CaCourseVoucherModel.aggregate(pipeline),
    CaCourseVoucherModel.countDocuments({ status: "pending" }),
  ]);
  const rows = (result[0]?.rows ?? []) as VoucherWithApplication[];
  const total = (result[0]?.total?.[0]?.count as number | undefined) ?? 0;

  return {
    rows: rows.map(toRequestRow),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    counts: { pending },
  };
};

/**
 * Approves a pending or declined request (an admin may reverse a decline).
 * Pre-checks the enrollment conflict, then claims the row with a status-scoped
 * conditional update so two concurrent approvals cannot both win, then grants
 * the enrollment. On any enrollment failure the claim is rolled back so the
 * row never ends up "approved" without a matching enrollment.
 */
export const approveCaVoucherRequest = async (viewer: CaVoucherAdminActor, id: string) => {
  assertId(id);
  const voucher = await CaCourseVoucherModel.findOne({ _id: id, status: { $in: ["pending", "declined"] } });
  if (!voucher) throw new AppError("Request not found, or already approved", 404);

  const alreadyEnrolled = await EnrollmentModel.exists({
    userId: voucher.userId,
    courseId: voucher.courseId,
    status: { $nin: ["dropped", "revoked"] },
  });
  if (alreadyEnrolled) {
    throw new AppError("This CA already has a live enrollment for that course", 409);
  }

  const course = await CourseModel.findById(voucher.courseId, { plans: 1 }).lean();
  const plan = course ? coursePlanForVoucher(course as CoursePlanFields) : voucher.plan;

  const previousState = {
    status: voucher.status,
    active: voucher.active,
    decidedAt: voucher.decidedAt,
    decidedBy: voucher.decidedBy,
    declineReason: voucher.declineReason,
  };

  const claimed = await CaCourseVoucherModel.findOneAndUpdate(
    { _id: id, status: { $in: ["pending", "declined"] } },
    {
      $set: {
        status: "approved",
        active: true,
        plan,
        decidedAt: new Date(),
        decidedBy: { userId: viewer.userId, name: viewer.name },
        declineReason: null,
      },
    },
    { new: true },
  );
  if (!claimed) throw new AppError("Request not found, or already approved", 404);

  let enrollment;
  try {
    enrollment = await CreateEnrollmentService({
      userId: String(claimed.userId),
      courseId: String(claimed.courseId),
      enrollmentSource: "direct",
      planType: plan,
    });
  } catch (error) {
    // Roll back the claim: the row must never sit "approved" without an enrollment.
    await CaCourseVoucherModel.updateOne({ _id: id }, { $set: previousState });
    if (error instanceof AppError && /already enrolled/i.test(error.message)) {
      throw new AppError("This CA already has a live enrollment for that course", 409);
    }
    throw error;
  }
  if (!enrollment) {
    await CaCourseVoucherModel.updateOne({ _id: id }, { $set: previousState });
    throw new AppError("Failed to create enrollment", 500);
  }

  // Historical labelling only; never affects course/instructor analytics counters.
  await EnrollmentModel.updateOne(
    { _id: (enrollment as { _id: unknown })._id },
    { $set: { grantSource: "ca-voucher" } },
  );

  const updated = await CaCourseVoucherModel.findOneAndUpdate(
    { _id: id },
    { $set: { enrollmentId: (enrollment as { _id: unknown })._id } },
    { new: true },
  ).lean();

  const application = await CaApplicationModel.findById(voucher.applicationId, {
    name: 1,
    email: 1,
    internId: 1,
  }).lean();

  return toRequestRow({ ...(updated as VoucherWithApplication), application: application ?? undefined });
};

export const declineCaVoucherRequest = async (
  viewer: CaVoucherAdminActor,
  id: string,
  reason: unknown,
) => {
  assertId(id);
  if (reason !== undefined && reason !== null && typeof reason !== "string") {
    throw new AppError("declineReason must be text", 400);
  }
  const declineReason = typeof reason === "string" ? reason.trim().slice(0, 300) || null : null;

  const updated = await CaCourseVoucherModel.findOneAndUpdate(
    { _id: id, status: "pending" },
    {
      $set: {
        status: "declined",
        active: false,
        decidedAt: new Date(),
        decidedBy: { userId: viewer.userId, name: viewer.name },
        declineReason,
      },
    },
    { new: true },
  ).lean();
  if (!updated) throw new AppError("Request not found, or already decided", 409);

  const application = await CaApplicationModel.findById(updated.applicationId, {
    name: 1,
    email: 1,
    internId: 1,
  }).lean();
  return toRequestRow({ ...(updated as VoucherWithApplication), application: application ?? undefined });
};

/** If approved, revokes the enrollment first (tolerating an already-revoked one), then deletes the row. */
export const deleteCaVoucherRequest = async (id: string): Promise<void> => {
  assertId(id);
  const voucher = await CaCourseVoucherModel.findById(id);
  if (!voucher) throw new AppError("Request not found", 404);

  if (voucher.status === "approved" && voucher.enrollmentId) {
    try {
      await revokeEnrollmentAdminService(String(voucher.enrollmentId));
    } catch (error) {
      if (!(error instanceof AppError && /already revoked/i.test(error.message))) throw error;
    }
  }
  await CaCourseVoucherModel.deleteOne({ _id: id });
};

interface EnrollmentLookup {
  validUntil?: Date | null;
}

interface VoucherEnrollmentSource extends VoucherWithApplication {
  revokedAt?: Date | null;
  enrollment?: EnrollmentLookup[];
}

const toEnrollmentRow = (v: VoucherEnrollmentSource) => ({
  id: String(v._id),
  caName: v.application?.name ?? "",
  caEmail: v.application?.email ?? "",
  internId: v.application?.internId ?? null,
  courseTitle: v.courseTitle,
  plan: v.plan,
  status: v.status as "approved" | "revoked",
  grantedAt: iso(v.decidedAt),
  validUntil: iso(v.enrollment?.[0]?.validUntil ?? null),
  decidedByName: v.decidedBy?.name ?? null,
  revokedAt: iso(v.revokedAt ?? null),
});

export interface ListCaVoucherEnrollmentsQuery {
  search?: unknown;
  page?: unknown;
  limit?: unknown;
}

export const listCaVoucherEnrollments = async (query: ListCaVoucherEnrollmentsQuery) => {
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit)) || 20));
  const search = String(query.search ?? "").trim();

  const pipeline: mongoose.PipelineStage[] = [
    { $match: { status: { $in: ["approved", "revoked"] } } },
    { $sort: { decidedAt: -1 } },
    {
      $lookup: {
        from: CaApplicationModel.collection.name,
        localField: "applicationId",
        foreignField: "_id",
        as: "application",
      },
    },
    { $unwind: { path: "$application", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: EnrollmentModel.collection.name,
        localField: "enrollmentId",
        foreignField: "_id",
        as: "enrollment",
      },
    },
  ];
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    pipeline.push({
      $match: { $or: [{ "application.name": rx }, { "application.email": rx }, { courseTitle: rx }] },
    });
  }
  pipeline.push({
    $facet: {
      rows: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      total: [{ $count: "count" }],
    },
  });

  const result = await CaCourseVoucherModel.aggregate(pipeline);
  const rows = (result[0]?.rows ?? []) as VoucherEnrollmentSource[];
  const total = (result[0]?.total?.[0]?.count as number | undefined) ?? 0;

  return {
    rows: rows.map(toEnrollmentRow),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const revokeCaVoucherEnrollment = async (viewer: CaVoucherAdminActor, id: string) => {
  assertId(id);
  const voucher = await CaCourseVoucherModel.findOne({ _id: id, status: "approved" });
  if (!voucher || !voucher.enrollmentId) {
    throw new AppError("Enrollment not found, or already revoked", 404);
  }

  await revokeEnrollmentAdminService(String(voucher.enrollmentId));

  const updated = await CaCourseVoucherModel.findOneAndUpdate(
    { _id: id, status: "approved" },
    {
      $set: {
        status: "revoked",
        active: false,
        revokedAt: new Date(),
        revokedBy: { userId: viewer.userId, name: viewer.name },
      },
    },
    { new: true },
  ).lean();
  if (!updated) throw new AppError("Enrollment not found, or already revoked", 404);

  const application = await CaApplicationModel.findById(updated.applicationId, {
    name: 1,
    email: 1,
    internId: 1,
  }).lean();
  const enrollment = await EnrollmentModel.findById(updated.enrollmentId, { validUntil: 1 }).lean();
  return toEnrollmentRow({
    ...(updated as VoucherEnrollmentSource),
    application: application ?? undefined,
    enrollment: enrollment ? [enrollment as EnrollmentLookup] : [],
  });
};
