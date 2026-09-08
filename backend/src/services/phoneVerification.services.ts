import axios from "axios";
import { PhoneVerificationModel, UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import {
  MAX_SENDS_PER_WINDOW,
  PHONE_ERROR_CODES,
  PHONE_MESSAGES,
  RESEND_COOLDOWN_SECONDS,
  VERIFICATION_WINDOW_MINUTES,
  otpSendLimitMessage,
  otpThrottledMessage,
} from "../constants/phoneVerification";

/**
 * Phone verification via the MSG91 OTP widget.
 *
 * The code itself never reaches this backend. The widget script running in the
 * learner's browser sends the SMS and checks the digits, then hands back a
 * signed access token; MSG91's control API is the only thing that can say
 * whether that token is real. So the split is:
 *
 *  - the client owns send + code entry (that is what the widget is),
 *  - the server owns the send budget and the final "this number is yours"
 *    write, neither of which a client can be trusted with.
 *
 * A token alone is not enough to claim a number. `verifyPhoneForUser` also
 * requires that the number matches the one the server itself issued the send
 * for, so a token captured against one number cannot be replayed to claim
 * another even in the case where MSG91 does not echo the number back.
 */

const MSG91_VERIFY_URL =
  "https://control.msg91.com/api/v5/widget/verifyAccessToken";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/** E.164 caps the whole number, country code included, at 15 digits. */
const E164 = /^\+\d{8,15}$/;

/**
 * Reduces every shape the UI or MSG91 might produce (`+91 98765 43210`,
 * `919876543210`, `09876543210`) to the bare 10 digits stored on the user.
 *
 * A number carrying any country code other than +91 keeps it, in E.164, since
 * ten digits have nowhere to put a country. Indian numbers keep the form they
 * have always been stored in, so nothing already in the database and nothing a
 * caller already sends changes meaning.
 *
 * The leading "+" is the only signal that a number is international: without
 * it, `447911123456` cannot be told from a mistyped Indian number.
 */
export const normalizePhone = (raw: unknown): string => {
  const text = String(raw ?? "").trim();
  const digits = text.replace(/\D/g, "");

  if (!text.startsWith("+") || digits.startsWith("91")) {
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return digits;
  }

  return `+${digits}`;
};

export const isValidPhone = (phone: string): boolean =>
  INDIAN_MOBILE.test(phone) || E164.test(phone);

/** Normalizes and rejects anything that is not a usable mobile number. */
export const requireValidPhone = (raw: unknown): string => {
  const phone = normalizePhone(raw);
  if (!isValidPhone(phone)) {
    throw new AppError(
      PHONE_MESSAGES.PHONE_INVALID,
      400,
      PHONE_ERROR_CODES.PHONE_INVALID,
    );
  }
  return phone;
};

const minutesFromNow = (minutes: number): Date =>
  new Date(Date.now() + minutes * 60 * 1000);

/** Mongo's duplicate-key error, raised when an upsert races an existing doc. */
const isDuplicateKeyError = (error: unknown): boolean =>
  Boolean(error) && (error as { code?: number }).code === 11000;

interface ThrottleState {
  phone?: string;
  sendCount: number;
  lastSentAt?: Date;
  expiresAt?: Date;
}

/**
 * Minutes until the throttle record TTLs out, which is when the send budget
 * resets. Rounded up, never below 1.
 */
const minutesUntilReset = (expiresAt?: Date | null): number => {
  if (!expiresAt) return VERIFICATION_WINDOW_MINUTES;
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 60_000));
};

