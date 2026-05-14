import { calculateFinalDiscountedPrice } from "../utils/lib/calculateDiscount";
import { applyCollaborationBenefitToPrice } from "../utils/lib/collaborationPricing";
import { resolveCollaborationForCheckoutService } from "./collaborationDomain.services";
import { resolvePartnershipImportDiscountForCheckoutService } from "./partnershipImportConfig.services";
import { AppError } from "../middlewares/error.middleware";
import mongoose from "mongoose";
import {
  OrderModel,
  CourseModel,
  UserModel,
  StudentModel,
  EnrollmentModel,
  CouponModel,
} from "../models";
import { InternshipModel } from "../models/internship.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import jwt from "jsonwebtoken";
import { generatePaytmChecksum } from "../utils/lib/generatePaytmChecksum";
import axios from "axios";
import { validateCouponService } from "./coupon.services";
import {
  qualifiesForInternshipVoucher,
  issueInternshipVoucher,
} from "./internshipVoucher.services";
import type { CourseDiscount, Discount } from "../types";
import { isApplicationWindowOpenIst } from "../utils/applicationWindow";
import { getPointsSettings } from "./pointsSettings.services";
import { parseProgramDurationMonthsFromAnswers } from "../lib/certificationExamSchedule";

const SUCCESS_POINTS_PURCHASE_MAX = 500;

const updatePendingPayments = async (userId: string, updateOperation: any) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (user.userType === "student") {
    await StudentModel.findByIdAndUpdate(userId, updateOperation);
  }
};

/**
 * After Paytm success: confirm paid internship seat and mark cohort enrolled.
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

  return enrollment;
};

/**
 * After Paytm success: credit purchased internship success points (certification) once per order.
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

  // After crediting points, check if learner now qualifies for a certificate
  try {
    const freshEnrollment = await InternshipEnrollmentModel.findById(enrollmentId)
      .select("internshipSuccessPoints")
      .lean();
    if (freshEnrollment && ((freshEnrollment as any).internshipSuccessPoints ?? 0) >= threshold) {
      const { InternshipSubmissionModel } = await import("../models/internshipSubmission.schema");
      const passingSub = await InternshipSubmissionModel.findOne({
        enrollmentId: String(enrollmentId),
        submissionFor: "exam",
        status: "fully_reviewed",
        "templateSnapshot.examType": "certification",
      })
        .select("totalAwardedScore templateSnapshot")
        .lean();
      if (passingSub) {
        const awardedScore = (passingSub as any).totalAwardedScore ?? 0;
        const examThreshold = (passingSub as any).templateSnapshot?.thresholdScore ?? 0;
        if (awardedScore >= examThreshold) {
          const { createCertificateJobService } = await import("./certificateJob.services");
          await createCertificateJobService({
            enrollmentId: String(enrollmentId),
            certificateType: "internship",
            studentName: "",
            courseName: "",
            completionDate: new Date(),
          });
        }
      }
    }
  } catch (certErr) {
    console.error("[Certificate] Failed to queue internship certificate job after payment:", certErr);
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

    // Check if enrollment already exists
    const existingEnrollment = await EnrollmentModel.findOne({
      userId: order.userId,
      courseId: order.courseId,
      status: { $nin: ["dropped", "revoked"] },
    });

    if (existingEnrollment) {
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

    return savedEnrollment;
  } catch (error) {
    console.error("Failed to create enrollment after payment:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to create enrollment after payment", 500);
  }
};

export const getAdminOrdersService = async (
  page: number,
  limit: number,
  search?: string,
  paymentStatus?: string
) => {
  const skip = (page - 1) * limit;
  const pipeline: any[] = [];

  const initialMatch: Record<string, unknown> = {};
  if (paymentStatus && ["pending", "success", "failed"].includes(paymentStatus)) {
    initialMatch.paymentStatus = paymentStatus;
  }
  if (Object.keys(initialMatch).length > 0) {
    pipeline.push({ $match: initialMatch });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "courses",
        localField: "courseId",
        foreignField: "_id",
        as: "course",
        pipeline: [{ $project: { title: 1, slug: 1, thumbnail: 1 } }],
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } }
  );

  if (search && search.trim()) {
    const searchTrimmed = String(search).trim();
    const searchRegex = new RegExp(
      searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    const orConditions: unknown[] = [
      { txnId: searchRegex },
      { couponCode: searchRegex },
      { courseName: searchRegex },
      { internshipTitle: searchRegex },
      { "user.firstName": searchRegex },
      { "user.lastName": searchRegex },
      { "user.email": searchRegex },
      { "course.title": searchRegex },
    ];
    // Exact match by Order ID (MongoDB ObjectId)
    if (/^[a-fA-F0-9]{24}$/.test(searchTrimmed)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(searchTrimmed) });
    }
    pipeline.push({ $match: { $or: orConditions } });
  }

  const [orders, countResult] = await Promise.all([
    OrderModel.aggregate([
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          userId: { $ifNull: ["$user", { firstName: "$userName", lastName: "", email: "" }] },
          courseId: { $ifNull: ["$course", { title: "$courseName", slug: "", thumbnail: "" }] },
          courseName: 1,
          userName: 1,
          orderKind: 1,
          internshipTitle: 1,
          internshipSuccessPointsQuantity: 1,
          batchId: 1,
          txnId: 1,
          amount: 1,
          currency: 1,
          planType: 1,
          paymentMode: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          paymentErrorReason: 1,
          couponCode: 1,
          couponDiscount: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]),
    OrderModel.aggregate([...pipeline, { $count: "total" }]),
  ]);

  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return { orders, total, totalPages, page };
};

export const getSelfOrdersService = async (
  userId: string,
  page: number,
  limit: number,
  search: string
) => {
  const skip = (page - 1) * limit;
  let filters: any = { userId };

  if (search) {
    filters.$or = [
      { "courseId.title": { $regex: search, $options: "i" } },
      { "courseId.description": { $regex: search, $options: "i" } },
      { "courseId.shortDescription": { $regex: search, $options: "i" } },
    ];
  }

  const orders = await OrderModel.find(filters)
    .populate("courseId", "title thumbnail shortDescription")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();

  const total = await OrderModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  return { orders, total, totalPages, page };
};

/**
 * Get total spend for a user (paid orders only, excludes gift/trial which have no orders).
 * @param userId - User ID
 * @returns Total amount spent (successful payments only)
 */
