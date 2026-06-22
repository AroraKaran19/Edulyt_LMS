import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { OrderModel } from "../models/order.schema";
import { UserModel } from "../models/user.schema";
import { AppError } from "../middlewares/error.middleware";
import {
  isApplicationWindowOpenIst,
  isPaidUpgradeWindowOpen,
} from "../utils/applicationWindow";
import { getPointsSettings } from "./pointsSettings.services";
import { tryAwardInternshipRegistrationPoints } from "./successPoints.services";
import { computeInternshipEligibility } from "./internshipEligibility.services";
import {
  computeCertificationExamWindowUtc,
  isInstantWithinWindowUtc,
  parseProgramDurationMonthsFromAnswers,
} from "../lib/certificationExamSchedule";
import { cached, PUBLIC_CACHE_TTL_MS } from "../utils/ttlCache";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalize `internship` ref from a lean enrollment doc (ObjectId or populated). */
function internshipRefToId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "object" && raw !== null && "_id" in raw) {
    const id = (raw as { _id: unknown })._id;
    if (id != null && mongoose.Types.ObjectId.isValid(String(id))) {
      return String(id);
    }
    return null;
  }
  const s = String(raw);
  return mongoose.Types.ObjectId.isValid(s) ? s : null;
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
    profilePicture?: string;
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
    /** ISO — “apply by” date captured at registration (optional on older rows). */
    applicationLastDate?: string;
  };
  enrollmentType?: "merit" | "paid";
  status: string;
  examScore?: number;
  /** ISO string — when the learner submitted the entrance exam. Absent = no-show. */
  examAttemptedAt?: string;
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
  /** Populated for learner `payment_pending` rows — live program/cohort vs signup snapshot. */
  paymentPendingContext?: {
    internshipExists: boolean;
    batchExistsOnProgram: boolean;
    applicationWindowOpen: boolean;
  };
  /**
   * Documentation submission window (ISO UTC). Populated on `pending_documentation`
   * rows so the learner-facing modal can render the IST window. Both fields
   * present together or both absent.
   */
  documentationStartAt?: string;
  documentationEndAt?: string;
  /**
   * Decrypted documentation. Only included by admin endpoints (never by learner
   * endpoints). `aadharCardNumber` is the plaintext value re-derived from the
   * stored ciphertext at request time.
   */
  documentation?: {
    aadharCardNumber: string;
    learnerPhoto: string;
    learnerPhotoS3Key: string;
    submittedAt: string;
  };
  /**
   * Rejection note written by admin when sending docs back for resubmission.
   * Returned on both admin and learner responses.
   */
  documentationRejectionNote?: string;

  /** ISO — when the offer-letter worker processed this enrollment. Admin-facing. */
  offerLetterGeneratedAt?: string;

  /** Unique intern ID assigned at offer-letter generation (e.g. "AI-00042"). Admin-facing. */
  internId?: string;

  /** Public S3 URL of the generated offer letter DOCX. Admin-facing. */
  offerLetterUrl?: string;
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
    /** Regex match against `batchSnapshot.name` only (narrower than the full-text `search`). */
    batchSearch?: string;
    /** When status is "all" or omitted: `program` = seat confirmed / post-admission; `pipeline` = exam & selection; `all` = no status filter. */
    lifecycle?: "program" | "pipeline" | "all";
    enrollmentType?: "merit" | "paid";
    /** Filter enrollments where `enrolledAt` >= this ISO date string. */
    enrolledFrom?: string;
    /** Filter enrollments where `enrolledAt` <= this ISO date string. */
    enrolledTo?: string;
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
    batchSearch,
    lifecycle,
    enrollmentType,
    enrolledFrom,
    enrolledTo,
    meritPoolFirst,
  } = options;

  const PROGRAM_STATUSES = [
    "pending_documentation",
    "docs_under_review",
    "offer_letter_pending",
    "re_pending_documentation",
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
  if (enrolledFrom || enrolledTo) {
    const dateRange: Record<string, Date> = {};
    if (enrolledFrom) {
      const d = new Date(enrolledFrom);
      if (!isNaN(d.getTime())) dateRange.$gte = d;
    }
    if (enrolledTo) {
      const d = new Date(enrolledTo);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        dateRange.$lte = d;
      }
    }
    if (Object.keys(dateRange).length > 0) preMatch.enrolledAt = dateRange;
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
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              name: 1,
              profilePicture: 1,
            },
          },
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

  if (batchSearch?.trim()) {
    const batchRx = new RegExp(escapeRegex(batchSearch.trim()), "i");
    pipeline.push({ $match: { "batchSnapshot.name": batchRx } });
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
            profilePicture:
              typeof (u as { profilePicture?: string }).profilePicture ===
              "string"
                ? (u as { profilePicture: string }).profilePicture
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
      examAttemptedAt: toIso(r.examAttemptedAt),
      internshipSuccessPoints:
        typeof r.internshipSuccessPoints === "number"
          ? r.internshipSuccessPoints
          : 0,
      enrolledAt: toIso(r.enrolledAt),
      createdAt: toIso(r.createdAt),
      updatedAt: toIso(r.updatedAt),
      // Decrypted Aadhar + photo so admin pages (doc-review queue, detail
      // modal) can render the upload without a separate per-row fetch. Only
      // populated when the learner has submitted documents.
      documentation: decryptDocumentationForAdmin(
        (r as { documentation?: unknown }).documentation,
      ),
      documentationRejectionNote:
        typeof (r as { documentationRejectionNote?: string })
          .documentationRejectionNote === "string"
          ? (r as { documentationRejectionNote: string })
              .documentationRejectionNote
          : undefined,
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
    .populate("user", "firstName lastName email name profilePicture")
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
          profilePicture:
            typeof u.profilePicture === "string" ? u.profilePicture : undefined,
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
    examAttemptedAt: toIso(doc.examAttemptedAt),
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
    documentation: decryptDocumentationForAdmin(
      (doc as { documentation?: unknown }).documentation,
    ),
    documentationRejectionNote:
      typeof (doc as { documentationRejectionNote?: string }).documentationRejectionNote === "string"
        ? (doc as { documentationRejectionNote: string }).documentationRejectionNote
        : undefined,
    offerLetterGeneratedAt: toIso(
      (doc as { offerLetterGeneratedAt?: Date }).offerLetterGeneratedAt,
    ),
    internId:
      typeof (doc as { internId?: string }).internId === "string"
        ? (doc as { internId: string }).internId
        : undefined,
    offerLetterUrl:
      typeof (doc as { offerLetterUrl?: string }).offerLetterUrl === "string"
        ? (doc as { offerLetterUrl: string }).offerLetterUrl
        : undefined,
  };
}

/**
 * Decrypts the stored Aadhar ciphertext for admin display. Returns `undefined`
 * if the enrollment hasn't submitted documents yet, or if the key is missing
 * (we surface a partial response with no number rather than 500 the listing).
 */
