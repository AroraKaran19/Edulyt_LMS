import { UserModel, StudentModel } from "../../models";
import { createEnrollmentAfterPayment } from "./fulfillment";
import { getProvider, resolveGateway } from "./registry";
import { generatePaymentGatewayToken } from "./token";
import type {
  CheckoutSession,
  FreeOrderResult,
  GatewayPaymentResult,
  OrderDoc,
} from "./types";

/** An order below this is settled without touching a gateway. */
const FREE_ORDER_THRESHOLD = 1;

const updatePendingPayments = async (userId: string, update: unknown) => {
  const user = await UserModel.findById(userId);
  if (!user) return;
  if (user.userType === "student") {
    await StudentModel.findByIdAndUpdate(userId, update as never);
  }
};

/**
 * The single writer of terminal order state. Reached concurrently from status
 * polling, the webhook, and the reconciliation cron — so it must be idempotent.
 */
export const applyPaymentResult = async (
  order: OrderDoc,
  result: GatewayPaymentResult,
): Promise<void> => {
  // Already settled — nothing to do. This is what makes the three callers safe.
  if (order.paymentStatus === "success" || order.paymentStatus === "failed") {
    return;
  }
  if (result.status === "pending") return;

  if (result.status === "success") {
    order.paymentStatus = "success";
    if (result.txnId) order.txnId = result.txnId;
    // Only write when the gateway told us — the schema already defaults to
    // "online", and the Paytm webhook does not report a mode.
    if (result.paymentMode) order.paymentMode = result.paymentMode;
    await order.save();

    await updatePendingPayments(order.userId?.toString() ?? "", {
      $pull: { pendingPayments: order._id.toString() },
    });

    // The payment already succeeded. A fulfilment failure must never throw
    // back to the caller and leave the order looking unpaid.
    try {
      await createEnrollmentAfterPayment(order);
    } catch (err) {
      console.error(`Failed to create enrollment for order ${order._id}:`, err);
    }
    return;
  }

  order.paymentStatus = "failed";
  if (result.errorReason) order.paymentErrorReason = result.errorReason;
  await order.save();

  await updatePendingPayments(order.userId?.toString() ?? "", {
    $pull: { pendingPayments: order._id.toString() },
  });
};

/** Ask the gateway where this order stands, then settle it. */
export const reconcileOrder = async (
  order: OrderDoc,
): Promise<GatewayPaymentResult> => {
  if (order.paymentStatus === "success" || order.paymentStatus === "failed") {
    return { status: order.paymentStatus, txnId: order.txnId };
  }

  const provider = getProvider(order.paymentMethod);
  const result = await provider.fetchPaymentStatus(order);
  await applyPaymentResult(order, result);

  return result;
};

/**
 * Turn a persisted, pending order into a checkout the client can open.
 * Replaces the three duplicated Paytm blocks in order.services.ts.
 */
export const beginGatewayCheckout = async (
  order: OrderDoc,
  customer: { userId: string; name?: string; email?: string; phone?: string },
): Promise<CheckoutSession> => {
  const orderId = order._id.toString();

  // Free order: settle immediately, never touch a gateway.
  if (order.amount < FREE_ORDER_THRESHOLD) {
    order.amount = 0;
    order.paymentStatus = "success";
    await order.save();
    await createEnrollmentAfterPayment(order);
    return {
      freeOrder: true,
      orderId,
      token: generatePaymentGatewayToken(orderId),
    };
  }

  const provider = getProvider(order.paymentMethod);
  const paymentToken = generatePaymentGatewayToken(orderId);
  const callbackUrl = `${process.env.FRONTEND_URL}/payment/status/${orderId}?token=${paymentToken}`;

  const result = await provider.initiatePayment({
    order,
    amount: order.amount,
    callbackUrl,
    customer,
  });

  if (result.clientToken) order.token = result.clientToken;
  order.gatewayOrderId = result.gatewayOrderId;
  await order.save();

  await updatePendingPayments(customer.userId, {
    $push: { pendingPayments: orderId },
  });

  // Carry OUR order id alongside the gateway's. For Paytm they are the same
  // value; for Razorpay they are not, and callers need ours.
  return { ...result, orderId };
};

export const isFreeOrderResult = (r: CheckoutSession): r is FreeOrderResult =>
  "freeOrder" in r;

/** Exported for the create services, which still need to resolve the gateway. */
export { resolveGateway };