export const getTotalSpendByUserIdService = async (
  userId: string
): Promise<number> => {
  const result = await OrderModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        paymentStatus: "success",
      },
    },
    { $group: { _id: null, totalSpend: { $sum: "$amount" } } },
  ]);
  return result[0]?.totalSpend ?? 0;
};

async function computeCheckoutAfterCollaboration(params: {
  planPrice: number;
  courseId: string;
  courseDiscount: any;
  planDiscount: any;
  userEmail: string | undefined;
}): Promise<{
  priceAfterPlanCourse: number;
  priceAfterCollaboration: number;
  collaborationDiscount: number;
  collaborationDomainId?: string;
  partnershipImportConfigId?: string;
}> {
  const priceAfterPlanCourse = calculateFinalDiscountedPrice(
    params.planPrice,
    params.courseDiscount,
    params.planDiscount
  );
  let priceAfterCollaboration = priceAfterPlanCourse;
  let collaborationDiscount = 0;
  let collaborationDomainId: string | undefined;
  let partnershipImportConfigId: string | undefined;

  const email = params.userEmail?.trim();
  if (!email) {
    return {
      priceAfterPlanCourse,
      priceAfterCollaboration,
      collaborationDiscount,
    };
  }

  let collab = await resolveCollaborationForCheckoutService(email, [
    params.courseId,
  ]);
  if (collab.applies && collab.benefit) {
    const before = priceAfterCollaboration;
    priceAfterCollaboration = applyCollaborationBenefitToPrice(
      before,
      collab.benefit
    );
    collaborationDiscount =
      Math.round((before - priceAfterCollaboration) * 100) / 100;
    collaborationDomainId = collab.collaborationDomainId;
    partnershipImportConfigId = collab.partnershipImportConfigId;
  } else {
    const importDisc = await resolvePartnershipImportDiscountForCheckoutService(
      email,
      [params.courseId]
    );
    if (importDisc.applies && importDisc.benefit) {
      const before = priceAfterCollaboration;
      priceAfterCollaboration = applyCollaborationBenefitToPrice(
        before,
        importDisc.benefit
      );
      collaborationDiscount =
        Math.round((before - priceAfterCollaboration) * 100) / 100;
      partnershipImportConfigId = importDisc.partnershipImportConfigId;
    }
  }

  return {
    priceAfterPlanCourse,
    priceAfterCollaboration,
    collaborationDiscount,
    collaborationDomainId,
    partnershipImportConfigId,
  };
}

/**
 * Resolve the amount to charge: always compute on the backend from plan/course
 * discounts, partnership collaboration, and coupon. The frontend totalAmount
 * is ignored — the backend is the single source of truth so Paytm always matches.
 */