function decryptDocumentationForAdmin(
  raw: unknown,
):
  | {
      aadharCardNumber: string;
      learnerPhoto: string;
      learnerPhotoS3Key: string;
      submittedAt: string;
    }
  | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as {
    aadharCardNumberEnc?: string;
    aadharCardNumberIv?: string;
    aadharCardNumberTag?: string;
    learnerPhoto?: string;
    learnerPhotoS3Key?: string;
    submittedAt?: Date;
  };
  if (
    !d.aadharCardNumberEnc ||
    !d.aadharCardNumberIv ||
    !d.aadharCardNumberTag ||
    !d.learnerPhoto ||
    !d.learnerPhotoS3Key ||
    !(d.submittedAt instanceof Date)
  ) {
    return undefined;
  }
  let aadhar = "";
  try {
    // Lazy require so the encryption key isn't demanded at import time.

    const { decryptAadhar } = require("../utils/lib/aadharCrypto") as {
      decryptAadhar: (ct: {
        aadharCardNumberEnc: string;
        aadharCardNumberIv: string;
        aadharCardNumberTag: string;
      }) => string;
    };
    aadhar = decryptAadhar({
      aadharCardNumberEnc: d.aadharCardNumberEnc,
      aadharCardNumberIv: d.aadharCardNumberIv,
      aadharCardNumberTag: d.aadharCardNumberTag,
    });
  } catch {
    aadhar = "";
  }
  return {
    aadharCardNumber: aadhar,
    learnerPhoto: d.learnerPhoto,
    learnerPhotoS3Key: d.learnerPhotoS3Key,
    submittedAt: d.submittedAt.toISOString(),
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
  if (
    String(existing.status) === "enrolled" ||
    String(existing.status) === "pending_documentation"
  ) {
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

  // Merit-track learner choosing the paid seat on the form: do NOT flip
  // enrollmentType here. The promotion to "paid" happens only when payment
  // succeeds (createInternshipSeatEnrollmentAfterPayment). Until then the row
  // stays merit so the learner keeps full exam access.
  const upgradeableStatuses = [
    "exam_registered",
    "exam_attempted",
    "in_merit_pool",
    "admin_rejected",
  ] as string[];
  if (upgradeableStatuses.includes(status)) {
    if (answersDoc) {
      existing.set("applicationAnswers", answersDoc);
      existing.set("applicationSubmittedAt", new Date());
      const months = parseProgramDurationMonthsFromAnswers(answersDoc);
      if (months != null) existing.set("programDurationMonths", months);
      await existing.save();
    }
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
        ...(batch.applicationLastDate != null
          ? { applicationLastDate: batch.applicationLastDate }
          : {}),
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

    try {
      await tryAwardInternshipRegistrationPoints(String(enrollment._id));
    } catch (e) {
      // A reward failure must never break registration.
      console.error("Internship registration reward failed:", e);
    }

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
      entranceExamTemplateId?: unknown;
      entranceExamEndAt?: Date;
      plan?: { price: number; isActive?: boolean; discount?: unknown } | null;
    }[]
  )?.find((b) => String(b._id) === batchId);
  if (!batch) throw new AppError("Batch not found", 404);
  if (!batch.isActive)
    throw new AppError("Batch is not accepting registrations", 400);
  if (!batch.plan || batch.plan.isActive === false) {
    throw new AppError(
      "This cohort is not open for direct seat purchase (no plan configured)",
      400,
    );
  }

  // Existing enrollment check is done first so we can decide which window applies:
  // merit-track upgrades (failed/no-show after exam) get a 15-day post-result
  // grace window; brand-new paid signups still enforce applicationLastDate.
  const existing = await InternshipEnrollmentModel.findOne({
    user: userId,
    internship: new mongoose.Types.ObjectId(internshipId),
    "batchSnapshot.batchId": batchId,
  });

  const upgradeableMeritStatuses = new Set([
    "exam_registered",
    "exam_attempted",
    "in_merit_pool",
    "admin_rejected",
  ]);
  const isMeritUpgrade = Boolean(
    existing &&
      upgradeableMeritStatuses.has(
        String((existing as { status?: string }).status ?? ""),
      ),
  );

  if (isMeritUpgrade) {
    const templateId = batch.entranceExamTemplateId;
    if (!templateId) {
      throw new AppError(
        "Paid entry is not available for this cohort",
        400,
      );
    }
    const exam = await InternshipExamModel.findById(
      new mongoose.Types.ObjectId(String(templateId)),
    )
      .select("examResultAt")
      .lean();
    const examResultAt = (exam as { examResultAt?: Date } | null)?.examResultAt;
    if (!isPaidUpgradeWindowOpen(examResultAt, batch.entranceExamEndAt)) {
      throw new AppError(
        "The 15-day paid entry window has closed for this cohort",
        400,
      );
    }
  } else if (!isApplicationWindowOpenIst(batch.applicationLastDate)) {
    throw new AppError("The application period for this batch has ended", 400);
  }

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
        ...(batch.applicationLastDate != null
          ? { applicationLastDate: batch.applicationLastDate }
          : {}),
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
 * Learner: remove an unpaid direct-seat registration (`payment_pending`).
 * Deletes the enrollment, related draft submissions, and any pending seat payment orders.
 */
export async function withdrawPaymentPendingEnrollmentForLearner(
  userId: mongoose.Types.ObjectId,
  enrollmentId: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const oid = new mongoose.Types.ObjectId(enrollmentId);
  const doc = await InternshipEnrollmentModel.findById(oid);
  if (!doc) throw new AppError("Enrollment not found", 404);
  if (String(doc.user) !== String(userId)) {
    throw new AppError("This enrollment does not belong to you", 403);
  }
  if (doc.status !== "payment_pending" || doc.enrollmentType !== "paid") {
    throw new AppError(
      "Only unpaid direct-seat registrations can be removed this way. If you already paid, contact support.",
      400,
    );
  }

  const pendingOrders = await OrderModel.find({
    internshipEnrollmentId: oid,
    paymentStatus: "pending",
    orderKind: "internship_seat",
  })
    .select("_id")
    .lean();

  if (pendingOrders.length > 0) {
    const pullIds = pendingOrders.map(
      (o) => new mongoose.Types.ObjectId(String((o as { _id: unknown })._id)),
    );
    await OrderModel.deleteMany({ _id: { $in: pullIds } });
    await UserModel.updateOne(
      { _id: userId },
      { $pullAll: { pendingPayments: pullIds } },
    );
  }

  await InternshipSubmissionModel.deleteMany({ enrollmentId: oid });
  const deleted = await InternshipEnrollmentModel.findByIdAndDelete(oid);
  if (!deleted) throw new AppError("Enrollment not found", 404);
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
    // Mirror the wire-level masking of `in_merit_pool` → `exam_attempted`:
    // a learner filtering by either bucket gets both real `exam_attempted`
    // and (server-side) `in_merit_pool` rows, and a probe query for
    // `in_merit_pool` alone behaves identically to one for `exam_attempted`.
    // Without this, the DB filter would otherwise act as an oracle that
    // reveals pool membership even though the response status is masked.
    const expanded = new Set<string>();
    for (const s of statuses) {
      if (s === "in_merit_pool" || s === "exam_attempted") {
        expanded.add("exam_attempted");
        expanded.add("in_merit_pool");
      } else {
        expanded.add(s);
      }
    }
    baseMatch.status = { $in: [...expanded] };
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

  /** Live cohort data for `payment_pending` paid-path rows (program removed / deadline / batch). */
  const paymentPendingLiveByInternshipId = new Map<
    string,
    {
      batches: {
        _id: unknown;
        applicationLastDate?: Date;
        isActive?: boolean;
      }[];
    }
  >();

  const pendingInsIds = new Set<string>();
  for (const d of raw as Record<string, unknown>[]) {
    if (String(d.status ?? "") !== "payment_pending") continue;
    const iid = internshipRefToId(d.internship);
    if (iid) pendingInsIds.add(iid);
  }
  if (pendingInsIds.size > 0) {
    const liveDocs = await InternshipModel.find({
      _id: {
        $in: [...pendingInsIds].map(
          (id) => new mongoose.Types.ObjectId(id),
        ),
      },
    })
      .select("batches._id batches.applicationLastDate batches.isActive")
      .lean();
    for (const live of liveDocs) {
      const id = String((live as { _id: unknown })._id);
      const batches =
        (
          live as {
            batches?: {
              _id: unknown;
              applicationLastDate?: Date;
              isActive?: boolean;
            }[];
          }
        ).batches ?? [];
      paymentPendingLiveByInternshipId.set(id, { batches });
    }
  }

  // For `pending_documentation` rows, surface the documentation window of the
  // learner's batch so the dashboard modal can show IST open/close times.
  const docsWindowByEnrollmentId = new Map<
    string,
    { documentationStartAt?: string; documentationEndAt?: string }
  >();
  const docsRows = (raw as Record<string, unknown>[]).filter(
    (d) =>
      (String(d.status ?? "") === "pending_documentation" ||
        String(d.status ?? "") === "docs_under_review" ||
        String(d.status ?? "") === "re_pending_documentation") &&
      d.internship,
  );
  if (docsRows.length > 0) {
    const insIdSet = new Set<string>();
    for (const d of docsRows) {
      const insId = internshipRefToId(d.internship);
      if (insId) insIdSet.add(insId);
    }
    if (insIdSet.size > 0) {
      const insDocs = await InternshipModel.find({
        _id: {
          $in: [...insIdSet].map((id) => new mongoose.Types.ObjectId(id)),
        },
      })
        .select("batches")
        .lean();
      // Index each batch's documentation window by `${internshipId}:${batchId}`.
      const batchWindowByKey = new Map<
        string,
        { start?: Date; end?: Date }
      >();
      for (const ins of insDocs) {
        const iid = String((ins as { _id: unknown })._id);
        const batches =
          (ins as { batches?: Record<string, unknown>[] }).batches ?? [];
        for (const b of batches) {
          batchWindowByKey.set(`${iid}:${String(b._id)}`, {
            start: b.documentationStartAt as Date | undefined,
            end: b.documentationEndAt as Date | undefined,
          });
        }
      }
      for (const d of docsRows) {
        const insId = internshipRefToId(d.internship);
        const batchId = (d.batchSnapshot as { batchId?: unknown } | undefined)
          ?.batchId;
        if (!insId || !batchId) continue;
        const win = batchWindowByKey.get(`${insId}:${String(batchId)}`);
        if (!win) continue;
        docsWindowByEnrollmentId.set(String(d._id), {
          ...(win.start instanceof Date
            ? { documentationStartAt: win.start.toISOString() }
            : {}),
          ...(win.end instanceof Date
            ? { documentationEndAt: win.end.toISOString() }
            : {}),
        });
      }
    }
  }

  // For merit-path rows, fetch entrance window from the internship batch (UTC)
  // and result time from the template. `admin_rejected` is included so the
  // post-result paid-grace window can be computed on the dashboard card.
  const needsExamWindow = new Set([
    "exam_registered",
    "exam_attempted",
    "in_merit_pool",
    "admin_rejected",
  ]);
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
    const iSnap = doc.internshipSnapshot as
      | { title?: string; slug?: string; thumbnail?: string }
      | undefined;
    const bs = doc.batchSnapshot as
      | {
          batchId?: string;
          name?: string;
          internshipStartDate?: Date;
          applicationLastDate?: Date;
        }
      | undefined;
    const internshipIdFromRef = internshipRefToId(doc.internship);
    const rawStatus = String(doc.status ?? "");
    // Don't expose merit-pool membership on the wire — a learner inspecting
    // the network tab could otherwise tell they crossed the threshold and
    // are awaiting an admin pick. Surface as the indistinguishable
    // `exam_attempted` state; admin endpoints keep the real value.
    const statusStr =
      rawStatus === "in_merit_pool" ? "exam_attempted" : rawStatus;

    const internship =
      internshipIdFromRef != null
        ? {
            _id: internshipIdFromRef,
            title: String(iSnap?.title ?? ""),
            slug: typeof iSnap?.slug === "string" ? iSnap.slug : undefined,
          }
        : null;

    const snapAppRaw = bs?.applicationLastDate;
    const batchSnapshotOut =
      bs && typeof bs === "object"
        ? {
            batchId: String(bs.batchId ?? ""),
            name: String(bs.name ?? ""),
            internshipStartDate:
              bs.internshipStartDate instanceof Date
                ? bs.internshipStartDate.toISOString()
                : (toIso(bs.internshipStartDate) ??
                  new Date(0).toISOString()),
            ...(snapAppRaw instanceof Date &&
            !Number.isNaN(snapAppRaw.getTime())
              ? { applicationLastDate: snapAppRaw.toISOString() }
              : toIso(snapAppRaw)
                ? { applicationLastDate: toIso(snapAppRaw)! }
                : {}),
          }
        : undefined;

    let paymentPendingContext:
      | InternshipEnrollmentListRow["paymentPendingContext"]
      | undefined;
    if (statusStr === "payment_pending" && internshipIdFromRef != null) {
      const live = paymentPendingLiveByInternshipId.get(
        internshipIdFromRef,
      );
      const bid = String(bs?.batchId ?? "");
      const liveBatchDoc = live?.batches.find((b) => String(b._id) === bid);
      const internshipExists = Boolean(live);
      const batchExistsOnProgram = Boolean(liveBatchDoc);
      const snapApp =
        snapAppRaw instanceof Date ? snapAppRaw : undefined;
      const liveApp = liveBatchDoc?.applicationLastDate;
      const effectiveApp =
        snapApp ?? (liveApp instanceof Date ? liveApp : undefined);
      const applicationWindowOpen =
        effectiveApp != null
          ? isApplicationWindowOpenIst(effectiveApp)
          : true;

      paymentPendingContext = {
        internshipExists,
        batchExistsOnProgram,
        applicationWindowOpen,
      };
    }

    return {
      _id: id,
      user: null,
      internship,
      internshipSnapshot: iSnap?.title
        ? {
            title: String(iSnap.title),
            slug: String(iSnap.slug ?? ""),
            thumbnail:
              typeof iSnap.thumbnail === "string" ? iSnap.thumbnail : undefined,
          }
        : undefined,
      batchSnapshot: batchSnapshotOut,
      enrollmentType: doc.enrollmentType as "merit" | "paid" | undefined,
      status: statusStr,
      examScore: typeof doc.examScore === "number" ? doc.examScore : undefined,
      examAttemptedAt: toIso(doc.examAttemptedAt),
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
      ...(
        statusStr === "pending_documentation" ||
        statusStr === "docs_under_review" ||
        statusStr === "re_pending_documentation"
          ? docsWindowByEnrollmentId.get(String(doc._id)) ?? {}
          : {}
      ),
      ...(paymentPendingContext ? { paymentPendingContext } : {}),
      ...(typeof (doc as Record<string, unknown>).documentationRejectionNote === "string"
        ? { documentationRejectionNote: (doc as Record<string, unknown>).documentationRejectionNote as string }
        : {}),
      // Offer letter (+ intern ID) so the dashboard card can show the download
      // button in any stage once generated. The doc carries these (the list
      // projection only omits application answers); the learner mapping just
      // wasn't forwarding them.
      ...(typeof (doc as Record<string, unknown>).offerLetterUrl === "string"
        ? { offerLetterUrl: (doc as Record<string, unknown>).offerLetterUrl as string }
        : {}),
      ...(typeof (doc as Record<string, unknown>).internId === "string"
        ? { internId: (doc as Record<string, unknown>).internId as string }
        : {}),
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
  /** Penalty deducted on a wrong MCQ answer; 0 = no negative marking. */
  negativeScore: number;
  options?: { optionId: string; text: string }[];
  referenceFile?: string;
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

/** Static, learner-safe exam content (title + questions, isCorrect scrubbed).
 *  Identical for every student taking the same exam, so it's cached by examId
 *  to spare the cluster the template + N-question fetch on every page load
 *  during a live exam. Timing (window) is NOT cached here — it's resolved live
 *  by the caller. Returns null when the exam is missing/inactive. */
type CachedEntranceExamContent = {
  title: string;
  description: string;
  totalScore: number;
  thresholdScore?: number;
  examResultAt?: string;
  questions: LearnerEntranceExamQuestion[];
};

async function getEntranceExamContentCached(
  examId: string,
): Promise<CachedEntranceExamContent | null> {
  return cached(
    `entrance-exam:content:${examId}`,
    PUBLIC_CACHE_TTL_MS,
    async () => {
      const exam = await InternshipExamModel.findById(examId).lean();
      if (!exam || !(exam as { isActive?: boolean }).isActive) return null;

      const eAny = exam as {
        title?: string;
        description?: string;
        totalScore?: number;
        thresholdScore?: number;
        examResultAt?: Date;
        questions?: unknown[];
      };

      const qIds = Array.isArray(eAny.questions)
        ? eAny.questions.map((q) => new mongoose.Types.ObjectId(String(q)))
        : [];
      const qDocs = await (
        await import("../models/internshipQuestion.schema")
      ).InternshipQuestionModel.find({ _id: { $in: qIds } })
        .select("questionText type score negativeScore options referenceFile")
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
            negativeScore?: number;
            options?: { _id?: unknown; text?: unknown; isCorrect?: unknown }[];
            referenceFile?: string;
          };
          const isMcq = qAny.type !== "file_upload";
          const out: LearnerEntranceExamQuestion = {
            questionId: String(qAny._id),
            questionText: String(qAny.questionText ?? ""),
            type: (isMcq ? "mcq" : "file_upload") as "mcq" | "file_upload",
            score: typeof qAny.score === "number" ? qAny.score : 0,
            negativeScore:
              isMcq &&
              typeof qAny.negativeScore === "number" &&
              qAny.negativeScore > 0
                ? qAny.negativeScore
                : 0,
          };
          const ref = qAny.referenceFile;
          if (typeof ref === "string" && ref.trim()) {
            out.referenceFile = ref.trim();
          }
          if (qAny.type === "mcq" && Array.isArray(qAny.options)) {
            out.options = qAny.options.map((o) => ({
              optionId: String(o._id ?? ""),
              text: String(o.text ?? ""),
              // isCorrect intentionally excluded for learners
            }));
          }
          return out;
        });

      return {
        title: String(eAny.title ?? "Entrance Exam"),
        description: String(eAny.description ?? ""),
        totalScore: typeof eAny.totalScore === "number" ? eAny.totalScore : 0,
        thresholdScore:
          typeof eAny.thresholdScore === "number"
            ? eAny.thresholdScore
            : undefined,
        examResultAt:
          eAny.examResultAt instanceof Date
            ? eAny.examResultAt.toISOString()
            : undefined,
        questions,
      };
    },
  );
}

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

  // Live window check (timing is never cached — admins can extend it mid-exam).
  const entranceStart = batch.entranceExamStartAt;
  const entranceEnd = batch.entranceExamEndAt;
  const now = new Date();
  if (entranceStart && now.getTime() < entranceStart.getTime()) {
    throw new AppError("The exam window has not opened yet", 403);
  }
  if (entranceEnd && now.getTime() > entranceEnd.getTime()) {
    throw new AppError("The exam window has closed", 403);
  }

  // Static exam content (title + scrubbed questions) — cached by examId so a
  // batch of concurrent learners doesn't refetch the template + every question.
  const content = await getEntranceExamContentCached(examId);
  if (!content) {
    throw new AppError("Entrance exam not found or inactive", 404);
  }

  // Per-learner draft lookup stays live (changes as they answer).
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
    title: content.title,
    description: content.description,
    totalScore: content.totalScore,
    thresholdScore: content.thresholdScore,
    examStartAt:
      entranceStart instanceof Date
        ? entranceStart.toISOString()
        : undefined,
    examEndAt:
      entranceEnd instanceof Date ? entranceEnd.toISOString() : undefined,
    examResultAt: content.examResultAt,
    questions: content.questions,
    existingSubmissionId: existingSub
      ? String((existingSub as { _id: unknown })._id)
      : undefined,
  };
}

