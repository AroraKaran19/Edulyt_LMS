import mongoose from "mongoose";
import {
  InternshipVoucherModel,
  generateVoucherCode,
} from "../models/internshipVoucher.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { EnrollmentModel } from "../models/enrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { CourseModel } from "../models/course.schema";
import { UserModel } from "../models/user.schema";
import { internshipVoucherAwardedMail } from "../mail";
import {
  internshipListingUrl,
  voucherClaimUrl,
} from "../lib/internshipSeatUrl";
import { AppError } from "../middlewares/error.middleware";
import { isVoucherRedemptionWindowOpen } from "../utils/applicationWindow";
import { sanitizeApplicationAnswers } from "./internshipEnrollment.services";
import { addBrandMembership } from "./brandMembership.services";
import { tryAwardInternshipRegistrationPoints } from "./successPoints.services";
import { queueInternshipApplicationReceivedEmail } from "./internshipApplicationMail.services";
import { parseProgramDurationMonthsFromAnswers } from "../lib/certificationExamSchedule";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InternshipVoucherStatus = "available" | "redeemed" | "expired";

export interface InternshipVoucherRow {
  _id: string;
  code: string;
  status: InternshipVoucherStatus;
  issuedAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  redeemedInternshipEnrollmentId: string | null;
  /** Title of the course purchase that earned this voucher. */
  sourceCourseName: string | null;
  /** Title of the internship the voucher was spent on (redeemed only). */
  redeemedInternshipTitle: string | null;
}

// ─── Qualification check ──────────────────────────────────────────────────────

/**
 * A paid course order qualifies for a free-internship voucher when the
 * learner paid at least 50 % of the original plan price.
 *
 *   originalPrice = amountPaid + couponDiscount + collaborationDiscount
 *   qualifies     = amountPaid ≥ 0.5 × originalPrice
 *               ⟺ amountPaid ≥ couponDiscount + collaborationDiscount
 *
 * Free/fully-discounted orders (amount = 0) never qualify.
 */
export function qualifiesForInternshipVoucher(order: {
  amount: number;
  couponDiscount?: number;
  collaborationDiscount?: number;
}): boolean {
  const paid = order.amount ?? 0;
  if (paid <= 0) return false;
  const discounts =
    (order.couponDiscount ?? 0) + (order.collaborationDiscount ?? 0);
  return paid >= discounts;
}

// ─── Issue ────────────────────────────────────────────────────────────────────

/**
 * Tell the learner they earned a voucher.
 *
 * No claim guard of its own: the unique index on `sourceOrderId` means the create
 * above succeeds exactly once per qualifying order, so this runs once by
 * construction. Swallows its own failures, because a voucher that exists but was
 * not announced is recoverable, and a purchase that fails because an email did not
 * send is not.
 */
const notifyVoucherAwarded = async (
  userId: string,
  courseEnrollmentId: string,
  voucherCode: string,
): Promise<void> => {
  try {
    const [user, enrollment] = await Promise.all([
      UserModel.findById(userId)
        .select("firstName lastName name email")
        .lean<{
          firstName?: string;
          lastName?: string;
          name?: string;
          email?: string;
        }>(),
      EnrollmentModel.findById(courseEnrollmentId)
        .select("courseId")
        .lean<{ courseId?: mongoose.Types.ObjectId }>(),
    ]);

    const email = user?.email?.trim();
    if (!email) return;

    const course = enrollment?.courseId
      ? await CourseModel.findById(enrollment.courseId)
          .select("title")
          .lean<{ title?: string }>()
      : null;

    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.name?.trim() ||
      "there";

    internshipVoucherAwardedMail.send([{ email, name }], {
      name,
      courseName: course?.title?.trim() || "your course",
      voucherCode,
      ctaUrl: voucherClaimUrl(voucherCode),
      browseUrl: internshipListingUrl(),
      year: new Date().getFullYear(),
    });
  } catch (error) {
    console.error(
      `[Voucher Mail] Could not announce voucher for user ${userId}:`,
      error instanceof Error ? error.message : error,
    );
  }
};

