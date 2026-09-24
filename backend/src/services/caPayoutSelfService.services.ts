import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import { CaApplicationModel, CaPayoutOtpModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { decryptCaText, encryptCaText } from "../lib/caPii";
import { isIndianMobile, PAYOUT_DETAILS_MAX, UPI_RE } from "../lib/caApplication";
import { sendCaPayoutOtpSms } from "../lib/caPayoutOtpSms";
import { ACCOUNT_CHANGE_COOLDOWN_DAYS } from "../constants/accountChangeCooldown";
import {
  MAX_SENDS_PER_WINDOW,
  MAX_VERIFY_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
} from "./emailChangeVerification.services";
import type { CaPayoutCiphertext } from "../types/caApplication";

/**
 * Self-service payout change for an attached or approved Campus Ambassador,
 * gated on an OTP to the phone verified at application time.
 *
 * Deliberately the same shape as `emailChangeVerification.services.ts`: a
 * hashed code with its own send throttle, and a cooldown after a successful
 * change that mirrors `accountChangeCooldown.ts`. The plain and encrypted
 * payout value are never logged, and only a masked form ever leaves this
 * module.
 */

export const CA_PAYOUT_ERROR_CODES = {
  LOCKED: "CA_PAYOUT_LOCKED",
  INVALID_CODE: "INVALID_CODE",
  OTP_SEND_LIMIT: "OTP_SEND_LIMIT",
  OTP_THROTTLED: "OTP_THROTTLED",
} as const;

/** How long an OTP attempt survives before the TTL index reaps it. */
const OTP_WINDOW_MINUTES = 5;

interface OwnApplication {
  _id: mongoose.Types.ObjectId;
  phone: string;
  payout: CaPayoutCiphertext | null;
  payoutChangedAt: Date | null;
  payoutLockedUntil: Date | null;
}

/** The signed-in user's own attached-or-approved CA application, or a 404. */
const loadOwnApplication = async (userId: string): Promise<OwnApplication> => {
  const doc = await CaApplicationModel.findOne(
    { userId, status: { $in: ["approved", "attached"] } },
    { phone: 1, payout: 1, payoutChangedAt: 1, payoutLockedUntil: 1 },
  ).lean();
  if (!doc) throw new AppError("You have no Campus Ambassador application", 404);
  return doc as unknown as OwnApplication;
};

const maskUpi = (upi: string): string => {
  const at = upi.indexOf("@");
  if (at < 0) return "••••";
  return `${upi.slice(0, Math.min(2, at))}••••${upi.slice(at)}`;
};

const maskDetails = (value: string): string => `••••${value.slice(-4)}`;

const maskPayout = (method: "upi" | "details", value: string): string =>
  method === "upi" ? maskUpi(value) : maskDetails(value);

/**
 * "9876543210" -> "+91 ••••••3210"; an E.164 number keeps its own country
 * code the same way. Never the destination the client can act on, only what
 * it displays.
 */
const maskPhone = (phone: string): string => {
  const indian = isIndianMobile(phone);
  const digits = indian ? `91${phone}` : phone.replace(/^\+/, "");
  const ccLen = indian ? 2 : Math.max(1, digits.length - 10);
  const rest = digits.slice(ccLen);
  const last4 = rest.slice(-4);
  const bullets = "•".repeat(Math.max(4, rest.length - 4));
  return `+${digits.slice(0, ccLen)} ${bullets}${last4}`;
};

const isLocked = (lockedUntil: Date | null | undefined): boolean =>
  Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());

const assertNotLocked = (lockedUntil: Date | null | undefined): void => {
  if (!isLocked(lockedUntil)) return;
  const until = new Date(lockedUntil as Date);
  throw new AppError(
    `You can change your payout details again on ${until.toDateString()}`,
    409,
    CA_PAYOUT_ERROR_CODES.LOCKED,
    { lockedUntil: until.toISOString() },
  );
};

export interface CaPayoutView {
  method: "upi" | "details" | null;
  masked: string | null;
  lastChangedAt: string | null;
  lockedUntil: string | null;
}

