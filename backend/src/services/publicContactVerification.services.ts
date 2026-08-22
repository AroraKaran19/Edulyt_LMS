import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ContactEmailOtpModel, ContactSessionModel, UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { verificationCodeMail } from "../mail";
import {
  assertPhoneTokenValid,
  requireValidPhone,
} from "./phoneVerification.services";
import {
  PHONE_ERROR_CODES,
  PHONE_MESSAGES,
  otpThrottledMessage,
} from "../constants/phoneVerification";
import {
  MAX_SENDS_PER_WINDOW,
  MAX_VERIFY_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
} from "./emailChangeVerification.services";

/**
 * Email and phone verification for public forms, where there is no account to
 * hang the proof on.
 *
 * Deliberately the same shape as `emailChangeVerification.services.ts`, whose
 * constants are imported rather than redeclared so the flows cannot drift. The
 * differences are consequences of being unauthenticated: the OTP is keyed on
 * (scope, email), and the proof is carried afterwards by a bearer token rather
 * than a login.
 *
 * There is no per-IP budget anywhere here. MSG91 rate limits sends on its side,
 * and a counter of our own punished shared networks, a college lab or an office,
 * for traffic the provider already meters.
 */

/** Measured from the last send; doubles as the lockout once the cap is spent. */
const OTP_WINDOW_MINUTES = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * SMS codes one session may claim: an initial code plus two resends, matching
 * what the email gate allows. There is no reset inside a session, because a
 * session is exactly one person's run at one form.
 */
export const PHONE_SENDS_PER_SESSION = 3;

const minutesFromNow = (minutes: number): Date =>
  new Date(Date.now() + minutes * 60 * 1000);

export const normalizeEmail = (email: unknown): string =>
  String(email ?? "")
    .trim()
    .toLowerCase();

export const generateOtp = (): string => {
  const max = 10 ** OTP_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(OTP_LENGTH, "0");
};

/** SHA-256, matching the storage form. See the note on the schema field. */
export const hashSessionToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: number }).code === 11000;

/**
 * Explains a refused email send, carrying the code and the real remaining wait
 * so the UI can count a button down rather than print a dead sentence.
 */
const refusedEmailSend = async (
  scope: string,
  email: string,
): Promise<AppError> => {
  const doc = await ContactEmailOtpModel.findOne({ scope, email })
    .select("sendCount lastSentAt expiresAt")
    .lean();

  if (doc && (doc.sendCount ?? 0) >= MAX_SENDS_PER_WINDOW) {
    const remainingMs = new Date(doc.expiresAt).getTime() - Date.now();
    const retryAfterMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
    return new AppError(
      `You have used every code this window allows. Try again in ${retryAfterMinutes} minute${
        retryAfterMinutes === 1 ? "" : "s"
      }.`,
      429,
      PHONE_ERROR_CODES.OTP_SEND_LIMIT,
      { retryAfterMinutes },
    );
  }

  const elapsed =
    (Date.now() - new Date(doc?.lastSentAt ?? 0).getTime()) / 1000;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed),
  );
  return new AppError(
    otpThrottledMessage(retryAfterSeconds),
    429,
    PHONE_ERROR_CODES.OTP_THROTTLED,
    { retryAfterSeconds },
  );
};

export interface EmailOtpRequest {
  scope: string;
  email: string;
  /**
   * Completes "continue with:" in the template, so it reads as a noun phrase.
   * Keep it short: the template gives it one highlighted line.
   */
  purpose: string;
  /** Names the flow in the dev-only console fallback. */
  label?: string;
}

