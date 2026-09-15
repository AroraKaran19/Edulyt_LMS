import axios from "axios";
import PaytmChecksum from "paytmchecksum";
import { AppError } from "../../../middlewares/error.middleware";
import { BRANDS, asBrand, type Brand } from "../../../constants/brands";
import { gatewayEnvName, readGatewayEnv } from "../env";
import { generatePaytmChecksum } from "./checksum";
import type {
  GatewayPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  OrderDoc,
  PaymentProvider,
  WebhookVerifyResult,
} from "../types";

const INITIATE_URL = "https://secure.paytmpayments.com/theia/api/v1/initiateTransaction";
const STATUS_URL = "https://secure.paytmpayments.com/v3/order/status";

/** Paytm wants at most 2dp and no float artifacts like "0.34999999999999964". */
const toPaytmAmount = (amount: number): string =>
  Number.isInteger(amount) ? amount.toString() : Number(amount.toFixed(2)).toString();

const CREDENTIAL_KEYS = ["PAYTM_MID", "PAYTM_KEY", "PAYTM_WEBSITE"];

interface PaytmCredentials {
  mid: string;
  key: string;
  website: string;
}

const readCredentials = (brand: Brand): PaytmCredentials | null => {
  const mid = readGatewayEnv("PAYTM_MID", brand);
  const key = readGatewayEnv("PAYTM_KEY", brand);
  const website = readGatewayEnv("PAYTM_WEBSITE", brand);
  return mid && key && website ? { mid, key, website } : null;
};

const paytmCredentials = (brand: Brand): PaytmCredentials => {
  const credentials = readCredentials(brand);
  if (!credentials) {
    const names = CREDENTIAL_KEYS.map((key) => gatewayEnvName(key, brand));
    throw new AppError(`Paytm is not configured: set ${names.join(", ")}`, 500);
  }
  return credentials;
};

const checksumIsValid = (
  body: Record<string, any>,
  key: string,
  checksum: string,
): boolean => {
  try {
    // Paytm's typings insist on a full transaction body; the webhook payload
    // is an arbitrary form post, which is what the SDK actually hashes.
    // Typed as boolean | Promise<boolean>; it is synchronous for a params object,
    // and a promise would be truthy, so compare rather than coerce.
    return PaytmChecksum.verifySignature({ ...body } as any, key, checksum) === true;
  } catch {
    // Another brand's key fails to decrypt the checksum rather than mismatching.
    return false;
  }
};

export class PaytmProvider implements PaymentProvider {
  readonly name = "paytm" as const;

  isConfigured(brand: Brand): boolean {
    return readCredentials(brand) !== null;
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { mid, key, website } = paytmCredentials(asBrand(input.order.brand));

    const orderId = input.order._id.toString();
    const body = {
      requestType: "Payment",
      mid,
      websiteName: website,
      orderId,
      callbackUrl: input.callbackUrl,
      txnAmount: { value: toPaytmAmount(input.amount), currency: "INR" },
      userInfo: { custId: input.customer.userId },
    };

    const checksum = await generatePaytmChecksum(body, key);
    if (!checksum) {
      throw new AppError("Failed to generate Paytm checksum", 500);
    }

    let response;
    try {
      response = await axios.post(
        `${INITIATE_URL}?mid=${mid}&orderId=${orderId}`,
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
          headers: { "Content-Type": "application/json", Accept: "application/json" },
        },
      );
    } catch (err: any) {
      const resultInfo = err.response?.data?.body?.resultInfo;
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

    // Paytm returns HTTP 200 even for validation errors — check resultInfo first.
    if (resultInfo && resultInfo.resultStatus !== "S") {
      throw new AppError(
        resultInfo.resultMsg || `Paytm error (code: ${resultInfo.resultCode || "unknown"})`,
        400,
      );
    }

    if (!paytmBody?.txnToken) {
      throw new AppError(
        resultInfo?.resultMsg || "Invalid response from Paytm - no transaction token",
        500,
      );
    }

    return {
      gateway: this.name,
      gatewayOrderId: orderId,
      clientToken: paytmBody.txnToken,
      amount: input.amount,
      currency: "INR",
      extra: { mid },
    };
  }

  async fetchPaymentStatus(order: OrderDoc): Promise<GatewayPaymentResult> {
    const orderId = order._id.toString();

    try {
      const { mid, key } = paytmCredentials(asBrand(order.brand));
      const signature = await generatePaytmChecksum({ mid, orderId }, key);
      if (!signature) {
        return { status: "pending" };
      }

      const res = await axios.post(
        STATUS_URL,
        {
          body: { mid, orderId },
          head: { signature },
        },
        {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          timeout: 10000,
        },
      );

      if (res.status !== 200) return { status: "pending" };

      const paytmBody = res.data?.body;
      const resultStatus = paytmBody?.resultInfo?.resultStatus;

      if (resultStatus === "TXN_SUCCESS") {
        return {
          status: "success",
          txnId: paytmBody.txnId,
          paymentMode: paytmBody.paymentMode,
        };
      }
      if (resultStatus === "TXN_FAILURE") {
        return {
          status: "failed",
          errorReason: paytmBody?.resultInfo?.resultMsg || "Payment declined",
        };
      }
      return { status: "pending" };
    } catch (error: any) {
      // A gateway outage must never mark an order failed — leave it pending
      // for the reconciliation cron. This preserves today's behavior.
      console.error(
        `❌ Error verifying payment with Paytm for order ${orderId}:`,
        error.message,
      );
      return { status: "pending" };
    }
  }

  async verifyWebhook(
    rawBody: unknown,
    _headers: Record<string, string | undefined>,
  ): Promise<WebhookVerifyResult> {
    const body = rawBody as Record<string, any>;
    if (!body || typeof body !== "object") {
      throw new AppError("Invalid webhook payload", 400);
    }

    const orderId = body.ORDERID || body.orderId;
    const checksumHash = body.CHECKSUMHASH || body.checksumHash;

    if (!orderId) {
      throw new AppError("Order ID not found in webhook payload", 400);
    }

    // Settling needs a verified checksum; status polling and the cron still settle real payments.
    if (!checksumHash) {
      throw new AppError("Missing checksum", 403);
    }

    const keyed = BRANDS.flatMap((b) => {
      const key = readGatewayEnv("PAYTM_KEY", b);
      return key ? [{ brand: b, key }] : [];
    });
    if (keyed.length === 0) {
      console.error("No PAYTM_KEY_<BRAND> is set, so the Paytm webhook cannot be verified");
    }
    const brand = keyed.find((k) => checksumIsValid(body, k.key, checksumHash))?.brand;
    if (!brand) {
      console.error("Paytm webhook checksum verification failed");
      throw new AppError("Invalid checksum", 403);
    }

    const status = body.STATUS || body.status;
    if (status === "TXN_SUCCESS" || status === "success") {
      return { orderId, brand, status: "success", txnId: body.TXNID || body.txnId };
    }
    if (status === "TXN_FAILURE" || status === "failed") {
      return {
        orderId,
        brand,
        status: "failed",
        errorReason: body.RESPMSG || body.respMsg || body.resultMsg || "Payment declined",
      };
    }
    return { orderId, brand, status: "pending" };
  }

  // No verifySignature: Paytm has no client-side signature step. Status polling covers it.
}