const toView = (app: Pick<OwnApplication, "payout" | "payoutChangedAt" | "payoutLockedUntil">): CaPayoutView => {
  if (!app.payout) {
    return {
      method: null,
      masked: null,
      lastChangedAt: app.payoutChangedAt ? new Date(app.payoutChangedAt).toISOString() : null,
      lockedUntil: isLocked(app.payoutLockedUntil) ? new Date(app.payoutLockedUntil as Date).toISOString() : null,
    };
  }
  const value = decryptCaText(app.payout);
  return {
    method: app.payout.method,
    masked: maskPayout(app.payout.method, value),
    lastChangedAt: app.payoutChangedAt ? new Date(app.payoutChangedAt).toISOString() : null,
    lockedUntil: isLocked(app.payoutLockedUntil) ? new Date(app.payoutLockedUntil as Date).toISOString() : null,
  };
};

export const getOwnCaPayout = async (userId: string): Promise<CaPayoutView> => {
  const app = await loadOwnApplication(userId);
  return toView(app);
};

const generateOtp = (): string =>
  String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

const minutesFromNow = (minutes: number): Date => new Date(Date.now() + minutes * 60 * 1000);

const isDuplicateKeyError = (error: unknown): boolean =>
  Boolean(error) && (error as { code?: number }).code === 11000;

interface ThrottleState {
  sendCount: number;
  lastSentAt?: Date;
  expiresAt?: Date;
}

const minutesUntilReset = (expiresAt?: Date | null): number => {
  if (!expiresAt) return OTP_WINDOW_MINUTES;
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 60_000));
};