export const requestEmailOtp = async ({
  scope,
  email: rawEmail,
  purpose,
  label = "Verification",
}: EmailOtpRequest): Promise<{
  sent: true;
  expiryMinutes: number;
  cooldownSeconds: number;
}> => {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Enter a valid email address", 400);
  }

  const otp = generateOtp();
  const cooldownCutoff = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000);

  try {
    // The guards live in the filter so check and write are one atomic step.
    // When a doc exists but fails them the upsert falls through to an insert,
    // and the unique index on (scope, email) rejects it. That is the signal.
    await ContactEmailOtpModel.findOneAndUpdate(
      {
        scope,
        email,
        lastSentAt: { $lte: cooldownCutoff },
        sendCount: { $lt: MAX_SENDS_PER_WINDOW },
      },
      {
        $set: {
          otpHash: await bcrypt.hash(otp, 10),
          otpExpiresAt: minutesFromNow(OTP_EXPIRY_MINUTES),
          attempts: 0,
          lastSentAt: new Date(),
          expiresAt: minutesFromNow(OTP_WINDOW_MINUTES),
        },
        $inc: { sendCount: 1 },
        $setOnInsert: { scope, email },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    // The insert lost to an existing row, so a guard in the filter rejected it.
    // Read back what the real wait is: quoting the full cooldown would tell
    // someone 60 seconds when 3 are left, and the UI counts down on this.
    throw await refusedEmailSend(scope, email);
  }

  const [d1, d2, d3, d4, d5, d6] = otp.split("");
  try {
    const result = await verificationCodeMail.sendNow(
      { email },
      {
        purpose,
        // Whole code for the subject line; the body renders the digits below.
        otp,
        otp1: d1,
        otp2: d2,
        otp3: d3,
        otp4: d4,
        otp5: d5,
        otp6: d6,
        expiryMinutes: OTP_EXPIRY_MINUTES,
        year: new Date().getFullYear(),
      },
    );
    // Mailer off or unconfigured: surface the code locally so the flow is
    // testable without a live template. Never in production.
    if (
      (result as { outcome?: string })?.outcome === "skipped" &&
      process.env.NODE_ENV !== "production"
    ) {
      console.log(`🔑 [dev] ${label} OTP for ${email}: ${otp}`);
    }
  } catch {
    // Undo the throttle bookkeeping: an MSG91 outage must not cost the sender a
    // slot and a minute.
    await ContactEmailOtpModel.findOneAndUpdate(
      { scope, email },
      { $set: { lastSentAt: new Date(0) }, $inc: { sendCount: -1 } },
    );
    throw new AppError("Could not send the code, try again", 502);
  }

  return {
    sent: true,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
  };
};

export interface VerifiedSession {
  sessionToken: string;
  expiresAt: Date;
  phoneVerified: boolean;
}

export interface EmailOtpVerification {
  scope: string;
  email: string;
  otp: string;
  /** How long the session issued on success should live. */
  sessionMinutes: number;
  /**
   * Carry over a number already proved on an earlier session for this same
   * (scope, email). Without it a reload, or a second tab, means another SMS to
   * prove the same number to the same form, which is a bill for nothing.
   */
  inheritProvedPhone?: boolean;
}

export const verifyEmailOtp = async ({
  scope,
  email: rawEmail,
  otp,
  sessionMinutes,
  inheritProvedPhone = true,
}: EmailOtpVerification): Promise<VerifiedSession> => {
  const email = normalizeEmail(rawEmail);

  const pending = await ContactEmailOtpModel.findOne({ scope, email }).lean();
  if (!pending) throw new AppError("Ask for a code first", 400);

  if ((pending.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS) {
    throw new AppError("Too many incorrect codes. Ask for a new one.", 429);
  }

  if (new Date(pending.otpExpiresAt).getTime() < Date.now()) {
    throw new AppError("That code has expired. Ask for a new one.", 400);
  }

  const matches = await bcrypt.compare(String(otp ?? ""), pending.otpHash);
  if (!matches) {
    await ContactEmailOtpModel.updateOne(
      { _id: pending._id },
      { $inc: { attempts: 1 } },
    );
    throw new AppError("That code is incorrect", 400);
  }

  // Consumed on success so the same code cannot be replayed from a second tab.
  await ContactEmailOtpModel.deleteOne({ _id: pending._id });

  // Scoped to (scope, email) and served by the index on that pair. It cannot
  // lend a number to a different address, and the sessions it reads from expire
  // on their own clock, so the window is a reload rather than forever.
  const proved = inheritProvedPhone
    ? await ContactSessionModel.findOne({
        scope,
        email,
        phoneVerifiedAt: { $ne: null },
      })
        .sort({ phoneVerifiedAt: -1 })
        .select("phone phoneVerifiedAt")
        .lean()
    : null;

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = minutesFromNow(sessionMinutes);

  await ContactSessionModel.create({
    tokenHash: hashSessionToken(sessionToken),
    scope,
    email,
    emailVerifiedAt: new Date(),
    phone: proved?.phone ?? null,
    phoneVerifiedAt: proved?.phoneVerifiedAt ?? null,
    expiresAt,
  });

  // Reported rather than assumed so the UI reads one field for every entry path.
  return { sessionToken, expiresAt, phoneVerified: Boolean(proved?.phone) };
};

/**
 * Issues a session for a form that takes the address on trust.
 *
 * The enquiry form is the only caller: it collects leads for a sales call, so
 * the number is what has to be real and the address is a note for the
 * counsellor. `emailVerifiedAt` stays null, which is what tells anything reading
 * the session apart from one a code paid for.
 *
 * A number proved under this address on an earlier session is deliberately not
 * inherited. Nothing here proves the caller owns the address, so inheriting
 * would let anyone who types it skip the SMS and post a lead as them.
 */
export const startUnverifiedSession = async ({
  scope,
  email: rawEmail,
  sessionMinutes,
}: {
  scope: string;
  email: string;
  sessionMinutes: number;
}): Promise<VerifiedSession> => {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Enter a valid email address", 400);
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = minutesFromNow(sessionMinutes);

  await ContactSessionModel.create({
    tokenHash: hashSessionToken(sessionToken),
    scope,
    email,
    emailVerifiedAt: null,
    expiresAt,
  });

  return { sessionToken, expiresAt, phoneVerified: false };
};

export interface AccountSession {
  scope: string;
  accountEmail: string;
  userId: unknown;
  sessionMinutes: number;
  /** A profile number, already proved when it was added. */
  verifiedProfilePhone?: string | null;
}

/**
 * Issues a session straight from a signed-in account, with no code.
 *
 * The OTP exists to prove someone can read mail at an address. A signed-in
 * account cleared that bar at signup, so mailing another code asks them to prove
 * the same thing twice.
 *
 * The email comes from the account record, never from the request: letting a
 * signed-in user name their own address here would hand them one session per
 * address they can type.
 */
export const startSessionForAccount = async ({
  scope,
  accountEmail,
  userId,
  sessionMinutes,
  verifiedProfilePhone,
}: AccountSession): Promise<VerifiedSession & { email: string }> => {
  const email = normalizeEmail(accountEmail);
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Your account has no usable email address", 400);
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = minutesFromNow(sessionMinutes);

  await ContactSessionModel.create({
    tokenHash: hashSessionToken(sessionToken),
    scope,
    email,
    emailVerifiedAt: new Date(),
    userId,
    phone: verifiedProfilePhone ?? null,
    phoneVerifiedAt: verifiedProfilePhone ? new Date() : null,
    expiresAt,
  });

  return {
    sessionToken,
    expiresAt,
    email,
    phoneVerified: Boolean(verifiedProfilePhone),
  };
};

/**
 * Resolves a bearer token into its session, or null. Callers must still check
 * `expiresAt`: Mongo's TTL reaper runs about once a minute, so an expired row
 * can still be readable. The index is cleanup, not the check.
 */
export const loadSessionByToken = async (token: string) =>
  ContactSessionModel.findOne({ tokenHash: hashSessionToken(token) }).lean();

/** Explains a refused claim, so the UI can count down instead of dead-ending. */
const refusedPhoneSend = async (sessionId: unknown): Promise<AppError> => {
  const doc = await ContactSessionModel.findById(sessionId)
    .select("phoneVerifiedAt phoneSendCount phoneLastSentAt")
    .lean();
  if (!doc) return new AppError("Verify your email again to continue", 401);

  if (doc.phoneVerifiedAt) {
    return new AppError(
      "That number is already verified",
      400,
      PHONE_ERROR_CODES.PHONE_ALREADY_VERIFIED,
    );
  }

  if ((doc.phoneSendCount ?? 0) >= PHONE_SENDS_PER_SESSION) {
    // No retry window to quote: the budget belongs to the session, so the way
    // back is a fresh one rather than a wait.
    return new AppError(
      "You have used every code this session allows. Verify your email again to start over.",
      429,
      PHONE_ERROR_CODES.OTP_SEND_LIMIT,
    );
  }

  const elapsed =
    (Date.now() - new Date(doc.phoneLastSentAt ?? 0).getTime()) / 1000;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed),
  );
  return new AppError(
    otpThrottledMessage(retryAfterSeconds),
    429,
    PHONE_ERROR_CODES.OTP_THROTTLED,
    { retryAfterSeconds },
  );
};

