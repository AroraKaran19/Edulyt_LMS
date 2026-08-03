import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  CourseModel,
  EnrollmentModel,
  OrderModel,
  StudentModel,
  UserModel,
} from "../models";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { calculateFinalDiscountedPrice } from "../utils/lib/calculateDiscount";
import { AppError } from "../middlewares/error.middleware";
import { getPointsSettings } from "./pointsSettings.services";
import type { PaymentOrder } from "../types/order";
import type { Course } from "../types/course";
import type { Enrollment } from "../types/enrollment";
import type {
  SuccessPointCourseSnapshot,
  SuccessPointEarnSource,
  SuccessPointRewardSource,
  SuccessPointTransaction,
} from "../types/user";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function resolveDisplayName(u: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.email || "User";
}

/**
 * Returns how many points to credit for an eligible enrollment, or 0 to skip.
 * If `completionSuccessPoints` is **missing** or **0**, do not award (no success
 * points for that course).
 */
function resolveCompletionPointsForCourse(course: Course): number {
  const raw = course.completionSuccessPoints;
  if (raw == null) return 0;
  if (!Number.isFinite(Number(raw))) return 0;
  const p = Math.max(0, Math.floor(Number(raw)));
  return Math.min(p, 1_000_000);
}

/**
 * "Effective" plan price for eligibility: plan list price minus plan discount and
 * course discount (stacked, same as checkout `calculateFinalDiscountedPrice`),
 * not including collaboration or coupon.
 */
function listPriceAfterPlanAndCourseDiscounts(
  course: Course,
  planType: "elite" | "essential",
): number | null {
  const plan = course.plans?.[planType];
  if (!plan) return null;
  return calculateFinalDiscountedPrice(
    plan.price,
    course.discount,
    plan.discount,
  );
}

type Eligibility = {
  eligible: true;
  earnSource: SuccessPointEarnSource;
};

type Ineligible = { eligible: false };

/**
 * - No coupon: earn if there was a real payment (`amount` ≥ ₹1) on a successful order.
 * - With coupon: earn only if `amount` is strictly more than 50% of
 *   listPriceAfterPlanAndCourseDiscounts (per product rules).
 */
export function evaluateSuccessPointsEligibilityForOrder(
  order: PaymentOrder,
  course: Course,
  planType: "elite" | "essential",
): Eligibility | Ineligible {
  const effective = listPriceAfterPlanAndCourseDiscounts(course, planType);
  if (effective == null) return { eligible: false };
  if (effective <= 0) return { eligible: false };

  const paid = Math.round((order.amount ?? 0) * 100) / 100;
  if (paid < 1) return { eligible: false };

  const couponCode =
    order.couponCode != null && String(order.couponCode).trim() !== "";

  if (!couponCode) {
    return { eligible: true, earnSource: "purchased" };
  }

  const half = Math.round(0.5 * effective * 100) / 100;
  if (paid > half) {
    return { eligible: true, earnSource: "coupon_paid_over_half_effective" };
  }

  return { eligible: false };
}

async function findQualifyingOrder(
  userId: string,
  courseId: string,
  planType: "elite" | "essential",
): Promise<PaymentOrder | null> {
  const order = await OrderModel.findOne({
    userId,
    courseId,
    planType,
    paymentStatus: "success",
  })
    .sort({ createdAt: -1 })
    .lean();

  return (order as PaymentOrder | null) ?? null;
}

/**
 * Idempotent: credits at most once per enrollment when the course certificate is
 * generated and payment / coupon rules are satisfied. Not trial, full access, not gift.
 * Does nothing if the course's `completionSuccessPoints` is 0 or not set.
 */