const secondsUntilNextSend = (lastSentAt?: Date | null): number => {
  if (!lastSentAt) return 0;
  const elapsed = (Date.now() - new Date(lastSentAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
};

const loadThrottleState = async (applicationId: mongoose.Types.ObjectId): Promise<ThrottleState | null> =>
  (await CaPayoutOtpModel.findOne({ application: applicationId })
    .select("sendCount lastSentAt expiresAt")
    .lean()) as ThrottleState | null;

const buildThrottleError = (doc: ThrottleState | null): AppError => {
  if (doc && doc.sendCount >= MAX_SENDS_PER_WINDOW) {
    const retryAfterMinutes = minutesUntilReset(doc.expiresAt);
    return new AppError(
      `You have used every code this window allows. Try again in ${retryAfterMinutes} minute${
        retryAfterMinutes === 1 ? "" : "s"
      }.`,
      429,
      CA_PAYOUT_ERROR_CODES.OTP_SEND_LIMIT,
      { retryAfterMinutes },
    );
  }
  const retryAfterSeconds = secondsUntilNextSend(doc?.lastSentAt) || RESEND_COOLDOWN_SECONDS;
  return new AppError(
    `Please wait ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"} before requesting another code.`,
    429,
    CA_PAYOUT_ERROR_CODES.OTP_THROTTLED,
    { retryAfterSeconds },
  );
};

export interface RequestedPayoutOtp {
  sentTo: string;
}

export const requestOwnCaPayoutOtp = async (userId: string): Promise<RequestedPayoutOtp> => {
  const app = await loadOwnApplication(userId);
  assertNotLocked(app.payoutLockedUntil);

  const otp = generateOtp();
  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000);

  let pending;
  try {
    // The guards live in the filter so the check and the write are one atomic
    // step, matching `requestEmailChange`.
    pending = await CaPayoutOtpModel.findOneAndUpdate(
      {
        application: app._id,
        lastSentAt: { $lte: cooldownCutoff },
        sendCount: { $lt: MAX_SENDS_PER_WINDOW },
      },
      {
        $set: {
          otpHash: await bcrypt.hash(otp, 10),
          otpExpiresAt: minutesFromNow(OTP_EXPIRY_MINUTES),
          attempts: 0,
          lastSentAt: now,
          expiresAt: minutesFromNow(OTP_WINDOW_MINUTES),
        },
        $inc: { sendCount: 1 },
        $setOnInsert: { application: app._id },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    throw buildThrottleError(await loadThrottleState(app._id));
  }

  try {
    await sendCaPayoutOtpSms(app.phone, otp);
  } catch (error) {
    // The SMS never went out: undo the throttle bookkeeping so the CA is not
    // charged a slot and a minute for a send that failed on our side.
    await CaPayoutOtpModel.findOneAndUpdate(
      { application: app._id },
      { $set: { lastSentAt: new Date(0) }, $inc: { sendCount: -1 } },
    );
    throw error;
  }

  return { sentTo: maskPhone(app.phone) };
};

/** Applies the same rules `cleanCaApplicationInput` uses at submission time. */
const validatePayoutValue = (method: "upi" | "details", raw: unknown): string => {
  const value = String(raw ?? "").trim().slice(0, PAYOUT_DETAILS_MAX);
  if (!value) {
    throw new AppError(method === "upi" ? "Enter your UPI ID" : "Enter your payout details", 400);
  }
  if (method === "upi") {
    const upi = value.toLowerCase();
    if (!UPI_RE.test(upi)) {
      throw new AppError("Enter a valid UPI ID, like yourname@bank", 400);
    }
    return upi;
  }
  return value;
};

export const changeOwnCaPayout = async (
  userId: string,
  input: { value: unknown; code: unknown },
): Promise<CaPayoutView> => {
  const app = await loadOwnApplication(userId);
  assertNotLocked(app.payoutLockedUntil);

  const pending = await CaPayoutOtpModel.findOne({ application: app._id });
  if (!pending) {
    throw new AppError("Ask for a code first", 400, CA_PAYOUT_ERROR_CODES.INVALID_CODE);
  }
  if (pending.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError("That code has expired. Ask for a new one.", 400, CA_PAYOUT_ERROR_CODES.INVALID_CODE);
  }
  if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new AppError("Too many incorrect codes. Ask for a new one.", 429, CA_PAYOUT_ERROR_CODES.INVALID_CODE);
  }

  const matches = await bcrypt.compare(String(input.code ?? "").trim(), pending.otpHash);
  if (!matches) {
    await CaPayoutOtpModel.updateOne({ _id: pending._id }, { $inc: { attempts: 1 } });
    throw new AppError("That code is incorrect", 400, CA_PAYOUT_ERROR_CODES.INVALID_CODE);
  }

  // No stored method yet (payout was never set): derive it the same way
  // `cleanCaApplicationInput` did at submission time.
  const method: "upi" | "details" = app.payout?.method ?? (isIndianMobile(app.phone) ? "upi" : "details");
  const value = validatePayoutValue(method, input.value);

  const now = new Date();
  const lockedUntil = new Date(now.getTime() + ACCOUNT_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  const updated = await CaApplicationModel.findOneAndUpdate(
    {
      _id: app._id,
      $or: [{ payoutLockedUntil: null }, { payoutLockedUntil: { $lte: now } }],
    },
    {
      $set: {
        payout: { method, ...encryptCaText(value) },
        payoutChangedAt: now,
        payoutLockedUntil: lockedUntil,
      },
      $push: { payoutChanges: { $each: [{ at: now, by: "self" }], $slice: -20 } },
    },
    { new: true, projection: { payoutChangedAt: 1, payoutLockedUntil: 1 } },
  ).lean();

  if (!updated) {
    // Locked between the check above and the write (a second tab, most likely).
    throw new AppError(
      `You can change your payout details again on ${lockedUntil.toDateString()}`,
      409,
      CA_PAYOUT_ERROR_CODES.LOCKED,
    );
  }

  // Consumed on success so the same code cannot be replayed.
  await CaPayoutOtpModel.deleteOne({ application: app._id });

  return {
    method,
    masked: maskPayout(method, value),
    lastChangedAt: now.toISOString(),
    lockedUntil: lockedUntil.toISOString(),
  };
};
