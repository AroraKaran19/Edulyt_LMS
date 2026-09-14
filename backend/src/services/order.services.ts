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
import { verifyPaymentGatewayToken } from "./payments/token";
import {
  applyPaymentResult,
  beginGatewayCheckout,
  reconcileOrder,
  resolveGateway,
} from "./payments/orderFlow";
import { getProvider } from "./payments/registry";
import { validateCouponService } from "./coupon.services";
import { applyCouponToCheckout } from "./checkoutCoupon.services";
import { resolveOfferSelection } from "../lib/courseInternshipOffer";
import { getPointsSettings } from "./pointsSettings.services";
import type { CourseDiscount, Discount } from "../types";
import type { OrderScholarshipSnapshot } from "../types/order";
import { isApplicationWindowOpenIst } from "../utils/applicationWindow";
import type { Brand } from "../constants/brands";
import { assertBrandReadable } from "../lib/brandPurchase";
import { brandOfCourseDoc } from "./productBrand.services";

// Re-exported for back-compat: these moved to ./payments/token, but existing
// importers still reach for them here.
export {
  generatePaymentGatewayToken,
  verifyPaymentGatewayToken,
} from "./payments/token";

const SUCCESS_POINTS_PURCHASE_MAX = 500;

// Post-payment fulfillment moved to ./payments/fulfillment so orderFlow can
// call it without importing this module (which imports orderFlow).
export {
  createEnrollmentAfterPayment,
  createInternshipSeatEnrollmentAfterPayment,
  createInternshipSuccessPointsAfterPayment,
} from "./payments/fulfillment";

export interface GetAdminOrdersParams {
  page: number;
  limit: number;
  search?: string;
  /**
   * One or more payment statuses to include. Empty / omitted means no filter
   * (every status), which is what the UI sends when all boxes are ticked.
   */
  paymentStatus?: string | string[];
  /** Inclusive `createdAt` window. Both optional. */
  from?: Date;
  to?: Date;
  /**
   * Ignore paging and return every match up to `maxRows`. Used by the CSV
   * date-range export.
   */
  exportAll?: boolean;
  maxRows?: number;
}