export async function tryAwardCompletionSuccessPoints(
  enrollmentId: string,
): Promise<void> {
  const enrollment = await EnrollmentModel.findById(enrollmentId).lean<
    Enrollment & { _id: mongoose.Types.ObjectId }
  >();
  if (!enrollment) return;
  if (enrollment.status !== "completed" || !enrollment.completedAt) return;
  if (enrollment.isTrial) return;
  if (enrollment.successPointsCompletionAwarded) return;
  if (enrollment.enrollmentSource === "gift") return;

  const hasFullAccess =
    !enrollment.accessControl || enrollment.accessControl.accessType === "full";
  if (!hasFullAccess) return;

  const userId = enrollment.userId;
  const courseId = enrollment.courseId;
  if (userId == null || courseId == null) return;
  const planType: "elite" | "essential" = enrollment.planType || "essential";

  const [course, order] = await Promise.all([
    CourseModel.findById(courseId).lean<Course | null>(),
    findQualifyingOrder(userId.toString(), courseId.toString(), planType),
  ]);

  if (!course || !order) return;

  const ev = evaluateSuccessPointsEligibilityForOrder(order, course, planType);
  if (!ev.eligible) return;

  const points = resolveCompletionPointsForCourse(course);
  if (points <= 0) {
    // Course disabled success points (0) or has no/invalid `successPoints` field.
    return;
  }

  // Snapshot so history entries remain readable even if the course is later edited/deleted.
  const courseSnapshot: SuccessPointCourseSnapshot = {
    title: course.title || "",
    ...(course.slug ? { slug: course.slug } : {}),
  };

  const tx: SuccessPointTransaction = {
    transactionId: uuidv4(),
    earnedAt: new Date(),
    type: "earned",
    points,
    courseId: courseId.toString(),
    enrollmentId: enrollmentId.toString(),
    earnSource: ev.earnSource,
    courseSnapshot,
  };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const updated = await EnrollmentModel.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(enrollmentId),
          successPointsCompletionAwarded: { $ne: true },
        },
        { $set: { successPointsCompletionAwarded: true } },
        { new: true, session },
      );
      if (!updated) {
        return;
      }

      const student = await StudentModel.findByIdAndUpdate(
        userId,
        {
          $inc: { successPoints: points },
          $push: { successPointsHistory: tx },
        },
        { new: true, session },
      );

      if (!student) {
        throw new Error("Student not found for success points update");
      }
    });
  } catch (e) {
    console.error("Success points transaction failed:", e);
    throw e;
  } finally {
    await session.endSession();
  }
}

/**
 * Grant the plan-level `purchaseSuccessPoints` to the buyer once a course
 * order is paid. Idempotent at the order level via a one-shot guarded write
 * on `successPointsPurchaseGranted`, so webhook retries can't double-credit.
 *
 * No-op when the plan's `purchaseSuccessPoints` is 0 / unset, when the order
 * lacks a planType/courseId (non-course orders), or when the order has
 * already been granted.
 */
export async function tryAwardPurchaseSuccessPoints(input: {
  orderId: string;
  userId: string;
  courseId: string;
  planType: "elite" | "essential";
  enrollmentId?: string;
}): Promise<void> {
  const course = await CourseModel.findById(input.courseId).lean<
    Course | null
  >();
  if (!course) return;

  const plan = course.plans?.[input.planType];
  if (!plan) return;

  const raw = plan.purchaseSuccessPoints;
  const points = Math.max(
    0,
    Math.min(Math.floor(Number(raw ?? 0)), 1_000_000),
  );
  if (points <= 0) return;

  // Atomic "claim" — flips successPointsPurchaseGranted from false→true
  // exactly once. Subsequent runs (retries, replays) find no match and exit.
  const claimed = await OrderModel.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(input.orderId),
      successPointsPurchaseGranted: { $ne: true },
    },
    { $set: { successPointsPurchaseGranted: true } },
    { new: true },
  );
  if (!claimed) return;

  const courseSnapshot: SuccessPointCourseSnapshot = {
    title: course.title || "",
    ...(course.slug ? { slug: course.slug } : {}),
  };

  const tx: SuccessPointTransaction = {
    transactionId: uuidv4(),
    earnedAt: new Date(),
    type: "earned",
    points,
    courseId: String(course._id),
    enrollmentId: input.enrollmentId,
    earnSource: "plan_purchase",
    courseSnapshot,
  };

  try {
    await StudentModel.findByIdAndUpdate(input.userId, {
      $inc: { successPoints: points },
      $push: { successPointsHistory: tx },
    });
  } catch (e) {
    // Roll back the claim so a later retry can re-attempt the credit.
    await OrderModel.findByIdAndUpdate(input.orderId, {
      $set: { successPointsPurchaseGranted: false },
    });
    throw e;
  }
}

