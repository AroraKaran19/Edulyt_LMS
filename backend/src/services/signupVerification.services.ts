import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import { PendingSignupModel, UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { getPointsSettings } from "./pointsSettings.services";
import { signupVerificationMail } from "../mail";
import { buildWelcomeBonusBlock } from "../lib/signupVerificationMail";
import {
  SIGNUP_ERROR_CODES,
  SIGNUP_MESSAGES,
  otpIncorrectMessage,
  otpSendLimitMessage,
  otpThrottledMessage,
} from "../constants/signupVerificationMessages";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
/** Wrong codes allowed per issued OTP. A resend clears the counter. */
export const MAX_VERIFY_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
/** Codes emailed per signup attempt: the initial one plus two resends. */
export const MAX_SENDS_PER_SIGNUP = 3;
/**
 * How long the whole attempt survives before the TTL index reaps it, measured
 * from the last send. It doubles as the lockout: once the send cap is spent,
 * this is how long the address waits before signup can start over.
 */
export const SIGNUP_WINDOW_MINUTES = 5;

export interface PendingSignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  userType?: string;
  provider?: string;
  extra?: Record<string, unknown>;
}

export interface StartedVerification {
  pendingId: string;
  email: string;
  expiryMinutes: number;
}

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

/**
 * Uniformly distributed 6-digit code. `crypto.randomInt` rather than
 * `Math.random`, which is predictable from prior outputs.
 */
export const generateOtp = (): string =>
  String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

const minutesFromNow = (minutes: number): Date =>
  new Date(Date.now() + minutes * 60 * 1000);

/**
 * Deadline for the pending record.
 *
 * Never earlier than the code it holds: if the record were reaped first, the
 * learner would be told to register again while holding a code the email says
 * is still valid. Taking the max keeps that true if either constant moves.
 */
const pendingExpiryDate = (): Date =>
  minutesFromNow(Math.max(SIGNUP_WINDOW_MINUTES, OTP_EXPIRY_MINUTES));

/** Mongo's duplicate-key error, raised when an upsert races an existing doc. */
const isDuplicateKeyError = (error: unknown): boolean =>
  Boolean(error) && (error as { code?: number }).code === 11000;

/**
 * Sends the code and reports failure to the caller.
 *
 * Deliberately awaited, unlike the rest of the platform's mail: here the email
 * IS the operation. A queued send that fails would leave the learner waiting
 * for a code that never arrives, with a success response on screen.
 */
