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

/**
 * Every secret this backend accepts, in the order they are tried. Read per
 * call, not at import: a process booting without one must still start.
 *
 * Two frontends sit in front of this API and each has its own reCAPTCHA key
 * pair, so no single secret can verify both — a token is only valid against
 * the secret belonging to the key that issued it. Duplicates are dropped, so
 * the same secret under both names costs one call rather than two.
 */
const secretKeys = (): string[] => {
  const configured = [
    process.env.RECAPTCHA_SECRET_KEY_AIRKRIT,
    process.env.RECAPTCHA_SECRET_KEY_EDULYT,
  ];

  const keys: string[] = [];
  for (const raw of configured) {
    const key = raw?.trim();
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
};

/** One siteverify round trip against a single secret. */
const verifyWithSecret = async (
  token: string,
  secret: string,
): Promise<RecaptchaResult> => {
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

/**
 * Asks Google whether the checkbox was really ticked.
 *
 * Spends the token: a v2 response is single use, so anything but `verified`
 * needs a freshly solved one, and so does the next call.
 *
 * Each configured secret is tried until one verifies. Carrying on past a
 * `rejected` is safe because a token is only spent by the key that issued it:
 * a refusal means this secret's key did not issue it, so the next secret still
 * gets a fair look. The loop stops the moment one succeeds, so a token is
 * never offered to another key after it has been accepted.
 */
export const verifyRecaptcha = async (
  token: string,
): Promise<RecaptchaResult> => {
  if (!token) return "rejected";

  const secrets = secretKeys();
  if (!secrets.length) {
    console.error(
      "[recaptcha] no reCAPTCHA secret is set; refusing every submission",
    );
    return "unavailable";
  }

  // One secret failing on our side must not read as the visitor's failure,
  // even when a later one goes on to reject them.
  let sawUnavailable = false;

  for (const secret of secrets) {
    const result = await verifyWithSecret(token, secret);
    if (result === "verified") return "verified";
    if (result === "unavailable") sawUnavailable = true;
  }

  return sawUnavailable ? "unavailable" : "rejected";
};