/** Seconds left on the per-send cooldown. Zero once another send is allowed. */
const secondsUntilNextSend = (lastSentAt?: Date | null): number => {
  if (!lastSentAt) return 0;
  const elapsed = (Date.now() - new Date(lastSentAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
};

/**
 * Builds the error for a refused send.
 *
 * Distinguishing "asked too soon" from "used every code" is the whole point:
 * the first clears itself in a minute, the second needs `retryAfterMinutes` so
 * the UI can say when to come back instead of re-arming a button that will only
 * fail again.
 */
const buildThrottleError = (doc: ThrottleState | null): AppError => {
  if (doc && doc.sendCount >= MAX_SENDS_PER_WINDOW) {
    const retryAfterMinutes = minutesUntilReset(doc.expiresAt);
    return new AppError(
      otpSendLimitMessage(retryAfterMinutes),
      429,
      PHONE_ERROR_CODES.OTP_SEND_LIMIT,
      { retryAfterMinutes },
    );
  }

  const retryAfterSeconds =
    secondsUntilNextSend(doc?.lastSentAt) || RESEND_COOLDOWN_SECONDS;
  return new AppError(
    otpThrottledMessage(retryAfterSeconds),
    429,
    PHONE_ERROR_CODES.OTP_THROTTLED,
    { retryAfterSeconds },
  );
};

/** Reads just the fields needed to explain a refused send. */
const loadThrottleState = async (
  userId: string,
): Promise<ThrottleState | null> =>
  (await PhoneVerificationModel.findOne({ user: userId })
    .select("phone sendCount lastSentAt expiresAt")
    .lean()) as ThrottleState | null;

/** Rejects a number that is already proven against a different account. */
const assertPhoneAvailable = async (
  userId: string,
  phone: string,
): Promise<void> => {
  // Accounts predating verification stored the number however the form sent
  // it, so match the +91 form too or a legacy owner goes undetected. Both
  // values are exact, so the sparse index on `phone` still serves the lookup.
  const owner = await UserModel.findOne({
    phone: { $in: [phone, `+91${phone}`] },
    _id: { $ne: userId },
  })
    .select("_id")
    .lean();
  if (owner) {
    throw new AppError(
      PHONE_MESSAGES.PHONE_IN_USE,
      409,
      PHONE_ERROR_CODES.PHONE_IN_USE,
    );
  }
};

export interface OtpStatus {
  /** True while the learner is inside the per-send cooldown. */
  active: boolean;
  remainingSeconds: number;
  /** The number the last code went to, so a reload can resume on it. */
  phone: string | null;
  /** Codes still available in this window. Zero means the budget is spent. */
  sendsLeft: number;
  /** Minutes until the budget resets. Only meaningful once sendsLeft is 0. */
  resetsInMinutes: number;
}

/**
 * Current throttle state for this learner, so a reload resumes the countdown
 * and keeps the "no codes left" notice up, instead of handing back a live
 * button that the next click would only bounce.
 */
export const getOtpStatus = async (userId: string): Promise<OtpStatus> => {
  const record = await loadThrottleState(userId);
  if (!record) {
    return {
      active: false,
      remainingSeconds: 0,
      phone: null,
      sendsLeft: MAX_SENDS_PER_WINDOW,
      resetsInMinutes: 0,
    };
  }

  const remainingSeconds = secondsUntilNextSend(record.lastSentAt);
  return {
    active: remainingSeconds > 0,
    remainingSeconds,
    phone: record.phone ?? null,
    sendsLeft: Math.max(0, MAX_SENDS_PER_WINDOW - record.sendCount),
    resetsInMinutes: minutesUntilReset(record.expiresAt),
  };
};

export interface SendClaim {
  phone: string;
  /** Seconds before the next send is allowed, for the resend countdown. */
  cooldownSeconds: number;
  sendsLeft: number;
}

/**
 * Claims one send against the learner's budget, before the widget is allowed to
 * dispatch anything.
 *
 * Claiming first rather than recording afterwards is deliberate: a client that
 * simply skips the "I sent one" call cannot then bypass the budget. The cost is
 * that a send MSG91 drops still spends the slot, so the learner waits out the
 * cooldown. That trade favours the budget, which is the part protecting the
 * account and the SMS bill.
 */
export const claimOtpSend = async (
  userId: string,
  rawPhone: unknown,
): Promise<SendClaim> => {
  const phone = requireValidPhone(rawPhone);
  await assertPhoneAvailable(userId, phone);

  const now = new Date();
  const cooldownCutoff = new Date(
    now.getTime() - RESEND_COOLDOWN_SECONDS * 1000,
  );

  let record;
  try {
    // The guards live in the filter so the check and the write are one atomic
    // step. When a doc exists but fails them, the upsert falls through to an
    // insert and the unique index on `user` rejects it, which is the throttle
    // signal.
    record = await PhoneVerificationModel.findOneAndUpdate(
      {
        user: userId,
        lastSentAt: { $lte: cooldownCutoff },
        sendCount: { $lt: MAX_SENDS_PER_WINDOW },
      },
      {
        $set: {
          phone,
          lastSentAt: now,
          expiresAt: minutesFromNow(VERIFICATION_WINDOW_MINUTES),
        },
        $inc: { sendCount: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    // The insert lost to an existing record, so the guards in the filter are
    // what rejected this attempt. Report which one.
    throw buildThrottleError(await loadThrottleState(userId));
  }

  return {
    phone,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    sendsLeft: Math.max(0, MAX_SENDS_PER_WINDOW - record.sendCount),
  };
};

interface TokenCheck {
  ok: boolean;
  /** The number MSG91 says the token was issued for, when it tells us. */
  verifiedPhone: string | null;
  error?: string;
}

/**
 * Asks MSG91 whether the widget token is genuine.
 *
 * MSG91 answers 200 with `type: "error"` for a bad authkey or an already-spent
 * token, so the body has to be inspected rather than the status code.
 */
const checkAccessToken = async (
  accessToken: string,
  authKey: string,
): Promise<TokenCheck> => {
  try {
    const response = await axios.post(
      MSG91_VERIFY_URL,
      { authkey: authKey, "access-token": accessToken },
      { headers: { "Content-Type": "application/json" }, timeout: 10_000 },
    );

    const succeeded =
      response.data?.type === "success" || response.data?.success === true;

    if (!succeeded) {
      return {
        ok: false,
        verifiedPhone: null,
        error:
          response.data?.message ||
          response.data?.error ||
          PHONE_MESSAGES.OTP_TOKEN_INVALID,
      };
    }

    // On success MSG91 puts the verified number in `message`, but not on every
    // widget configuration, so treat it as a bonus check rather than a promise.
    const echoed = normalizePhone(response.data?.message);
    return {
      ok: true,
      verifiedPhone: isValidPhone(echoed) ? echoed : null,
    };
  } catch (error: any) {
    return {
      ok: false,
      verifiedPhone: null,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        PHONE_MESSAGES.OTP_TOKEN_INVALID,
    };
  }
};

/**
 * Local escape hatch for developing without live MSG91 credentials. Guarded on
 * NODE_ENV as well as the flag so a stray env var cannot disable verification
 * in production.
 */
const skipTokenCheck = (): boolean =>
  process.env.NODE_ENV !== "production" &&
  process.env.MSG91_SKIP_TOKEN_VERIFICATION === "true";

export interface VerifiedPhone {
  phone: string;
  phoneVerifiedAt: Date;
}

/**
 * Proves the number and writes it to the account. This is the only path that
 * sets `phone` for a learner, so a number on a profile is a number its owner
 * demonstrated control of.
 */
/**
 * Proves a widget token really belongs to `phone`, with no account involved.
 *
 * Extracted so the public scholarship flow can prove a number for someone who
 * has no account at all. Everything account-shaped (the send claim, the
 * uniqueness check, the profile write) stays with the caller, because those
 * only make sense when there is a user.
 */
export const assertPhoneTokenValid = async (
  phone: string,
  msg91Token: unknown,
): Promise<void> => {
  if (skipTokenCheck()) return;

  const authKey = process.env.MSG91_AUTHKEY?.trim();
  if (!authKey) {
    throw new AppError(
      PHONE_MESSAGES.OTP_PROVIDER_UNCONFIGURED,
      503,
      PHONE_ERROR_CODES.OTP_PROVIDER_UNCONFIGURED,
    );
  }

  const token = String(msg91Token ?? "").trim();
  if (!token) {
    throw new AppError(
      PHONE_MESSAGES.TOKEN_REQUIRED,
      400,
      PHONE_ERROR_CODES.OTP_TOKEN_INVALID,
    );
  }

  const check = await checkAccessToken(token, authKey);
  if (!check.ok) {
    throw new AppError(
      check.error || PHONE_MESSAGES.OTP_TOKEN_INVALID,
      400,
      PHONE_ERROR_CODES.OTP_TOKEN_INVALID,
    );
  }
  // MSG91 does not echo the number on every widget config, so a mismatch is
  // fatal but a missing echo is not.
  if (check.verifiedPhone && check.verifiedPhone !== phone) {
    throw new AppError(
      PHONE_MESSAGES.PHONE_MISMATCH,
      400,
      PHONE_ERROR_CODES.PHONE_MISMATCH,
    );
  }
};

export const verifyPhoneForUser = async (
  userId: string,
  rawPhone: unknown,
  msg91Token: unknown,
): Promise<VerifiedPhone> => {
  const phone = requireValidPhone(rawPhone);

  // The number must be one this server issued a send for. Without this, a token
  // obtained for any number could be presented alongside any other number.
  const claim = await loadThrottleState(userId);
  if (!claim || claim.phone !== phone) {
    throw new AppError(
      PHONE_MESSAGES.PHONE_MISMATCH,
      400,
      PHONE_ERROR_CODES.PHONE_MISMATCH,
    );
  }

  await assertPhoneAvailable(userId, phone);

  if (!skipTokenCheck()) {
    const authKey = process.env.MSG91_AUTHKEY?.trim();
    if (!authKey) {
      throw new AppError(
        PHONE_MESSAGES.OTP_PROVIDER_UNCONFIGURED,
        503,
        PHONE_ERROR_CODES.OTP_PROVIDER_UNCONFIGURED,
      );
    }

    const token = String(msg91Token ?? "").trim();
    if (!token) {
      throw new AppError(
        PHONE_MESSAGES.TOKEN_REQUIRED,
        400,
        PHONE_ERROR_CODES.OTP_TOKEN_INVALID,
      );
    }

    const check = await checkAccessToken(token, authKey);
    if (!check.ok) {
      throw new AppError(
        check.error || PHONE_MESSAGES.OTP_TOKEN_INVALID,
        400,
        PHONE_ERROR_CODES.OTP_TOKEN_INVALID,
      );
    }
    if (check.verifiedPhone && check.verifiedPhone !== phone) {
      throw new AppError(
        PHONE_MESSAGES.PHONE_MISMATCH,
        400,
        PHONE_ERROR_CODES.PHONE_MISMATCH,
      );
    }
  }

  const phoneVerifiedAt = new Date();
  const updated = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { phone, phoneVerifiedAt, updatedAt: phoneVerifiedAt } },
    { new: true, runValidators: true },
  )
    .select("_id")
    .lean();

  if (!updated) {
    throw new AppError("User not found", 404);
  }

  // The number is settled, so the send budget has nothing left to guard.
  await PhoneVerificationModel.deleteOne({ user: userId });

  return { phone, phoneVerifiedAt };
};