/**
 * Issue one internship voucher for a qualifying course purchase.
 *
 * Idempotent: a second call with the same `orderId` is silently ignored
 * (unique index on `sourceOrderId` prevents duplicates).
 *
 * Retries code generation up to 5 times in the unlikely event of a
 * collision on the `code` unique index.
 */
export async function issueInternshipVoucher(params: {
  userId: string;
  enrollmentId: string;
  orderId: string;
}): Promise<void> {
  const { userId, enrollmentId, orderId } = params;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateVoucherCode();
    try {
      await InternshipVoucherModel.create({
        code,
        userId: new mongoose.Types.ObjectId(userId),
        sourceEnrollmentId: new mongoose.Types.ObjectId(enrollmentId),
        sourceOrderId: new mongoose.Types.ObjectId(orderId),
        status: "available",
      });
      await notifyVoucherAwarded(userId, enrollmentId, code);
      return; // success
    } catch (err: unknown) {
      const e = err as { code?: number; keyPattern?: Record<string, unknown> };
      if (e.code === 11000) {
        // Duplicate on sourceOrderId → already issued; stop.
        if (e.keyPattern && "sourceOrderId" in e.keyPattern) return;
        // Duplicate on code → retry with a new code.
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to generate a unique voucher code after 5 attempts.");
}

// ─── Query ────────────────────────────────────────────────────────────────────

/** Count of vouchers the user can still spend. */
export async function countAvailableVouchers(userId: string): Promise<number> {
  return InternshipVoucherModel.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    status: "available",
  });
}

/** All vouchers for the authenticated user, newest first. */
export async function listVouchersForUser(
  userId: string,
): Promise<InternshipVoucherRow[]> {
  const docs = await InternshipVoucherModel.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .sort({ createdAt: -1 })
    .lean();

  if (docs.length === 0) return [];

  // Resolve the "what is this voucher for" labels in two batched _id lookups
  // (no per-voucher round trips): the course purchase that earned it, and the
  // internship it was spent on.
  const courseEnrollmentIds = docs
    .map((d) => d.sourceEnrollmentId)
    .filter(Boolean) as mongoose.Types.ObjectId[];
  const internshipEnrollmentIds = docs
    .map((d) => d.redeemedInternshipEnrollmentId)
    .filter(Boolean) as mongoose.Types.ObjectId[];

  const [courseEnrollments, internshipEnrollments] = await Promise.all([
    courseEnrollmentIds.length
      ? EnrollmentModel.find({ _id: { $in: courseEnrollmentIds } })
          .select("courseName")
          .lean()
      : [],
    internshipEnrollmentIds.length
      ? InternshipEnrollmentModel.find({ _id: { $in: internshipEnrollmentIds } })
          .select("internshipSnapshot.title")
          .lean()
      : [],
  ]);

  const courseNameById = new Map<string, string>();
  for (const e of courseEnrollments) {
    const name = (e as { courseName?: string | null }).courseName;
    if (name) courseNameById.set(String(e._id), name);
  }

  const internshipTitleById = new Map<string, string>();
  for (const e of internshipEnrollments) {
    const title = (e as { internshipSnapshot?: { title?: string } })
      .internshipSnapshot?.title;
    if (title) internshipTitleById.set(String(e._id), title);
  }

  return docs.map((d) => ({
    _id: String(d._id),
    code: d.code,
    status: d.status as InternshipVoucherStatus,
    issuedAt: (d.createdAt as Date).toISOString(),
    expiresAt: d.expiresAt ? (d.expiresAt as Date).toISOString() : null,
    redeemedAt: d.redeemedAt ? (d.redeemedAt as Date).toISOString() : null,
    redeemedInternshipEnrollmentId: d.redeemedInternshipEnrollmentId
      ? String(d.redeemedInternshipEnrollmentId)
      : null,
    sourceCourseName: d.sourceEnrollmentId
      ? (courseNameById.get(String(d.sourceEnrollmentId)) ?? null)
      : null,
    redeemedInternshipTitle: d.redeemedInternshipEnrollmentId
      ? (internshipTitleById.get(String(d.redeemedInternshipEnrollmentId)) ??
        null)
      : null,
  }));
}