export const getAdminOrdersService = async (params: GetAdminOrdersParams) => {
  const { page, limit, search, paymentStatus, from, to, exportAll } = params;
  const maxRows = params.maxRows ?? 50_000;
  const skip = (page - 1) * limit;

  const VALID_STATUSES = ["pending", "success", "failed"];
  const statuses = (
    Array.isArray(paymentStatus)
      ? paymentStatus
      : String(paymentStatus ?? "").split(",")
  )
    .map((s) => s.trim())
    .filter((s) => VALID_STATUSES.includes(s));

  const initialMatch: Record<string, unknown> = {};
  // A full selection is the same as no filter, so skip the clause and let the
  // query keep using the plain `createdAt` index.
  if (statuses.length > 0 && statuses.length < VALID_STATUSES.length) {
    initialMatch.paymentStatus =
      statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  // Rides { paymentStatus, createdAt } / { createdAt } — applied before the
  // user/course lookups so the joins only run on rows that survive the window.
  if (from || to) {
    const clause: Record<string, Date> = {};
    if (from) clause.$gte = from;
    if (to) clause.$lte = to;
    initialMatch.createdAt = clause;
  }
  const matchStages: any[] =
    Object.keys(initialMatch).length > 0 ? [{ $match: initialMatch }] : [];

  // Both joins are 1:1 on `_id`, so they never change the row count. Where
  // they sit in the pipeline decides how many rows pay for them.
  const lookupStages: any[] = [
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
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
  ];

  const searchTrimmed = String(search ?? "").trim();
  let searchStage: { $match: { $or: unknown[] } } | null = null;
  if (searchTrimmed) {
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
    searchStage = { $match: { $or: orConditions } };
  }

  const sortStage = { $sort: { createdAt: -1 } };
  const pagingStages = exportAll
    ? [{ $limit: maxRows }]
    : [{ $skip: skip }, { $limit: limit }];
  const projectStage = {
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
      collaborationDiscount: 1,
      referralCode: 1,
      referralDiscount: 1,
      successPointsApplied: 1,
      successPointsDiscount: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  };

  /**
   * A search term matches joined `user.*` / `course.*` fields, so the joins
   * have to run before the filter and the whole match gets joined.
   *
   * Without one the order inverts: `$match` + `$sort` + paging ride
   * { createdAt: -1 } (or { paymentStatus, createdAt }) off the front of the
   * pipeline, so only the rows actually being returned are joined and a page
   * load costs the same at a million orders as at a thousand.
   */
  const listPipeline: any[] = searchStage
    ? [
        ...matchStages,
        ...lookupStages,
        searchStage,
        sortStage,
        ...pagingStages,
        projectStage,
      ]
    : [
        ...matchStages,
        sortStage,
        ...pagingStages,
        ...lookupStages,
        projectStage,
      ];

  /**
   * The count only needs the joins when a search term can match a joined
   * field. Otherwise:
   *  - with a status / date filter it is a COUNT_SCAN over the same index the
   *    listing rides, no documents fetched;
   *  - with no filter at all (the default view) it reads the collection's
   *    metadata count. That figure only drifts from the truth after an
   *    unclean shutdown, and it drives a page count in an admin header, so
   *    the trade is worth not scan-counting the collection on every load.
   */
  const countPromise = searchStage
    ? OrderModel.aggregate<{ total: number }>([
        ...matchStages,
        ...lookupStages,
        searchStage,
        { $count: "total" },
      ]).then((rows) => rows[0]?.total ?? 0)
    : matchStages.length > 0
      ? OrderModel.countDocuments(initialMatch)
      : OrderModel.estimatedDocumentCount();

  const [orders, total] = await Promise.all([
    OrderModel.aggregate(listPipeline),
    countPromise,
  ]);

  const totalPages = exportAll ? 1 : Math.ceil(total / limit);

  return { orders, total, totalPages, page: exportAll ? 1 : page };
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
 * is ignored — the backend is the single source of truth so the gateway always matches.
 */
async function resolveOrderAmount(params: {
  planPrice: number;
  courseId: string;
  courseDiscount: any;
  planDiscount: any;
  userId: string;
  userEmail: string | undefined;
  couponCode?: string;
  brand: Brand;
}): Promise<{
  amount: number;
  couponCode: string | undefined;
  couponDiscount: number;
  collaborationDiscount: number;
  collaborationDomainId?: string;
  partnershipImportConfigId?: string;
  scholarshipTestId?: string;
  scholarshipSnapshot?: OrderScholarshipSnapshot;
}> {
  const {
    planPrice,
    courseId,
    courseDiscount,
    planDiscount,
    userId,
    userEmail,
    couponCode,
    brand,
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
  let appliedScholarshipTestId: string | undefined = undefined;
  let appliedScholarshipSnapshot: OrderScholarshipSnapshot | undefined =
    undefined;

  if (couponCode) {
    const applied = await applyCouponToCheckout({
      couponCode,
      courseId,
      userId,
      amount,
      brand,
    });
    amount = applied.amount;
    couponDiscount = applied.couponDiscount;
    appliedCouponCode = applied.couponCode;
    appliedScholarshipTestId = applied.scholarshipTestId;
    appliedScholarshipSnapshot = applied.scholarshipSnapshot;
  }

  return {
    amount: Math.round(amount * 100) / 100,
    couponCode: appliedCouponCode,
    couponDiscount,
    collaborationDiscount: checkout.collaborationDiscount,
    collaborationDomainId: checkout.collaborationDomainId,
    partnershipImportConfigId: checkout.partnershipImportConfigId,
    scholarshipTestId: appliedScholarshipTestId,
    scholarshipSnapshot: appliedScholarshipSnapshot,
  };
}

export const createOrderService = async (
  userId: string,
  courseId: string,
  planType: "elite" | "essential",
  /** The site the checkout runs on. Never inferred: both brands sell here. */
  brand: Brand,
  couponCode?: string,
  referralCode?: string,
  useSuccessPoints?: boolean,
  gateway?: string,
  /** Course-internship add-on: duration the learner picked, if any. */
  courseInternshipMonths?: number,
) => {
  // The provider's isConfigured() owns credential validation now.
  const gatewayName = resolveGateway(gateway);

  const [course, user] = await Promise.all([
    CourseModel.findById(courseId),
    UserModel.findById(userId).select("firstName lastName email").lean(),
  ]);
  if (!course) throw new AppError("Course not found", 404);
  assertBrandReadable(brandOfCourseDoc(course), brand, "course");

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
    amount: subtotal,
    couponCode: appliedCouponCode,
    couponDiscount,
    collaborationDiscount,
    collaborationDomainId,
    partnershipImportConfigId,
    scholarshipTestId: appliedScholarshipTestId,
    scholarshipSnapshot: appliedScholarshipSnapshot,
  } = await resolveOrderAmount({
    planPrice,
    courseId,
    courseDiscount: course.discount,
    planDiscount: plan.discount,
    userId,
    userEmail,
    couponCode,
    brand,
  });

  // Referral buyer discount: validate the code and take the configured % off
  // the current subtotal (after collaboration AND any coupon — referral stacks
  // last before success points). The code is also snapshotted on the order so
  // the post-payment hook credits the referrer on the discounted amount.
  let referralCodeSnapshot: string | undefined;
  let referralDiscount = 0;
  const refRaw =
    typeof referralCode === "string" ? referralCode.trim().toUpperCase() : "";
  if (refRaw) {
    const { validateReferralCode, getReferralBuyerDiscountPercent } =
      await import("./referral.services");
    const res = await validateReferralCode(
      refRaw,
      new mongoose.Types.ObjectId(userId),
      brand,
    );
    if (!res.valid) {
      if (res.reason === "other-brand" && res.message) {
        throw new AppError(res.message, 400);
      }
      if (res.reason === "self") {
        throw new AppError("You can't use your own referral code.", 400);
      }
      if (res.reason === "not-found") {
        throw new AppError("Referral code not found.", 400);
      }
      throw new AppError("Invalid referral code.", 400);
    }
    referralCodeSnapshot = refRaw;

    const pct = await getReferralBuyerDiscountPercent();
    if (pct > 0) {
      referralDiscount = Math.round(subtotal * (pct / 100) * 100) / 100;
    }
  }

  const baseAfterReferral =
    Math.round((subtotal - referralDiscount) * 100) / 100;

  // Apply success-points discount last in the stack, capped at amount due.
  // The buyer's balance check + actual deduction happens at payment success;
  // here we only price the order and snapshot the intended redemption.
  let amount = baseAfterReferral;
  let successPointsApplied = 0;
  let successPointsDiscount = 0;

  if (useSuccessPoints && baseAfterReferral > 0) {
    const settings = await getPointsSettings();
    const rate = Number(settings.successPointRedemptionInr ?? 0);
    const maxPct = Math.min(
      100,
      Math.max(0, Number(settings.successPointsMaxUtilizationPercent ?? 0)),
    );
    if (rate > 0 && maxPct > 0) {
      const student = await StudentModel.findById(userId)
        .select("successPoints")
        .lean<{ successPoints?: number } | null>();
      const balance = Math.max(
        0,
        Math.floor(Number(student?.successPoints ?? 0)),
      );
      // Cap by the admin %-of-amount-due (success points stack AFTER coupon +
      // referral), and never discount more than the amount actually due.
      const maxDiscountByPct =
        Math.round(baseAfterReferral * (maxPct / 100) * 100) / 100;
      // Work in whole points so discount = points × rate stays exact and
      // inside every cap.
      const maxPointsByPct = Math.floor(maxDiscountByPct / rate);
      const maxPointsByDue = Math.floor(baseAfterReferral / rate);
      const pointsToSpend = Math.max(
        0,
        Math.min(balance, maxPointsByPct, maxPointsByDue),
      );
      if (pointsToSpend > 0) {
        const discount =
          Math.round(
            Math.min(pointsToSpend * rate, baseAfterReferral) * 100,
          ) / 100;
        successPointsApplied = pointsToSpend;
        successPointsDiscount = discount;
        amount = Math.round((baseAfterReferral - discount) * 100) / 100;
      }
    }
  }

  // Internship add-on, priced LAST and deliberately outside the discount stack:
  // coupons, collaboration, referral and success points all apply to the course
  // only. The price comes from the course's own offer — a learner chooses which
  // duration, never what it costs.
  const { selection: internshipSelection, error: internshipError } =
    resolveOfferSelection(
      (course as any).internshipOffer,
      courseInternshipMonths,
    );
  if (internshipError) throw new AppError(internshipError, 400);

  if (internshipSelection) {
    amount = Math.round((amount + internshipSelection.price) * 100) / 100;
  }

  const courseName = (course as any).title ?? "";
  const userName =
    user && ((user as any).firstName || (user as any).lastName)
      ? `${((user as any).firstName ?? "").trim()} ${((user as any).lastName ?? "").trim()}`.trim()
      : "";

  const order = new OrderModel({
    txnId: Math.random().toString(36).substring(2, 15),
    token: "", // Will be set by the gateway's client token
    userId,
    brand,
    orderKind: "course",
    courseId,
    courseName,
    userName,
    planType,
    amount,
    currency: "INR",
    paymentMethod: gatewayName,
    paymentMode: "online",
    paymentStatus: "pending",
    couponCode: appliedCouponCode,
    couponDiscount,
    // Only set for a scholarship winner's coupon. Settlement reads it to know
    // there is a voucher to retire, and the campaign deletion preview counts
    // in-flight checkouts through it.
    scholarshipTestId: appliedScholarshipTestId
      ? new mongoose.Types.ObjectId(appliedScholarshipTestId)
      : null,
    // Frozen at checkout: the campaign, the coupon and the buying account are
    // all deletable, so the pointer above cannot explain this payment later.
    scholarshipSnapshot: appliedScholarshipSnapshot ?? null,
    collaborationDiscount: collaborationDiscount ?? 0,
    collaborationDomainId: collaborationDomainId
      ? new mongoose.Types.ObjectId(collaborationDomainId)
      : undefined,
    partnershipImportConfigId: partnershipImportConfigId
      ? new mongoose.Types.ObjectId(partnershipImportConfigId)
      : undefined,
    referralCode: referralCodeSnapshot,
    referralDiscount,
    successPointsApplied,
    successPointsDiscount,
    ...(internshipSelection
      ? {
          courseInternshipProgramId: (course as any).internshipOffer.programId,
          courseInternshipMonths: internshipSelection.months,
          courseInternshipPrice: internshipSelection.price,
        }
      : {}),
  });
  await order.save();

  // Save order to user
  await StudentModel.findByIdAndUpdate(userId, {
    $push: { orders: order._id.toString() },
  });

  return beginGatewayCheckout(order, {
    userId: String(userId),
    name: userName,
    email: userEmail,
  });
};

/**
 * Create a checkout order for “direct seat” internship enrollment (after form, `payment_pending`).
 * Amount is derived from the batch plan + discounts (single source of truth, same as enroll-preview).
 */
export const createInternshipSeatOrderService = async (
  userId: string,
  internshipEnrollmentId: string,
  brand: Brand,
  gateway?: string,
) => {
  // Every internship is Edulyt's.
  assertBrandReadable("edulyt", brand, "internship");
  const gatewayName = resolveGateway(gateway);

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
    brand,
    orderKind: "internship_seat",
    amount,
    currency: "INR",
    paymentMethod: gatewayName,
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

  return beginGatewayCheckout(order, {
    userId: String(userId),
    name: userName,
  });
};

/**
 * Create a checkout order for purchasing internship certification success points
 * (admin-priced INR per point).
 */
export const createInternshipSuccessPointsOrderService = async (
  userId: string,
  internshipEnrollmentId: string,
  quantity: number,
  brand: Brand,
  gateway?: string,
) => {
  // Every internship is Edulyt's.
  assertBrandReadable("edulyt", brand, "internship");
  const gatewayName = resolveGateway(gateway);

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

  // The certificate verdict is final once written — points bought afterwards
  // cannot change it, so we must not take the learner's money. Blocked at the
  // window boundary too, so a purchase can't be started on the last night and
  // settle after the verdict has already been decided.
  if (
    (enrollment as unknown as { certificateEvaluation?: unknown })
      .certificateEvaluation
  ) {
    throw new AppError(
      "Evaluation for this program has closed — success points can no longer be purchased.",
      400,
    );
  }
  const windowEnd = (enrollment as unknown as { endDate?: Date }).endDate;
  if (windowEnd instanceof Date && windowEnd.getTime() < Date.now()) {
    throw new AppError(
      "Your program window has ended — success points can no longer be purchased.",
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
    brand,
    orderKind: "internship_success_points",
    amount,
    currency: "INR",
    paymentMethod: gatewayName,
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

  return beginGatewayCheckout(order, {
    userId: String(userId),
    name: userName,
  });
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

  await reconcileOrder(order);

  return {
    status: order.paymentStatus,
    orderId: order._id.toString(),
    updatedAt: order.updatedAt,
    amount: order.amount,
    txnId: order.txnId,
  };
};

export const processWebhook = async (webhookData: any) => {
  try {
    const gateway = webhookData.gateway ?? "paytm";
    const result = await getProvider(gateway).verifyWebhook(webhookData, {});

    const order = await OrderModel.findById(result.orderId);
    if (!order) {
      return { success: false, message: "Order not found", orderId: result.orderId };
    }

    await applyPaymentResult(order, result);

    return {
      success: true,
      message: "Webhook processed",
      orderId: result.orderId,
      status: order.paymentStatus,
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      success: false,
      message: "Error processing webhook",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const deleteOrderService = async (orderId: string) => {
  const order = await OrderModel.findByIdAndDelete(orderId);
  if (!order) throw new AppError("Order not found", 404);
  return order;
};
