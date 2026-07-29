import mongoose from "mongoose";
import { AppError } from "../../middlewares/error.middleware";
import {
  OrderModel,
  CourseModel,
  UserModel,
  StudentModel,
  EnrollmentModel,
} from "../../models";
import { InternshipModel } from "../../models/internship.schema";
import { InternshipEnrollmentModel } from "../../models/internshipEnrollment.schema";
import {
  tryAwardInternshipRegistrationPoints,
  tryAwardPurchaseSuccessPoints,
  tryRedeemSuccessPointsForOrder,
} from "../successPoints.services";
import {
  qualifiesForInternshipVoucher,
  issueInternshipVoucher,
} from "../internshipVoucher.services";
import { parseProgramDurationMonthsFromAnswers } from "../../lib/certificationExamSchedule";

/**
 * After payment success: confirm paid internship seat and mark cohort enrolled.
 */
export const createInternshipSeatEnrollmentAfterPayment = async (
  order: any,
) => {
  const enrollmentId = order.internshipEnrollmentId;
  if (!enrollmentId) {
    throw new AppError("Order is missing internship enrollment reference", 400);
  }

  const enrollment = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!enrollment) {
    throw new AppError("Internship enrollment not found", 404);
  }

  if (
    enrollment.status === "enrolled" ||
    enrollment.status === "pending_documentation"
  ) {
    // Idempotent: payment already settled. Learners may remain in
    // `pending_documentation` until they submit KYC.
    return enrollment;
  }

  // Accept all enrollment shapes that can legitimately complete a seat payment:
  //  • paid + payment_pending   — fresh direct-seat registration
  //  • merit + exam_registered  — merit learner upgrading before exam
  //  • merit + exam_attempted   — merit learner upgrading after exam (any score)
  //  • merit + in_merit_pool    — merit learner upgrading while awaiting selection
  //  • merit + admin_rejected   — merit learner rejected from pool, buying a seat
  // For merit upgrades enrollmentType is promoted to "paid" below, atomically
  // with status="enrolled" — never on form submit, never before payment.
  const upgradeableMeritStatuses = [
    "exam_registered",
    "exam_attempted",
    "in_merit_pool",
    "admin_rejected",
  ] as string[];
  const isPaidPending =
    enrollment.enrollmentType === "paid" &&
    String(enrollment.status) === "payment_pending";
  const isMeritUpgrade =
    enrollment.enrollmentType === "merit" &&
    upgradeableMeritStatuses.includes(String(enrollment.status));
  if (!isPaidPending && !isMeritUpgrade) {
    throw new AppError(
      "Enrollment is not awaiting payment for a direct seat",
      400,
    );
  }

  const userId = order.userId?.toString?.() ?? String(order.userId);
  if (String(enrollment.user) !== userId) {
    throw new AppError("Order does not match this enrollment", 403);
  }

  enrollment.enrollmentType = "paid";
  enrollment.status = "pending_documentation";
  // NOTE: `enrolledAt` is intentionally NOT set here. The paid path differs
  // from the merit path only in skipping the entrance exam — everything
  // downstream (docs, offer letter) is identical, and `enrolledAt` is the
  // anchor for task unlock schedules, so it must be set when the learner
  // actually reaches the `enrolled` state (offer-letter cron / admin
  // status update), not when they pay.
  const ans = enrollment.applicationAnswers as Record<string, unknown> | undefined;
  const months = parseProgramDurationMonthsFromAnswers(ans ?? null);
  if (months != null) enrollment.programDurationMonths = months;
  enrollment.paymentAmount = order.amount;
  enrollment.paymentOrderId = String(order._id);
  enrollment.paymentConfirmedAt = new Date();
  await enrollment.save();

  const internshipOid = enrollment.internship as mongoose.Types.ObjectId;
  const batchIdStr = enrollment.batchSnapshot?.batchId;
  if (batchIdStr && mongoose.Types.ObjectId.isValid(batchIdStr)) {
    await InternshipModel.updateOne(
      {
        _id: internshipOid,
        "batches._id": new mongoose.Types.ObjectId(batchIdStr),
      },
      {
        $inc: {
          "batches.$.analytics.totalEnrollments": 1,
        },
      },
    );
  }
  await InternshipModel.updateOne(
    { _id: internshipOid },
    {
      $inc: { "analytics.totalEnrollments": 1 },
    },
  );

  try {
    await tryAwardInternshipRegistrationPoints(String(enrollment._id));
  } catch (e) {
    // A reward failure must never break paid-seat confirmation.
    console.error("Internship registration reward failed:", e);
  }

  return enrollment;
};