// ─── Admin: update enrollment status ─────────────────────────────────────────

const ALLOWED_ADMIN_TRANSITIONS: Record<string, string[]> = {
  exam_registered: ["exam_attempted", "in_merit_pool", "admin_rejected"],
  exam_attempted: ["in_merit_pool", "admin_rejected"],
  in_merit_pool: ["enrolled", "admin_rejected"],
  payment_pending: ["admin_rejected"],
  pending_documentation: ["docs_under_review", "enrolled", "admin_rejected", "revoked"],
  docs_under_review: ["offer_letter_pending", "re_pending_documentation", "enrolled", "admin_rejected", "revoked"],
  offer_letter_pending: ["enrolled", "revoked"],
  re_pending_documentation: ["docs_under_review", "pending_documentation", "enrolled", "admin_rejected", "revoked"],
  enrolled: ["completed", "paused", "revoked"],
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
    // Preserve existing enrolledAt if already set (e.g. via documentation flow)
    // so task unlock anchors don't drift when admin manually fast-forwards.
    if (!(doc.enrolledAt instanceof Date)) {
      doc.enrolledAt = new Date();
    }
    const ans = doc.applicationAnswers as Record<string, unknown> | undefined;
    const months = parseProgramDurationMonthsFromAnswers(ans ?? null);
    if (months != null) doc.programDurationMonths = months;
  }

  // Allocate the intern ID at this single, controlled point so every
  // downstream consumer reads the same value. Mirrors the path in
  // adminVerifyInternshipDocumentation. Idempotent: skips if already set.
  if (newStatus === "offer_letter_pending") {
    const currentInternId = (doc as unknown as Record<string, unknown>).internId;
    if (!currentInternId) {
      const { allocateNextInternId } = await import("./internId.services");
      (doc as unknown as Record<string, unknown>).internId =
        await allocateNextInternId();
    }
  }

  await doc.save();

  // Mirrors the auto-enqueue in adminVerifyInternshipDocumentation — when an
  // admin manually flips an enrollment to `offer_letter_pending` through this
  // generic status endpoint, the offer-letter worker still needs a job row.
  if (newStatus === "offer_letter_pending") {
    try {
      const { createOfferLetterJobService } = await import(
        "./offerLetterJob.services"
      );
      await createOfferLetterJobService({
        internshipEnrollmentId: String(doc._id),
      });
    } catch (e) {
      console.error(
        "[Offer Letter] Failed to enqueue job after admin status update for enrollment",
        String(doc._id),
        e,
      );
    }
  }

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
 * Merit or paid enrollees always pass through `pending_documentation` and must
 * submit Aadhar + photo before tasks unlock (see internship documentation window).
 */
