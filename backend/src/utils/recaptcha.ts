import axios from "axios";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/**
 * Long enough for a slow round trip, short enough that a hung Google never
 * holds an OTP request open.
 */
const VERIFY_TIMEOUT_MS = 5_000;

/**
 * `rejected` is the visitor's problem and theirs to fix; `unavailable` is ours,
 * and the caller should report it as a server error rather than blame them.
 */
export type RecaptchaResult = "verified" | "rejected" | "unavailable";

/** Read per call, not at import: a process booting without it must still start. */
const secretKey = (): string | null =>
  process.env.RECAPTCHA_SECRET_KEY?.trim() || null;

/**
 * Asks Google whether the checkbox was really ticked.
 *
 * Spends the token: a v2 response is single use, so anything but `verified`
 * needs a freshly solved one, and so does the next call.
 */
export const verifyRecaptcha = async (
  token: string,
): Promise<RecaptchaResult> => {
  if (!token) return "rejected";

  const secret = secretKey();
  if (!secret) {
    console.error(
      "[recaptcha] RECAPTCHA_SECRET_KEY is not set; refusing every submission",
    );
    return "unavailable";
  }

  try {
    const response = await axios.post(
      VERIFY_URL,
      new URLSearchParams({ secret, response: token }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: VERIFY_TIMEOUT_MS,
      },
    );

    if (response.data?.success === true) return "verified";

    // A bad secret is our misconfiguration, not a failed challenge, and telling
    // the visitor to tick the box again would send them round a loop nothing
    // they do can break.
    const codes: string[] = response.data?.["error-codes"] ?? [];
    const ourFault = codes.some(
      (code) =>
        code === "invalid-input-secret" ||
        code === "missing-input-secret" ||
        code === "bad-request",
    );

    if (ourFault) {
      console.error("[recaptcha] siteverify rejected our request", codes);
      return "unavailable";
    }

    return "rejected";
  } catch (error) {
    console.error(
      "[recaptcha] siteverify request failed",
      error instanceof Error ? error.message : String(error),
    );
    return "unavailable";
  }
};
