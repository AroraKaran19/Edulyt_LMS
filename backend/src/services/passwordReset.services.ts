import { PasswordResetRequestModel, UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import type { Brand } from "../constants/brands";
import { passwordResetMail } from "../mail";

/**
 * Emails a password reset link, without telling the caller whether the address
 * has an account.
 *
 * Two rules drive everything here:
 *
 *  1. The link goes to the inbox and nowhere else. It used to be returned in
 *     the endpoint's response body, which handed a working reset token to
 *     anyone who could name an email address.
 *  2. Every request gets the same answer. A different status, body, or error
 *     for a registered address turns this endpoint into an account-existence
 *     oracle, which is worth having even without the token.
 *
 * The throttle is claimed before the account lookup precisely so rule 2 holds
 * for it too: a 429 that only ever fired for real accounts would leak exactly
 * what the uniform response protects.
 */

/** Must match the reset token's own lifetime. The email quotes this figure. */
export const RESET_TOKEN_TTL_MINUTES = 10;

/** Gap between two links for the same address. */
export const RESEND_COOLDOWN_SECONDS = 60;
/** Links emailed per window, per address. */
export const MAX_SENDS_PER_WINDOW = 3;
/**
 * How long the throttle record survives, measured from the last send. Spending
 * the cap means waiting this long before the address can ask again.
 */
export const RESET_WINDOW_MINUTES = 15;

/** Deliberately vague: it must read the same whether or not an account exists. */
export const RESET_REQUESTED_MESSAGE =
  "If an account exists for that address, a password reset link is on its way.";

const normalizeEmail = (email: unknown): string =>
  String(email ?? "")
    .trim()
    .toLowerCase();

const minutesFromNow = (minutes: number): Date =>
  new Date(Date.now() + minutes * 60 * 1000);

/** Mongo's duplicate-key error, raised when an upsert races an existing doc. */
const isDuplicateKeyError = (error: unknown): boolean =>
  Boolean(error) && (error as { code?: number }).code === 11000;

/**
 * Takes one send from this address's budget.
 *
 * Returns false when the budget refuses it. The caller turns that into the
 * same 429 for every address, registered or not.
 */
const claimSend = async (email: string): Promise<boolean> => {
  const now = new Date();
  const cooldownCutoff = new Date(
    now.getTime() - RESEND_COOLDOWN_SECONDS * 1000,
  );

  try {
    // The guards live in the filter so the check and the write are one atomic
    // step. When a doc exists but fails them, the upsert falls through to an
    // insert and the unique index on `email` rejects it, which is the throttle
    // signal.
    await PasswordResetRequestModel.findOneAndUpdate(
      {
        email,
        lastSentAt: { $lte: cooldownCutoff },
        sendCount: { $lt: MAX_SENDS_PER_WINDOW },
      },
      {
        $set: { lastSentAt: now, expiresAt: minutesFromNow(RESET_WINDOW_MINUTES) },
        $inc: { sendCount: 1 },
        $setOnInsert: { email },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return true;
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return false;
  }
};

/**
 * Claims a send and, if the address has an account, emails the link.
 *
 * `buildResetUrl` is injected rather than built here so token minting stays in
 * the auth layer that owns the signing key.
 *
 * Queued rather than awaited, unlike the signup code. Awaiting would make a
 * registered address measurably slower to respond than an unregistered one,
 * which is the same leak by a different route.
 */
export const requestPasswordReset = async (
  rawEmail: unknown,
  buildResetUrl: (userId: string, email: string) => string,
  /** The site the reset was asked for, which is who the mail comes from. */
  brand: Brand,
): Promise<void> => {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  if (!(await claimSend(email))) {
    throw new AppError(
      "Too many reset requests for that address. Please try again later.",
      429,
    );
  }

  const user = await UserModel.findOne({ email })
    .select("_id firstName lastName email")
    .lean<{
      _id: unknown;
      firstName?: string;
      lastName?: string;
      email: string;
    } | null>();

  // No account: the send was still claimed above, so the throttle behaves
  // identically for a probe and for a real request. Nothing is emailed.
  if (!user) return;

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.firstName ||
    "there";

  passwordResetMail.send(
    { email: user.email, name: fullName },
    {
      name: user.firstName || fullName,
      resetUrl: buildResetUrl(String(user._id), user.email),
      expiryMinutes: RESET_TOKEN_TTL_MINUTES,
      year: new Date().getFullYear(),
    },
    { brand },
  );
};