function resolveSelectionStatus(
  _internshipId: mongoose.Types.ObjectId | string,
): "enrolled" | "pending_documentation" {
  return "pending_documentation";
}

/**
 * Throw a 403 with code `DOCUMENTATION_PENDING` if the enrollment is gated
 * waiting for the learner to submit Aadhar + photo. Frontend uses the code
 * to open the documentation modal.
 */
export function assertNotPendingDocumentation(status: string | undefined): void {
  if (status === "pending_documentation") {
    throw new AppError(
      "Submit your Aadhar and photo to unlock tasks and the certification exam.",
      403,
      "DOCUMENTATION_PENDING",
    );
  }
}

/**
 * Admin: confirm merit candidates into the program (`pending_documentation` until
 * they submit documents, then learners become `enrolled`). Idempotent for rows
 * already at `enrolled` or `pending_documentation`.
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
  if (s === "enrolled" || s === "pending_documentation") {
    return getInternshipEnrollmentByIdAdmin(enrollmentId);
  }
  if (!APPROVABLE_MERIT_TO_ENROLLED.has(s)) {
    throw new AppError(`Cannot approve to enrolled from status "${s}"`, 400);
  }

  // `enrolledAt` is set at selection regardless of status — it anchors task
  // unlock dates, which must align with the cohort schedule, not the moment
  // the learner submits documents.
  const nextStatus = resolveSelectionStatus(
    doc.internship as mongoose.Types.ObjectId,
  );
  doc.status = nextStatus as typeof doc.status;
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
  /** Total marks (grade max) for this task. */
  totalScore: number;
  scoreThreshold: number;
  /** Internship success points this task awards on pass (marks >= scoreThreshold). */
  successPoints: number;
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
    /** True when a reviewer sent a file answer back for re-upload. */
    needsResubmission: boolean;
  };
};