const sendVerificationEmail = async (
  pending: {
    email: string;
    firstName: string;
    lastName?: string;
    userType?: string;
  },
  otp: string,
): Promise<void> => {
  // Only students earn the welcome bonus, and only when it is configured.
  let bonusPoints = 0;
  if (pending.userType === "student") {
    try {
      const { loginSuccessPoints } = await getPointsSettings();
      bonusPoints = Math.max(0, Math.floor(Number(loginSuccessPoints) || 0));
    } catch {
      // A settings read failure must not block signup; just omit the bonus box.
      bonusPoints = 0;
    }
  }

  const digits = otp.split("");
  const fullName = [pending.firstName, pending.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const result = await signupVerificationMail.sendNow(
    { email: pending.email, name: fullName || pending.firstName },
    {
      name: pending.firstName,
      otp1: digits[0],
      otp2: digits[1],
      otp3: digits[2],
      otp4: digits[3],
      otp5: digits[4],
      otp6: digits[5],
      expiryMinutes: OTP_EXPIRY_MINUTES,
      year: new Date().getFullYear(),
      // One template for both cases: the card is markup that disappears when
      // there is no bonus, rather than a second variant to keep in step.
      welcomeBonusBlock: buildWelcomeBonusBlock(bonusPoints),
    },
  );

  if (!result.ok) {
    throw new AppError(
      SIGNUP_MESSAGES.OTP_SEND_FAILED,
      502,
      SIGNUP_ERROR_CODES.OTP_SEND_FAILED,
    );
  }

  // Mailer off or unconfigured: surface the code locally so signup is testable
  // before MSG91 credentials exist. Never in production.
  if (result.outcome === "skipped" && process.env.NODE_ENV !== "production") {
    console.log(`🔑 [dev] Signup OTP for ${pending.email}: ${otp}`);
  }
};

/**
 * Records a signup attempt and emails the code. No `User` document is created
 * here, so an abandoned signup leaves the email address free.
 *
 * Re-submitting the register form for the same address updates the existing
 * attempt rather than creating a second one, and is subject to the same
 * cooldown and send cap as the resend endpoint - otherwise the cap could be
 * bypassed by simply submitting the form again.
 */
export const startSignupVerification = async (
  input: PendingSignupInput,
): Promise<StartedVerification> => {
  const email = normalizeEmail(input.email);

  const existingUser = await UserModel.findOne({ email }).select("_id").lean();
  if (existingUser) {
    throw new AppError(
      SIGNUP_MESSAGES.USER_EXISTS,
      400,
      SIGNUP_ERROR_CODES.USER_EXISTS,
    );
  }

  const otp = generateOtp();
  const now = new Date();
  const cooldownCutoff = new Date(
    now.getTime() - RESEND_COOLDOWN_SECONDS * 1000,
  );

  const update = {
    $set: {
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || "",
      password: await bcrypt.hash(input.password, 10),
      userType: input.userType || "student",
      provider: input.provider || "credentials",
      extra: input.extra ?? {},
      otpHash: await bcrypt.hash(otp, 10),
      otpExpiresAt: minutesFromNow(OTP_EXPIRY_MINUTES),
      attempts: 0,
      lastSentAt: now,
      expiresAt: pendingExpiryDate(),
    },
    $inc: { sendCount: 1 },
    $setOnInsert: { email },
  };

  let pending;
  try {
    // The guards live in the filter so the check and the write are one atomic
    // step. When a doc exists but fails them, the upsert falls through to an
    // insert and the unique index rejects it - which is the throttle signal.
    pending = await PendingSignupModel.findOneAndUpdate(
      {
        email,
        lastSentAt: { $lte: cooldownCutoff },
        sendCount: { $lt: MAX_SENDS_PER_SIGNUP },
      },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    // The insert lost to an existing record, so the guards in the filter are
    // what rejected this attempt. Report which one.
    throw buildThrottleError(await loadThrottleState({ email }));
  }

  await sendOrRollback(pending, otp);

  return {
    pendingId: String(pending._id),
    email: pending.email,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  };
};

/**
 * Minutes until the pending record TTLs out, which is when the address frees up
 * and the learner can start over. Rounded up, never below 1.
 */
const minutesUntilExpiry = (expiresAt?: Date | null): number => {
  if (!expiresAt) return SIGNUP_WINDOW_MINUTES;
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 60_000));
};

interface ThrottleState {
  sendCount: number;
  expiresAt?: Date;
}

/**
 * Builds the error for a refused send.
 *
 * Distinguishing "asked too soon" from "used every code" is the whole point:
 * the first clears itself in a minute, the second needs `retryAfterMinutes` so
 * the UI can say when to come back instead of re-arming a button that will
 * only fail again.
 */
const buildThrottleError = (doc: ThrottleState | null): AppError => {
  if (doc && doc.sendCount >= MAX_SENDS_PER_SIGNUP) {
    const retryAfterMinutes = minutesUntilExpiry(doc.expiresAt);
    return new AppError(
      otpSendLimitMessage(retryAfterMinutes),
      429,
      SIGNUP_ERROR_CODES.OTP_SEND_LIMIT,
      { retryAfterMinutes },
    );
  }

  return new AppError(
    otpThrottledMessage(RESEND_COOLDOWN_SECONDS),
    429,
    SIGNUP_ERROR_CODES.OTP_THROTTLED,
    { retryAfterSeconds: RESEND_COOLDOWN_SECONDS },
  );
};

/** Reads just the fields needed to explain a refused send. */
const loadThrottleState = async (
  filter: Record<string, unknown>,
): Promise<ThrottleState | null> =>
  (await PendingSignupModel.findOne(filter)
    .select("sendCount expiresAt")
    .lean()) as ThrottleState | null;

/**
 * Undoes the throttle bookkeeping when the email never went out, so a MSG91
 * outage doesn't lock the learner out of retrying for a minute.
 */
const sendOrRollback = async (
  pending: any,
  otp: string,
): Promise<void> => {
  try {
    await sendVerificationEmail(pending, otp);
  } catch (error) {
    await PendingSignupModel.findByIdAndUpdate(pending._id, {
      $set: { lastSentAt: new Date(0) },
      $inc: { sendCount: -1 },
    });
    throw error;
  }
};

export interface VerifiedSignup {
  email: string;
  firstName: string;
  lastName: string;
  /** Already bcrypt-hashed. Must NOT be hashed again. */
  passwordHash: string;
  userType: string;
  provider: string;
  extra: Record<string, unknown>;
}