async function resolveOrderAmount(params: {
  planPrice: number;
  courseId: string;
  courseDiscount: any;
  planDiscount: any;
  userId: string;
  userEmail: string | undefined;
  couponCode?: string;
}): Promise<{
  amount: number;
  couponCode: string | undefined;
  couponDiscount: number;
  collaborationDiscount: number;
  collaborationDomainId?: string;
  partnershipImportConfigId?: string;
}> {
  const {
    planPrice,
    courseId,
    courseDiscount,
    planDiscount,
    userId,
    userEmail,
    couponCode,
  } = params;

  const checkout = await computeCheckoutAfterCollaboration({
    planPrice,
    courseId,
    courseDiscount,
    planDiscount,
    userEmail,
  });

  let amount = checkout.priceAfterCollaboration;
  let appliedCouponCode: string | undefined = undefined;
  let couponDiscount = 0;

  if (couponCode) {
    const validation = await validateCouponService({
      code: couponCode,
      courseId,
      purchaseAmount: amount,
      userId,
    });

    if (!validation.valid) {
      throw new AppError(validation.message || "Invalid coupon", 400);
    }

    if (validation.finalAmount != null) {
      couponDiscount = validation.discountAmount ?? 0;
      amount = validation.finalAmount;
      appliedCouponCode = couponCode;
      await CouponModel.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $inc: { usageCount: 1 } }
      );
    }
  }

  return {
    amount: Math.round(amount * 100) / 100,
    couponCode: appliedCouponCode,
    couponDiscount,
    collaborationDiscount: checkout.collaborationDiscount,
    collaborationDomainId: checkout.collaborationDomainId,
    partnershipImportConfigId: checkout.partnershipImportConfigId,
  };
}

