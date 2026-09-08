import { CouponModel, ScholarshipCouponEntitlementModel } from "../models";

/**
 * Retires a winner's voucher once their payment settles.
 *
 * Deleting the coupon is what makes it single-use. `usageLimit: 1` on the
 * document is declarative only, because campaign coupons deliberately skip the
 * creation-time `usageCount` increment (see `applyCouponToCheckout`); without
 * that increment the generic `usageCount >= usageLimit` check never fires.
 * Once this document is gone the code reports itself as unknown, which is also
 * what an expired one does.
 *
 * Safe to delete: `Order` stores `couponCode` as a plain string with no ref,
 * and nothing joins an order or an invoice back to a coupon document.
 *
 * Never throws. The payment has already succeeded, so a failure here must not
 * make a paid order look unpaid. It is logged loudly instead, because the
 * visible symptom would be a voucher that stays spendable.
 */
export const consumeScholarshipCoupon = async (order: {
  _id: unknown;
  couponCode?: string | null;
  userId?: unknown;
  scholarshipTestId?: unknown;
}): Promise<void> => {
  try {
    if (!order.scholarshipTestId || !order.couponCode) return;
    const code = String(order.couponCode).toUpperCase();

    // The redeemedAt guard is the idempotency: `applyPaymentResult` is reached
    // concurrently from status polling, the webhook and the reconcile cron, and
    // a replay must not overwrite the first redemption's order id or timestamp.
    await ScholarshipCouponEntitlementModel.updateOne(
      { couponCode: code, redeemedAt: null },
      {
        $set: {
          redeemedAt: new Date(),
          orderId: order._id,
          userId: order.userId ?? null,
          couponId: null,
        },
      },
    );

    await CouponModel.deleteOne({
      code,
      sourceScholarshipTestId: { $ne: null },
    });
  } catch (error) {
    console.error(
      `[scholarship] failed to consume coupon for order ${String(order._id)}:`,
      error,
    );
  }
};
