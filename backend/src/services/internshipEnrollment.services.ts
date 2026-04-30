import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { AppError } from "../middlewares/error.middleware";
import { isApplicationWindowOpenIst } from "../utils/applicationWindow";
import { getPointsSettings } from "./pointsSettings.services";
import {
  computeCertificationExamWindowUtc,
  isInstantWithinWindowUtc,
  parseProgramDurationMonthsFromAnswers,
} from "../lib/certificationExamSchedule";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toIso(d: unknown): string | undefined {
  if (d instanceof Date && !Number.isNaN(d.getTime())) return d.toISOString();
  if (typeof d === "string" || typeof d === "number") {
    const t = new Date(d);
    return Number.isNaN(t.getTime()) ? undefined : t.toISOString();
  }
  return undefined;
}

const MAX_APPLICATION_ANSWERS_BYTES = 120_000;

/** Validates and returns plain object for Mongoose Mixed, or undefined if omitted. */
export function sanitizeApplicationAnswers(
  raw: unknown,
): Record<string, unknown> | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new AppError("applicationAnswers must be a JSON object", 400);
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(raw);
  } catch {
    throw new AppError("applicationAnswers must be JSON-serializable", 400);
  }
  if (serialized.length > MAX_APPLICATION_ANSWERS_BYTES) {
    throw new AppError("applicationAnswers payload is too large", 400);
  }
  return raw as Record<string, unknown>;
}

/**
 * Exclude internship enroll-form snapshots from DB reads that power learner-facing
 * or non-admin HTTP APIs (admin detail uses `getInternshipEnrollmentByIdAdmin`, which loads full doc).
 */
const ENROLLMENT_DOC_OMIT_APPLICATION_SNAPSHOT =
  "-applicationAnswers -applicationSubmittedAt";

export type InternshipEnrollmentListRow = {
  _id: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    name?: string;
  } | null;
  internship: {
    _id: string;
    title: string;
    slug?: string;
  } | null;
  internshipSnapshot?: {
    title: string;
    slug: string;
    thumbnail?: string;
  };
  batchSnapshot?: {
    batchId: string;
    name: string;
    internshipStartDate: string;
  };
  enrollmentType?: "merit" | "paid";
  status: string;
  examScore?: number;
  internshipSuccessPoints: number;
  enrolledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /** ISO string — entrance exam window opens (cohort batch, UTC). */
  examStartAt?: string;
  /** ISO string — entrance exam window closes (cohort batch, UTC). */
  examEndAt?: string;
  /** ISO string — when the exam result will be announced. */
  examResultAt?: string;
  /**
   * Per-learner certification exam day window (UTC), when the cohort batch assigns a
   * certification template. Derived from cohort start + program duration months.
   */
  certificationExamStartAt?: string;
  certificationExamEndAt?: string;
  /** Snapshot of public enroll form fields at submission (admin + detail API). */
  applicationAnswers?: Record<string, unknown>;
  /** ISO — when {@link applicationAnswers} was stored. */
  applicationSubmittedAt?: string;
};

/**
 * Admin list: paginated internship enrollments with user + internship populated,
 * optional search (user email/name, internship title, batch name), status filter.
 */
export async function listInternshipEnrollmentsAdmin(
  page: number,
  limit: number,
  options: {
    search?: string;
    status?: string;
    internshipId?: string;
    batchId?: string;
    /** When status is "all" or omitted: `program` = seat confirmed / post-admission; `pipeline` = exam & selection; `all` = no status filter. */
    lifecycle?: "program" | "pipeline" | "all";
    enrollmentType?: "merit" | "paid";
    /** When true, `in_merit_pool` rows sort before all other statuses (then by `updatedAt` desc). */
    meritPoolFirst?: boolean;
  } = {},
): Promise<{
  enrollments: InternshipEnrollmentListRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const p = Math.max(1, page);
  const l = Math.min(100, Math.max(1, limit));
  const skip = (p - 1) * l;

  const {
    search,
    status,
    internshipId,
    batchId,
    lifecycle,
    enrollmentType,
    meritPoolFirst,
  } = options;

  const PROGRAM_STATUSES = [
    "enrolled",
    "completed",
    "paused",
    "dropped",
    "revoked",
  ] as const;
  const PIPELINE_STATUSES = [
    "exam_registered",
    "exam_attempted",
    "in_merit_pool",
    "admin_rejected",
    "payment_pending",
  ] as const;

  const preMatch: Record<string, unknown> = {};
  if (internshipId && mongoose.Types.ObjectId.isValid(internshipId)) {
    preMatch.internship = new mongoose.Types.ObjectId(internshipId);
  }
  if (batchId) {
    preMatch["batchSnapshot.batchId"] = batchId;
  }
  if (enrollmentType === "merit" || enrollmentType === "paid") {
    preMatch.enrollmentType = enrollmentType;
  }
  if (status && status !== "all") {
    preMatch.status = status;
  } else if (!status || status === "all") {
    // lifecycle groups statuses unless a specific status is chosen
    if (lifecycle === "program") {
      preMatch.status = { $in: [...PROGRAM_STATUSES] };
    } else if (lifecycle === "pipeline") {
      preMatch.status = { $in: [...PIPELINE_STATUSES] };
    }
    // lifecycle "all" or undefined → no status constraint (back-compat)
  }

  const pipeline: mongoose.PipelineStage[] = [];
  if (Object.keys(preMatch).length > 0) {
    pipeline.push({ $match: preMatch });
  }
  pipeline.push({
    $project: {
      applicationAnswers: 0,
      applicationSubmittedAt: 0,
    },
  });
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDoc",
        pipeline: [
          { $project: { firstName: 1, lastName: 1, email: 1, name: 1 } },
        ],
      },
    },
    {
      $lookup: {
        from: "internships",
        localField: "internship",
        foreignField: "_id",
        as: "internshipDoc",
        pipeline: [{ $project: { title: 1, slug: 1 } }],
      },
    },
    {
      $addFields: {
        user: { $arrayElemAt: ["$userDoc", 0] },
        internship: { $arrayElemAt: ["$internshipDoc", 0] },
      },
    },
    { $project: { userDoc: 0, internshipDoc: 0 } },
  );

  if (search?.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    pipeline.push({
      $match: {
        $or: [
          { "user.email": rx },
          { "user.firstName": rx },
          { "user.lastName": rx },
          { "user.name": rx },
          { "internship.title": rx },
          { "batchSnapshot.name": rx },
        ],
      },
    });
  }

  const countResult = await InternshipEnrollmentModel.aggregate([
    ...pipeline,
    { $count: "total" },
  ]);
  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / l));

  const sortStages: mongoose.PipelineStage[] = meritPoolFirst
    ? [
        {
          $addFields: {
            _meritPoolFirst: {
              $cond: [{ $eq: ["$status", "in_merit_pool"] }, 0, 1],
            },
          },
        },
        { $sort: { _meritPoolFirst: 1, updatedAt: -1 } },
      ]
    : [{ $sort: { updatedAt: -1 } }];

  const rows = await InternshipEnrollmentModel.aggregate([
    ...pipeline,
    ...sortStages,
    { $skip: skip },
    { $limit: l },
  ]);

  const enrollments: InternshipEnrollmentListRow[] = (
    rows as Record<string, unknown>[]
  ).map((r) => {
    const u = r.user as Record<string, unknown> | null | undefined;
    const ins = r.internship as Record<string, unknown> | null | undefined;
    const userOut =
      u && typeof u === "object" && u._id != null
        ? {
            _id: String((u as { _id: unknown })._id),
            firstName:
              typeof (u as { firstName?: string }).firstName === "string"
                ? (u as { firstName: string }).firstName
                : undefined,
            lastName:
              typeof (u as { lastName?: string }).lastName === "string"
                ? (u as { lastName: string }).lastName
                : undefined,
            email:
              typeof (u as { email?: string }).email === "string"
                ? (u as { email: string }).email
                : undefined,
            name:
              typeof (u as { name?: string }).name === "string"
                ? (u as { name: string }).name
                : undefined,
          }
        : null;
    const internshipOut =
      ins && typeof ins === "object" && ins._id != null
        ? {
            _id: String((ins as { _id: unknown })._id),
            title: String((ins as { title?: string }).title ?? ""),
            slug:
              typeof (ins as { slug?: string }).slug === "string"
                ? (ins as { slug: string }).slug
                : undefined,
          }
        : null;

    const batchSnap = r.batchSnapshot;
    const batchOut =
      batchSnap && typeof batchSnap === "object"
        ? {
            batchId: String((batchSnap as { batchId?: string }).batchId ?? ""),
            name: String((batchSnap as { name?: string }).name ?? ""),
            internshipStartDate:
              (batchSnap as { internshipStartDate?: Date })
                .internshipStartDate instanceof Date
                ? (
                    batchSnap as { internshipStartDate: Date }
                  ).internshipStartDate.toISOString()
                : new Date(
                    String(
                      (batchSnap as { internshipStartDate?: unknown })
                        .internshipStartDate ?? 0,
                    ),
                  ).toISOString(),
          }
        : undefined;

    const iSnap = r.internshipSnapshot as
      | { title?: string; slug?: string; thumbnail?: string }
      | null
      | undefined;
    const internshipSnapshotOut = iSnap?.title
      ? {
          title: String(iSnap.title),
          slug: String(iSnap.slug ?? ""),
          thumbnail:
            typeof iSnap.thumbnail === "string" ? iSnap.thumbnail : undefined,
        }
      : undefined;

    return {
      _id: String(r._id),
      user: userOut,
      internship: internshipOut,
      internshipSnapshot: internshipSnapshotOut,
      batchSnapshot: batchOut,
      enrollmentType: r.enrollmentType as "merit" | "paid" | undefined,
      status: String(r.status ?? ""),
      examScore: typeof r.examScore === "number" ? r.examScore : undefined,
      internshipSuccessPoints:
        typeof r.internshipSuccessPoints === "number"
          ? r.internshipSuccessPoints
          : 0,
      enrolledAt: toIso(r.enrolledAt),
      createdAt: toIso(r.createdAt),
      updatedAt: toIso(r.updatedAt),
    };
  });

  return { enrollments, total, page: p, totalPages };
}