/**
 * Checks the code and hands back the signup for account creation.
 *
 * The pending record is deleted as an atomic claim before returning, so a
 * double-submitted form cannot create two accounts from one verification.
 */
export const verifySignupOtp = async (
  pendingId: string,
  otp: string,
): Promise<VerifiedSignup> => {
  if (!mongoose.Types.ObjectId.isValid(pendingId)) {
    throw new AppError(
      SIGNUP_MESSAGES.PENDING_NOT_FOUND,
      400,
      SIGNUP_ERROR_CODES.PENDING_NOT_FOUND,
    );
  }

  const pending = await PendingSignupModel.findById(pendingId);
  if (!pending) {
    throw new AppError(
      SIGNUP_MESSAGES.PENDING_NOT_FOUND,
      400,
      SIGNUP_ERROR_CODES.PENDING_NOT_FOUND,
    );
  }

  if (pending.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError(
      SIGNUP_MESSAGES.OTP_EXPIRED,
      400,
      SIGNUP_ERROR_CODES.OTP_EXPIRED,
    );
  }

  if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new AppError(
      SIGNUP_MESSAGES.OTP_ATTEMPTS_EXCEEDED,
      429,
      SIGNUP_ERROR_CODES.OTP_ATTEMPTS_EXCEEDED,
    );
  }

  const matches = await bcrypt.compare(String(otp).trim(), pending.otpHash);
  if (!matches) {
    const updated = await PendingSignupModel.findByIdAndUpdate(
      pendingId,
      { $inc: { attempts: 1 } },
      { new: true },
    );
    const attemptsLeft = Math.max(
      0,
      MAX_VERIFY_ATTEMPTS - (updated?.attempts ?? MAX_VERIFY_ATTEMPTS),
    );
    throw new AppError(
      otpIncorrectMessage(attemptsLeft),
      400,
      SIGNUP_ERROR_CODES.OTP_INVALID,
      { attemptsLeft },
    );
  }

  // Atomic claim: whoever deletes the document owns the account creation.
  const claimed = await PendingSignupModel.findByIdAndDelete(pendingId);
  if (!claimed) {
    throw new AppError(
      SIGNUP_MESSAGES.ALREADY_VERIFIED,
      409,
      SIGNUP_ERROR_CODES.ALREADY_VERIFIED,
    );
  }

  return {
    email: claimed.email,
    firstName: claimed.firstName,
    lastName: claimed.lastName || "",
    passwordHash: claimed.password,
    userType: claimed.userType,
    provider: claimed.provider,
    extra: (claimed.extra as Record<string, unknown>) ?? {},
  };
};

/** Issues a fresh code for an existing attempt, subject to cooldown and cap. */
export const resendSignupOtp = async (
  pendingId: string,
): Promise<StartedVerification> => {
  if (!mongoose.Types.ObjectId.isValid(pendingId)) {
    throw new AppError(
      SIGNUP_MESSAGES.PENDING_NOT_FOUND,
      400,
      SIGNUP_ERROR_CODES.PENDING_NOT_FOUND,
    );
  }

  const otp = generateOtp();
  const now = new Date();
  const cooldownCutoff = new Date(
    now.getTime() - RESEND_COOLDOWN_SECONDS * 1000,
  );

  const pending = await PendingSignupModel.findOneAndUpdate(
    {
      _id: pendingId,
      lastSentAt: { $lte: cooldownCutoff },
      sendCount: { $lt: MAX_SENDS_PER_SIGNUP },
    },
    {
      $set: {
        otpHash: await bcrypt.hash(otp, 10),
        otpExpiresAt: minutesFromNow(OTP_EXPIRY_MINUTES),
        attempts: 0,
        lastSentAt: now,
        expiresAt: pendingExpiryDate(),
      },
      $inc: { sendCount: 1 },
    },
    { new: true },
  );

  if (!pending) {
    // Separate "doesn't exist" from "asked too soon" for a useful message.
    const existing = await loadThrottleState({ _id: pendingId });
    if (!existing) {
      throw new AppError(
        SIGNUP_MESSAGES.PENDING_NOT_FOUND,
        400,
        SIGNUP_ERROR_CODES.PENDING_NOT_FOUND,
      );
    }
    throw buildThrottleError(existing);
  }

  await sendOrRollback(pending, otp);

  return {
    pendingId: String(pending._id),
    email: pending.email,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  };
};
