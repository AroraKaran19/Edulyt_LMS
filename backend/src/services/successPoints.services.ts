import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  CourseModel,
  EnrollmentModel,
  OrderModel,
  StudentModel,
} from "../models";
import { calculateFinalDiscountedPrice } from "../utils/lib/calculateDiscount";
import type { PaymentOrder } from "../types/order";
import type { Course } from "../types/course";
import type { Enrollment } from "../types/enrollment";
import type {
  SuccessPointCourseSnapshot,
  SuccessPointEarnSource,
  SuccessPointTransaction,
} from "../types/user";

/**
 * Returns how many points to credit for a completed eligible enrollment, or 0 to skip.
 * If `successPoints` is **missing** or **0**, do not award (no success points for that course).
 */
function resolveCompletionPointsForCourse(course: Course): number {
  const raw = course.successPoints;
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
 * Idempotent: credits at most once per enrollment when the course is completed and
 * payment / coupon rules are satisfied. Mirrors cert rules: not trial, full access, not gift.
 * Does nothing if the course’s `successPoints` is 0 or not set — no success points for that course.
 */
export async function tryAwardSuccessPointsOnCourseCompletion(
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