export async function getInternshipEnrollmentByIdAdmin(
  id: string,
): Promise<InternshipEnrollmentListRow> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const doc = await InternshipEnrollmentModel.findById(id)
    .populate("user", "firstName lastName email name")
    .populate("internship", "title slug")
    .lean();
  if (!doc) {
    throw new AppError("Enrollment not found", 404);
  }
  const u = doc.user as unknown as Record<string, unknown> | null;
  const ins = doc.internship as unknown as Record<string, unknown> | null;
  const userOut =
    u && u._id != null
      ? {
          _id: String(u._id),
          firstName: typeof u.firstName === "string" ? u.firstName : undefined,
          lastName: typeof u.lastName === "string" ? u.lastName : undefined,
          email: typeof u.email === "string" ? u.email : undefined,
          name: typeof u.name === "string" ? u.name : undefined,
        }
      : null;
  const internshipOut =
    ins && ins._id != null
      ? {
          _id: String(ins._id),
          title: String(ins.title ?? ""),
          slug: typeof ins.slug === "string" ? ins.slug : undefined,
        }
      : null;
  const iSnap = doc.internshipSnapshot as
    | { title?: string; slug?: string; thumbnail?: string }
    | null
    | undefined;
  const bs = doc.batchSnapshot;
  return {
    _id: String(doc._id),
    user: userOut,
    internship: internshipOut,
    internshipSnapshot: iSnap?.title
      ? {
          title: String(iSnap.title),
          slug: String(iSnap.slug ?? ""),
          thumbnail:
            typeof iSnap.thumbnail === "string" ? iSnap.thumbnail : undefined,
        }
      : undefined,
    batchSnapshot:
      bs && typeof bs === "object"
        ? {
            batchId: String((bs as { batchId?: string }).batchId ?? ""),
            name: String((bs as { name?: string }).name ?? ""),
            internshipStartDate:
              (bs as { internshipStartDate?: Date })
                .internshipStartDate instanceof Date
                ? (
                    bs as { internshipStartDate: Date }
                  ).internshipStartDate.toISOString()
                : new Date(0).toISOString(),
          }
        : undefined,
    enrollmentType: doc.enrollmentType as "merit" | "paid" | undefined,
    status: String(doc.status ?? ""),
    examScore: typeof doc.examScore === "number" ? doc.examScore : undefined,
    internshipSuccessPoints:
      typeof doc.internshipSuccessPoints === "number"
        ? doc.internshipSuccessPoints
        : 0,
    enrolledAt:
      doc.enrolledAt instanceof Date
        ? doc.enrolledAt.toISOString()
        : doc.enrolledAt
          ? new Date(doc.enrolledAt).toISOString()
          : undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : undefined,
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt).toISOString()
      : undefined,
    applicationAnswers:
      doc.applicationAnswers &&
      typeof doc.applicationAnswers === "object" &&
      !Array.isArray(doc.applicationAnswers)
        ? (doc.applicationAnswers as Record<string, unknown>)
        : undefined,
    applicationSubmittedAt:
      (doc as { applicationSubmittedAt?: Date }).applicationSubmittedAt instanceof
      Date
        ? (
            doc as { applicationSubmittedAt: Date }
          ).applicationSubmittedAt.toISOString()
        : undefined,
  };
}

/** Mongo duplicate key (e.g. concurrent enrollment submits racing on unique index). */
function isMongoDuplicateKeyError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: number }).code === 11000
  );
}

async function completeMeritRegistrationForExistingRow(
  existing: {
    _id: mongoose.Types.ObjectId | string;
    status?: string;
  },
  answersDoc: Record<string, unknown> | undefined,
): Promise<{ enrollmentId: string }> {
  const examStatuses = ["exam_registered", "exam_attempted"] as string[];
  if (examStatuses.includes(String(existing.status))) {
    if (answersDoc) {
      const months = parseProgramDurationMonthsFromAnswers(answersDoc);
      await InternshipEnrollmentModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            applicationAnswers: answersDoc,
            applicationSubmittedAt: new Date(),
            ...(months != null ? { programDurationMonths: months } : {}),
          },
        },
      );
    }
    return { enrollmentId: String(existing._id) };
  }
  if (String(existing.status) === "enrolled") {
    return { enrollmentId: String(existing._id) };
  }
  throw new AppError("You are already registered for this batch", 409);
}

async function completePaidSeatRegistrationForExistingDoc(
  existing: mongoose.Document,
  answersDoc: Record<string, unknown> | undefined,
): Promise<{ enrollmentId: string }> {
  const enrollmentType = String(
    (existing as { enrollmentType?: string }).enrollmentType ?? "",
  );
  const status = String((existing as { status?: string }).status ?? "");

  if (enrollmentType === "paid" && status === "payment_pending") {
    if (answersDoc) {
      existing.set("applicationAnswers", answersDoc);
      existing.set("applicationSubmittedAt", new Date());
      const months = parseProgramDurationMonthsFromAnswers(answersDoc);
      if (months != null) existing.set("programDurationMonths", months);
      await existing.save();
    }
    return { enrollmentId: String(existing._id) };
  }

  const upgradeableStatuses = [
    "exam_registered",
    "exam_attempted",
    "in_merit_pool",
    "admin_rejected",
  ] as string[];
  if (upgradeableStatuses.includes(status)) {
    (existing as { enrollmentType?: string }).enrollmentType = "paid";
    if (answersDoc) {
      existing.set("applicationAnswers", answersDoc);
      existing.set("applicationSubmittedAt", new Date());
      const months = parseProgramDurationMonthsFromAnswers(answersDoc);
      if (months != null) existing.set("programDurationMonths", months);
    }
    await existing.save();
    return { enrollmentId: String(existing._id) };
  }

  throw new AppError("You are already registered for this batch", 409);
}

// ─── Learner: register for entrance exam ─────────────────────────────────────

/**
 * Called when a learner submits the enrollment form.
 * Creates an InternshipEnrollment with status "exam_registered".
 * The user's profile is updated separately via PATCH /users/me before this call.
 */
