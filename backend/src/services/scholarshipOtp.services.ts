import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  ScholarshipEmailOtpModel,
  ScholarshipSessionModel,
  ScholarshipTestDailyStatModel,
  ScholarshipTestModel,
} from "../models";
import { AppError } from "../middlewares/error.middleware";
import { verificationCodeMail } from "../mail";
import { todayIst } from "../utils/ist";
import {
  assertPhoneTokenValid,
  requireValidPhone,
} from "./phoneVerification.services";
import {
  PHONE_ERROR_CODES,
  PHONE_MESSAGES,
  otpThrottledMessage,
} from "../constants/phoneVerification";
import { UserModel } from "../models";
import {
  MAX_SENDS_PER_WINDOW,
  MAX_VERIFY_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
} from "./emailChangeVerification.services";

/**
 * Public OTP for a scholarship campaign.
 *
 * Deliberately the same shape as `emailChangeVerification.services.ts`, whose
 * constants are imported rather than redeclared so the two flows cannot drift.
 * The one difference is a consequence of this being unauthenticated: there is no
 * account to key on, so the OTP is keyed on (campaign, email).
 *
 * There is no per-address budget here. MSG91 rate limits sends on its side, and
 * a per-IP counter of our own punished shared networks (a college lab, an office)
 * for traffic the provider already meters.
 */

/** Measured from the last send; doubles as the lockout once the cap is spent. */
const OTP_WINDOW_MINUTES = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const minutesFromNow = (minutes: number): Date =>
  new Date(Date.now() + minutes * 60 * 1000);

const normalizeEmail = (email: unknown): string =>
  String(email ?? "").trim().toLowerCase();

export const generateScholarshipOtp = (): string => {
  const max = 10 ** OTP_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(OTP_LENGTH, "0");
};

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: number }).code === 11000;

export interface OpenCampaign {
  _id: unknown;
  title: string;
  slug: string;
  durationMinutes: number;
  attemptsAllowed: number;
  questions: unknown[];
  couponValidForDays: number;
  discountPercent: number;
  couponId: unknown;
  createdBy: unknown;
}

/**
 * Loads a campaign that is accepting attempts right now. Every public write
 * path goes through this, so the window is enforced in one place rather than
 * re-derived per endpoint.
 */
export const loadOpenCampaign = async (slug: string) => {
  const campaign = await ScholarshipTestModel.findOne({
    slug: String(slug ?? "").trim().toLowerCase(),
  }).lean();
  if (!campaign) throw new AppError("Campaign not found", 404);

  // A campaign has no schedule: it runs from creation until someone pauses or
  // deletes it, so the flag is the whole check.
  if (!campaign.isActive) {
    throw new AppError("This campaign is no longer accepting attempts", 400);
  }
  return campaign as unknown as OpenCampaign;
};

/**
 * Best-effort funnel counter. Wrapped because a reporting write must never cost
 * a candidate their code: the bucket is allowed to under-count, the flow is not
 * allowed to fail.
 */
export const bumpDailyStat = async (
  testId: unknown,
  field: "views" | "otpRequested" | "started" | "submitted",
): Promise<void> => {
  try {
    await ScholarshipTestDailyStatModel.updateOne(
      { testId, day: todayIst() },
      { $inc: { [field]: 1 } },
      { upsert: true },
    );
  } catch {
    // Deliberately swallowed. See the doc comment.
  }
};