/**
 * Deduct redeemed points from the buyer's wallet once the order is paid.
 * Idempotent via the order's `successPointsRedeemed` flag — a webhook retry
 * (or any second call) finds the flag already true and exits.
 *
 * No-op when the order didn't apply points (`successPointsApplied <= 0`).
 *
 * Allows the buyer's balance to go negative under rare concurrent-checkout
 * conditions (two orders spending the same points before either deduction
 * lands). Admin adjustments can reconcile; matches the broader policy that
 * a balance may dip below zero.
 */
export async function tryRedeemSuccessPointsForOrder(input: {
  orderId: string;
  userId: string;
  courseId?: string;
}): Promise<void> {
  const claimed = await OrderModel.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(input.orderId),
      successPointsRedeemed: { $ne: true },
      successPointsApplied: { $gt: 0 },
    },
    { $set: { successPointsRedeemed: true } },
    { new: true },
  ).lean<{
    successPointsApplied?: number;
    courseId?: mongoose.Types.ObjectId;
  } | null>();
  if (!claimed) return;

  const points = Math.max(0, Math.floor(Number(claimed.successPointsApplied ?? 0)));
  if (points <= 0) return;

  const courseId = input.courseId ?? (claimed.courseId ? String(claimed.courseId) : undefined);
  let courseSnapshot: SuccessPointCourseSnapshot | undefined;
  if (courseId) {
    const course = await CourseModel.findById(courseId)
      .select("title slug")
      .lean<{ title?: string; slug?: string } | null>();
    if (course) {
      courseSnapshot = {
        title: course.title || "",
        ...(course.slug ? { slug: course.slug } : {}),
      };
    }
  }

  const tx: SuccessPointTransaction = {
    transactionId: uuidv4(),
    earnedAt: new Date(),
    type: "redeemed",
    points,
    orderId: input.orderId,
    courseId,
    courseSnapshot,
  };

  try {
    await StudentModel.findByIdAndUpdate(input.userId, {
      $inc: { successPoints: -points },
      $push: { successPointsHistory: tx },
    });
  } catch (e) {
    // Roll back the claim so a later retry can re-attempt.
    await OrderModel.findByIdAndUpdate(input.orderId, {
      $set: { successPointsRedeemed: false },
    });
    throw e;
  }
}

/**
 * Credit a milestone reward (login / community review / internship
 * registration) to a user's wallet `successPoints` and record a "reward"
 * history entry. No-op when `points <= 0`.
 *
 * Idempotency is the **caller's** responsibility — each reward type has its
 * own one-shot guard (a user flag, a per-enrollment flag, or the 1/user
 * review limit). This helper just does the credit + history push.
 */
export async function awardWalletSuccessPoints(
  userId: string,
  points: number,
  rewardSource: SuccessPointRewardSource,
): Promise<void> {
  const amount = Math.max(0, Math.floor(Number(points)));
  if (amount <= 0) return;

  const tx: SuccessPointTransaction = {
    transactionId: uuidv4(),
    earnedAt: new Date(),
    type: "reward",
    points: amount,
    rewardSource,
  };

  await StudentModel.findByIdAndUpdate(userId, {
    $inc: { successPoints: amount },
    $push: { successPointsHistory: tx },
  });
}

/**
 * One-time welcome bonus, credited when a student account is created
 * (registration), NOT on login. Call it from the registration paths only.
 * Idempotent: atomically claims `firstLoginBonusAwarded` (false→true) so a
 * retried registration can't double-credit.
 *
 * No-op for non-student accounts or when `loginSuccessPoints` is 0.
 * Failures are swallowed by the caller so a bonus problem can never block
 * account creation.
 *
 * NOTE: the persisted flag (`firstLoginBonusAwarded`), reward source
 * (`"login"`) and settings key (`loginSuccessPoints`) keep their legacy names
 * to avoid a data/admin-UI migration — only the *trigger* moved to registration.
 */
export async function tryAwardRegistrationBonus(
  userId: string,
  userType: string | undefined,
): Promise<void> {
  if (userType !== "student") return;
  if (!mongoose.Types.ObjectId.isValid(userId)) return;

  // Atomic claim — flips the flag exactly once across concurrent logins.
  const claimed = await UserModel.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(userId),
      firstLoginBonusAwarded: { $ne: true },
    },
    { $set: { firstLoginBonusAwarded: true } },
    { new: true },
  );
  if (!claimed) return;

  const { loginSuccessPoints } = await getPointsSettings();
  const points = Math.max(0, Math.floor(Number(loginSuccessPoints)));
  if (points <= 0) return;

  try {
    await awardWalletSuccessPoints(userId, points, "login");
  } catch (e) {
    // Roll back the claim so a later login can re-attempt the credit.
    await UserModel.findByIdAndUpdate(userId, {
      $set: { firstLoginBonusAwarded: false },
    });
    throw e;
  }
}

