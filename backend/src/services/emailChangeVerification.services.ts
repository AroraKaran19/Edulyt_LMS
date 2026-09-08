import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PendingEmailChangeModel, UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { emailChangeVerificationMail, emailChangedMail } from "../mail";
import { formatIstDateTime } from "../utils/ist";
import {
  EMAIL_CHANGE_ERROR_CODES,
  EMAIL_CHANGE_MESSAGES,
  emailChangeTooSoonMessage,
  otpIncorrectMessage,
  otpSendLimitMessage,
  otpThrottledMessage,
} from "../constants/emailChangeMessages";
import {
  cooldownDaysRemaining,
  cooldownRetryPhrase,
} from "../constants/accountChangeCooldown";

/**
 * Changing the email on an account, gated on proving the new address.
 *
 * The `User` document is not touched until a code sent to the new address comes
 * back verified. That address is the account's recovery channel: once it moves,
 * password reset moves with it, so an unverified change is a one-way door.
 *
 * Deliberately the same shape as `signupVerification.services.ts`, which
 * already solved OTP issuing, throttling and abuse here. One mental model for
 * both flows beats two similar-but-different ones.
 */

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
/** Wrong codes allowed per issued OTP. A resend clears the counter. */
export const MAX_VERIFY_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
/** Codes emailed per change attempt: the initial one plus two resends. */
export const MAX_SENDS_PER_WINDOW = 3;
/**
 * How long the attempt survives before the TTL index reaps it, measured from
 * the last send. It doubles as the lockout: once the send cap is spent, this is
 * how long the learner waits before the change can be started over.
 */
export const CHANGE_WINDOW_MINUTES = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface StartedEmailChange {
  newEmail: string;
  expiryMinutes: number;
  cooldownSeconds: number;
  sendsLeft: number;
}

export interface CompletedEmailChange {
  email: string;
  changedAt: Date;
}

const normalizeEmail = (email: unknown): string =>
  String(email ?? "")
    .trim()
    .toLowerCase();

/**
 * Uniformly distributed 6-digit code. `crypto.randomInt` rather than
 * `Math.random`, which is predictable from prior outputs.
 */
const generateOtp = (): string =>
  String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

const minutesFromNow = (minutes: number): Date =>
  new Date(Date.now() + minutes * 60 * 1000);

/**
 * Deadline for the pending record.
 *
 * Never earlier than the code it holds: if the record were reaped first, the
 * learner would be told the change expired while holding a code the email says
 * is still valid. Taking the max keeps that true if either constant moves.
 */
const pendingExpiryDate = (): Date =>
  minutesFromNow(Math.max(CHANGE_WINDOW_MINUTES, OTP_EXPIRY_MINUTES));

/** Mongo's duplicate-key error, raised when an upsert races an existing doc. */
const isDuplicateKeyError = (error: unknown): boolean =>
  Boolean(error) && (error as { code?: number }).code === 11000;

/**
 * "karan@example.com" -> "k****@example.com".
 *
 * The notice goes to an address that may no longer belong to the learner, so it
 * says enough to recognise a change they made without handing a stranger the
 * full address of the account that now owns it.
 */
export const maskEmail = (email: string): string => {
  const at = email.lastIndexOf("@");
  if (at < 1) return "****";
  return `${email[0]}****${email.slice(at)}`;
};

interface ThrottleState {
  newEmail?: string;
  sendCount: number;
  lastSentAt?: Date;
  expiresAt?: Date;
}

/**
 * Minutes until the pending record TTLs out, which is when the send budget
 * resets. Rounded up, never below 1.
 */
const minutesUntilReset = (expiresAt?: Date | null): number => {
  if (!expiresAt) return CHANGE_WINDOW_MINUTES;
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
      EMAIL_CHANGE_ERROR_CODES.OTP_SEND_LIMIT,
      { retryAfterMinutes },
    );
  }

  const retryAfterSeconds =
    secondsUntilNextSend(doc?.lastSentAt) || RESEND_COOLDOWN_SECONDS;
  return new AppError(
    otpThrottledMessage(retryAfterSeconds),
    429,
    EMAIL_CHANGE_ERROR_CODES.OTP_THROTTLED,
    { retryAfterSeconds },
  );
};