export const requestScholarshipOtp = async (
  slug: string,
  rawEmail: string,
): Promise<{ sent: true; expiryMinutes: number; cooldownSeconds: number }> => {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Enter a valid email address", 400);
  }

  const campaign = await loadOpenCampaign(slug);

  const otp = generateScholarshipOtp();
  const cooldownCutoff = new Date(
    Date.now() - RESEND_COOLDOWN_SECONDS * 1000,
  );

  try {
    // The guards live in the filter so check and write are one atomic step.
    // When a doc exists but fails them the upsert falls through to an insert,
    // and the unique index on (testId, email) rejects it. That is the signal.
    await ScholarshipEmailOtpModel.findOneAndUpdate(
      {
        testId: campaign._id,
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
        $setOnInsert: { testId: campaign._id, email },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    throw new AppError(
      `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before asking for another code.`,
      429,
    );
  }

  const [d1, d2, d3, d4, d5, d6] = otp.split("");
  try {
    const result = await verificationCodeMail.sendNow(
      { email },
      {
        // Completes "continue with:" in the template. The campaign title is
        // already a noun phrase, and most of them contain the word
        // "scholarship", so building a sentence around it produces duplicates.
        purpose: campaign.title,
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
    // testable before MSG91 approves the template. Never in production.
    if (
      (result as { outcome?: string })?.outcome === "skipped" &&
      process.env.NODE_ENV !== "production"
    ) {
      console.log(`🔑 [dev] Scholarship OTP for ${email}: ${otp}`);
    }
  } catch (error) {
    // Undo the throttle bookkeeping: an MSG91 outage must not cost the
    // candidate a slot and a minute.
    await ScholarshipEmailOtpModel.findOneAndUpdate(
      { testId: campaign._id, email },
      { $set: { lastSentAt: new Date(0) }, $inc: { sendCount: -1 } },
    );
    throw new AppError("Could not send the code, try again", 502);
  }

  await bumpDailyStat(campaign._id, "otpRequested");

  return {
    sent: true,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
  };
};

/** Extra life beyond the attempt clock, so a paused attempt still resumes. */
const SESSION_GRACE_MINUTES = 60;

/** SHA-256, matching the storage form. See the note on the schema field. */
export const hashSessionToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const verifyScholarshipOtp = async (
  slug: string,
  rawEmail: string,
  otp: string,
): Promise<{
  sessionToken: string;
  expiresAt: Date;
  phoneVerified: boolean;
}> => {
  const email = normalizeEmail(rawEmail);
  const campaign = await loadOpenCampaign(slug);

  const pending = await ScholarshipEmailOtpModel.findOne({
    testId: campaign._id,
    email,
  }).lean();
  if (!pending) {
    throw new AppError("Ask for a code first", 400);
  }

  if ((pending.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS) {
    throw new AppError(
      "Too many incorrect codes. Ask for a new one.",
      429,
    );
  }

  if (new Date(pending.otpExpiresAt).getTime() < Date.now()) {
    throw new AppError("That code has expired. Ask for a new one.", 400);
  }

  const matches = await bcrypt.compare(String(otp ?? ""), pending.otpHash);
  if (!matches) {
    await ScholarshipEmailOtpModel.updateOne(
      { _id: pending._id },
      { $inc: { attempts: 1 } },
    );
    throw new AppError("That code is incorrect", 400);
  }

  // Consumed on success so the same code cannot be replayed from a second tab.
  await ScholarshipEmailOtpModel.deleteOne({ _id: pending._id });

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = minutesFromNow(
    (campaign.durationMinutes ?? 15) + SESSION_GRACE_MINUTES,
  );

  /**
   * A number already proved on an earlier session for this same address carries
   * over. Without this a reload, or a second tab, means another SMS to prove
   * the same number to the same campaign, which is a bill for nothing.
   *
   * Scoped to (campaign, email) and served by the index on that pair. It cannot
   * lend a number to a different address, and the sessions it reads from expire
   * with the attempt clock, so the window is a reload rather than forever.
   */
  const proved = await ScholarshipSessionModel.findOne({
    testId: campaign._id,
    email,
    phoneVerifiedAt: { $ne: null },
  })
    .sort({ phoneVerifiedAt: -1 })
    .select("phone phoneVerifiedAt")
    .lean();

  await ScholarshipSessionModel.create({
    tokenHash: hashSessionToken(sessionToken),
    testId: campaign._id,
    email,
    phone: proved?.phone ?? null,
    phoneVerifiedAt: proved?.phoneVerifiedAt ?? null,
    expiresAt,
  });

  // Reported rather than assumed so the UI reads one field for every entry path.
  return { sessionToken, expiresAt, phoneVerified: Boolean(proved?.phone) };
};

/**
 * Issues a session straight from a signed-in account, with no code.
 *
 * The OTP exists to prove someone can read mail at the address their coupon
 * gets locked to. A signed-in account already cleared that bar at signup, so
 * mailing another code would be asking them to prove the same thing twice.
 *
 * The email comes from the account record, never from the request: letting a
 * signed-in user name their own address here would hand them one coupon per
 * address they can type.
 */
export const startSessionForAccount = async (
  slug: string,
  accountEmail: string,
  userId: unknown,
  verifiedProfilePhone?: string | null,
): Promise<{
  sessionToken: string;
  expiresAt: Date;
  email: string;
  phoneVerified: boolean;
}> => {
  const email = normalizeEmail(accountEmail);
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Your account has no usable email address", 400);
  }

  const campaign = await loadOpenCampaign(slug);

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = minutesFromNow(
    (campaign.durationMinutes ?? 15) + SESSION_GRACE_MINUTES,
  );

  await ScholarshipSessionModel.create({
    tokenHash: hashSessionToken(sessionToken),
    testId: campaign._id,
    email,
    userId,
    // A profile number was already proved when it was added, so the session
    // inherits it and the candidate is not asked twice.
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
 * SMS codes one session may claim: an initial code plus two resends, matching
 * what the email gate allows. There is no reset inside a session, because the
 * session is exactly one candidate's run at one campaign.
 */
export const SCHOLARSHIP_PHONE_SENDS_PER_SESSION = 3;

/** Explains a refused claim, so the UI can count down instead of dead-ending. */
const refusedPhoneSend = async (sessionId: unknown): Promise<AppError> => {
  const doc = await ScholarshipSessionModel.findById(sessionId)
    .select("phoneVerifiedAt phoneSendCount phoneLastSentAt")
    .lean();
  if (!doc) return new AppError("Verify your email again to continue", 401);

  if (doc.phoneVerifiedAt) {
    return new AppError("That number is already verified", 400);
  }

  if ((doc.phoneSendCount ?? 0) >= SCHOLARSHIP_PHONE_SENDS_PER_SESSION) {
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
 *
 * There is no per-IP budget here, unlike the email gate: MSG91 already rate
 * limits sends on its side, and what it cannot see is one candidate looping the
 * same session, which is exactly what the count below stops.
 */
export const claimScholarshipPhoneSend = async (
  sessionId: unknown,
  rawPhone: unknown,
): Promise<{ phone: string; cooldownSeconds: number; sendsLeft: number }> => {
  const phone = requireValidPhone(rawPhone);

  const now = new Date();
  const cooldownCutoff = new Date(
    now.getTime() - RESEND_COOLDOWN_SECONDS * 1000,
  );

  // The guards live in the filter so check and write are one atomic step; two
  // tabs clicking together cannot both pass. The `null` arms cover sessions
  // issued before these fields existed, which outlive a deploy by their TTL.
  const claimed = await ScholarshipSessionModel.findOneAndUpdate(
    {
      _id: sessionId,
      phoneVerifiedAt: null,
      $and: [
        {
          $or: [
            { phoneSendCount: null },
            { phoneSendCount: { $lt: SCHOLARSHIP_PHONE_SENDS_PER_SESSION } },
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
      SCHOLARSHIP_PHONE_SENDS_PER_SESSION - (claimed.phoneSendCount ?? 0),
    ),
  };
};

/**
 * Proves a number for a scholarship session.
 *
 * The MSG91 widget already sent the SMS and checked the digits in the browser;
 * this validates the token it handed back. When the session belongs to a
 * signed-in account with no number on file, the proved number is written to
 * that profile too, so nobody is asked for it twice.
 */
export const verifyScholarshipPhone = async (
  sessionId: unknown,
  rawPhone: unknown,
  msg91Token: unknown,
): Promise<{ phone: string }> => {
  const phone = requireValidPhone(rawPhone);

  const session = await ScholarshipSessionModel.findById(sessionId)
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
  await ScholarshipSessionModel.updateOne(
    { _id: sessionId },
    { $set: { phone, phoneVerifiedAt: now, phonePending: null } },
  );

  if (session.userId) {
    // Only fills a gap: an existing number was proved when it was added, and
    // silently replacing it here would let this flow move someone's number.
    await UserModel.updateOne(
      { _id: session.userId, $or: [{ phone: { $exists: false } }, { phone: null }, { phone: "" }] },
      { $set: { phone, phoneVerifiedAt: now } },
    );
  }

  return { phone };
};