/**
 * Wallet reward for registering for an internship, granted **once per
 * internship** (not per batch) regardless of the registration path —
 * entrance-exam registration, paid seat, or voucher redemption.
 *
 * Idempotency has two layers:
 *  - a per-enrollment `registrationSuccessPointsAwarded` flag, claimed
 *    atomically so repeat calls on the same enrollment (e.g. a merit
 *    registration later upgraded to a paid seat) never double-credit;
 *  - a sibling check across the user's other enrollments of the same
 *    internship, so registering for a second batch doesn't re-award.
 *
 * No-op when `internshipRegistrationSuccessPoints` is 0. Safe to call from
 * any registration path — failures are swallowed by the caller.
 *
 * Returns the points actually credited, 0 when nothing was. The registration
 * email needs the real figure: it must not claim a bonus that the sibling check
 * or a zero setting suppressed.
 */
export async function tryAwardInternshipRegistrationPoints(
  enrollmentId: string,
): Promise<number> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) return 0;

  const enrollment = await InternshipEnrollmentModel.findById(enrollmentId)
    .select("user internship registrationSuccessPointsAwarded")
    .lean<{
      _id: mongoose.Types.ObjectId;
      user?: mongoose.Types.ObjectId;
      internship?: mongoose.Types.ObjectId;
      registrationSuccessPointsAwarded?: boolean;
    } | null>();
  if (!enrollment || !enrollment.user || !enrollment.internship) return 0;
  if (enrollment.registrationSuccessPointsAwarded) return 0;

  // "Once per internship": skip the credit if another enrollment of the
  // same internship (any batch) was already processed for this reward.
  const siblingAwarded = await InternshipEnrollmentModel.exists({
    _id: { $ne: enrollment._id },
    user: enrollment.user,
    internship: enrollment.internship,
    registrationSuccessPointsAwarded: true,
  });

  // Atomic per-enrollment claim — marks this enrollment processed so repeat
  // calls on it (merit registration → paid upgrade) become no-ops.
  const claimed = await InternshipEnrollmentModel.findOneAndUpdate(
    {
      _id: enrollment._id,
      registrationSuccessPointsAwarded: { $ne: true },
    },
    { $set: { registrationSuccessPointsAwarded: true } },
    { new: true },
  );
  if (!claimed) return 0;

  // Already credited for this internship via a sibling enrollment.
  if (siblingAwarded) return 0;

  const { internshipRegistrationSuccessPoints } = await getPointsSettings();
  const points = Math.max(
    0,
    Math.floor(Number(internshipRegistrationSuccessPoints)),
  );
  if (points <= 0) return 0;

  try {
    await awardWalletSuccessPoints(
      String(enrollment.user),
      points,
      "internship_registration",
    );
  } catch (e) {
    // Roll back the claim so a later registration path can re-attempt.
    await InternshipEnrollmentModel.findByIdAndUpdate(enrollment._id, {
      $set: { registrationSuccessPointsAwarded: false },
    });
    throw e;
  }

  return points;
}

// ===================================================================
// Wallet: balance, history, peer-to-peer transfer
// ===================================================================

/** Returns the current success-points balance for a student. */
export async function getSuccessPointsBalanceService(
  userId: string,
): Promise<{ balance: number }> {
  const student = await StudentModel.findById(userId)
    .select("successPoints")
    .lean<{ successPoints?: number } | null>();
  if (!student) {
    throw new AppError("Account not found", 404);
  }
  return { balance: student.successPoints ?? 0 };
}