/**
 * After payment success: credit purchased internship success points (certification) once per order.
 */
export const createInternshipSuccessPointsAfterPayment = async (order: any) => {
  const enrollmentId = order.internshipEnrollmentId;
  if (!enrollmentId) {
    throw new AppError("Order is missing internship enrollment reference", 400);
  }

  const qty = Math.floor(Number(order.internshipSuccessPointsQuantity));
  if (!Number.isFinite(qty) || qty < 1) {
    throw new AppError("Invalid purchased quantity on order", 400);
  }

  const enrollment = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!enrollment) {
    throw new AppError("Internship enrollment not found", 404);
  }

  const userId = order.userId?.toString?.() ?? String(order.userId);
  if (String(enrollment.user) !== userId) {
    throw new AppError("Order does not match this enrollment", 403);
  }

  const ALLOWED_STATUSES = ["enrolled", "completed", "paused"] as string[];
  if (!ALLOWED_STATUSES.includes(String(enrollment.status))) {
    throw new AppError(
      "Enrollment is not eligible for success point purchases",
      400,
    );
  }

  const internship = await InternshipModel.findById(enrollment.internship)
    .select("certificationThreshold title")
    .lean();
  const thresholdRaw = (internship as { certificationThreshold?: unknown })
    ?.certificationThreshold;
  const threshold =
    typeof thresholdRaw === "number" && !Number.isNaN(thresholdRaw)
      ? Math.max(0, Math.floor(thresholdRaw))
      : 0;
  if (threshold <= 0) {
    throw new AppError(
      "This program does not use certification success points",
      400,
    );
  }

  const claim = await OrderModel.updateOne(
    {
      _id: order._id,
      paymentStatus: "success",
      internshipSuccessPointsFulfillmentApplied: { $ne: true },
    },
    { $set: { internshipSuccessPointsFulfillmentApplied: true } },
  );

  if (!claim.modifiedCount) {
    return enrollment;
  }

  try {
    await InternshipEnrollmentModel.findByIdAndUpdate(enrollmentId, {
      $inc: { internshipSuccessPoints: qty },
    });
  } catch (err) {
    await OrderModel.updateOne(
      { _id: order._id },
      { $set: { internshipSuccessPointsFulfillmentApplied: false } },
    );
    throw err;
  }

  // Points are credited above. From here there are two cases:
  //
  //  • A verdict is already written — the payment settled AFTER the learner's
  //    window closed (they checked out before the deadline; the webhook landed
  //    after). The verdict is final, so we do NOT flip it. Flag it loudly so
  //    support can refund, or apply `certificateOverride: "pass"` if the
  //    topped-up points now merit the certificate.
  //  • No verdict yet — the evaluation worker will read the topped-up balance
  //    when the window closes. Nothing to do here.
  //
  // (The code this replaces queued a certificate only when it found a PASSING
  // certification-exam submission — which can never exist in an exam-less
  // internship, so it never fired for exactly the learners it was meant to help.
  // Issuance now belongs to the evaluation worker.)
  const evaluated = await InternshipEnrollmentModel.findById(enrollmentId)
    .select("certificateEvaluation")
    .lean();

  if (
    (evaluated as { certificateEvaluation?: unknown } | null)
      ?.certificateEvaluation
  ) {
    console.warn(
      `[Internship Evaluation] Points purchase settled AFTER the final verdict ` +
        `for enrollment ${String(enrollmentId)} (order ${String(order._id)}, ` +
        `qty ${qty}). Points credited; verdict unchanged. Needs a support decision.`,
    );
  }

  return InternshipEnrollmentModel.findById(enrollmentId);
};