export const createOrderService = async (
  userId: string,
  courseId: string,
  planType: "elite" | "essential",
  couponCode?: string
) => {
  if (!process.env.PAYTM_MID || !process.env.PAYTM_WEBSITE) {
    throw new AppError("PAYTM_MID or PAYTM_WEBSITE is not set", 500);
  }

  const [course, user] = await Promise.all([
    CourseModel.findById(courseId),
    UserModel.findById(userId).select("firstName lastName email").lean(),
  ]);
  if (!course) throw new AppError("Course not found", 404);

  const plan = course.plans[planType];
  if (!plan)
    throw new AppError(`${planType} plan not available for this course`, 400);

  // Block new order if user already has active enrollment (not dropped/revoked)
  const existingEnrollment = await EnrollmentModel.findOne({
    userId,
    courseId,
    status: { $nin: ["dropped", "revoked"] },
  });
  if (existingEnrollment) {
    throw new AppError(
      "You are already enrolled in this course. Purchase is only allowed after the previous enrollment is revoked.",
      400
    );
  }

  const planPrice = plan.price;

  const userEmailRaw = user && (user as { email?: string | null }).email;
  const userEmail =
    typeof userEmailRaw === "string" && userEmailRaw.trim()
      ? userEmailRaw.trim()
      : undefined;

  const {
    amount,
    couponCode: appliedCouponCode,
    couponDiscount,
    collaborationDiscount,
    collaborationDomainId,
    partnershipImportConfigId,
  } = await resolveOrderAmount({
    planPrice,
    courseId,
    courseDiscount: course.discount,
    planDiscount: plan.discount,
    userId,
    userEmail,
    couponCode,
  });

  const courseName = (course as any).title ?? "";
  const userName =
    user && ((user as any).firstName || (user as any).lastName)
      ? `${((user as any).firstName ?? "").trim()} ${((user as any).lastName ?? "").trim()}`.trim()
      : "";

  const order = new OrderModel({
    txnId: Math.random().toString(36).substring(2, 15),
    token: "", // Will be set by Paytm's txnToken
    userId,
    orderKind: "course",
    courseId,
    courseName,
    userName,
    planType,
    amount,
    currency: "INR",
    paymentMethod: "paytm",
    paymentMode: "online",
    paymentStatus: "pending",
    couponCode: appliedCouponCode,
    couponDiscount,
    collaborationDiscount: collaborationDiscount ?? 0,
    collaborationDomainId: collaborationDomainId
      ? new mongoose.Types.ObjectId(collaborationDomainId)
      : undefined,
    partnershipImportConfigId: partnershipImportConfigId
      ? new mongoose.Types.ObjectId(partnershipImportConfigId)
      : undefined,
  });
  await order.save();

  // Save order to user
  await StudentModel.findByIdAndUpdate(userId, {
    $push: { orders: order._id.toString() },
  });

  // If final amount is less than ₹1, treat as free — skip Paytm and complete enrollment
  const isFreeOrder = amount < 1;
  if (isFreeOrder) {
    order.amount = 0;
    order.paymentStatus = "success";
    await order.save();
    await createEnrollmentAfterPayment(order);
    const paymentGatewayToken = generatePaymentGatewayToken(order._id.toString());
    return {
      _id: order._id.toString(),
      freeOrder: true,
      token: paymentGatewayToken,
    };
  }

  const paymentGatewayToken = generatePaymentGatewayToken(order._id.toString());
  const redirectUrl = `${
    process.env.FRONTEND_URL
  }/payment/status/${order._id.toString()}?token=${paymentGatewayToken}`;

  // Paytm requires amount with at most 2 decimal places; avoid floating-point strings like "0.34999999999999964"
  const amountForPaytm =
    Number.isInteger(amount) ? amount.toString() : Number(amount.toFixed(2)).toString();

  const body = {
    requestType: "Payment",
    mid: process.env.PAYTM_MID,
    websiteName: process.env.PAYTM_WEBSITE,
    orderId: order._id.toString(),
    callbackUrl: redirectUrl,
    txnAmount: { value: amountForPaytm, currency: "INR" },
    userInfo: { custId: userId },
  };

  const checksum = await generatePaytmChecksum(body);

  if (!checksum) {
    throw new AppError("Failed to generate Paytm checksum", 500);
  }

  let response;
  try {
    response = await axios.post(
      `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${
        process.env.PAYTM_MID
      }&orderId=${order._id.toString()}`,
      {
        head: {
          signature: checksum,
          channelId: "WEB",
          version: "v1",
          requestTimestamp: `${Math.floor(Date.now() / 1000)}`,
        },
        body,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
  } catch (err: any) {
    const paytmBody = err.response?.data?.body;
    const resultInfo = paytmBody?.resultInfo;
    const message =
      resultInfo?.resultMsg ||
      err.response?.data?.message ||
      err.message ||
      "Failed to initiate Paytm transaction";
    throw new AppError(message, err.response?.status || 500);
  }

  if (response.status !== 200) {
    throw new AppError("Error initiating transaction", 500);
  }

  const paytmBody = response.data?.body;
  const resultInfo = paytmBody?.resultInfo;

  // Paytm returns 200 even for validation/API errors; check resultInfo first
  if (resultInfo && resultInfo.resultStatus !== "S") {
    const message =
      resultInfo.resultMsg ||
      `Paytm error (code: ${resultInfo.resultCode || "unknown"})`;
    throw new AppError(message, 400);
  }

  if (!paytmBody?.txnToken) {
    const paytmMessage = resultInfo?.resultMsg
      ? resultInfo.resultMsg
      : "Invalid response from Paytm - no transaction token";
    throw new AppError(paytmMessage, 500);
  }

  order.token = paytmBody.txnToken; // Paytm's transaction token
  await order.save();

  await updatePendingPayments(userId, {
    $push: { pendingPayments: order._id.toString() },
  });

  return {
    _id: order._id.toString(),
    token: paytmBody.txnToken,
  };
};

/**
 * Create Paytm order for “direct seat” internship enrollment (after form, `payment_pending`).
 * Amount is derived from the batch plan + discounts (single source of truth, same as enroll-preview).
 */
export const createInternshipSeatOrderService = async (
  userId: string,
  internshipEnrollmentId: string,
) => {
  if (!process.env.PAYTM_MID || !process.env.PAYTM_WEBSITE) {
    throw new AppError("PAYTM_MID or PAYTM_WEBSITE is not set", 500);
  }

  if (!mongoose.Types.ObjectId.isValid(internshipEnrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const enrollment = await InternshipEnrollmentModel.findById(
    internshipEnrollmentId,
  );
  if (!enrollment) throw new AppError("Internship enrollment not found", 404);
  if (String(enrollment.user) !== String(userId)) {
    throw new AppError("This enrollment does not belong to you", 403);
  }

  // Statuses an enrollment can be in when starting a seat payment:
  //  • "payment_pending"     — fresh direct-seat registration (enrollmentType=paid)
  //  • "exam_registered"     — merit learner upgrading to paid; exam access kept
  //  • "exam_attempted"      — merit learner upgrading after taking the exam
  //  • "in_merit_pool"       — merit learner upgrading while waiting for selection
  //  • "admin_rejected"      — merit learner who was rejected and now buys a seat
  // For upgrade cases enrollmentType is still "merit" — the promotion to "paid"
  // happens atomically on payment success, not at order-creation time.
  const payableStatuses = [
    "payment_pending",
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
    payableStatuses.includes(String(enrollment.status));
  if (!isPaidPending && !isMeritUpgrade) {
    throw new AppError("This enrollment is not waiting for a seat payment", 400);
  }

  const internship = await InternshipModel.findById(enrollment.internship).lean();
  if (!internship) throw new AppError("Internship not found", 404);

  const batchIdStr = enrollment.batchSnapshot?.batchId;
  if (!batchIdStr) throw new AppError("Enrollment is missing batch", 400);

  const batch = (internship.batches as Record<string, unknown>[])?.find(
    (b) => String(b._id) === String(batchIdStr),
  ) as
    | {
        _id: unknown;
        applicationLastDate?: Date;
        plan?: { price: number; isActive?: boolean; discount?: unknown } | null;
      }
    | undefined;
  if (!batch) throw new AppError("Batch not found on internship", 404);

  if (String(enrollment.status) === "payment_pending") {
    const snap = enrollment.batchSnapshot as
      | { applicationLastDate?: Date }
      | undefined;
    const snapDate = snap?.applicationLastDate;
    const effectiveDeadline =
      snapDate instanceof Date && !Number.isNaN(snapDate.getTime())
        ? snapDate
        : batch.applicationLastDate;
    if (
      effectiveDeadline != null &&
      !isApplicationWindowOpenIst(effectiveDeadline)
    ) {
      throw new AppError(
        "The enrollment deadline for this cohort has passed. You can remove this pending registration from your dashboard, or contact support if you need help.",
        400,
      );
    }
  }

  const plan = batch.plan;
  if (!plan || plan.isActive === false) {
    throw new AppError("This cohort has no purchasable plan", 400);
  }

  const listPrice = Number(plan.price) || 0;
  const internshipDisc = (internship as { discount?: CourseDiscount | null })
    .discount;
  const planDiscount =
    (plan as { discount?: Discount | null }).discount ?? undefined;
  const rawAmount = calculateFinalDiscountedPrice(
    listPrice,
    internshipDisc ?? undefined,
    planDiscount,
  );
  const amount = Math.round(rawAmount * 100) / 100;

  const user = await UserModel.findById(userId)
    .select("firstName lastName email")
    .lean();
  const userName =
    user && ((user as { firstName?: string }).firstName || (user as { lastName?: string }).lastName)
      ? `${((user as { firstName?: string }).firstName ?? "").trim()} ${(
          (user as { lastName?: string }).lastName ?? ""
        ).trim()}`.trim()
      : "";

  await OrderModel.deleteMany({
    userId: new mongoose.Types.ObjectId(userId),
    orderKind: "internship_seat",
    internshipEnrollmentId: new mongoose.Types.ObjectId(internshipEnrollmentId),
    paymentStatus: "pending",
  });

  const order = new OrderModel({
    txnId: Math.random().toString(36).substring(2, 15),
    token: "",
    userId,
    orderKind: "internship_seat",
    amount,
    currency: "INR",
    paymentMethod: "paytm",
    paymentMode: "online",
    paymentStatus: "pending",
    userName,
    internshipId: new mongoose.Types.ObjectId(String(enrollment.internship)),
    batchId: batchIdStr,
    internshipEnrollmentId: new mongoose.Types.ObjectId(internshipEnrollmentId),
    internshipTitle: String((internship as { title?: string }).title ?? "Internship"),
  });
  await order.save();

  await StudentModel.findByIdAndUpdate(userId, {
    $push: { orders: order._id.toString() },
  });

  if (amount < 1) {
    order.amount = 0;
    order.paymentStatus = "success";
    await order.save();
    await createEnrollmentAfterPayment(order);
    const paymentGatewayToken = generatePaymentGatewayToken(
      order._id.toString(),
    );
    return {
      _id: order._id.toString(),
      freeOrder: true,
      token: paymentGatewayToken,
    };
  }

  const paymentGatewayToken = generatePaymentGatewayToken(order._id.toString());
  const redirectUrl = `${
    process.env.FRONTEND_URL
  }/payment/status/${order._id.toString()}?token=${paymentGatewayToken}`;

  const amountForPaytm = Number.isInteger(amount)
    ? amount.toString()
    : Number(amount.toFixed(2)).toString();

  const paytmRequestBody = {
    requestType: "Payment" as const,
    mid: process.env.PAYTM_MID,
    websiteName: process.env.PAYTM_WEBSITE,
    orderId: order._id.toString(),
    callbackUrl: redirectUrl,
    txnAmount: { value: amountForPaytm, currency: "INR" as const },
    userInfo: { custId: userId },
  };

  const checksum = await generatePaytmChecksum(paytmRequestBody);

  if (!checksum) {
    throw new AppError("Failed to generate Paytm checksum", 500);
  }

  let response;
  try {
    response = await axios.post(
      `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${
        process.env.PAYTM_MID
      }&orderId=${order._id.toString()}`,
      {
        head: {
          signature: checksum,
          channelId: "WEB",
          version: "v1",
          requestTimestamp: `${Math.floor(Date.now() / 1000)}`,
        },
        body: paytmRequestBody,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  } catch (err: unknown) {
    const e = err as { response?: { data?: { body?: { resultInfo?: { resultMsg?: string } } } } };
    const paytmBody = e.response?.data?.body;
    const resultInfo = paytmBody?.resultInfo;
    const message =
      resultInfo?.resultMsg ||
      (e as { message?: string }).message ||
      "Failed to initiate Paytm transaction";
    throw new AppError(
      message,
      (e as { response?: { status?: number } }).response?.status || 500,
    );
  }

  if (response.status !== 200) {
    throw new AppError("Error initiating transaction", 500);
  }

  const paytmBody = response.data?.body;
  const resultInfo = paytmBody?.resultInfo;

  if (resultInfo && resultInfo.resultStatus !== "S") {
    const message =
      resultInfo.resultMsg ||
      `Paytm error (code: ${resultInfo.resultCode || "unknown"})`;
    throw new AppError(message, 400);
  }

  if (!paytmBody?.txnToken) {
    const paytmMessage = resultInfo?.resultMsg
      ? resultInfo.resultMsg
      : "Invalid response from Paytm - no transaction token";
    throw new AppError(paytmMessage, 500);
  }

  order.token = paytmBody.txnToken;
  await order.save();

  await updatePendingPayments(userId, {
    $push: { pendingPayments: order._id.toString() },
  });

  return {
    _id: order._id.toString(),
    token: paytmBody.txnToken,
  };
};

/**
 * Create Paytm order for purchasing internship certification success points (admin-priced INR per point).
 */
export const createInternshipSuccessPointsOrderService = async (
  userId: string,
  internshipEnrollmentId: string,
  quantity: number,
) => {
  if (!process.env.PAYTM_MID || !process.env.PAYTM_WEBSITE) {
    throw new AppError("PAYTM_MID or PAYTM_WEBSITE is not set", 500);
  }

  if (!mongoose.Types.ObjectId.isValid(internshipEnrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const qty = Math.floor(Number(quantity));
  if (
    !Number.isFinite(qty) ||
    qty < 1 ||
    qty > SUCCESS_POINTS_PURCHASE_MAX
  ) {
    throw new AppError(
      `quantity must be between 1 and ${SUCCESS_POINTS_PURCHASE_MAX}`,
      400,
    );
  }

  const enrollment = await InternshipEnrollmentModel.findById(
    internshipEnrollmentId,
  );
  if (!enrollment) throw new AppError("Internship enrollment not found", 404);
  if (String(enrollment.user) !== String(userId)) {
    throw new AppError("This enrollment does not belong to you", 403);
  }

  const activeStatuses = ["enrolled", "completed", "paused"] as string[];
  if (!activeStatuses.includes(String(enrollment.status))) {
    throw new AppError(
      "Your enrollment is not active for this purchase",
      400,
    );
  }

  const internship = await InternshipModel.findById(enrollment.internship).lean();
  if (!internship) throw new AppError("Internship not found", 404);

  const thresholdRaw = (internship as { certificationThreshold?: unknown })
    .certificationThreshold;
  const threshold =
    typeof thresholdRaw === "number" && !Number.isNaN(thresholdRaw)
      ? Math.max(0, Math.floor(thresholdRaw))
      : 0;
  if (threshold <= 0) {
    throw new AppError(
      "This program does not offer purchased success points",
      400,
    );
  }

  const settings = await getPointsSettings();
  const pricePerPoint = settings.internshipSuccessPointInr;
  if (typeof pricePerPoint !== "number" || pricePerPoint <= 0) {
    throw new AppError("Purchasing success points is not available right now", 400);
  }

  const rawAmount = qty * pricePerPoint;
  const amount = Math.round(rawAmount * 100) / 100;

  const user = await UserModel.findById(userId)
    .select("firstName lastName email")
    .lean();
  const userName =
    user && ((user as { firstName?: string }).firstName || (user as { lastName?: string }).lastName)
      ? `${((user as { firstName?: string }).firstName ?? "").trim()} ${(
          (user as { lastName?: string }).lastName ?? ""
        ).trim()}`.trim()
      : "";

  const batchIdStr = enrollment.batchSnapshot?.batchId;

  await OrderModel.deleteMany({
    userId: new mongoose.Types.ObjectId(userId),
    orderKind: "internship_success_points",
    internshipEnrollmentId: new mongoose.Types.ObjectId(internshipEnrollmentId),
    paymentStatus: "pending",
  });

  const order = new OrderModel({
    txnId: Math.random().toString(36).substring(2, 15),
    token: "",
    userId,
    orderKind: "internship_success_points",
    amount,
    currency: "INR",
    paymentMethod: "paytm",
    paymentMode: "online",
    paymentStatus: "pending",
    userName,
    internshipId: new mongoose.Types.ObjectId(String(enrollment.internship)),
    ...(batchIdStr ? { batchId: batchIdStr } : {}),
    internshipEnrollmentId: new mongoose.Types.ObjectId(internshipEnrollmentId),
    internshipTitle: String((internship as { title?: string }).title ?? "Internship"),
    internshipSuccessPointsQuantity: qty,
  });
  await order.save();

  await StudentModel.findByIdAndUpdate(userId, {
    $push: { orders: order._id.toString() },
  });

  if (amount < 1) {
    order.amount = 0;
    order.paymentStatus = "success";
    await order.save();
    await createEnrollmentAfterPayment(order);
    const paymentGatewayToken = generatePaymentGatewayToken(
      order._id.toString(),
    );
    return {
      _id: order._id.toString(),
      freeOrder: true,
      token: paymentGatewayToken,
    };
  }

  const paymentGatewayToken = generatePaymentGatewayToken(order._id.toString());
  const redirectUrl = `${
    process.env.FRONTEND_URL
  }/payment/status/${order._id.toString()}?token=${paymentGatewayToken}`;

  const amountForPaytm = Number.isInteger(amount)
    ? amount.toString()
    : Number(amount.toFixed(2)).toString();

  const paytmRequestBody = {
    requestType: "Payment" as const,
    mid: process.env.PAYTM_MID,
    websiteName: process.env.PAYTM_WEBSITE,
    orderId: order._id.toString(),
    callbackUrl: redirectUrl,
    txnAmount: { value: amountForPaytm, currency: "INR" as const },
    userInfo: { custId: userId },
  };

  const checksum = await generatePaytmChecksum(paytmRequestBody);

  if (!checksum) {
    throw new AppError("Failed to generate Paytm checksum", 500);
  }

  let response;
  try {
    response = await axios.post(
      `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${
        process.env.PAYTM_MID
      }&orderId=${order._id.toString()}`,
      {
        head: {
          signature: checksum,
          channelId: "WEB",
          version: "v1",
          requestTimestamp: `${Math.floor(Date.now() / 1000)}`,
        },
        body: paytmRequestBody,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  } catch (err: unknown) {
    const e = err as { response?: { data?: { body?: { resultInfo?: { resultMsg?: string } } } } };
    const paytmBody = e.response?.data?.body;
    const resultInfo = paytmBody?.resultInfo;
    const message =
      resultInfo?.resultMsg ||
      (e as { message?: string }).message ||
      "Failed to initiate Paytm transaction";
    throw new AppError(
      message,
      (e as { response?: { status?: number } }).response?.status || 500,
    );
  }

  if (response.status !== 200) {
    throw new AppError("Error initiating transaction", 500);
  }

  const paytmBody = response.data?.body;
  const resultInfo = paytmBody?.resultInfo;

  if (resultInfo && resultInfo.resultStatus !== "S") {
    const message =
      resultInfo.resultMsg ||
      `Paytm error (code: ${resultInfo.resultCode || "unknown"})`;
    throw new AppError(message, 400);
  }

  if (!paytmBody?.txnToken) {
    const paytmMessage = resultInfo?.resultMsg
      ? resultInfo.resultMsg
      : "Invalid response from Paytm - no transaction token";
    throw new AppError(paytmMessage, 500);
  }

  order.token = paytmBody.txnToken;
  await order.save();

  await updatePendingPayments(userId, {
    $push: { pendingPayments: order._id.toString() },
  });

  return {
    _id: order._id.toString(),
    token: paytmBody.txnToken,
  };
};

export const getOrderInfoService = async (orderId: string) => {
  const order = await OrderModel.findById(orderId)
    .populate("courseId", "title thumbnail shortDescription")
    .populate("internshipId", "title slug")
    .populate("userId", "name email")
    .lean();
  if (!order) throw new AppError("Order not found", 404);
  return order;
};

export const updateOrderService = async (orderId: string, update: any) => {
  const order = await OrderModel.findOneAndUpdate(
    { _id: orderId },
    { ...update, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!order) throw new AppError("Order not found", 404);
  return order;
};

export const verifyPayment = async (token: string) => {
  const { orderId } = verifyPaymentGatewayToken(token);
  const order = await OrderModel.findOne({ _id: orderId });
  if (!order) throw new AppError("Order not found", 404);

  if (order.paymentStatus === "success" || order.paymentStatus === "failed") {
    return {
      status: order.paymentStatus,
      orderId: order._id.toString(),
      updatedAt: order.updatedAt,
      amount: order.amount,
      txnId: order.txnId,
    };
  }

  const signature = await generatePaytmChecksum({
    mid: process.env.PAYTM_MID,
    orderId: orderId,
  });

  const status = await axios.post(
    `https://secure.paytmpayments.com/v3/order/status`,
    {
      body: { mid: process.env.PAYTM_MID, orderId: orderId },
      head: { signature: signature },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  if (status.status !== 200) {
    return {
      status: order.paymentStatus,
      orderId: order._id.toString(),
      updatedAt: order.updatedAt,
      amount: order.amount,
      txnId: order.txnId,
    };
  }

  if (status.data.body.resultInfo.resultStatus === "TXN_SUCCESS") {
    order.paymentStatus = "success";
    order.paymentMode = status.data.body.paymentMode;
    order.txnId = status.data.body.txnId;
    await order.save();

    await updatePendingPayments(order.userId?.toString() || "", {
      $pull: { pendingPayments: order._id.toString() },
    });

    // Create enrollment after successful payment (this will update analytics)
    try {
      await createEnrollmentAfterPayment(order);
    } catch (enrollmentError) {
      console.error(
        `Failed to create enrollment for order ${order._id}:`,
        enrollmentError
      );
      // Don't throw here as payment is already successful
      // The enrollment can be created manually later if needed
    }
  } else if (status.data.body.resultInfo.resultStatus === "TXN_FAILURE") {
    order.paymentStatus = "failed";
    order.paymentErrorReason =
      status.data.body.resultInfo?.resultMsg || "Payment declined";
    await order.save();

    await updatePendingPayments(order.userId?.toString() || "", {
      $pull: { pendingPayments: order._id.toString() },
    });
  }

  return {
    status: order.paymentStatus,
    orderId: order._id.toString(),
    updatedAt: order.updatedAt,
    amount: order.amount,
    txnId: order.txnId,
  };
};

export const generatePaymentGatewayToken = (orderId: string) => {
  return jwt.sign({ orderId }, process.env.JWT_SECRET!, { expiresIn: "5m" });
};

export const verifyPaymentGatewayToken = (
  token: string
): { orderId: string } => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { orderId: string };
  } catch (error) {
    throw new AppError("Invalid token", 400);
  }
};

export const processWebhook = async (webhookData: any) => {
  try {
    const orderId = webhookData.orderId || webhookData.ORDERID;
    const txnId = webhookData.txnId || webhookData.TXNID;
    const status = webhookData.status || webhookData.STATUS;

    if (!orderId) {
      return { success: false, message: "Order ID not found in webhook data" };
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found", orderId };
    }

    if (order.paymentStatus === "success") {
      return {
        success: true,
        message: "Order already processed successfully",
        orderId,
      };
    }

    if (status === "TXN_SUCCESS" || status === "success") {
      await handleSuccessfulPayment(order, txnId);
      return {
        success: true,
        message: "Payment processed successfully",
        orderId,
      };
    } else if (status === "TXN_FAILURE" || status === "failed") {
      const errorReason =
        webhookData.respMsg ||
        webhookData.RESPMSG ||
        webhookData.resultMsg ||
        "Payment declined";
      await handleFailedPayment(order, errorReason);
      return { success: true, message: "Payment failure processed", orderId };
    } else {
      return {
        success: false,
        message: `Unknown payment status: ${status}`,
        orderId,
      };
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      success: false,
      message: "Error processing webhook",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const handleSuccessfulPayment = async (order: any, txnId: string) => {
  order.paymentStatus = "success";
  order.txnId = txnId;
  order.paymentMode = "online";
  await order.save();

  await updatePendingPayments(order.userId?.toString() || "", {
    $pull: { pendingPayments: order._id.toString() },
  });

  // Create enrollment after successful payment (this will update analytics)
  try {
    await createEnrollmentAfterPayment(order);
  } catch (enrollmentError) {
    console.error(
      `Failed to create enrollment for order ${order._id}:`,
      enrollmentError
    );
    // Don't throw here as payment is already successful
    // The enrollment can be created manually later if needed
  }
};

const handleFailedPayment = async (
  order: any,
  errorReason?: string
) => {
  order.paymentStatus = "failed";
  if (errorReason) {
    order.paymentErrorReason = errorReason;
  }
  await order.save();

  await updatePendingPayments(order.userId?.toString() || "", {
    $pull: { pendingPayments: order._id.toString() },
  });
};

export const deleteOrderService = async (orderId: string) => {
  const order = await OrderModel.findByIdAndDelete(orderId);
  if (!order) throw new AppError("Order not found", 404);
  return order;
};