/** Reads just the fields needed to explain a refused send. */
const loadThrottleState = async (
  userId: string,
): Promise<ThrottleState | null> =>
  (await PendingEmailChangeModel.findOne({ user: userId })
    .select("newEmail sendCount lastSentAt expiresAt")
    .lean()) as ThrottleState | null;

/** Rejects an address that already belongs to a different account. */
const assertEmailAvailable = async (
  userId: string,
  email: string,
): Promise<void> => {
  const owner = await UserModel.findOne({ email, _id: { $ne: userId } })
    .select("_id")
    .lean();
  if (owner) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.EMAIL_IN_USE,
      409,
      EMAIL_CHANGE_ERROR_CODES.EMAIL_IN_USE,
    );
  }
};

/**
 * Sends the code and reports failure to the caller.
 *
 * Deliberately awaited, unlike most of the platform's mail: here the email IS
 * the operation. A queued send that fails would leave the learner waiting on a
 * code that never arrives, with a success response on screen.
 */
const sendVerificationEmail = async (
  recipient: { email: string; name: string },
  otp: string,
): Promise<void> => {
  const digits = otp.split("");

  const result = await emailChangeVerificationMail.sendNow(
    { email: recipient.email, name: recipient.name },
    {
      name: recipient.name,
      newEmail: recipient.email,
      otp1: digits[0],
      otp2: digits[1],
      otp3: digits[2],
      otp4: digits[3],
      otp5: digits[4],
      otp6: digits[5],
      expiryMinutes: OTP_EXPIRY_MINUTES,
      year: new Date().getFullYear(),
    },
  );

  if (!result.ok) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.OTP_SEND_FAILED,
      502,
      EMAIL_CHANGE_ERROR_CODES.OTP_SEND_FAILED,
    );
  }

  // Mailer off or unconfigured: surface the code locally so the flow is
  // testable before MSG91 credentials exist. Never in production.
  if (result.outcome === "skipped" && process.env.NODE_ENV !== "production") {
    console.log(`🔑 [dev] Email change OTP for ${recipient.email}: ${otp}`);
  }
};

/**
 * Undoes the throttle bookkeeping when the email never went out, so an MSG91
 * outage doesn't cost the learner a slot and a minute.
 */
const sendOrRollback = async (
  userId: string,
  recipient: { email: string; name: string },
  otp: string,
): Promise<void> => {
  try {
    await sendVerificationEmail(recipient, otp);
  } catch (error) {
    await PendingEmailChangeModel.findOneAndUpdate(
      { user: userId },
      { $set: { lastSentAt: new Date(0) }, $inc: { sendCount: -1 } },
    );
    throw error;
  }
};

/** The account fields every step of this flow needs. */
const loadUserForChange = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .select("+password email firstName lastName emailChangedAt")
    .lean();
  if (!user) {
    throw new AppError(EMAIL_CHANGE_MESSAGES.USER_NOT_FOUND, 404);
  }
  return user as {
    _id: unknown;
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    emailChangedAt?: Date;
  };
};

const displayName = (user: { firstName?: string; lastName?: string }): string =>
  [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
  user.firstName ||
  "there";

type ChangeCandidate = Awaited<ReturnType<typeof loadUserForChange>>;

/**
 * Everything that has to be true before an address change may proceed, in the
 * order the learner should hear about it.
 *
 * Shared by both entry points rather than living in `requestEmailChange`: with
 * `EMAIL_OTP_ENABLED` off the change is applied by the request itself, and
 * these checks are then the only thing standing between a stolen session and
 * the account's password-reset channel.
 */
const assertChangeAllowed = async (
  userId: string,
  currentPassword: string,
  rawNewEmail: unknown,
): Promise<{ newEmail: string; user: ChangeCandidate }> => {
  const newEmail = normalizeEmail(rawNewEmail);
  if (!EMAIL_PATTERN.test(newEmail)) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.EMAIL_INVALID,
      400,
      EMAIL_CHANGE_ERROR_CODES.EMAIL_INVALID,
    );
  }

  const user = await loadUserForChange(userId);

  // Checked before the password, so a wrong password on a locked account still
  // reports the lock. Reporting "wrong password" to someone who could not have
  // changed it anyway sends them to reset a password that was fine.
  const cooldownDays = cooldownDaysRemaining(user.emailChangedAt);
  if (cooldownDays > 0) {
    throw new AppError(
      emailChangeTooSoonMessage(cooldownRetryPhrase(cooldownDays)),
      429,
      EMAIL_CHANGE_ERROR_CODES.CHANGE_TOO_SOON,
      { daysRemaining: cooldownDays },
    );
  }

  // Google-only accounts can reach this with nothing to compare against, and
  // `bcrypt.compare` throws on an undefined hash rather than returning false.
  if (!user.password) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.PASSWORD_NOT_SET,
      400,
      EMAIL_CHANGE_ERROR_CODES.PASSWORD_NOT_SET,
    );
  }

  const passwordMatches = await bcrypt.compare(
    String(currentPassword ?? ""),
    user.password,
  );
  if (!passwordMatches) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.PASSWORD_INCORRECT,
      400,
      EMAIL_CHANGE_ERROR_CODES.PASSWORD_INCORRECT,
    );
  }

  if (normalizeEmail(user.email) === newEmail) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.EMAIL_UNCHANGED,
      400,
      EMAIL_CHANGE_ERROR_CODES.EMAIL_UNCHANGED,
    );
  }

  await assertEmailAvailable(userId, newEmail);

  return { newEmail, user };
};