// ─── Redeem ───────────────────────────────────────────────────────────────────

/**
 * Redeem a voucher to enroll the learner in a free internship seat.
 *
 * Accepts either the voucher's `_id` OR its `code` string.
 * Enforces that the voucher belongs to this user and is still available.
 * Creates an InternshipEnrollment (type "paid", paymentAmount = 0) and
 * immediately marks the voucher as "redeemed" — single-use.
 */
export async function redeemInternshipVoucher(params: {
  userId: string;
  /** Either the Mongo _id or the "INTV-XXXXXX" code string. */
  voucherIdOrCode: string;
  internshipId: string;
  batchId: string;
  /**
   * Full public enroll form snapshot (JSON). Captured on voucher redemption
   * so admins reviewing documentation can see the learner's submitted form
   * answers — same field that `registerForPaidSeat` writes.
   */
  applicationAnswers?: unknown;
}): Promise<{ internshipEnrollmentId: string; code: string }> {
  const { userId, voucherIdOrCode, internshipId, batchId } = params;
  const answersDoc = sanitizeApplicationAnswers(params.applicationAnswers);
  const durationMonths = answersDoc
    ? parseProgramDurationMonthsFromAnswers(answersDoc)
    : undefined;

  if (!mongoose.Types.ObjectId.isValid(internshipId))
    throw new AppError("Invalid internship id", 400);

  // 1. Find voucher — by _id or code
  const isObjectId = mongoose.Types.ObjectId.isValid(voucherIdOrCode);
  const query = isObjectId
    ? { _id: new mongoose.Types.ObjectId(voucherIdOrCode) }
    : { code: voucherIdOrCode.toUpperCase().trim() };

  const voucher = await InternshipVoucherModel.findOne({
    ...query,
    userId: new mongoose.Types.ObjectId(userId),
    status: "available",
  });
  if (!voucher) throw new AppError("Voucher not found or already used", 404);

  // 2. Check wall-clock expiry
  if (voucher.expiresAt && new Date() > voucher.expiresAt) {
    await InternshipVoucherModel.findByIdAndUpdate(voucher._id, {
      status: "expired",
    });
    throw new AppError("This voucher has expired", 400);
  }

  // 3. Validate internship + batch
  const internship = await InternshipModel.findOne({
    _id: new mongoose.Types.ObjectId(internshipId),
    isActive: true,
  })
    .select("batches title slug thumbnail")
    .lean();
  if (!internship) throw new AppError("Internship not found", 404);

  const internshipSnapshot = {
    title: String((internship as { title?: unknown }).title ?? ""),
    slug: String((internship as { slug?: unknown }).slug ?? ""),
    thumbnail:
      typeof (internship as { thumbnail?: unknown }).thumbnail === "string"
        ? (internship as { thumbnail: string }).thumbnail
        : undefined,
  };

  type BatchRaw = {
    _id?: unknown;
    name?: string;
    internshipStartDate?: Date;
    applicationLastDate?: Date;
    isActive?: boolean;
    status?: string;
  };

  const batch = (internship.batches as BatchRaw[]).find(
    (b) => b._id != null && String(b._id) === batchId,
  );
  if (!batch) throw new AppError("Batch not found", 404);
  if (batch.isActive === false || batch.status !== "active")
    throw new AppError("This batch is no longer accepting enrollments", 400);

  // 4. Voucher redemption stays open while the batch application is open, and
  // for a grace window of VOUCHER_POST_START_GRACE_DAYS after the batch's
  // internship start date — mirroring the paid-seat grace so a free-seat
  // holder isn't shut out the instant applications close.
  if (
    !isVoucherRedemptionWindowOpen(
      batch.applicationLastDate,
      batch.internshipStartDate,
    )
  ) {
    throw new AppError(
      "Voucher can only be redeemed up to 15 days after the batch start date",
      400,
    );
  }

  // 5. Existing-enrollment handling
  //    - Same batch, terminal/upgradeable status: upgrade in place
  //    - Same batch, locked status (enrolled/completed/paused/payment_pending): block
  //    - Different active batch in the same internship: block
  const lockedStatuses = new Set([
    "enrolled",
    "completed",
    "paused",
    "payment_pending",
  ]);
  const upgradeableStatuses = new Set([
    "exam_registered",
    "exam_attempted",
    "in_merit_pool",
    "admin_rejected",
  ]);

  const existingSameBatch = await InternshipEnrollmentModel.findOne({
    user: new mongoose.Types.ObjectId(userId),
    internship: new mongoose.Types.ObjectId(internshipId),
    "batchSnapshot.batchId": String(batch._id),
  });

  if (
    existingSameBatch &&
    lockedStatuses.has(String(existingSameBatch.status))
  ) {
    throw new AppError(
      "You are already enrolled in this internship batch",
      400,
    );
  }

  const existingOtherBatch = await InternshipEnrollmentModel.findOne({
    user: new mongoose.Types.ObjectId(userId),
    internship: new mongoose.Types.ObjectId(internshipId),
    "batchSnapshot.batchId": { $ne: String(batch._id) },
    status: { $nin: ["dropped", "revoked", "admin_rejected"] },
  });
  if (existingOtherBatch) {
    throw new AppError(
      "You are already enrolled in another batch of this internship",
      400,
    );
  }

  // 6. Create new OR upgrade existing in place.
  //
  // Voucher redemption is the "free paid seat" path — it grants the seat
  // without payment, but the learner still goes through the standard
  // post-qualification flow: pending_documentation → docs_under_review →
  // offer_letter_pending → enrolled. `enrolledAt` stays unset; it's anchored
  // by the offer-letter cron when the learner truly reaches `enrolled`.
  let enrollment;
  if (
    existingSameBatch &&
    upgradeableStatuses.has(String(existingSameBatch.status))
  ) {
    existingSameBatch.set("enrollmentType", "paid");
    existingSameBatch.set("status", "pending_documentation");
    existingSameBatch.set("paymentAmount", 0);
    // Backfill internshipSnapshot if the prior row never got one (legacy
    // exam-registration rows pre-date this snapshot field on some paths).
    if (!existingSameBatch.get("internshipSnapshot")) {
      existingSameBatch.set("internshipSnapshot", internshipSnapshot);
    }
    // Persist the freshly-submitted enroll form. We overwrite any previously
    // stored answers from the entrance-exam registration since the voucher
    // redemption is the more recent intent.
    if (answersDoc) {
      existingSameBatch.set("applicationAnswers", answersDoc);
      existingSameBatch.set("applicationSubmittedAt", new Date());
      if (durationMonths != null) {
        existingSameBatch.set("programDurationMonths", durationMonths);
      }
    }
    await existingSameBatch.save();
    enrollment = existingSameBatch;
  } else {
    enrollment = await InternshipEnrollmentModel.create({
      user: new mongoose.Types.ObjectId(userId),
      internship: new mongoose.Types.ObjectId(internshipId),
      internshipSnapshot,
      batchSnapshot: {
        batchId: String(batch._id),
        name: String(batch.name ?? ""),
        internshipStartDate: batch.internshipStartDate ?? new Date(),
      },
      enrollmentType: "paid",
      status: "pending_documentation",
      paymentAmount: 0,
      internshipSuccessPoints: 0,
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
  }

  // Every internship is Edulyt's.
  await addBrandMembership(userId, "edulyt");

  // 6. Mark voucher redeemed — expires immediately after single use
  await InternshipVoucherModel.findByIdAndUpdate(voucher._id, {
    status: "redeemed",
    redeemedAt: new Date(),
    redeemedInternshipEnrollmentId: enrollment._id,
  });

  let awardedPoints = 0;
  try {
    awardedPoints = await tryAwardInternshipRegistrationPoints(
      String(enrollment._id),
    );
  } catch (e) {
    // A reward failure must never break voucher redemption.
    console.error("Internship registration reward failed:", e);
  }

  // Awaited above so the email can state the points actually credited.
  queueInternshipApplicationReceivedEmail(
    String(enrollment._id),
    "voucher",
    awardedPoints,
  );

  return {
    internshipEnrollmentId: String(enrollment._id),
    code: voucher.code,
  };
}