/** Paginated success-points history (newest first). */
export async function getSuccessPointsHistoryService(
  userId: string,
  page: number,
  limit: number,
) {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit) || 10));

  const student = await StudentModel.findById(userId)
    .select("successPointsHistory")
    .lean<{ successPointsHistory?: SuccessPointTransaction[] } | null>();
  if (!student) {
    throw new AppError("Account not found", 404);
  }

  const all = [...(student.successPointsHistory ?? [])].sort(
    (a, b) =>
      new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime(),
  );
  const total = all.length;
  const start = (safePage - 1) * safeLimit;
  const items = all.slice(start, start + safeLimit);

  return {
    items,
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

/**
 * Credit / debit classification for one ledger entry, inside a `$reduce`
 * (hence `$$this`). Mirrors the admin platform-points report so the totals an
 * admin sees on a single student reconcile with that report's columns:
 * `redeemed` / `transferred_out` store positive magnitudes and are debits by
 * type, while `admin_adjustment` is the only signed type, so its sign decides
 * which side it lands on.
 */
const LEDGER_CREDIT_EXPR = {
  $switch: {
    branches: [
      {
        case: { $in: ["$$this.type", ["earned", "reward", "transferred_in"]] },
        then: { $abs: "$$this.points" },
      },
      {
        case: {
          $and: [
            { $eq: ["$$this.type", "admin_adjustment"] },
            { $gt: ["$$this.points", 0] },
          ],
        },
        then: "$$this.points",
      },
    ],
    default: 0,
  },
};

const LEDGER_DEBIT_EXPR = {
  $switch: {
    branches: [
      {
        case: { $in: ["$$this.type", ["redeemed", "transferred_out"]] },
        then: { $abs: "$$this.points" },
      },
      {
        case: {
          $and: [
            { $eq: ["$$this.type", "admin_adjustment"] },
            { $lt: ["$$this.points", 0] },
          ],
        },
        then: { $abs: "$$this.points" },
      },
    ],
    default: 0,
  },
};

export interface AdminSuccessPointsHistoryPage {
  items: SuccessPointTransaction[];
  total: number;
  page: number;
  totalPages: number;
  /** Live wallet balance — all-time, independent of the page being shown. */
  balance: number;
  /** All-time credits / debits, classified as in the admin points report. */
  earned: number;
  spent: number;
}

/**
 * Admin read of one student's wallet ledger: a page of entries (newest first)
 * plus the all-time balance / earned / spent summary.
 *
 * Paging and the summary are computed server-side in a single aggregation on
 * one `_id`-matched document, so a long ledger never crosses the wire just to
 * render ten rows.
 */
export async function getSuccessPointsHistoryForAdminService(
  userId: string,
  page: number,
  limit: number,
): Promise<AdminSuccessPointsHistoryPage> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit) || 10));
  const skip = (safePage - 1) * safeLimit;

  const [doc] = await StudentModel.aggregate<{
    balance: number;
    total: number;
    earned: number;
    spent: number;
    items: SuccessPointTransaction[];
  }>([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $project: {
        tx: { $ifNull: ["$successPointsHistory", []] },
        balance: { $ifNull: ["$successPoints", 0] },
      },
    },
    {
      $project: {
        _id: 0,
        balance: 1,
        total: { $size: "$tx" },
        earned: {
          $reduce: {
            input: "$tx",
            initialValue: 0,
            in: { $add: ["$$value", LEDGER_CREDIT_EXPR] },
          },
        },
        spent: {
          $reduce: {
            input: "$tx",
            initialValue: 0,
            in: { $add: ["$$value", LEDGER_DEBIT_EXPR] },
          },
        },
        // Entries are only ever appended (`$push`), so the stored order is
        // already chronological — reversing gives newest-first without a sort.
        items: { $slice: [{ $reverseArray: "$tx" }, skip, safeLimit] },
      },
    },
  ]);

  if (!doc) {
    throw new AppError("Student account not found", 404);
  }

  const total = doc.total ?? 0;

  return {
    items: doc.items ?? [],
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    balance: doc.balance ?? 0,
    earned: doc.earned ?? 0,
    spent: doc.spent ?? 0,
  };
}

export interface TransferSuccessPointsInput {
  senderId: string;
  recipientEmail: string;
  points: number;
}

/**
 * Peer-to-peer transfer of success points, by recipient email.
 * Atomic: if the recipient can't be found or the sender lacks balance, the
 * function throws before any write commits — the sender never loses points.
 */