/**
 * Claims one SMS against this session's budget, before the widget is allowed to
 * dispatch anything.
 *
 * The MSG91 widget sends from the browser, so without this step nothing on the
 * server sees an SMS at all and the send is free to repeat: no cooldown, no cap,
 * and a bill that grows with every click. Claiming first rather than recording
 * afterwards is what makes the budget enforceable, since a client that simply
 * skips the "I sent one" call cannot then bypass it.
 *
 * The cost of that order is that a send MSG91 drops still spends a slot. That
 * trade favours the budget, which is the part protecting the bill.
 */
export const claimPhoneSend = async (
  sessionId: unknown,
  rawPhone: unknown,
): Promise<{ phone: string; cooldownSeconds: number; sendsLeft: number }> => {
  const phone = requireValidPhone(rawPhone);

  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000);

  // The guards live in the filter so check and write are one atomic step; two
  // tabs clicking together cannot both pass. The `null` arms cover sessions
  // issued before these fields existed, which outlive a deploy by their TTL.
  const claimed = await ContactSessionModel.findOneAndUpdate(
    {
      _id: sessionId,
      phoneVerifiedAt: null,
      $and: [
        {
          $or: [
            { phoneSendCount: null },
            { phoneSendCount: { $lt: PHONE_SENDS_PER_SESSION } },
          ],
        },
        {
          $or: [
            { phoneLastSentAt: null },
            { phoneLastSentAt: { $lte: cooldownCutoff } },
          ],
        },
      ],
    },
    {
      $set: { phonePending: phone, phoneLastSentAt: now },
      $inc: { phoneSendCount: 1 },
    },
    { new: true },
  )
    .select("phoneSendCount")
    .lean();

  if (!claimed) throw await refusedPhoneSend(sessionId);

  return {
    phone,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    sendsLeft: Math.max(
      0,
      PHONE_SENDS_PER_SESSION - (claimed.phoneSendCount ?? 0),
    ),
  };
};

