import { AppError } from "../../../middlewares/error.middleware";
import { asBrand, type Brand } from "../../../constants/brands";
import { phonepeIsConfigured, phonepeRequest, phonepeWebhookBrand } from "./client";
import type {
  GatewayPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  OrderDoc,
  PaymentProvider,
  WebhookVerifyResult,
} from "../types";

/** PhonePe works in integer paise. Rounding kills float artifacts like 30.000000000000004. */
const toPaise = (amount: number): number => Math.round(amount * 100);

/** How long the hosted page stays payable. The status page token outlives it. */
const PAYMENT_WINDOW_SECONDS = 1200;

interface PhonePeAttempt {
  transactionId?: string;
  paymentMode?: string;
  state?: string;
  errorCode?: string;
}

interface PhonePeOrderStatus {
  state?: string;
  errorCode?: string;
  paymentDetails?: PhonePeAttempt[];
}

/** Looked up by OUR order id, which is PhonePe's merchantOrderId. */
const fetchOrderStatus = (brand: Brand, orderId: string) =>
  phonepeRequest<PhonePeOrderStatus>(
    brand,
    "get",
    `/checkout/v2/order/${encodeURIComponent(orderId)}/status?details=false`,
  );

const toResult = (status: PhonePeOrderStatus): GatewayPaymentResult => {
  const attempts = status.paymentDetails ?? [];
  if (status.state === "COMPLETED") {
    const paid = attempts.find((a) => a.state === "COMPLETED");
    return {
      status: "success",
      txnId: paid?.transactionId,
      paymentMode: paid?.paymentMode,
    };
  }
  if (status.state === "FAILED") {
    return {
      status: "failed",
      errorReason:
        status.errorCode || attempts[attempts.length - 1]?.errorCode || "Payment declined",
    };
  }
  return { status: "pending" };
};

export class PhonePeProvider implements PaymentProvider {
  readonly name = "phonepe" as const;

  isConfigured(brand: Brand): boolean {
    return phonepeIsConfigured(brand);
  }

  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    const created = await phonepeRequest<{ orderId?: string; redirectUrl?: string }>(
      asBrand(input.order.brand),
      "post",
      "/checkout/v2/pay",
      {
        merchantOrderId: input.order._id.toString(),
        amount: toPaise(input.amount),
        expireAfter: PAYMENT_WINDOW_SECONDS,
        paymentFlow: {
          type: "PG_CHECKOUT",
          merchantUrls: { redirectUrl: input.callbackUrl },
        },
      },
    );

    if (!created?.orderId || !created.redirectUrl) {
      throw new AppError("Invalid response from PhonePe - no checkout page", 502);
    }

    return {
      gateway: this.name,
      gatewayOrderId: created.orderId,
      amount: input.amount,
      currency: "INR",
      extra: { redirectUrl: created.redirectUrl },
    };
  }

  async fetchPaymentStatus(order: OrderDoc): Promise<GatewayPaymentResult> {
    try {
      return toResult(
        await fetchOrderStatus(asBrand(order.brand), order._id.toString()),
      );
    } catch (error: any) {
      // A gateway outage, or an order PhonePe never saw, must never mark it failed.
      console.error(
        `❌ Error verifying payment with PhonePe for order ${order._id}:`,
        error?.message,
      );
      return { status: "pending" };
    }
  }

  async verifyWebhook(
    rawBody: unknown,
    headers: Record<string, string | undefined>,
  ): Promise<WebhookVerifyResult> {
    const brand = phonepeWebhookBrand(headers.authorization);
    if (!brand) {
      throw new AppError("Invalid PhonePe webhook authorization", 403);
    }

    const payload = (rawBody as { payload?: Record<string, unknown> } | undefined)
      ?.payload;
    // Refund events name the order they refund as originalMerchantOrderId.
    const orderId = payload?.merchantOrderId ?? payload?.originalMerchantOrderId;
    if (typeof orderId !== "string" || !orderId) {
      throw new AppError("Could not resolve our order id from PhonePe webhook", 400);
    }

    // The header is a static shared secret, not a signature over this body, so
    // the state is read back from PhonePe rather than taken from the payload.
    try {
      return { orderId, brand, ...toResult(await fetchOrderStatus(brand, orderId)) };
    } catch (error: any) {
      console.error(
        `❌ Error confirming PhonePe webhook for order ${orderId}:`,
        error?.message,
      );
      return { orderId, brand, status: "pending" };
    }
  }
}
