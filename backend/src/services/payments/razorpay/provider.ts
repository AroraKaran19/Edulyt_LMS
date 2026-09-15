import { AppError } from "../../../middlewares/error.middleware";
import { BRANDS, asBrand, type Brand } from "../../../constants/brands";
import { gatewayEnvName, readGatewayEnv } from "../env";
import { razorpayCredentials, razorpayRequest } from "./client";
import { paymentSignatureIsValid, webhookSignatureIsValid } from "./signature";
import type {
  GatewayPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  OrderDoc,
  PaymentProvider,
  WebhookVerifyResult,
} from "../types";

/** Razorpay works in integer paise. Rounding kills float artifacts like 30.000000000000004. */
const toPaise = (amount: number): number => Math.round(amount * 100);

/** Razorpay caps each note value at 256 chars and rejects non-strings. */
const NOTE_MAX = 256;
const note = (v: unknown): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s ? s.slice(0, NOTE_MAX) : undefined;
};

/**
 * Human-readable context for the Razorpay dashboard. `orderId` is the only
 * load-bearing entry — `verifyWebhook` resolves our order from it — so it is
 * written first and never overwritten by a blank optional field.
 */
const buildNotes = (input: InitiatePaymentInput): Record<string, string> => {
  const order = input.order as unknown as Record<string, unknown>;
  const candidates: Record<string, unknown> = {
    orderId: input.order._id.toString(),
    orderKind: order.orderKind,
    courseName: order.courseName,
    planType: order.planType,
    internshipTitle: order.internshipTitle,
    phone: input.customer.phone,
  };

  const notes: Record<string, string> = {};
  for (const [k, v] of Object.entries(candidates)) {
    const s = note(v);
    if (s !== undefined) notes[k] = s;
  }
  return notes;
};

interface RazorpayPayment {
  id?: string;
  status?: string;
  method?: string;
  notes?: Record<string, string>;
}

export class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay" as const;

  isConfigured(brand: Brand): boolean {
    return Boolean(
      readGatewayEnv("RAZORPAY_KEY_ID", brand) &&
        readGatewayEnv("RAZORPAY_KEY_SECRET", brand),
    );
  }

  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    const brand = asBrand(input.order.brand);
    const { keyId } = razorpayCredentials(brand);
    const orderId = input.order._id.toString();

    // Our id goes in BOTH fields on purpose: payment.* webhooks expose `notes`,
    // order.* webhooks expose `receipt`. Writing one strands half the events.
    const created = await razorpayRequest<{ id?: string }>(brand, "post", "/orders", {
      amount: toPaise(input.amount),
      currency: "INR",
      receipt: orderId,
      notes: buildNotes(input),
    });

    if (!created?.id) {
      throw new AppError("Invalid response from Razorpay - no order id", 500);
    }

    return {
      gateway: this.name,
      gatewayOrderId: created.id,
      amount: input.amount,
      currency: "INR",
      extra: { keyId },
      // No clientToken: Razorpay has no Paytm-style txn token. orderFlow's
      // `if (result.clientToken)` guard leaves order.token untouched.
    };
  }

  async fetchPaymentStatus(order: OrderDoc): Promise<GatewayPaymentResult> {
    if (!order.gatewayOrderId) return { status: "pending" };

    try {
      const res = await razorpayRequest<{ items?: RazorpayPayment[] }>(
        asBrand(order.brand),
        "get",
        `/orders/${order.gatewayOrderId}/payments`,
      );

      const captured = (res?.items ?? []).find((p) => p.status === "captured");
      if (captured?.id) {
        return {
          status: "success",
          txnId: captured.id,
          paymentMode: captured.method,
        };
      }

      // Everything else — created, authorized, failed — is pending. A failed
      // attempt does NOT close a Razorpay order; the learner can retry inside it.
      // Genuinely abandoned orders are reaped by the cron after the abandon window.
      return { status: "pending" };
    } catch (error: any) {
      // A gateway outage must never mark an order failed.
      console.error(
        `❌ Error verifying payment with Razorpay for order ${order._id}:`,
        error?.message,
      );
      return { status: "pending" };
    }
  }

  async verifyWebhook(
    rawBody: unknown,
    headers: Record<string, string | undefined>,
    rawBodyBuffer?: Buffer,
  ): Promise<WebhookVerifyResult> {
    const secrets = BRANDS.flatMap((brand) => {
      const secret = readGatewayEnv("RAZORPAY_WEBHOOK_SECRET", brand);
      return secret ? [{ brand, secret }] : [];
    });
    if (secrets.length === 0) {
      // Unlike Paytm's soft-warn path, an unverified Razorpay webhook is never processed.
      const names = BRANDS.map((b) => gatewayEnvName("RAZORPAY_WEBHOOK_SECRET", b));
      throw new AppError(`No Razorpay webhook secret is set (${names.join(", ")})`, 500);
    }

    const signature = headers["x-razorpay-signature"];
    if (!signature) {
      throw new AppError("Missing Razorpay webhook signature", 403);
    }
    if (!rawBodyBuffer) {
      throw new AppError("Razorpay webhook raw body was not captured", 500);
    }
    const brand = secrets.find(({ secret }) =>
      webhookSignatureIsValid(rawBodyBuffer, signature, secret),
    )?.brand;
    if (!brand) {
      console.error("Razorpay webhook signature verification failed");
      throw new AppError("Invalid Razorpay webhook signature", 403);
    }

    const body = rawBody as Record<string, any>;
    const paymentEntity: RazorpayPayment | undefined =
      body?.payload?.payment?.entity;
    const orderEntity: Record<string, any> | undefined =
      body?.payload?.order?.entity;

    // OUR order id — never razorpay's `order_XXX`, which findById would miss.
    const orderId = paymentEntity?.notes?.orderId || orderEntity?.receipt;
    if (!orderId) {
      throw new AppError(
        "Could not resolve our order id from Razorpay webhook",
        400,
      );
    }

    const event = body?.event;
    if (event === "payment.captured" || event === "order.paid") {
      return {
        orderId,
        brand,
        status: "success",
        txnId: paymentEntity?.id,
        paymentMode: paymentEntity?.method,
      };
    }

    // payment.failed included: the learner can still retry inside this order.
    return { orderId, brand, status: "pending" };
  }

  async verifySignature(
    order: OrderDoc,
    payload: unknown,
  ): Promise<GatewayPaymentResult> {
    const { keySecret } = razorpayCredentials(asBrand(order.brand));
    const {
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
      razorpay_signature: signature,
    } = (payload ?? {}) as Record<string, string | undefined>;

    if (!rzpOrderId || !rzpPaymentId || !signature) {
      throw new AppError("Missing Razorpay signature fields", 400);
    }

    // A signature can be perfectly valid and still belong to someone else's order.
    if (rzpOrderId !== order.gatewayOrderId) {
      throw new AppError("Signature does not belong to this order", 403);
    }

    if (!paymentSignatureIsValid(rzpOrderId, rzpPaymentId, signature, keySecret)) {
      throw new AppError("Invalid Razorpay payment signature", 403);
    }

    return { status: "success", txnId: rzpPaymentId };
  }
}