/**
 * Proves a number for a session.
 *
 * The MSG91 widget already sent the SMS and checked the digits in the browser;
 * this validates the token it handed back. When the session belongs to a
 * signed-in account with no number on file, the proved number is written to that
 * profile too, so nobody is asked for it twice.
 */
export const verifyPhone = async (
  sessionId: unknown,
  rawPhone: unknown,
  msg91Token: unknown,
): Promise<{ phone: string }> => {
  const phone = requireValidPhone(rawPhone);

  const session = await ContactSessionModel.findById(sessionId)
    .select("userId phonePending")
    .lean();
  if (!session) throw new AppError("Verify your email again to continue", 401);

  // The number must be the one this server claimed a send for. MSG91 does not
  // echo the number back on every widget configuration, so without this a token
  // proved against one number could be presented alongside any other.
  if (!session.phonePending || session.phonePending !== phone) {
    throw new AppError(
      PHONE_MESSAGES.PHONE_MISMATCH,
      400,
      PHONE_ERROR_CODES.PHONE_MISMATCH,
    );
  }

  await assertPhoneTokenValid(phone, msg91Token);

  const now = new Date();
  await ContactSessionModel.updateOne(
    { _id: sessionId },
    { $set: { phone, phoneVerifiedAt: now, phonePending: null } },
  );

  if (session.userId) {
    // Only fills a gap: an existing number was proved when it was added, and
    // silently replacing it here would let this flow move someone's number.
    // Changing a number on purpose goes through /users/me/phone/verify.
    await UserModel.updateOne(
      {
        _id: session.userId,
        $or: [{ phone: { $exists: false } }, { phone: null }, { phone: "" }],
      },
      { $set: { phone, phoneVerifiedAt: now } },
    );
  }

  return { phone };
};
