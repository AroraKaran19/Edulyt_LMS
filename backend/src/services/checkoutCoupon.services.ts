import {
  CouponModel,
  OrderModel,
  ScholarshipCouponEntitlementModel,
} from "../models";
import { AppError } from "../middlewares/error.middleware";
import { validateCouponService } from "./coupon.services";
import type { OrderScholarshipSnapshot } from "../types/order";
import type { Brand } from "../constants/brands";

/**
 * Applying a coupon to a checkout amount.
 *
 * Lives outside `order.services` so it can be reached without that module's
 * import cycle (it pulls in `payments/orderFlow`, the gateway registry and
 * eight models). `payments/token` and `payments/fulfillment` were split out of
 * the same file for the same reason.
 */

export interface AppliedCoupon {
  amount: number;
  couponCode?: string;
  couponDiscount: number;
  /** Set only when the coupon was minted by a scholarship campaign. */
  scholarshipTestId?: string;
  /** Frozen explanation of the discount, for the payment record. */
  scholarshipSnapshot?: OrderScholarshipSnapshot;
}

/**
 * Freezes why this order is being discounted.
 *
 * Read from the entitlement, which already carries the awarded percentage and
 * its campaign's identity, so this is one indexed lookup rather than a join
 * across the campaign and the coupon (both of which get deleted).
 *
 * Falls back to what the coupon itself knows if no entitlement is found. That
 * should be impossible, since a winner's coupon and their entitlement are
 * minted in one transaction, but a payment with no explanation at all is the
 * worse failure of the two.
 */
const snapshotFor = async (
  campaignId: unknown,
  code: string,
  awardedPercent: number,
): Promise<OrderScholarshipSnapshot> => {
  const entitlement = await ScholarshipCouponEntitlementModel.findOne(
    { couponCode: code },
    {
      testId: 1,
      awardedPercent: 1,
      couponCode: 1,
      email: 1,
      campaignSnapshot: 1,
    },
  ).lean();

  return {
    testId: String(entitlement?.testId ?? campaignId),
    title: entitlement?.campaignSnapshot?.title ?? "",
    slug: entitlement?.campaignSnapshot?.slug ?? "",
    ownerName: entitlement?.campaignSnapshot?.ownerName ?? "",
    awardedPercent: entitlement?.awardedPercent ?? awardedPercent,
    couponCode: code,
    candidateEmail: entitlement?.email ?? "",
  };
};

/**
 * Campaign coupons are deliberately NOT consumed here.
 *
 * `usageCount` is incremented at order creation rather than at settlement, so
 * incrementing a winner's single-use voucher would destroy it the first time
 * anybody abandoned a checkout. It is consumed in `consumeScholarshipCoupon`
 * once payment settles, and the in-flight guard below is what stops two
 * parallel checkouts spending it in the meantime.
 */
export const applyCouponToCheckout = async (params: {
  couponCode: string;
  courseId: string;
  userId: string;
  amount: number;
  brand: Brand;
}): Promise<AppliedCoupon> => {
  const validation = await validateCouponService({
    code: params.couponCode,
    courseId: params.courseId,
    purchaseAmount: params.amount,
    userId: params.userId,
    brand: params.brand,
  });

  if (!validation.valid) {
    throw new AppError(validation.message || "Invalid coupon", 400);
  }
  if (validation.finalAmount == null) {
    return { amount: params.amount, couponDiscount: 0 };
  }

  const code = params.couponCode.toUpperCase();
  const campaignId = validation.coupon?.sourceScholarshipTestId ?? null;
  let scholarshipSnapshot: OrderScholarshipSnapshot | undefined;

  if (campaignId) {
    // Indexed by {scholarshipTestId, paymentStatus}. The payment cron settles
    // pending orders and deletes abandoned ones after 24 hours, so this lock
    // always clears itself without anyone intervening.
    const inFlight = await OrderModel.countDocuments({
      scholarshipTestId: campaignId,
      couponCode: code,
      paymentStatus: "pending",
    });
    if (inFlight > 0) {
      throw new AppError(
        "A checkout is already in progress with this scholarship code. Finish or cancel it, then try again.",
        409,
      );
    }

    scholarshipSnapshot = await snapshotFor(
      campaignId,
      code,
      Number(validation.coupon?.discountValue ?? 0),
    );
  } else {
    await CouponModel.findOneAndUpdate({ code }, { $inc: { usageCount: 1 } });
  }

  return {
    amount: validation.finalAmount,
    couponCode: params.couponCode,
    couponDiscount: validation.discountAmount ?? 0,
    scholarshipTestId: campaignId ? String(campaignId) : undefined,
    scholarshipSnapshot,
  };
};
