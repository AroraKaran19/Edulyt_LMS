import crypto from "crypto";

/** Hex HMAC-SHA256. Razorpay signs everything this way. */
export const hmacSha256Hex = (
  payload: string | Buffer,
  secret: string,
): string => crypto.createHmac("sha256", secret).update(payload).digest("hex");

/**
 * Constant-time hex compare. `timingSafeEqual` throws on length mismatch, so the
 * length check has to come first — and a length mismatch is simply "not equal".
 */
export const safeEqualHex = (a: string, b: string): boolean => {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
};

/** Webhook: HMAC over the EXACT bytes Razorpay sent, keyed with the webhook secret. */
export const webhookSignatureIsValid = (
  rawBody: Buffer | string,
  signature: string,
  secret: string,
): boolean => safeEqualHex(hmacSha256Hex(rawBody, secret), signature);

/** Checkout handler: HMAC over `order_id|payment_id`, keyed with the API key secret. */
export const paymentSignatureIsValid = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  secret: string,
): boolean =>
  safeEqualHex(
    hmacSha256Hex(`${razorpayOrderId}|${razorpayPaymentId}`, secret),
    signature,
  );