/**
 * Moves the account onto the new address and tells the old one.
 *
 * Two callers reach it: the verified path once a code has matched and its
 * pending record has been claimed, and the unverified path, which has no record
 * to claim in the first place.
 */
const applyEmailChange = async (
  userId: string,
  user: ChangeCandidate,
  newEmail: string,
): Promise<CompletedEmailChange> => {
  const oldEmail = user.email;
  const name = displayName(user);
  const changedAt = new Date();

  const updated = await UserModel.findByIdAndUpdate(
    userId,
    // `emailChangedAt` starts the cooldown. Stamped here rather than at request
    // time because an abandoned request should cost the learner nothing.
    {
      $set: { email: newEmail, emailChangedAt: changedAt, updatedAt: changedAt },
    },
    { new: true, runValidators: true },
  )
    .select("_id")
    .lean();

  if (!updated) {
    throw new AppError(EMAIL_CHANGE_MESSAGES.USER_NOT_FOUND, 404);
  }

  notifyOldAddress(oldEmail, name, newEmail, changedAt);

  return { email: newEmail, changedAt };
};

/**
 * Applies the change on the password check alone, for when no code is being
 * sent.
 *
 * The 7-day cooldown still applies, and still starts here, so this cannot be
 * used to walk an account from address to address in a single session.
 */
export const changeEmailWithoutOtp = async (
  userId: string,
  currentPassword: string,
  rawNewEmail: unknown,
): Promise<CompletedEmailChange> => {
  const { newEmail, user } = await assertChangeAllowed(
    userId,
    currentPassword,
    rawNewEmail,
  );
  return applyEmailChange(userId, user, newEmail);
};

/**
 * Records the requested change and emails the code to the NEW address.
 *
 * The account keeps its current email throughout. Re-requesting for a different
 * address updates the same record rather than opening a second one, and is
 * subject to the same cooldown and cap as a resend, so the budget cannot be
 * bypassed by simply retargeting.
 */