export async function registerForExam(
  userId: mongoose.Types.ObjectId,
  internshipId: string,
  batchId: string,
  options?: { applicationAnswers?: unknown },
): Promise<{ enrollmentId: string }> {
  const answersDoc = sanitizeApplicationAnswers(options?.applicationAnswers);

  if (!mongoose.Types.ObjectId.isValid(internshipId)) {
    throw new AppError("Invalid internship id", 400);
  }

  const internship = await InternshipModel.findById(internshipId).lean();
  if (!internship) throw new AppError("Internship not found", 404);
  if (!internship.isActive) throw new AppError("Internship is not active", 400);

  const batch = (
    internship.batches as {
      _id: unknown;
      name: string;
      internshipStartDate: Date;
      applicationLastDate?: Date;
      isActive: boolean;
      entranceExamTemplateId?: unknown;
    }[]
  )?.find((b) => String(b._id) === batchId);
  if (!batch) throw new AppError("Batch not found", 404);
  if (!batch.isActive)
    throw new AppError("Batch is not accepting registrations", 400);
  if (!batch.entranceExamTemplateId) {
    throw new AppError("This batch does not have an entrance exam", 400);
  }
  if (!isApplicationWindowOpenIst(batch.applicationLastDate)) {
    throw new AppError("The application period for this batch has ended", 400);
  }

  const existing = await InternshipEnrollmentModel.findOne({
    user: userId,
    internship: new mongoose.Types.ObjectId(internshipId),
    "batchSnapshot.batchId": batchId,
  }).lean();
  if (existing) {
    return completeMeritRegistrationForExistingRow(existing, answersDoc);
  }

  try {
    const durationMonths = answersDoc
      ? parseProgramDurationMonthsFromAnswers(answersDoc)
      : undefined;
    const enrollment = await InternshipEnrollmentModel.create({
      internship: new mongoose.Types.ObjectId(internshipId),
      user: userId,
      enrollmentType: "merit",
      status: "exam_registered",
      internshipSnapshot: {
        title: String((internship as { title?: unknown }).title ?? ""),
        slug: String((internship as { slug?: unknown }).slug ?? ""),
        thumbnail:
          typeof (internship as { thumbnail?: unknown }).thumbnail === "string"
            ? (internship as { thumbnail: string }).thumbnail
            : undefined,
      },
      batchSnapshot: {
        batchId: String(batch._id),
        name: batch.name,
        internshipStartDate: batch.internshipStartDate,
      },
      ...(answersDoc
        ? {
            applicationAnswers: answersDoc,
            applicationSubmittedAt: new Date(),
            ...(durationMonths != null
              ? { programDurationMonths: durationMonths }
              : {}),
          }
        : {}),
    });

    return { enrollmentId: String(enrollment._id) };
  } catch (err: unknown) {
    if (!isMongoDuplicateKeyError(err)) throw err;
    const raced = await InternshipEnrollmentModel.findOne({
      user: userId,
      internship: new mongoose.Types.ObjectId(internshipId),
      "batchSnapshot.batchId": batchId,
    }).lean();
    if (!raced) throw err;
    return completeMeritRegistrationForExistingRow(raced, answersDoc);
  }
}

/**
 * “Book seat / without entrance” — requires batch `plan` with pricing.
 * Learner must complete payment via Paytm; enrollment stays `payment_pending` until then.
 */
export async function registerForPaidSeat(
  userId: mongoose.Types.ObjectId,
  internshipId: string,
  batchId: string,
  options?: { applicationAnswers?: unknown },
): Promise<{ enrollmentId: string }> {
  const answersDoc = sanitizeApplicationAnswers(options?.applicationAnswers);

  if (!mongoose.Types.ObjectId.isValid(internshipId)) {
    throw new AppError("Invalid internship id", 400);
  }

  const internship = await InternshipModel.findById(internshipId).lean();
  if (!internship) throw new AppError("Internship not found", 404);
  if (!internship.isActive) throw new AppError("Internship is not active", 400);

  const batch = (
    internship.batches as {
      _id: unknown;
      name: string;
      internshipStartDate: Date;
      applicationLastDate?: Date;
      isActive: boolean;
      plan?: { price: number; isActive?: boolean; discount?: unknown } | null;
    }[]
  )?.find((b) => String(b._id) === batchId);
  if (!batch) throw new AppError("Batch not found", 404);
  if (!batch.isActive)
    throw new AppError("Batch is not accepting registrations", 400);
  if (!isApplicationWindowOpenIst(batch.applicationLastDate)) {
    throw new AppError("The application period for this batch has ended", 400);
  }
  if (!batch.plan || batch.plan.isActive === false) {
    throw new AppError(
      "This cohort is not open for direct seat purchase (no plan configured)",
      400,
    );
  }

  const existing = await InternshipEnrollmentModel.findOne({
    user: userId,
    internship: new mongoose.Types.ObjectId(internshipId),
    "batchSnapshot.batchId": batchId,
  });
  if (existing) {
    return completePaidSeatRegistrationForExistingDoc(existing, answersDoc);
  }

  try {
    const durationMonthsPaid = answersDoc
      ? parseProgramDurationMonthsFromAnswers(answersDoc)
      : undefined;
    const enrollment = await InternshipEnrollmentModel.create({
      internship: new mongoose.Types.ObjectId(internshipId),
      user: userId,
      enrollmentType: "paid",
      status: "payment_pending",
      internshipSnapshot: {
        title: String((internship as { title?: unknown }).title ?? ""),
        slug: String((internship as { slug?: unknown }).slug ?? ""),
        thumbnail:
          typeof (internship as { thumbnail?: unknown }).thumbnail === "string"
            ? (internship as { thumbnail: string }).thumbnail
            : undefined,
      },
      batchSnapshot: {
        batchId: String(batch._id),
        name: batch.name,
        internshipStartDate: batch.internshipStartDate,
      },
      ...(answersDoc
        ? {
            applicationAnswers: answersDoc,
            applicationSubmittedAt: new Date(),
            ...(durationMonthsPaid != null
              ? { programDurationMonths: durationMonthsPaid }
              : {}),
          }
        : {}),
    });

    return { enrollmentId: String(enrollment._id) };
  } catch (err: unknown) {
    if (!isMongoDuplicateKeyError(err)) throw err;
    const raced = await InternshipEnrollmentModel.findOne({
      user: userId,
      internship: new mongoose.Types.ObjectId(internshipId),
      "batchSnapshot.batchId": batchId,
    });
    if (!raced) throw err;
    return completePaidSeatRegistrationForExistingDoc(raced, answersDoc);
  }
}

/**
 * Learner: list their internship enrollments (dashboard).
 */