export type LearnerProgramDetail = {
  enrollment: {
    _id: string;
    status: string;
    enrollmentType?: string;
    enrolledAt?: string;
    internshipSuccessPoints: number;
    /**
     * From live internship doc — **percentage** (0–100) of total achievable
     * required to receive the certificate. 0 = no gate.
     */
    certificationThreshold: number;
    /** Total points achievable across tasks + meetings + cert exam in window. */
    certificationTotalAchievable?: number;
    /** `ceil(totalAchievable × certificationThreshold / 100)` — absolute points required. */
    certificationRequiredPoints?: number;
    /** Gate 1 — true if learner has met the work-points threshold. */
    certificationMeetsThreshold?: boolean;
    /** Gate 2 — true if the learner has passed the certification exam. */
    certificationExamPassed?: boolean;
    /** Both gates cleared — learner qualifies for the certificate. */
    certificateEligible?: boolean;
    /** Where the achievable work points come from (tasks vs attendance). */
    certificationBreakdown?: { tasksTotal: number; attendanceTotal: number };
    /**
     * Points still needed to reach `certificationRequiredPoints` (0 if already met or no gate).
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
    /** Unique intern ID (e.g. "AI-00042") — present once offer letter has been generated. */
    internId?: string;
    /** Offer letter PDF — present once issued. */
    offerLetterUrl?: string;
    /**
     * Cohort assigns a certification exam template (`certification`).
     * When false, certification points/top-up UX uses task-only thresholds.
     */
    certificationExamConfigured?: boolean;
    /**
     * When `certificationExamConfigured`: learner has a non-draft submission for that exam (sat / submitted exam).
     * Omitted when not configured — client treats `certificationExamSubmitted === true` only when cohort has an exam.
     */
    certificationExamSubmitted?: boolean;
  };
  tasks: LearnerTaskRow[];
  /** INR per purchased internship success point (certification), when configured */
  internshipSuccessPointPurchase?: {
    inrPerPoint: number;
  };
};

// ─── Public offer-letter verification ────────────────────────────────────────

/**
 * Public-safe payload returned when an HR / verifier scans the QR on an
 * issued offer letter. Contains no email, no Aadhar, no learner ID — only
 * what a verifier needs to confirm the letter is authentic.
 */
export type InternshipVerification = {
  internId: string;
  learnerName: string;
  internshipTitle: string;
  batchName?: string;
  status: string;
  enrolledAt?: string;
  offerLetterGeneratedAt?: string;
};

/**
 * Look up an enrollment by its public `internId` (printed on the offer letter)
 * and return a public-safe verification shape. Used by the public
 * `/verify/intern/:internId` page hit when scanning the QR.
 */
