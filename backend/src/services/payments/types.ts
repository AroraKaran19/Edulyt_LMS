import type { PaymentOrder } from "../../types/order";
import type { HydratedDocument } from "mongoose";

/** A hydrated Order document, as loaded by OrderModel. */
export type OrderDoc = HydratedDocument<PaymentOrder>;

export type GatewayName = "paytm" | "razorpay";

export type NormalizedStatus = "success" | "failed" | "pending";

export interface InitiatePaymentInput {
  /** Already persisted with paymentStatus="pending". */
  order: OrderDoc;
  /** INR, max 2dp. Providers convert as needed (Paytm: string; Razorpay: paise int). */
  amount: number;
  /** Frontend status URL carrying our JWT. */
  callbackUrl: string;
  customer: { userId: string; name?: string; email?: string; phone?: string };
}

export interface InitiatePaymentResult {
  gateway: GatewayName;
  /** paytm: our order _id | razorpay: "order_XXX" */
  gatewayOrderId: string;
  /** paytm: txnToken | razorpay: unused */
  clientToken?: string;
  amount: number;
  currency: string;
  /** paytm: { mid } | razorpay: { keyId } */
  extra?: Record<string, unknown>;
}

/** The single shape every verification path returns. */
export interface GatewayPaymentResult {
  status: NormalizedStatus;
  txnId?: string;
  /** Only set when the gateway reports one. Never overwrite with undefined. */
  paymentMode?: string;
  errorReason?: string;
}

export interface WebhookVerifyResult extends GatewayPaymentResult {
  /** OUR order _id, resolved by the provider from its payload. */
  orderId: string;
}

/** Returned by beginGatewayCheckout when the order settled for free (< ₹1). */
export interface FreeOrderResult {
  freeOrder: true;
  orderId: string;
  /** The JWT the status page verifies. */
  token: string;
}

/**
 * What beginGatewayCheckout hands back. Note `orderId` is OUR order _id on both
 * branches — distinct from `gatewayOrderId`, which is the gateway's own id and
 * only coincidentally equal to ours for Paytm. Callers must never use
 * `gatewayOrderId` as our order id.
 */
export type CheckoutSession =
  | (InitiatePaymentResult & { orderId: string })
  | FreeOrderResult;

export interface PaymentProvider {
  readonly name: GatewayName;
  /** True when this gateway's env credentials are all present. */
  isConfigured(): boolean;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  fetchPaymentStatus(order: OrderDoc): Promise<GatewayPaymentResult>;
  /**
   * `rawBody` is the parsed body (Paytm checksums the parsed form object).
   * `rawBodyBuffer` is the exact bytes Express received — Razorpay's HMAC is over
   * those, and re-serializing the parsed body does not reproduce them.
   */
  verifyWebhook(
    rawBody: unknown,
    headers: Record<string, string | undefined>,
    rawBodyBuffer?: Buffer,
  ): Promise<WebhookVerifyResult>;
  /** Client-side signature confirmation. Razorpay implements it; Paytm omits it. */
  verifySignature?(
    order: OrderDoc,
    payload: unknown,
  ): Promise<GatewayPaymentResult>;
}