// Create enrollment after successful payment
export const createEnrollmentAfterPayment = async (order: any) => {
  try {
    if (order.orderKind === "internship_seat") {
      return await createInternshipSeatEnrollmentAfterPayment(order);
    }
    if (order.orderKind === "internship_success_points") {
      return await createInternshipSuccessPointsAfterPayment(order);
    }

    // Status-agnostic ON PURPOSE: the unique { userId, courseId } index has no
    // partial filter, so a dropped/revoked row is invisible to a `$nin` lookup
    // yet still collides on insert (E11000). Mirrors the same reasoning in
    // grantCategorySiblingEnrollments.
    const INACTIVE_STATUSES = ["dropped", "revoked"];
    let priorEnrollment = await EnrollmentModel.findOne({
      userId: order.userId,
      courseId: order.courseId,
    });

    // Re-purchase after a revoke or drop. Reactivate the row in place rather
    // than deleting and reinserting: its _id is referenced by certificates,
    // certificate jobs and users.enrollmentId, so a new _id would orphan them.
    // Progress starts clean, since a revoke withdraws the entitlement.
    if (priorEnrollment && INACTIVE_STATUSES.includes(priorEnrollment.status)) {
      const previousStatus = priorEnrollment.status;
      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setFullYear(validUntil.getFullYear() + 4);

      priorEnrollment = await EnrollmentModel.findByIdAndUpdate(
        priorEnrollment._id,
        {
          $set: {
            status: "active",
            planType: order.planType,
            enrolledAt: now,
            // The pre("save") hook only fills validUntil when unset, and this
            // row already carries the old window, so set it explicitly.
            validUntil,
            lastUpdated: now,
            totalTimeSpent: 0,
            completedContents: [],
            progress: {
              overallCompletion: 0,
              totalModules: 0,
              completedModules: 0,
              totalLessons: 0,
              completedLessons: 0,
              lastActivityAt: now,
            },
          },
        },
        { new: true },
      );

      // Course analytics and instructor totalStudents are deliberately NOT
      // re-incremented: revokeEnrollment never decremented them, so those
      // counters still include this enrollment.
      await StudentModel.findByIdAndUpdate(order.userId, {
        $addToSet: { enrollments: priorEnrollment?._id },
      });

      console.log(
        `[Fulfilment] Reactivated ${previousStatus} enrollment ${priorEnrollment?._id} for user ${order.userId} on course ${order.courseId}`,
      );
    }

    const existingEnrollment = priorEnrollment;

    if (existingEnrollment) {
      // Idempotent retry: still attempt both the grant and the redemption
      // deduction. Each is no-op when its respective flag is already set.
      if (order.planType && order.courseId && order._id) {
        try {
          await tryAwardPurchaseSuccessPoints({
            orderId: String(order._id),
            userId: String(order.userId),
            courseId: String(order.courseId),
            planType: order.planType,
            enrollmentId: String(existingEnrollment._id),
          });
        } catch (e) {
          console.error("Purchase success points grant failed:", e);
        }
        try {
          await tryRedeemSuccessPointsForOrder({
            orderId: String(order._id),
            userId: String(order.userId),
            courseId: String(order.courseId),
          });
        } catch (e) {
          console.error("Success points redemption failed:", e);
        }
      }

      // Retry backfill: a prior attempt may have created the paid enrollment but
      // failed to fan out the category siblings. Re-run the grant (idempotent —
      // it skips courses the user already holds). Best-effort, never throws.
      try {
        const purchasedCourse = await CourseModel.findById(order.courseId).select(
          "_id category"
        );
        if (purchasedCourse) {
          const { grantCategorySiblingEnrollments } = await import(
            "../enrollment.services"
          );
          await grantCategorySiblingEnrollments({
            userId: String(order.userId),
            purchasedCourse,
            planType: order.planType,
          });
        }
      } catch (grantErr) {
        console.error("Category sibling enrollment grant (retry) failed:", grantErr);
      }

      return existingEnrollment;
    }

    // Verify user exists and is a student
    const user = await StudentModel.findById(order.userId);
    if (!user) {
      throw new AppError(`Student not found with ID: ${order.userId}`, 404);
    }

    // Verify course exists
    const course = await CourseModel.findById(order.courseId);
    if (!course) {
      throw new AppError(`Course not found with ID: ${order.courseId}`, 404);
    }

    // Create new enrollment
    const enrollment = new EnrollmentModel({
      userId: order.userId,
      courseId: order.courseId,
      // Snapshot the course title so enrollment history survives course deletion/unlink.
      courseName: course.title,
      planType: order.planType, // Include planType from order
      enrolledAt: new Date(),
      status: "active",
      enrollmentSource: "direct",
      progress: {
        overallCompletion: 0,
        totalModules: 0,
        completedModules: 0,
        totalLessons: 0,
        completedLessons: 0,
        lastActivityAt: new Date(),
      },
      lastUpdated: new Date(),
      totalTimeSpent: 0,
    });

    const savedEnrollment = await enrollment.save();

    // Add enrollment to user's enrollments array
    const updatedUser = await StudentModel.findByIdAndUpdate(
      order.userId,
      { $push: { enrollments: savedEnrollment._id } },
      { new: true }
    );

    if (!updatedUser) {
      console.error(
        `Failed to update user ${order.userId} with enrollment ${savedEnrollment._id}`
      );
      // Rollback enrollment creation
      await EnrollmentModel.findByIdAndDelete(savedEnrollment._id);
      throw new AppError("Failed to update user with enrollment", 500);
    }

    // Update course analytics (total enrollments and active enrollments)
    await CourseModel.findByIdAndUpdate(
      order.courseId,
      {
        $inc: {
          "analytics.totalEnrollments": 1,
          "analytics.activeEnrollments": 1,
        },
      },
      { new: true }
    );

    // Update instructor totalStudents
    if (course && course.instructor) {
      // Extract instructor IDs
      const instructorIds: string[] = [];

      if (Array.isArray(course.instructor)) {
        for (const instructor of course.instructor) {
          if (!instructor) continue;

          if (typeof instructor === 'string') {
            instructorIds.push(instructor);
          } else if (typeof instructor === 'object' && '_id' in instructor) {
            instructorIds.push(String((instructor as any)._id));
          }
        }
      } else {
        const instructor = course.instructor;
        if (typeof instructor === 'string') {
          instructorIds.push(instructor);
        } else if (instructor && typeof instructor === 'object' && '_id' in instructor) {
          instructorIds.push(String((instructor as any)._id));
        }
      }

      // Update totalStudents for each instructor
      for (const instructorId of instructorIds) {
        await UserModel.findByIdAndUpdate(
          instructorId,
          { $inc: { totalStudents: 1 } },
          { new: true }
        );
      }
    }

    // Issue a free-internship voucher if the learner paid ≥ 50 % of the
    // original plan price (amount paid ≥ total discounts applied).
    if (
      qualifiesForInternshipVoucher({
        amount: order.amount,
        couponDiscount: order.couponDiscount,
        collaborationDiscount: order.collaborationDiscount,
      })
    ) {
      try {
        await issueInternshipVoucher({
          userId: String(order.userId),
          enrollmentId: String(savedEnrollment._id),
          orderId: String(order._id),
        });
      } catch (voucherErr) {
        // Non-critical: log and move on; enrollment itself succeeded.
        console.error("Failed to issue internship voucher:", voucherErr);
      }
    }

    // Record a referral sale when the order carried a code from a different
    // user. Idempotent via the `orderId` unique index on `ReferralSale`.
    if (order.referralCode) {
      try {
        const { recordReferralSaleForOrder } = await import(
          "../referral.services"
        );
        const buyer = await UserModel.findById(order.userId)
          .select("firstName lastName email")
          .lean();
        const buyerName =
          `${(buyer as { firstName?: string } | null)?.firstName ?? ""} ${
            (buyer as { lastName?: string } | null)?.lastName ?? ""
          }`.trim() ||
          String((buyer as { email?: string } | null)?.email ?? "");
        await recordReferralSaleForOrder({
          orderId: String(order._id),
          code: order.referralCode,
          buyerUserId: String(order.userId),
          courseId: order.courseId ? String(order.courseId) : undefined,
          courseName: String(order.courseName ?? course.title ?? ""),
          buyerName,
          amount: Number(order.amount ?? 0),
        });
      } catch (refErr) {
        // Non-critical: the referrer can be reconciled manually if this fails.
        console.error("Failed to record referral sale:", refErr);
      }
    }

    // Grant per-plan purchase success points + redeem points the buyer
    // chose to apply at checkout. Both are idempotent at the order level.
    if (order.planType && order.courseId && order._id) {
      try {
        await tryAwardPurchaseSuccessPoints({
          orderId: String(order._id),
          userId: String(order.userId),
          courseId: String(order.courseId),
          planType: order.planType,
          enrollmentId: String(savedEnrollment._id),
        });
      } catch (e) {
        console.error("Purchase success points grant failed:", e);
      }
      try {
        await tryRedeemSuccessPointsForOrder({
          orderId: String(order._id),
          userId: String(order.userId),
          courseId: String(order.courseId),
        });
      } catch (e) {
        console.error("Success points redemption failed:", e);
      }
    }

    // Fan out free enrollments to sibling courses in the same primary category
    // (gated behind CATEGORY_SIBLING_ENROLLMENT_ENABLED). Best-effort: a failure
    // here must never fail an order whose payment already succeeded.
    try {
      const { grantCategorySiblingEnrollments } = await import(
        "../enrollment.services"
      );
      await grantCategorySiblingEnrollments({
        userId: String(order.userId),
        purchasedCourse: course,
        planType: order.planType,
      });
    } catch (grantErr) {
      console.error("Category sibling enrollment grant failed:", grantErr);
    }

    return savedEnrollment;
  } catch (error) {
    console.error("Failed to create enrollment after payment:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to create enrollment after payment", 500);
  }
};