export async function getInternshipVerification(
  internId: string,
): Promise<InternshipVerification> {
  const id = String(internId ?? "").trim();
  if (!/^AI-\d{4,8}$/.test(id)) {
    throw new AppError("Invalid intern ID", 400);
  }

  const doc = await InternshipEnrollmentModel.findOne({ internId: id })
    .select(
      "internId status enrolledAt offerLetterGeneratedAt internshipSnapshot batchSnapshot user",
    )
    .populate({ path: "user", select: "firstName lastName name" })
    .lean();

  if (!doc) {
    throw new AppError("Offer letter not found", 404);
  }

  const u = (doc as { user?: { firstName?: string; lastName?: string; name?: string } }).user;
  const learnerName = u
    ? ([u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        u.name ||
        "Intern")
    : "Intern";

  const iSnap = (doc as { internshipSnapshot?: { title?: string } })
    .internshipSnapshot;
  const bSnap = (doc as { batchSnapshot?: { name?: string } }).batchSnapshot;

  return {
    internId: String((doc as { internId?: string }).internId ?? id),
    learnerName,
    internshipTitle: iSnap?.title ? String(iSnap.title) : "—",
    batchName: bSnap?.name ? String(bSnap.name) : undefined,
    status: String((doc as { status?: string }).status ?? ""),
    enrolledAt: toIso((doc as { enrolledAt?: Date }).enrolledAt),
    offerLetterGeneratedAt: toIso(
      (doc as { offerLetterGeneratedAt?: Date }).offerLetterGeneratedAt,
    ),
  };
}

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

  assertNotPendingDocumentation(doc.status);
  const ALLOWED_STATUSES = new Set(["enrolled", "completed", "paused"]);
  if (!ALLOWED_STATUSES.has(doc.status)) {
    throw new AppError(
      "Your enrollment is not yet active for this program",
      403,
    );
  }

  // Cohort hasn't started yet — tasks/live classes aren't accessible before the
  // internship start date. Mirrors the dashboard hiding the "View tasks" link
  // (hideDashboardProgramLink); without this the page is reachable by direct URL.
  const startRaw = doc.batchSnapshot?.internshipStartDate;
  const startTime = startRaw ? new Date(startRaw).getTime() : null;
  if (startTime !== null && !Number.isNaN(startTime) && Date.now() < startTime) {
    throw new AppError("This internship hasn't started yet", 403);
  }

  // 3. Get the batch's task template IDs
  const batchId = doc.batchSnapshot?.batchId ?? "";
  type BatchLike = { _id?: unknown; taskTemplateIds?: unknown[]; certificationExamTemplateId?: unknown };
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

  // 4. Compute anchor date — task timelines are scheduled cohort-wide from the
  // batch's internship start date, so every learner in a batch sees the same
  // unlock/due calendar. Falls back to the enrolment date only if the batch
  // snapshot somehow lacks a start date (defensive — it is normally always set).
  const rawAnchor =
    doc.batchSnapshot?.internshipStartDate ?? doc.enrolledAt ?? doc.createdAt;
  const anchor =
    rawAnchor instanceof Date
      ? rawAnchor
      : new Date(rawAnchor ?? Date.now());

  const MS_PER_DAY = 86_400_000;
  const now = Date.now();

  // 5. Fetch tasks and filter to unlocked ones
  const taskDocs =
    taskOids.length > 0
      ? await InternshipTaskModel.find({ _id: { $in: taskOids }, isActive: true })
          .select(
            "title description taskType totalScore scoreThreshold successPoints unlockAfterDays dueDays questions",
          )
          .lean()
      : [];

  const unlockedTasks: LearnerTaskRow[] = [];

  for (const task of taskDocs) {
    const unlockAfterDays =
      typeof task.unlockAfterDays === "number" ? task.unlockAfterDays : 0;
    const dueDays = typeof task.dueDays === "number" ? task.dueDays : 0;
    const visibleFrom = new Date(
      anchor.getTime() + unlockAfterDays * MS_PER_DAY,
    );
    // `dueDays` is the window length after unlock, not an offset from the anchor.
    const dueAt = new Date(visibleFrom.getTime() + dueDays * MS_PER_DAY);

    if (now < visibleFrom.getTime()) continue; // locked — skip

    const sub = await InternshipSubmissionModel.findOne({
      userId,
      taskId: String(task._id),
      batchId,
    })
      .select("_id status totalAwardedScore fileResponses.status")
      .lean();

    const needsResubmission =
      Array.isArray((sub as { fileResponses?: unknown })?.fileResponses) &&
      (sub as { fileResponses: { status?: string }[] }).fileResponses.some(
        (r) => r.status === "re_upload_requested",
      );

    unlockedTasks.push({
      _id: String(task._id),
      title: String(task.title ?? ""),
      description: String(
        (task as { description?: string }).description ?? "",
      ),
      totalScore: typeof task.totalScore === "number" ? task.totalScore : 0,
      scoreThreshold:
        typeof (task as { scoreThreshold?: number }).scoreThreshold === "number"
          ? (task as { scoreThreshold: number }).scoreThreshold
          : 0,
      successPoints:
        typeof (task as { successPoints?: number }).successPoints === "number"
          ? (task as { successPoints: number }).successPoints
          : 0,
      unlockAfterDays,
      dueDays,
      questionCount: Array.isArray(task.questions) ? task.questions.length : 0,
      isUnlocked: true,
      // `dueAt` lands at the start of the due calendar day, but the learner has
      // the whole of that day to submit. The task is only "missed" once the day
      // after `dueAt` has begun — otherwise it shows missed on the due date.
      isDue: now >= dueAt.getTime() + MS_PER_DAY,
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
            needsResubmission,
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

  // Percentage-of-total eligibility. The service walks the learner's window
  // (enrolledAt → endDate), sums task / meeting / cert-exam point values,
  // and returns earned + required + shortfall + meetsThreshold.
  const eligibility = await computeInternshipEligibility(String(doc._id));
  const certificationThreshold = eligibility.thresholdPct;
  const certificationTotalAchievable = eligibility.totalAchievable;
  const certificationRequiredPoints = eligibility.requiredPoints;
  const certificationMeetsThreshold = eligibility.meetsThreshold;
  const enrolledPoints = eligibility.earned;

  const settings = await getPointsSettings();
  const priceInr = settings.internshipSuccessPointInr;
  const internshipSuccessPointPurchase =
    certificationThreshold > 0 &&
    typeof priceInr === "number" &&
    priceInr > 0
      ? { inrPerPoint: priceInr }
      : undefined;

  const certificationPointsShortfall =
    certificationThreshold > 0 ? eligibility.shortfall : undefined;
  const approxInrToReachCertificationThreshold =
    certificationPointsShortfall != null &&
    certificationPointsShortfall > 0 &&
    typeof priceInr === "number" &&
    priceInr > 0
      ? Math.round(certificationPointsShortfall * priceInr * 100) / 100
      : undefined;

  const rawCertExamId = matchedBatch?.certificationExamTemplateId;
  const certificationExamConfigured =
    rawCertExamId != null && String(rawCertExamId).trim().length > 0;
  let certificationExamSubmitted: boolean | undefined;
  if (certificationExamConfigured) {
    const certSub = await InternshipSubmissionModel.findOne({
      userId,
      batchId,
      examId: String(rawCertExamId),
      submissionFor: "exam",
    })
      .select("status")
      .lean();
    certificationExamSubmitted =
      certSub != null && String((certSub as { status?: string }).status ?? "") !== "draft";
  }

  return {
    enrollment: {
      _id: String(doc._id),
      status: doc.status,
      enrollmentType: doc.enrollmentType ?? undefined,
      enrolledAt: toIso(doc.enrolledAt),
      internshipSuccessPoints: enrolledPoints,
      certificationThreshold,
      certificationTotalAchievable,
      certificationRequiredPoints,
      certificationMeetsThreshold,
      certificationExamPassed: eligibility.examPassed,
      certificateEligible: eligibility.certificateEligible,
      certificationBreakdown: {
        tasksTotal: eligibility.breakdown.tasksTotal,
        attendanceTotal: eligibility.breakdown.meetingsTotal,
      },
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
      internId:
        typeof (doc as unknown as { internId?: string }).internId === "string"
          ? (doc as unknown as { internId: string }).internId
          : undefined,
      offerLetterUrl:
        typeof (doc as unknown as { offerLetterUrl?: string }).offerLetterUrl === "string"
          ? (doc as unknown as { offerLetterUrl: string }).offerLetterUrl
          : undefined,
      ...(certificationExamConfigured
        ? {
            certificationExamConfigured: true as const,
            certificationExamSubmitted: certificationExamSubmitted === true,
          }
        : { certificationExamConfigured: false as const }),
    },
    tasks: unlockedTasks,
    ...(internshipSuccessPointPurchase
      ? { internshipSuccessPointPurchase }
      : {}),
  };
}

// ─── Documentation submission ────────────────────────────────────────────────

/**
 * Learner submits Aadhar + photo from `pending_documentation` or
 * `re_pending_documentation`, transitioning the enrollment to
 * `docs_under_review` for admin review. Submissions outside the configured
 * window are rejected with `DOCUMENTATION_WINDOW_NOT_OPEN` /
 * `DOCUMENTATION_WINDOW_CLOSED`.
 *
 * Aadhar is encrypted at the application layer (AES-256-GCM); only the
 * ciphertext + IV + tag are persisted.
 */
export async function submitInternshipDocumentation(
  enrollmentId: string,
  userId: mongoose.Types.ObjectId,
  body: {
    aadharCardNumber: string;
    learnerPhoto: string;
    learnerPhotoS3Key: string;
    acceptedTerms: boolean;
  },
): Promise<{ status: string; submittedAt: string }> {
  const { encryptAadhar, isValidAadharFormat } = await import(
    "../utils/lib/aadharCrypto"
  );

  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const aadhar = String(body.aadharCardNumber ?? "").trim();
  const photo = String(body.learnerPhoto ?? "").trim();
  const photoKey = String(body.learnerPhotoS3Key ?? "").trim();
  if (!isValidAadharFormat(aadhar)) {
    throw new AppError(
      "Aadhar must be 12 digits and start with 2-9",
      400,
      "AADHAR_INVALID",
    );
  }
  if (!photo || !photoKey) {
    throw new AppError("Learner photo is required", 400);
  }
  if (body.acceptedTerms !== true) {
    throw new AppError(
      "You must accept the Terms & Conditions to submit documents.",
      400,
      "TERMS_NOT_ACCEPTED",
    );
  }

  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new AppError("Enrollment not found", 404);
  if (String(doc.user) !== String(userId)) {
    throw new AppError("Forbidden", 403);
  }
  if (
    String(doc.status) !== "pending_documentation" &&
    String(doc.status) !== "re_pending_documentation"
  ) {
    throw new AppError(
      `Cannot submit documents from status "${doc.status}"`,
      400,
    );
  }

  // The documentation window lives on the learner's batch.
  const ins = await InternshipModel.findById(doc.internship)
    .select("batches")
    .lean();
  const batchId = (
    doc.batchSnapshot as { batchId?: unknown } | undefined
  )?.batchId;
  const batch =
    ins && batchId
      ? ((ins as { batches?: Record<string, unknown>[] }).batches ?? []).find(
          (b) => String(b._id) === String(batchId),
        )
      : undefined;
  const startAt = (batch as { documentationStartAt?: Date } | undefined)
    ?.documentationStartAt;
  const endAt = (batch as { documentationEndAt?: Date } | undefined)
    ?.documentationEndAt;
  const now = new Date();
  if (startAt instanceof Date && now < startAt) {
    throw new AppError(
      "The documentation submission window hasn't opened yet.",
      403,
      "DOCUMENTATION_WINDOW_NOT_OPEN",
    );
  }
  if (endAt instanceof Date && now > endAt) {
    throw new AppError(
      "The documentation submission window has closed. Contact your program administrator.",
      403,
      "DOCUMENTATION_WINDOW_CLOSED",
    );
  }

  const ct = encryptAadhar(aadhar);

  doc.documentation = {
    aadharCardNumberEnc: ct.aadharCardNumberEnc,
    aadharCardNumberIv: ct.aadharCardNumberIv,
    aadharCardNumberTag: ct.aadharCardNumberTag,
    learnerPhoto: photo,
    learnerPhotoS3Key: photoKey,
    submittedAt: now,
  } as typeof doc.documentation;
  doc.status = "docs_under_review" as typeof doc.status;
  (doc as unknown as { termsAcceptedAt: Date }).termsAcceptedAt = now;
  await doc.save();

  return {
    status: doc.status as string,
    submittedAt: now.toISOString(),
  };
}

/**
 * Admin: edit (or upload-on-behalf-of-learner) the documentation on an
 * enrollment. Two modes, decided by whether the enrollment already has a
 * `documentation` sub-doc:
 *
 *  • Edit existing  — partial; either field may be updated independently.
 *    Pass only what changes. `submittedAt` is preserved. Status is unchanged.
 *
 *  • Create new (used when a learner missed the window and asks the admin to
 *    upload for them) — both `aadharCardNumber` and `learnerPhoto` must be
 *    provided. `submittedAt` is set to now. If the enrollment was in
 *    `pending_documentation`, status is flipped to `docs_under_review` so the
 *    admin still has to explicitly approve the upload through the review gate
 *    (matches the learner submit flow exactly).
 *
 * Window enforcement does NOT apply to admin actions in either mode.
 *
 * The Aadhar number is re-encrypted with the current key on every save.
 */
export async function adminUpdateInternshipDocumentation(
  enrollmentId: string,
  body: {
    aadharCardNumber?: string;
    learnerPhoto?: string;
    learnerPhotoS3Key?: string;
  },
): Promise<InternshipEnrollmentListRow> {
  const { encryptAadhar, isValidAadharFormat } = await import(
    "../utils/lib/aadharCrypto"
  );

  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const aadharRaw = body.aadharCardNumber;
  const photoRaw = body.learnerPhoto;
  const photoKeyRaw = body.learnerPhotoS3Key;

  const aadharProvided = typeof aadharRaw === "string" && aadharRaw.trim() !== "";
  const photoProvided = typeof photoRaw === "string" && photoRaw.trim() !== "";

  if (photoProvided) {
    if (typeof photoKeyRaw !== "string" || photoKeyRaw.trim() === "") {
      throw new AppError(
        "learnerPhotoS3Key is required when uploading learnerPhoto",
        400,
      );
    }
  }

  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new AppError("Enrollment not found", 404);

  const isCreate = !doc.documentation;

  if (isCreate) {
    if (!aadharProvided || !photoProvided) {
      throw new AppError(
        "Both aadharCardNumber and learnerPhoto are required to upload documentation for the first time",
        400,
      );
    }
  } else {
    if (!aadharProvided && !photoProvided) {
      throw new AppError(
        "Provide at least one of: aadharCardNumber, learnerPhoto",
        400,
      );
    }
  }

  let aadharCt: ReturnType<typeof encryptAadhar> | null = null;
  if (aadharProvided) {
    const aadhar = aadharRaw!.trim();
    if (!isValidAadharFormat(aadhar)) {
      throw new AppError(
        "Aadhar must be 12 digits and start with 2-9",
        400,
        "AADHAR_INVALID",
      );
    }
    aadharCt = encryptAadhar(aadhar);
  }

  if (isCreate) {
    doc.documentation = {
      aadharCardNumberEnc: aadharCt!.aadharCardNumberEnc,
      aadharCardNumberIv: aadharCt!.aadharCardNumberIv,
      aadharCardNumberTag: aadharCt!.aadharCardNumberTag,
      learnerPhoto: photoRaw!.trim(),
      learnerPhotoS3Key: photoKeyRaw!.trim(),
      submittedAt: new Date(),
    } as typeof doc.documentation;

    if (
      String(doc.status) === "pending_documentation" ||
      String(doc.status) === "re_pending_documentation"
    ) {
      doc.status = "docs_under_review" as typeof doc.status;
    }
  } else {
    if (aadharCt) {
      doc.documentation!.aadharCardNumberEnc = aadharCt.aadharCardNumberEnc;
      doc.documentation!.aadharCardNumberIv = aadharCt.aadharCardNumberIv;
      doc.documentation!.aadharCardNumberTag = aadharCt.aadharCardNumberTag;
    }
    if (photoProvided) {
      doc.documentation!.learnerPhoto = photoRaw!.trim();
      doc.documentation!.learnerPhotoS3Key = photoKeyRaw!.trim();
    }
  }

  await doc.save();
  return getInternshipEnrollmentByIdAdmin(enrollmentId);
}

/**
 * Admin: approve or reject submitted documentation from a `docs_under_review`
 * enrollment.
 *
 *  • approve → `offer_letter_pending`   (cron will generate offer letter and enroll)
 *  • reject  → `re_pending_documentation` (learner must resubmit via the same endpoint)
 *
 * Records `documentationReviewedBy` and `documentationReviewedAt` in both cases.
 * When rejecting, `documentationRejectionNote` is persisted (optional but recommended).
 */
export async function adminVerifyInternshipDocumentation(
  enrollmentId: string,
  action: "approve" | "reject",
  adminUserId: mongoose.Types.ObjectId,
  rejectionNote?: string,
): Promise<InternshipEnrollmentListRow> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new AppError("Enrollment not found", 404);

  if (String(doc.status) !== "docs_under_review") {
    throw new AppError(
      `Documentation can only be verified when status is "docs_under_review". Current status: "${doc.status}"`,
      400,
    );
  }

  if (!doc.documentation) {
    throw new AppError(
      "No documentation found on this enrollment to verify",
      400,
    );
  }

  const now = new Date();
  (doc as unknown as Record<string, unknown>).documentationReviewedBy = adminUserId;
  (doc as unknown as Record<string, unknown>).documentationReviewedAt = now;

  if (action === "approve") {
    doc.status = "offer_letter_pending" as typeof doc.status;
    // Allocate the intern ID at this single, controlled point so every
    // downstream consumer (worker, retries, admin UI) reads the same value.
    // Skipped if the row already carries an ID (idempotent re-approval).
    const currentInternId = (doc as unknown as Record<string, unknown>).internId;
    if (!currentInternId) {
      const { allocateNextInternId } = await import("./internId.services");
      (doc as unknown as Record<string, unknown>).internId =
        await allocateNextInternId();
    }
  } else {
    doc.status = "re_pending_documentation" as typeof doc.status;
    if (rejectionNote) {
      (doc as unknown as Record<string, unknown>).documentationRejectionNote = rejectionNote;
    }
  }

  await doc.save();

  // Enqueue the offer-letter generation job inline on approval so the worker
  // picks it up on its next tick — without this the row would only be queued
  // by the worker's boot-time sync (i.e. needs a restart).
  if (action === "approve") {
    try {
      const { createOfferLetterJobService } = await import(
        "./offerLetterJob.services"
      );
      await createOfferLetterJobService({
        internshipEnrollmentId: String(doc._id),
      });
    } catch (e) {
      console.error(
        "[Offer Letter] Failed to enqueue job after doc approval for enrollment",
        String(doc._id),
        e,
      );
    }
  }

  return getInternshipEnrollmentByIdAdmin(enrollmentId);
}

// ─── Admin: bulk documentation review ────────────────────────────────────────

/**
 * Admin-only: paginated list of internships that have at least one enrollment
 * currently in `docs_under_review`, with per-internship pending counts. Drives
 * the InfiniteScrollSelect on the doc-review queue page. Supports `search`
 * against live + snapshot internship title (case-insensitive).
 */
export async function listInternshipsWithPendingDocReview(
  options: { page?: number; limit?: number; search?: string } = {},
): Promise<{
  items: { internshipId: string; title: string; slug: string; pendingCount: number }[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  const basePipeline: mongoose.PipelineStage[] = [
    { $match: { status: "docs_under_review" } },
    {
      $group: {
        _id: "$internship",
        pendingCount: { $sum: 1 },
        snapshotTitle: { $first: "$internshipSnapshot.title" },
        snapshotSlug: { $first: "$internshipSnapshot.slug" },
      },
    },
    {
      $lookup: {
        from: "internships",
        localField: "_id",
        foreignField: "_id",
        as: "internshipDoc",
        pipeline: [{ $project: { title: 1, slug: 1 } }],
      },
    },
    { $unwind: { path: "$internshipDoc", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        _resolvedTitle: {
          $ifNull: ["$internshipDoc.title", "$snapshotTitle"],
        },
        _resolvedSlug: {
          $ifNull: ["$internshipDoc.slug", "$snapshotSlug"],
        },
      },
    },
  ];

  const search = (options.search ?? "").trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    basePipeline.push({ $match: { _resolvedTitle: rx } });
  }

  const [countAgg, rows] = await Promise.all([
    InternshipEnrollmentModel.aggregate([...basePipeline, { $count: "total" }]),
    InternshipEnrollmentModel.aggregate([
      ...basePipeline,
      { $sort: { pendingCount: -1, _resolvedTitle: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]),
  ]);

  const total = (countAgg[0] as { total?: number } | undefined)?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const items = rows.map((r) => {
    const o = r as {
      _id: unknown;
      _resolvedTitle?: string;
      _resolvedSlug?: string;
      pendingCount?: number;
    };
    return {
      internshipId: String(o._id),
      title: String(o._resolvedTitle ?? ""),
      slug: String(o._resolvedSlug ?? ""),
      pendingCount: Number(o.pendingCount ?? 0),
    };
  });

  return { items, total, page, totalPages };
}

export type BulkVerifyDocsItem = {
  enrollmentId: string;
  ok: boolean;
  error?: string;
};

/**
 * Admin-only: bulk-approve a set of `docs_under_review` enrollments. Mirrors
 * `adminBulkApproveMeritToEnrolled` — iterates serially through
 * `adminVerifyInternshipDocumentation(..., "approve")` so each row gets its
 * inline offer-letter job enqueued, with per-row error capture so a single
 * bad row doesn't abort the batch.
 */
export async function adminBulkApproveInternshipDocumentation(
  enrollmentIds: string[],
  adminUserId: mongoose.Types.ObjectId,
): Promise<{
  results: BulkVerifyDocsItem[];
  ok: number;
  failed: number;
}> {
  const unique = [
    ...new Set(enrollmentIds.map((id) => String(id).trim())),
  ].filter((id) => mongoose.Types.ObjectId.isValid(id));

  const results: BulkVerifyDocsItem[] = [];
  let ok = 0;
  let failed = 0;
  for (const id of unique) {
    try {
      await adminVerifyInternshipDocumentation(id, "approve", adminUserId);
      results.push({ enrollmentId: id, ok: true });
      ok += 1;
    } catch (e) {
      const msg = e instanceof AppError ? e.message : "Approve failed";
      results.push({ enrollmentId: id, ok: false, error: msg });
      failed += 1;
    }
  }
  return { results, ok, failed };
}