export async function listMyInternshipEnrollments(
  userId: mongoose.Types.ObjectId,
  page: number,
  limit: number,
  search?: string,
  /** When set, only rows whose `status` is in this list (entrance exam / selection flow). */
  statuses?: string[],
): Promise<{
  enrollments: InternshipEnrollmentListRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const p = Math.max(1, page);
  const l = Math.min(50, Math.max(1, limit));
  const skip = (p - 1) * l;

  const baseMatch: Record<string, unknown> = { user: userId };
  if (statuses && statuses.length > 0) {
    baseMatch.status = { $in: statuses };
  }
  if (search?.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    baseMatch.$or = [
      { "internshipSnapshot.title": rx },
      { "batchSnapshot.name": rx },
    ];
  }

  const [raw, total] = await Promise.all([
    InternshipEnrollmentModel.find(baseMatch)
      .select(ENROLLMENT_DOC_OMIT_APPLICATION_SNAPSHOT)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    InternshipEnrollmentModel.countDocuments(baseMatch),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / l));

  // For merit-path rows (exam_registered / exam_attempted / in_merit_pool), fetch
  // entrance window from the internship batch (UTC) and result time from the template.
  const needsExamWindow = new Set(["exam_registered", "exam_attempted", "in_merit_pool"]);
  const examWindowById = new Map<
    string,
    { examStartAt?: string; examEndAt?: string; examResultAt?: string }
  >();

  const examRows = (raw as Record<string, unknown>[]).filter(
    (d) => needsExamWindow.has(String(d.status ?? "")) && d.internship,
  );

  if (examRows.length > 0) {
    const insIdSet = new Set<string>();
    for (const d of examRows) {
      const insId = String(
        (d.internship as { _id?: unknown })?._id ?? d.internship ?? "",
      );
      if (insId && mongoose.Types.ObjectId.isValid(insId)) insIdSet.add(insId);
    }

    const insIds = [...insIdSet];
    if (insIds.length > 0) {
      const insDocs = await InternshipModel.find({
        _id: { $in: insIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .select(
          "batches._id batches.entranceExamTemplateId batches.entranceExamStartAt batches.entranceExamEndAt",
        )
        .lean();

      type BatchWin = {
        examStartAt?: string;
        examEndAt?: string;
        templateId?: string;
      };
      const windowByInsBatch = new Map<string, BatchWin>();
      const templateIds = new Set<string>();

      for (const ins of insDocs) {
        const insId = String((ins as { _id: unknown })._id);
        const batches =
          (
            ins as {
              batches?: {
                _id?: unknown;
                entranceExamTemplateId?: unknown;
                entranceExamStartAt?: Date;
                entranceExamEndAt?: Date;
              }[];
            }
          ).batches ?? [];
        for (const b of batches) {
          const bid = String(b._id);
          const tid =
            b.entranceExamTemplateId != null
              ? String(b.entranceExamTemplateId)
              : undefined;
          if (tid) templateIds.add(tid);
          const s = b.entranceExamStartAt;
          const e = b.entranceExamEndAt;
          windowByInsBatch.set(`${insId}::${bid}`, {
            examStartAt:
              s instanceof Date && !Number.isNaN(s.getTime())
                ? s.toISOString()
                : undefined,
            examEndAt:
              e instanceof Date && !Number.isNaN(e.getTime())
                ? e.toISOString()
                : undefined,
            templateId: tid,
          });
        }
      }

      const resultAtByTemplate = new Map<string, string>();
      if (templateIds.size > 0) {
        const examDocs = await InternshipExamModel.find({
          _id: {
            $in: [...templateIds].map(
              (id) => new mongoose.Types.ObjectId(id),
            ),
          },
        })
          .select("examResultAt")
          .lean();

        for (const ex of examDocs) {
          const eid = String((ex as { _id: unknown })._id);
          const r = (ex as { examResultAt?: Date }).examResultAt;
          if (r instanceof Date && !Number.isNaN(r.getTime())) {
            resultAtByTemplate.set(eid, r.toISOString());
          }
        }
      }

      for (const d of examRows) {
        const insId = String(
          (d.internship as { _id?: unknown })?._id ?? d.internship ?? "",
        );
        const batchId = String(
          (d.batchSnapshot as { batchId?: string } | undefined)?.batchId ?? "",
        );
        const win = windowByInsBatch.get(`${insId}::${batchId}`);
        if (!win) continue;
        const examResultAt = win.templateId
          ? resultAtByTemplate.get(win.templateId)
          : undefined;
        examWindowById.set(String(d._id), {
          ...(win.examStartAt ? { examStartAt: win.examStartAt } : {}),
          ...(win.examEndAt ? { examEndAt: win.examEndAt } : {}),
          ...(examResultAt ? { examResultAt } : {}),
        });
      }
    }
  }

  // Certification exam window (per learner) — same rule as createInternshipSubmission
  const certWindowByEnrollmentId = new Map<
    string,
    { certificationExamStartAt: string; certificationExamEndAt: string }
  >();
  const CERT_ACTIVE_STATUSES = new Set(["enrolled", "completed", "paused"]);
  const certCandidates = (raw as Record<string, unknown>[]).filter((d) => {
    const st = String(d.status ?? "");
    return CERT_ACTIVE_STATUSES.has(st) && d.internship != null && d.batchSnapshot;
  });

  if (certCandidates.length > 0) {
    const insIdSet = new Set<string>();
    for (const d of certCandidates) {
      const rawIns = d.internship as unknown;
      const insId = String(
        rawIns &&
          typeof rawIns === "object" &&
          (rawIns as { _id?: unknown })._id != null
          ? (rawIns as { _id: unknown })._id
          : rawIns ?? "",
      );
      if (insId && mongoose.Types.ObjectId.isValid(insId)) insIdSet.add(insId);
    }
    const insIds = [...insIdSet];
    if (insIds.length > 0) {
      const insDocs = await InternshipModel.find({
        _id: { $in: insIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .select("batches._id batches.certificationExamTemplateId")
        .lean();

      const hasCertByInsBatch = new Map<string, boolean>();
      for (const ins of insDocs) {
        const iid = String((ins as { _id: unknown })._id);
        const batches =
          (
            ins as {
              batches?: {
                _id?: unknown;
                certificationExamTemplateId?: unknown;
              }[];
            }
          ).batches ?? [];
        for (const b of batches) {
          hasCertByInsBatch.set(
            `${iid}::${String(b._id)}`,
            b.certificationExamTemplateId != null,
          );
        }
      }

      const needAnswersIds: mongoose.Types.ObjectId[] = [];
      for (const d of certCandidates) {
        const rawIns = d.internship as unknown;
        const insId = String(
          rawIns &&
            typeof rawIns === "object" &&
            (rawIns as { _id?: unknown })._id != null
            ? (rawIns as { _id: unknown })._id
            : rawIns ?? "",
        );
        const batchId = String(
          (d.batchSnapshot as { batchId?: string })?.batchId ?? "",
        );
        if (!hasCertByInsBatch.get(`${insId}::${batchId}`)) continue;

        const monthsStored = (d as { programDurationMonths?: unknown })
          .programDurationMonths;
        const monthsOk =
          typeof monthsStored === "number" &&
          monthsStored >= 1 &&
          monthsStored <= 120;
        if (!monthsOk)
          needAnswersIds.push(new mongoose.Types.ObjectId(String(d._id)));
      }

      const answersByEnrollment = new Map<string, Record<string, unknown>>();
      if (needAnswersIds.length > 0) {
        const answerDocs = await InternshipEnrollmentModel.find({
          _id: { $in: needAnswersIds },
        })
          .select("applicationAnswers")
          .lean();
        for (const ad of answerDocs) {
          const aid = String((ad as { _id: unknown })._id);
          const aa = (ad as { applicationAnswers?: unknown }).applicationAnswers;
          if (aa && typeof aa === "object" && !Array.isArray(aa))
            answersByEnrollment.set(aid, aa as Record<string, unknown>);
        }
      }

      for (const d of certCandidates) {
        const eid = String(d._id);
        const rawIns = d.internship as unknown;
        const insId = String(
          rawIns &&
            typeof rawIns === "object" &&
            (rawIns as { _id?: unknown })._id != null
            ? (rawIns as { _id: unknown })._id
            : rawIns ?? "",
        );
        const batchId = String(
          (d.batchSnapshot as { batchId?: string })?.batchId ?? "",
        );
        if (!hasCertByInsBatch.get(`${insId}::${batchId}`)) continue;

        let months: number | undefined;
        const monthsStored = (d as { programDurationMonths?: unknown })
          .programDurationMonths;
        if (
          typeof monthsStored === "number" &&
          monthsStored >= 1 &&
          monthsStored <= 120
        ) {
          months = monthsStored;
        } else {
          months = parseProgramDurationMonthsFromAnswers(
            answersByEnrollment.get(eid) ?? null,
          );
        }
        if (months == null || months < 1 || months > 120) continue;

        const bs = d.batchSnapshot as {
          internshipStartDate?: Date | string;
        };
        const startRaw = bs?.internshipStartDate;
        const progStart =
          startRaw instanceof Date
            ? startRaw
            : startRaw
              ? new Date(startRaw)
              : null;
        if (!progStart || Number.isNaN(progStart.getTime())) continue;

        let window: { examStartAt: Date; examEndAt: Date };
        try {
          window = computeCertificationExamWindowUtc(progStart, months);
        } catch {
          continue;
        }
        certWindowByEnrollmentId.set(eid, {
          certificationExamStartAt: window.examStartAt.toISOString(),
          certificationExamEndAt: window.examEndAt.toISOString(),
        });
      }
    }
  }

  const enrollments: InternshipEnrollmentListRow[] = (
    raw as Record<string, unknown>[]
  ).map((doc) => {
    const id = String(doc._id);
    const ins = doc.internship as
      | { _id: unknown; title?: string; slug?: string }
      | null
      | undefined;
    const iSnap = doc.internshipSnapshot as
      | { title?: string; slug?: string; thumbnail?: string }
      | undefined;
    const bs = doc.batchSnapshot as
      | {
          batchId?: string;
          name?: string;
          internshipStartDate?: Date;
        }
      | undefined;
    return {
      _id: id,
      user: null,
      internship:
        ins && ins._id != null
          ? {
              _id: String(ins._id),
              title: String(ins.title ?? ""),
              slug: typeof ins.slug === "string" ? ins.slug : undefined,
            }
          : null,
      internshipSnapshot: iSnap?.title
        ? {
            title: String(iSnap.title),
            slug: String(iSnap.slug ?? ""),
            thumbnail:
              typeof iSnap.thumbnail === "string" ? iSnap.thumbnail : undefined,
          }
        : undefined,
      batchSnapshot:
        bs && typeof bs === "object"
          ? {
              batchId: String(bs.batchId ?? ""),
              name: String(bs.name ?? ""),
              internshipStartDate:
                bs.internshipStartDate instanceof Date
                  ? bs.internshipStartDate.toISOString()
                  : (toIso(bs.internshipStartDate) ??
                    new Date(0).toISOString()),
            }
          : undefined,
      enrollmentType: doc.enrollmentType as "merit" | "paid" | undefined,
      status: String(doc.status ?? ""),
      examScore: typeof doc.examScore === "number" ? doc.examScore : undefined,
      internshipSuccessPoints:
        typeof doc.internshipSuccessPoints === "number"
          ? doc.internshipSuccessPoints
          : 0,
      enrolledAt: toIso(doc.enrolledAt),
      createdAt: doc.createdAt
        ? toIso((doc as { createdAt: unknown }).createdAt)
        : undefined,
      updatedAt: doc.updatedAt
        ? toIso((doc as { updatedAt: unknown }).updatedAt)
        : undefined,
      ...examWindowById.get(String(doc._id)),
      ...certWindowByEnrollmentId.get(String(doc._id)),
    };
  });

  return { enrollments, total, page: p, totalPages };
}

// ─── Learner: get entrance exam for a specific enrollment ────────────────────

export type LearnerEntranceExamQuestion = {
  questionId: string;
  questionText: string;
  type: "mcq" | "file_upload";
  score: number;
  options?: { optionId: string; text: string }[];
};

export type LearnerEntranceExam = {
  examId: string;
  enrollmentId: string;
  internshipId: string;
  batchId: string;
  title: string;
  description: string;
  totalScore: number;
  thresholdScore?: number;
  examStartAt?: string;
  examEndAt?: string;
  examResultAt?: string;
  questions: LearnerEntranceExamQuestion[];
  /** Existing draft submission id (if the learner already started). */
  existingSubmissionId?: string;
};

export async function getLearnerEntranceExam(
  enrollmentId: string,
  userId: mongoose.Types.ObjectId,
): Promise<LearnerEntranceExam> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const enrollment =
    await InternshipEnrollmentModel.findById(enrollmentId)
      .select(ENROLLMENT_DOC_OMIT_APPLICATION_SNAPSHOT)
      .lean();
  if (!enrollment) throw new AppError("Enrollment not found", 404);
  if (String((enrollment as { user?: unknown }).user) !== String(userId)) {
    throw new AppError("Forbidden", 403);
  }
  const status = String((enrollment as { status?: unknown }).status ?? "");
  if (status !== "exam_registered" && status !== "exam_attempted") {
    throw new AppError(
      "No entrance exam available for this enrollment's current status",
      400,
    );
  }

  const internshipId = String(
    (enrollment as { internship?: unknown }).internship ?? "",
  );
  const batchId = String(
    (enrollment as { batchSnapshot?: { batchId?: string } }).batchSnapshot
      ?.batchId ?? "",
  );
  if (!mongoose.Types.ObjectId.isValid(internshipId)) {
    throw new AppError("Enrollment has no valid internship reference", 500);
  }

  const internship = await InternshipModel.findById(internshipId)
    .select(
      "batches._id batches.entranceExamTemplateId batches.entranceExamStartAt batches.entranceExamEndAt",
    )
    .lean();
  if (!internship) throw new AppError("Internship not found", 404);

  const batches =
    (
      internship as {
        batches?: {
          _id?: unknown;
          entranceExamTemplateId?: unknown;
          entranceExamStartAt?: Date;
          entranceExamEndAt?: Date;
        }[];
      }
    ).batches ?? [];
  const batch = batches.find((b) => String(b._id) === batchId);
  if (!batch?.entranceExamTemplateId) {
    throw new AppError("This batch has no entrance exam configured", 400);
  }

  const examId = String(batch.entranceExamTemplateId);
  const exam = await InternshipExamModel.findById(examId).lean();
  if (!exam || !(exam as { isActive?: boolean }).isActive) {
    throw new AppError("Entrance exam not found or inactive", 404);
  }

  const entranceStart = batch.entranceExamStartAt;
  const entranceEnd = batch.entranceExamEndAt;
  const now = new Date();
  if (entranceStart && now.getTime() < entranceStart.getTime()) {
    throw new AppError("The exam window has not opened yet", 403);
  }
  if (entranceEnd && now.getTime() > entranceEnd.getTime()) {
    throw new AppError("The exam window has closed", 403);
  }

  const eAny = exam as {
    title?: string;
    description?: string;
    totalScore?: number;
    thresholdScore?: number;
    examResultAt?: Date;
    questions?: unknown[];
    isActive?: boolean;
  };

  // Fetch questions (scrub isCorrect)
  const qIds = Array.isArray(eAny.questions)
    ? eAny.questions.map((q) => new mongoose.Types.ObjectId(String(q)))
    : [];
  const qDocs = await (
    await import("../models/internshipQuestion.schema")
  ).InternshipQuestionModel.find({ _id: { $in: qIds } })
    .select("questionText type score options referenceFile")
    .lean();

  const questions: LearnerEntranceExamQuestion[] = qIds
    .map((oid) =>
      qDocs.find((d) => String((d as { _id: unknown })._id) === String(oid)),
    )
    .filter((q): q is NonNullable<typeof q> => q != null)
    .map((q) => {
      const qAny = q as {
        _id: unknown;
        questionText?: string;
        type?: string;
        score?: number;
        options?: { _id?: unknown; text?: unknown; isCorrect?: unknown }[];
      };
      const out: LearnerEntranceExamQuestion = {
        questionId: String(qAny._id),
        questionText: String(qAny.questionText ?? ""),
        type: (qAny.type === "file_upload" ? "file_upload" : "mcq") as
          | "mcq"
          | "file_upload",
        score: typeof qAny.score === "number" ? qAny.score : 0,
      };
      if (qAny.type === "mcq" && Array.isArray(qAny.options)) {
        out.options = qAny.options.map((o) => ({
          optionId: String(o._id ?? ""),
          text: String(o.text ?? ""),
          // isCorrect intentionally excluded for learners
        }));
      }
      return out;
    });

  // Check for existing draft submission
  const { InternshipSubmissionModel } =
    await import("../models/internshipSubmission.schema");
  const existingSub = await InternshipSubmissionModel.findOne({
    userId,
    examId,
    batchId,
    status: "draft",
  })
    .select("_id")
    .lean();

  return {
    examId,
    enrollmentId,
    internshipId,
    batchId,
    title: String(eAny.title ?? "Entrance Exam"),
    description: String(eAny.description ?? ""),
    totalScore: typeof eAny.totalScore === "number" ? eAny.totalScore : 0,
    thresholdScore:
      typeof eAny.thresholdScore === "number" ? eAny.thresholdScore : undefined,
    examStartAt:
      entranceStart instanceof Date
        ? entranceStart.toISOString()
        : undefined,
    examEndAt:
      entranceEnd instanceof Date ? entranceEnd.toISOString() : undefined,
    examResultAt:
      eAny.examResultAt instanceof Date
        ? eAny.examResultAt.toISOString()
        : undefined,
    questions,
    existingSubmissionId: existingSub
      ? String((existingSub as { _id: unknown })._id)
      : undefined,
  };
}

// ─── Admin: update enrollment status ─────────────────────────────────────────

const ALLOWED_ADMIN_TRANSITIONS: Record<string, string[]> = {
  /** Admin may move straight to merit pool (e.g. shortlist without exam attempt on file). */
  exam_registered: ["exam_attempted", "in_merit_pool", "admin_rejected"],
  exam_attempted: ["in_merit_pool", "admin_rejected"],
  in_merit_pool: ["enrolled", "admin_rejected"],
  /** Paid track before gateway clears — admin may still reject the candidate. */
  payment_pending: ["admin_rejected"],
  enrolled: ["completed", "paused", "revoked"],
  /** Allow marking complete without unpausing first (operational shortcut). */
  paused: ["enrolled", "revoked", "completed"],
};

/** Statuses where changing cohort is blocked (terminal / withdrawn). */
const DISALLOW_ADMIN_BATCH_MOVE_STATUSES = new Set([
  "admin_rejected",
  "dropped",
  "revoked",
]);

export async function adminUpdateEnrollmentStatus(
  enrollmentId: string,
  newStatus: string,
  adminUserId: mongoose.Types.ObjectId,
  rejectionNote?: string,
): Promise<InternshipEnrollmentListRow> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new AppError("Enrollment not found", 404);

  const allowed = ALLOWED_ADMIN_TRANSITIONS[doc.status as string] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from "${doc.status}" to "${newStatus}"`,
      400,
    );
  }

  doc.status = newStatus as typeof doc.status;
  doc.adminActionBy = adminUserId;
  doc.adminActionAt = new Date();

  if (newStatus === "admin_rejected" && rejectionNote) {
    doc.adminRejectionNote = rejectionNote;
  }
  if (newStatus === "enrolled") {
    doc.enrolledAt = new Date();
    const ans = doc.applicationAnswers as Record<string, unknown> | undefined;
    const months = parseProgramDurationMonthsFromAnswers(ans ?? null);
    if (months != null) doc.programDurationMonths = months;
  }

  await doc.save();
  return getInternshipEnrollmentByIdAdmin(enrollmentId);
}

/**
 * Admin: move an enrollment to another cohort (same internship).
 * Updates `batchSnapshot` only; task timelines stay anchored to `enrolledAt`.
 */
export async function adminChangeEnrollmentBatch(
  enrollmentId: string,
  newBatchId: string,
  adminUserId: mongoose.Types.ObjectId,
): Promise<InternshipEnrollmentListRow> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const trimmedBatch = String(newBatchId ?? "").trim();
  if (!trimmedBatch) {
    throw new AppError("batchId is required", 400);
  }

  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new AppError("Enrollment not found", 404);

  const st = String(doc.status ?? "");
  if (DISALLOW_ADMIN_BATCH_MOVE_STATUSES.has(st)) {
    throw new AppError(
      `Cannot change batch when enrollment status is "${st}"`,
      400,
    );
  }

  const internshipOid = doc.internship as mongoose.Types.ObjectId;
  const internship = await InternshipModel.findById(internshipOid).lean();
  if (!internship) throw new AppError("Internship not found", 404);

  type BatchLean = {
    _id: unknown;
    name: string;
    internshipStartDate: Date;
    isActive?: boolean;
  };
  const batches = Array.isArray(
    (internship as { batches?: BatchLean[] }).batches,
  )
    ? (internship as { batches: BatchLean[] }).batches
    : [];
  const batch = batches.find((b) => String(b._id) === trimmedBatch);
  if (!batch) {
    throw new AppError("Batch not found on this internship", 404);
  }
  if (batch.isActive === false) {
    throw new AppError("Cannot move to an inactive batch", 400);
  }

  const currentBid =
    doc.batchSnapshot &&
    typeof doc.batchSnapshot === "object" &&
    typeof (doc.batchSnapshot as { batchId?: string }).batchId === "string"
      ? String((doc.batchSnapshot as { batchId: string }).batchId)
      : "";
  if (currentBid === trimmedBatch) {
    return getInternshipEnrollmentByIdAdmin(enrollmentId);
  }

  const conflict = await InternshipEnrollmentModel.findOne({
    user: doc.user,
    internship: internshipOid,
    "batchSnapshot.batchId": trimmedBatch,
    _id: { $ne: doc._id },
  })
    .select("_id")
    .lean();
  if (conflict) {
    throw new AppError(
      "This learner already has an enrollment in the selected batch",
      409,
    );
  }

  doc.batchSnapshot = {
    batchId: String(batch._id),
    name: batch.name,
    internshipStartDate: batch.internshipStartDate,
  };
  doc.adminActionBy = adminUserId;
  doc.adminActionAt = new Date();

  try {
    await doc.save();
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? (e as { code?: number }).code
        : undefined;
    if (code === 11000) {
      throw new AppError(
        "Another enrollment already exists for this learner in the selected batch",
        409,
      );
    }
    throw e;
  }

  return getInternshipEnrollmentByIdAdmin(enrollmentId);
}

/** Merit-path statuses an admin can resolve to `enrolled` in one action. */
const APPROVABLE_MERIT_TO_ENROLLED = new Set([
  "exam_registered",
  "exam_attempted",
  "in_merit_pool",
]);

/**
 * Admin: confirm merit candidates into the program as `enrolled` in a single
 * action (no separate “merit pool” step on the client). Idempotent for
 * already-enrolled rows.
 */
export async function adminApproveMeritToEnrolled(
  enrollmentId: string,
  adminUserId: mongoose.Types.ObjectId,
): Promise<InternshipEnrollmentListRow> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new AppError("Enrollment not found", 404);

  const s = String(doc.status ?? "");
  if (s === "enrolled") {
    return getInternshipEnrollmentByIdAdmin(enrollmentId);
  }
  if (!APPROVABLE_MERIT_TO_ENROLLED.has(s)) {
    throw new AppError(`Cannot approve to enrolled from status "${s}"`, 400);
  }

  doc.status = "enrolled" as typeof doc.status;
  doc.enrolledAt = new Date();
  doc.adminActionBy = adminUserId;
  doc.adminActionAt = new Date();
  const ans = doc.applicationAnswers as Record<string, unknown> | undefined;
  const months = parseProgramDurationMonthsFromAnswers(ans ?? null);
  if (months != null) doc.programDurationMonths = months;
  await doc.save();
  return getInternshipEnrollmentByIdAdmin(enrollmentId);
}

export type BulkApproveMeritToEnrolledItem = {
  enrollmentId: string;
  ok: boolean;
  error?: string;
};

/**
 * Run {@link adminApproveMeritToEnrolled} for each id; collects per-row
 * errors so the client can show partial success.
 */
export async function adminBulkApproveMeritToEnrolled(
  enrollmentIds: string[],
  adminUserId: mongoose.Types.ObjectId,
): Promise<{
  results: BulkApproveMeritToEnrolledItem[];
  ok: number;
  failed: number;
}> {
  const unique = [
    ...new Set(enrollmentIds.map((id) => String(id).trim())),
  ].filter((id) => mongoose.Types.ObjectId.isValid(id));
  const results: BulkApproveMeritToEnrolledItem[] = [];
  let ok = 0;
  let failed = 0;
  for (const id of unique) {
    try {
      await adminApproveMeritToEnrolled(id, adminUserId);
      results.push({ enrollmentId: id, ok: true });
      ok += 1;
    } catch (e) {
      const msg = e instanceof AppError ? e.message : "Update failed";
      results.push({ enrollmentId: id, ok: false, error: msg });
      failed += 1;
    }
  }
  return { results, ok, failed };
}

// ─── Admin: delete enrollment (e.g. remove mistaken exam registration) ───────

export async function deleteInternshipEnrollmentAdmin(
  enrollmentId: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const oid = new mongoose.Types.ObjectId(enrollmentId);
  const deleted = await InternshipEnrollmentModel.findByIdAndDelete(oid);
  if (!deleted) throw new AppError("Enrollment not found", 404);
  await InternshipSubmissionModel.deleteMany({ enrollmentId: oid });
}

// ─── Admin: list cohorts that have an entrance exam (for navigation) ───────

export type EntranceExamCohortRow = {
  internshipId: string;
  internshipTitle: string;
  internshipSlug: string;
  batchId: string;
  batchName: string;
  applicationLastDate: string;
  internshipStartDate: string;
  examId: string;
  examTitle: string;
};

export async function listEntranceExamCohortsAdmin(): Promise<
  EntranceExamCohortRow[]
> {
  const internships = await InternshipModel.find({})
    .select("title slug batches isActive")
    .lean();

  type BatchLean = {
    _id: unknown;
    name?: string;
    isActive?: boolean;
    entranceExamTemplateId?: unknown;
    applicationLastDate?: Date;
    internshipStartDate?: Date;
  };

  const rows: EntranceExamCohortRow[] = [];

  for (const ins of internships) {
    if ((ins as { isActive?: boolean }).isActive === false) continue;
    const insId = String((ins as { _id: unknown })._id);
    const title = String((ins as { title?: string }).title ?? "");
    const slug = String((ins as { slug?: string }).slug ?? "");
    const batches = Array.isArray((ins as { batches?: BatchLean[] }).batches)
      ? (ins as { batches: BatchLean[] }).batches
      : [];
    for (const b of batches) {
      if (b.isActive === false) continue;
      const tid = b.entranceExamTemplateId;
      if (!tid) continue;
      const appD = b.applicationLastDate;
      const startD = b.internshipStartDate;
      rows.push({
        internshipId: insId,
        internshipTitle: title,
        internshipSlug: slug,
        batchId: String(b._id),
        batchName: String(b.name ?? "Batch"),
        applicationLastDate:
          appD instanceof Date && !Number.isNaN(appD.getTime())
            ? appD.toISOString()
            : new Date(0).toISOString(),
        internshipStartDate:
          startD instanceof Date && !Number.isNaN(startD.getTime())
            ? startD.toISOString()
            : new Date(0).toISOString(),
        examId: String(tid),
        examTitle: "",
      });
    }
  }

  const uniqueExamIds = [...new Set(rows.map((r) => r.examId))].map(
    (s) => new mongoose.Types.ObjectId(s),
  );
  const examDocs = await InternshipExamModel.find({
    _id: { $in: uniqueExamIds },
  })
    .select("title")
    .lean();
  const titleById = new Map(
    examDocs.map((e) => [
      String(e._id),
      String((e as { title?: string }).title ?? ""),
    ]),
  );
  for (const r of rows) {
    r.examTitle = titleById.get(r.examId) || "Entrance exam";
  }

  return rows.sort((a, b) => {
    const t = a.internshipTitle.localeCompare(b.internshipTitle);
    if (t !== 0) return t;
    return a.batchName.localeCompare(b.batchName);
  });
}

/** Same row shape as entrance exams; `examId` is the certification template id. */
export type CertificationExamCohortRow = EntranceExamCohortRow;

/**
 * Admin: cohorts that have a certification exam template (program-phase exam).
 */
export async function listCertificationExamCohortsAdmin(): Promise<
  CertificationExamCohortRow[]
> {
  const internships = await InternshipModel.find({})
    .select("title slug batches isActive")
    .lean();

  type BatchLean = {
    _id: unknown;
    name?: string;
    isActive?: boolean;
    certificationExamTemplateId?: unknown;
    applicationLastDate?: Date;
    internshipStartDate?: Date;
  };

  const rows: CertificationExamCohortRow[] = [];

  for (const ins of internships) {
    if ((ins as { isActive?: boolean }).isActive === false) continue;
    const insId = String((ins as { _id: unknown })._id);
    const title = String((ins as { title?: string }).title ?? "");
    const slug = String((ins as { slug?: string }).slug ?? "");
    const batches = Array.isArray((ins as { batches?: BatchLean[] }).batches)
      ? (ins as { batches: BatchLean[] }).batches
      : [];
    for (const b of batches) {
      if (b.isActive === false) continue;
      const tid = b.certificationExamTemplateId;
      if (!tid) continue;
      const appD = b.applicationLastDate;
      const startD = b.internshipStartDate;
      rows.push({
        internshipId: insId,
        internshipTitle: title,
        internshipSlug: slug,
        batchId: String(b._id),
        batchName: String(b.name ?? "Batch"),
        applicationLastDate:
          appD instanceof Date && !Number.isNaN(appD.getTime())
            ? appD.toISOString()
            : new Date(0).toISOString(),
        internshipStartDate:
          startD instanceof Date && !Number.isNaN(startD.getTime())
            ? startD.toISOString()
            : new Date(0).toISOString(),
        examId: String(tid),
        examTitle: "",
      });
    }
  }

  const uniqueExamIds = [...new Set(rows.map((r) => r.examId))].map(
    (s) => new mongoose.Types.ObjectId(s),
  );
  const examDocs = await InternshipExamModel.find({
    _id: { $in: uniqueExamIds },
  })
    .select("title")
    .lean();
  const titleById = new Map(
    examDocs.map((e) => [
      String(e._id),
      String((e as { title?: string }).title ?? ""),
    ]),
  );
  for (const r of rows) {
    r.examTitle = titleById.get(r.examId) || "Certification exam";
  }

  return rows.sort((a, b) => {
    const t = a.internshipTitle.localeCompare(b.internshipTitle);
    if (t !== 0) return t;
    return a.batchName.localeCompare(b.batchName);
  });
}

// ─── Learner: program detail by slug ─────────────────────────────────────────

export type LearnerTaskRow = {
  _id: string;
  title: string;
  description: string;
  taskType: "attendance" | "task";
  totalScore: number;
  scoreThreshold: number;
  unlockAfterDays: number;
  dueDays: number;
  questionCount: number;
  isUnlocked: boolean;
  isDue: boolean;
  /** ISO string: when this task becomes available. */
  visibleFrom: string;
  /** ISO string: submission deadline. */
  dueAt: string;
  /** Exists when the learner has already started or submitted this task. */
  submission?: {
    _id: string;
    status: string;
    totalAwardedScore: number;
  };
};

export type LearnerProgramDetail = {
  enrollment: {
    _id: string;
    status: string;
    enrollmentType?: string;
    enrolledAt?: string;
    internshipSuccessPoints: number;
    /** From live internship doc — min points before certification exam (0 = none). */
    certificationThreshold: number;
    /**
     * Points still needed to reach `certificationThreshold` (0 if already met or no gate).
     */
    certificationPointsShortfall?: number;
    /**
     * Rough INR to buy exactly the shortfall at `internshipSuccessPointPurchase.inrPerPoint`, if purchase is enabled.
     */
    approxInrToReachCertificationThreshold?: number;
    internshipId: string;
    batchId: string;
    internshipSnapshot?: {
      title: string;
      slug: string;
      thumbnail?: string;
    };
    batchSnapshot?: {
      batchId: string;
      name: string;
      internshipStartDate: string;
    };
  };
  tasks: LearnerTaskRow[];
  /** INR per purchased internship success point (certification), when configured */
  internshipSuccessPointPurchase?: {
    inrPerPoint: number;
  };
};

/**
 * Returns the learner's enrolled-program detail for a given internship slug,
 * including the list of **unlocked** task templates with submission state.
 *
 * Only users with status `enrolled | completed | paused` can access this.
 */
export async function getLearnerProgramBySlug(
  userId: mongoose.Types.ObjectId,
  slug: string,
): Promise<LearnerProgramDetail> {
  const { InternshipTaskModel } = await import("../models/internshipTask.schema");
  const { InternshipSubmissionModel } = await import("../models/internshipSubmission.schema");

  const trimmed = slug.trim();
  const normalizedSlug = trimmed.toLowerCase();

  // 1. Resolve internship: prefer current canonical slug (stored lowercase on Internship).
  //    Fallback: match enrollment snapshot slug — frozen at signup time, so it still works
  //    after an admin renames the internship (dashboard links often use snapshot slug).
  let internship = await InternshipModel.findOne({ slug: normalizedSlug })
    .select("_id batches certificationThreshold")
    .lean();

  let enrollment: Record<string, unknown> | null = null;

  if (internship) {
    enrollment = await InternshipEnrollmentModel.findOne({
      user: userId,
      internship: internship._id,
    })
      .select(ENROLLMENT_DOC_OMIT_APPLICATION_SNAPSHOT)
      .sort({ createdAt: -1 })
      .lean();
  } else {
    enrollment = await InternshipEnrollmentModel.findOne({
      user: userId,
      "internshipSnapshot.slug": new RegExp(
        `^${escapeRegex(trimmed)}$`,
        "i",
      ),
    })
      .select(ENROLLMENT_DOC_OMIT_APPLICATION_SNAPSHOT)
      .sort({ createdAt: -1 })
      .lean();

    if (enrollment) {
      internship = await InternshipModel.findById(enrollment.internship as mongoose.Types.ObjectId)
        .select("_id batches certificationThreshold")
        .lean();
    }
  }

  if (!internship) {
    throw new AppError("Program not found", 404);
  }

  if (!enrollment) {
    throw new AppError("You are not enrolled in this program", 403);
  }

  type LeanEnrollmentDoc = {
    _id: mongoose.Types.ObjectId | string;
    status: string;
    enrollmentType?: string;
    enrolledAt?: Date | string;
    createdAt?: Date | string;
    internshipSnapshot?: {
      title?: string;
      slug?: string;
      thumbnail?: string;
    };
    batchSnapshot?: {
      batchId?: string;
      name?: string;
      internshipStartDate?: Date | string;
    };
    internshipSuccessPoints?: number;
  };
  const doc = enrollment as LeanEnrollmentDoc;

  const ALLOWED_STATUSES = new Set(["enrolled", "completed", "paused"]);
  if (!ALLOWED_STATUSES.has(doc.status)) {
    throw new AppError(
      "Your enrollment is not yet active for this program",
      403,
    );
  }

  // 3. Get the batch's task template IDs
  const batchId = doc.batchSnapshot?.batchId ?? "";
  type BatchLike = { _id?: unknown; taskTemplateIds?: unknown[] };
  const batches =
    (internship as { batches?: BatchLike[] }).batches ?? [];
  const matchedBatch = batches.find((b) => String(b._id) === batchId);
  const rawTaskIds: unknown[] = Array.isArray(matchedBatch?.taskTemplateIds)
    ? matchedBatch!.taskTemplateIds
    : [];

  const taskOids = rawTaskIds
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(String(id));
      } catch {
        return null;
      }
    })
    .filter((x): x is mongoose.Types.ObjectId => x !== null);

  // 4. Compute anchor date
  const rawEnrolledAt = doc.enrolledAt ?? doc.createdAt;
  const enrolledAt =
    rawEnrolledAt instanceof Date ? rawEnrolledAt : new Date(rawEnrolledAt ?? Date.now());

  const MS_PER_DAY = 86_400_000;
  const now = Date.now();

  // 5. Fetch tasks and filter to unlocked ones
  const taskDocs =
    taskOids.length > 0
      ? await InternshipTaskModel.find({ _id: { $in: taskOids }, isActive: true })
          .select(
            "title description taskType totalScore scoreThreshold unlockAfterDays dueDays questions",
          )
          .lean()
      : [];

  const unlockedTasks: LearnerTaskRow[] = [];

  for (const task of taskDocs) {
    const unlockAfterDays =
      typeof task.unlockAfterDays === "number" ? task.unlockAfterDays : 0;
    const dueDays = typeof task.dueDays === "number" ? task.dueDays : 0;
    const visibleFrom = new Date(
      enrolledAt.getTime() + unlockAfterDays * MS_PER_DAY,
    );
    const dueAt = new Date(enrolledAt.getTime() + dueDays * MS_PER_DAY);

    if (now < visibleFrom.getTime()) continue; // locked — skip

    const sub = await InternshipSubmissionModel.findOne({
      userId,
      taskId: String(task._id),
      batchId,
    })
      .select("_id status totalAwardedScore")
      .lean();

    unlockedTasks.push({
      _id: String(task._id),
      title: String(task.title ?? ""),
      description: String(
        (task as { description?: string }).description ?? "",
      ),
      taskType:
        (task as { taskType?: string }).taskType === "attendance"
          ? "attendance"
          : "task",
      totalScore: typeof task.totalScore === "number" ? task.totalScore : 0,
      scoreThreshold:
        typeof (task as { scoreThreshold?: number }).scoreThreshold === "number"
          ? (task as { scoreThreshold: number }).scoreThreshold
          : 0,
      unlockAfterDays,
      dueDays,
      questionCount: Array.isArray(task.questions) ? task.questions.length : 0,
      isUnlocked: true,
      isDue: now >= dueAt.getTime(),
      visibleFrom: visibleFrom.toISOString(),
      dueAt: dueAt.toISOString(),
      submission: sub
        ? {
            _id: String(sub._id),
            status: String(sub.status ?? ""),
            totalAwardedScore:
              typeof sub.totalAwardedScore === "number"
                ? sub.totalAwardedScore
                : 0,
          }
        : undefined,
    });
  }

  const snap = doc.internshipSnapshot as
    | { title?: string; slug?: string; thumbnail?: string }
    | undefined;
  const bsnap = doc.batchSnapshot as
    | {
        batchId?: string;
        name?: string;
        internshipStartDate?: Date | string;
      }
    | undefined;

  const certificationThresholdRaw = (internship as {
    certificationThreshold?: unknown;
  }).certificationThreshold;
  const certificationThreshold =
    typeof certificationThresholdRaw === "number" &&
    !Number.isNaN(certificationThresholdRaw)
      ? Math.max(0, Math.floor(certificationThresholdRaw))
      : 0;

  const settings = await getPointsSettings();
  const priceInr = settings.internshipSuccessPointInr;
  const internshipSuccessPointPurchase =
    certificationThreshold > 0 &&
    typeof priceInr === "number" &&
    priceInr > 0
      ? { inrPerPoint: priceInr }
      : undefined;

  const enrolledPoints =
    typeof doc.internshipSuccessPoints === "number"
      ? doc.internshipSuccessPoints
      : 0;
  const certificationPointsShortfall =
    certificationThreshold > 0
      ? Math.max(0, certificationThreshold - enrolledPoints)
      : undefined;
  const approxInrToReachCertificationThreshold =
    certificationPointsShortfall != null &&
    certificationPointsShortfall > 0 &&
    typeof priceInr === "number" &&
    priceInr > 0
      ? Math.round(certificationPointsShortfall * priceInr * 100) / 100
      : undefined;

  return {
    enrollment: {
      _id: String(doc._id),
      status: doc.status,
      enrollmentType: doc.enrollmentType ?? undefined,
      enrolledAt: toIso(doc.enrolledAt),
      internshipSuccessPoints: enrolledPoints,
      certificationThreshold,
      ...(certificationPointsShortfall != null
        ? { certificationPointsShortfall }
        : {}),
      ...(approxInrToReachCertificationThreshold != null
        ? { approxInrToReachCertificationThreshold }
        : {}),
      internshipId: String(internship._id),
      batchId,
      internshipSnapshot: snap
        ? {
            title: String(snap.title ?? ""),
            slug: String(snap.slug ?? ""),
            thumbnail:
              typeof snap.thumbnail === "string" ? snap.thumbnail : undefined,
          }
        : undefined,
      batchSnapshot: bsnap
        ? {
            batchId: String(bsnap.batchId ?? ""),
            name: String(bsnap.name ?? ""),
            internshipStartDate: toIso(bsnap.internshipStartDate) ?? "",
          }
        : undefined,
    },
    tasks: unlockedTasks,
    ...(internshipSuccessPointPurchase
      ? { internshipSuccessPointPurchase }
      : {}),
  };
}