export async function transferSuccessPointsService(
  input: TransferSuccessPointsInput,
): Promise<{
  points: number;
  balance: number;
  recipient: { name: string; email: string };
}> {
  const points = Math.floor(Number(input.points));
  if (!Number.isFinite(points) || points <= 0) {
    throw new AppError(
      "Enter a whole number of points greater than 0",
      400,
    );
  }

  const email = String(input.recipientEmail ?? "").trim().toLowerCase();
  if (!email) {
    throw new AppError("Recipient email is required", 400);
  }

  // StudentModel is the student discriminator — this naturally rejects
  // instructor / admin / partner accounts.
  const recipient = await StudentModel.findOne({
    email: new RegExp(`^${escapeRegex(email)}$`, "i"),
  }).select("_id firstName lastName email status");
  if (!recipient) {
    throw new AppError("No student account found with that email", 404);
  }
  if (recipient.status !== "active") {
    throw new AppError("That account can't receive points right now", 400);
  }
  if (String(recipient._id) === String(input.senderId)) {
    throw new AppError("You can't transfer points to yourself", 400);
  }

  const sender = await StudentModel.findById(input.senderId).select(
    "_id firstName lastName email",
  );
  if (!sender) {
    throw new AppError("Sender account not found", 404);
  }

  const now = new Date();
  const peerTransactionId = uuidv4();
  const senderName = resolveDisplayName(sender);
  const recipientName = resolveDisplayName(recipient);

  const outTx: SuccessPointTransaction = {
    transactionId: uuidv4(),
    earnedAt: now,
    type: "transferred_out",
    points,
    toUserId: String(recipient._id),
    toUserDisplayName: recipientName,
    peerTransactionId,
  };
  const inTx: SuccessPointTransaction = {
    transactionId: uuidv4(),
    earnedAt: now,
    type: "transferred_in",
    points,
    fromUserId: String(sender._id),
    fromUserDisplayName: senderName,
    peerTransactionId,
  };

  let newBalance = 0;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Guarded debit: the `$gte` filter makes concurrent transfers
      // overdraft-safe — a racing transfer simply matches no document.
      const updatedSender = await StudentModel.findOneAndUpdate(
        { _id: sender._id, successPoints: { $gte: points } },
        {
          $inc: { successPoints: -points },
          $push: { successPointsHistory: outTx },
        },
        { new: true, session },
      );
      if (!updatedSender) {
        throw new AppError(
          "You don't have enough success points for this transfer",
          400,
        );
      }
      newBalance = updatedSender.successPoints ?? 0;

      const updatedRecipient = await StudentModel.findByIdAndUpdate(
        recipient._id,
        {
          $inc: { successPoints: points },
          $push: { successPointsHistory: inTx },
        },
        { new: true, session },
      );
      if (!updatedRecipient) {
        throw new AppError("Recipient account not found", 404);
      }
    });
  } finally {
    await session.endSession();
  }

  return {
    points,
    balance: newBalance,
    recipient: { name: recipientName, email: recipient.email },
  };
}

export interface AdminAdjustSuccessPointsInput {
  adminId: string;
  adminName: string;
  targetUserId: string;
  /** Signed: positive grants points, negative deducts them. */
  points: number;
}

/**
 * Admin grant / deduction of success points on a student account.
 * The resulting balance is allowed to go negative — admins can intentionally
 * claw back more than a student currently holds.
 */
export async function adminAdjustSuccessPointsService(
  input: AdminAdjustSuccessPointsInput,
): Promise<{ balance: number; applied: number }> {
  const points = Math.trunc(Number(input.points));
  if (!Number.isFinite(points) || points === 0) {
    throw new AppError("Enter a non-zero whole number of points", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(input.targetUserId)) {
    throw new AppError("Invalid user id", 400);
  }

  const adjustTx: SuccessPointTransaction = {
    transactionId: uuidv4(),
    earnedAt: new Date(),
    type: "admin_adjustment",
    points,
    adjustedByUserId: String(input.adminId),
    adjustedByName: input.adminName,
  };

  const updated = await StudentModel.findByIdAndUpdate(
    input.targetUserId,
    {
      $inc: { successPoints: points },
      $push: { successPointsHistory: adjustTx },
    },
    { new: true },
  ).select("successPoints");

  if (!updated) {
    throw new AppError("Student account not found", 404);
  }

  return { balance: updated.successPoints ?? 0, applied: points };
}