export const requestEmailChange = async (
  userId: string,
  currentPassword: string,
  rawNewEmail: unknown,
): Promise<StartedEmailChange> => {
  const { newEmail, user } = await assertChangeAllowed(
    userId,
    currentPassword,
    rawNewEmail,
  );

  const otp = generateOtp();
  const now = new Date();
  const cooldownCutoff = new Date(
    now.getTime() - RESEND_COOLDOWN_SECONDS * 1000,
  );

  let pending;
  try {
    // The guards live in the filter so the check and the write are one atomic
    // step. When a doc exists but fails them, the upsert falls through to an
    // insert and the unique index on `user` rejects it, which is the throttle
    // signal.
    pending = await PendingEmailChangeModel.findOneAndUpdate(
      {
        user: userId,
        lastSentAt: { $lte: cooldownCutoff },
        sendCount: { $lt: MAX_SENDS_PER_WINDOW },
      },
      {
        $set: {
          newEmail,
          otpHash: await bcrypt.hash(otp, 10),
          otpExpiresAt: minutesFromNow(OTP_EXPIRY_MINUTES),
          attempts: 0,
          lastSentAt: now,
          expiresAt: pendingExpiryDate(),
        },
        $inc: { sendCount: 1 },
        $setOnInsert: { user: userId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    // The insert lost to an existing record, so the guards in the filter are
    // what rejected this attempt. Report which one.
    throw buildThrottleError(await loadThrottleState(userId));
  }

  await sendOrRollback(userId, { email: newEmail, name: displayName(user) }, otp);

  return {
    newEmail,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    sendsLeft: Math.max(0, MAX_SENDS_PER_WINDOW - pending.sendCount),
  };
};

/** Issues a fresh code for the in-flight change, subject to cooldown and cap. */
export const resendEmailChangeOtp = async (
  userId: string,
): Promise<StartedEmailChange> => {
  // Loaded before the send is claimed, so a failure here cannot cost a slot.
  const user = await loadUserForChange(userId);

  const otp = generateOtp();
  const now = new Date();
  const cooldownCutoff = new Date(
    now.getTime() - RESEND_COOLDOWN_SECONDS * 1000,
  );

  const pending = await PendingEmailChangeModel.findOneAndUpdate(
    {
      user: userId,
      lastSentAt: { $lte: cooldownCutoff },
      sendCount: { $lt: MAX_SENDS_PER_WINDOW },
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
    // Separate "nothing in flight" from "asked too soon" for a useful message.
    const existing = await loadThrottleState(userId);
    if (!existing) {
      throw new AppError(
        EMAIL_CHANGE_MESSAGES.REQUEST_NOT_FOUND,
        400,
        EMAIL_CHANGE_ERROR_CODES.REQUEST_NOT_FOUND,
      );
    }
    throw buildThrottleError(existing);
  }

  await sendOrRollback(
    userId,
    { email: pending.newEmail, name: displayName(user) },
    otp,
  );

  return {
    newEmail: pending.newEmail,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    sendsLeft: Math.max(0, MAX_SENDS_PER_WINDOW - pending.sendCount),
  };
};

/**
 * Tells the previous address that it is no longer the one on the account.
 *
 * Queued rather than awaited, the opposite of the code: by the time this runs
 * the change has already correctly happened, and a mail failure is not
 * something to fail the request over.
 */
const notifyOldAddress = (
  oldEmail: string,
  name: string,
  newEmail: string,
  changedAt: Date,
): void => {
  emailChangedMail.send(
    { email: oldEmail, name },
    {
      name,
      maskedNewEmail: maskEmail(newEmail),
      changedAt: formatIstDateTime(changedAt),
      year: changedAt.getFullYear(),
    },
  );
};

/**
 * Checks the code and moves the account onto the new address.
 *
 * The pending record is deleted as an atomic claim before the write, so a
 * double-submitted form cannot apply the change (and mail the old address)
 * twice.
 */
export const verifyEmailChange = async (
  userId: string,
  otp: unknown,
): Promise<CompletedEmailChange> => {
  const pending = await PendingEmailChangeModel.findOne({ user: userId });
  if (!pending) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.REQUEST_NOT_FOUND,
      400,
      EMAIL_CHANGE_ERROR_CODES.REQUEST_NOT_FOUND,
    );
  }

  if (pending.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.OTP_EXPIRED,
      400,
      EMAIL_CHANGE_ERROR_CODES.OTP_EXPIRED,
    );
  }

  if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.OTP_ATTEMPTS_EXCEEDED,
      429,
      EMAIL_CHANGE_ERROR_CODES.OTP_ATTEMPTS_EXCEEDED,
    );
  }

  const matches = await bcrypt.compare(String(otp ?? "").trim(), pending.otpHash);
  if (!matches) {
    const updated = await PendingEmailChangeModel.findOneAndUpdate(
      { user: userId },
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
      EMAIL_CHANGE_ERROR_CODES.OTP_INVALID,
      { attemptsLeft },
    );
  }

  const newEmail = pending.newEmail;

  // Re-checked here, not just at request time: the window is minutes long and
  // another account can claim the address inside it. The unique index would
  // catch it anyway, as a 500 rather than something the learner can act on.
  await assertEmailAvailable(userId, newEmail);

  const user = await loadUserForChange(userId);

  // Atomic claim: whoever deletes the document owns the write below.
  const claimed = await PendingEmailChangeModel.findOneAndDelete({
    user: userId,
  });
  if (!claimed) {
    throw new AppError(
      EMAIL_CHANGE_MESSAGES.REQUEST_NOT_FOUND,
      400,
      EMAIL_CHANGE_ERROR_CODES.REQUEST_NOT_FOUND,
    );
  }

  return applyEmailChange(userId, user, newEmail);
};
