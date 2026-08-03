import crypto from "crypto";
import mongoose from "mongoose";
import { UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import {
  ALL_EMAIL_PREFERENCE_CATEGORIES,
  EMAIL_PREFERENCE_MESSAGES,
  EmailPreferenceCategory,
  isEmailPreferenceCategory,
} from "../constants/emailPreferences";

/**
 * Unsubscribe links, signed rather than stored.
 *
 * The signature is an HMAC over the user id and category, so a link is valid
 * forever and identical every time. That is deliberate: an unsubscribe link in
 * a two-year-old email must still work, and there is no token table to grow.
 *
 * Namespaced with a purpose prefix so a signature minted here can never be
 * replayed against anything else that happens to sign with the same secret.
 */
const SIGNATURE_PURPOSE = "email-unsubscribe";

/** 128 bits of the digest. Far past brute force, and keeps the URL short. */
const SIGNATURE_LENGTH = 32;

const signingSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET is not set", 500);
  }
  return secret;
};

export const signUnsubscribeToken = (
  userId: string,
  category: EmailPreferenceCategory,
): string =>
  crypto
    .createHmac("sha256", signingSecret())
    .update(`${SIGNATURE_PURPOSE}:${userId}:${category}`)
    .digest("hex")
    .slice(0, SIGNATURE_LENGTH);

/** Constant-time compare so a wrong signature leaks nothing through timing. */
export const verifyUnsubscribeToken = (
  userId: string,
  category: EmailPreferenceCategory,
  token: string,
): boolean => {
  if (typeof token !== "string" || token.length !== SIGNATURE_LENGTH) {
    return false;
  }
  const expected = Buffer.from(signUnsubscribeToken(userId, category));
  const received = Buffer.from(token);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
};

/**
 * The link that goes in the email footer as `unsubscribeUrl`.
 *
 * Points at a frontend page, never straight at a mutating endpoint: inbox
 * scanners at Gmail and Apple prefetch links, and a GET that unsubscribes would
 * silently opt out people who never clicked.
 */
export const buildUnsubscribeUrl = (
  userId: string,
  category: EmailPreferenceCategory,
): string => {
  const base = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
  const params = new URLSearchParams({
    uid: String(userId),
    cat: category,
    sig: signUnsubscribeToken(String(userId), category),
  });
  return `${base}/unsubscribe?${params.toString()}`;
};

export interface EmailRecipientPreference {
  userId: string;
  email: string;
  subscribed: boolean;
}

/**
 * Looks up whether each address still wants this category.
 *
 * Addresses with no account are returned as subscribed: mail to a
 * non-learner (an admin alert, a partner contact) is not something a
 * preference row can govern, and dropping it silently would be worse.
 */
export const resolveRecipientPreferences = async (
  emails: string[],
  category: EmailPreferenceCategory,
): Promise<Map<string, EmailRecipientPreference>> => {
  const normalized = emails.map((e) => e.trim().toLowerCase());
  const byEmail = new Map<string, EmailRecipientPreference>();

  if (!normalized.length) return byEmail;

  const users = await UserModel.find({ email: { $in: normalized } })
    .select(`_id email emailPreferences.${category}`)
    .lean();

  for (const user of users as any[]) {
    byEmail.set(user.email, {
      userId: String(user._id),
      email: user.email,
      // Absent means subscribed, so pre-existing accounts need no backfill.
      subscribed: user.emailPreferences?.[category] !== false,
    });
  }

  return byEmail;
};

export type EmailPreferenceMap = Record<EmailPreferenceCategory, boolean>;

/**
 * Current opt-in state for every category.
 *
 * Missing fields read as subscribed, matching what the send path does, so the
 * settings page shows the same truth the mailer acts on.
 */
export const getEmailPreferences = async (
  userId: string,
): Promise<EmailPreferenceMap> => {
  const user = (await UserModel.findById(userId)
    .select("emailPreferences")
    .lean()) as { emailPreferences?: Record<string, boolean> } | null;

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return ALL_EMAIL_PREFERENCE_CATEGORIES.reduce((acc, category) => {
    acc[category] = user.emailPreferences?.[category] !== false;
    return acc;
  }, {} as EmailPreferenceMap);
};

/**
 * Settings-page write. No signature: the session already proves who they are,
 * and requiring a token here would mean minting one just to render a toggle.
 */
export const updateEmailPreferences = async (
  userId: string,
  changes: Partial<EmailPreferenceMap>,
): Promise<EmailPreferenceMap> => {
  const updates: Record<string, boolean> = {};
  for (const [category, subscribed] of Object.entries(changes)) {
    if (!isEmailPreferenceCategory(category)) continue;
    if (typeof subscribed !== "boolean") continue;
    updates[`emailPreferences.${category}`] = subscribed;
  }

  if (!Object.keys(updates).length) {
    throw new AppError("No valid email preferences supplied", 400);
  }

  const updated = (await UserModel.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true },
  )
    .select("emailPreferences")
    .lean()) as { emailPreferences?: Record<string, boolean> } | null;

  if (!updated) {
    throw new AppError("User not found", 404);
  }

  return ALL_EMAIL_PREFERENCE_CATEGORIES.reduce((acc, category) => {
    acc[category] = updated.emailPreferences?.[category] !== false;
    return acc;
  }, {} as EmailPreferenceMap);
};

/**
 * Flips one category for one user. Idempotent, so a double-clicked unsubscribe
 * button or a retried request is harmless.
 */
export const setEmailPreference = async (
  userId: string,
  category: EmailPreferenceCategory,
  token: string,
  subscribed: boolean,
): Promise<void> => {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !isEmailPreferenceCategory(category) ||
    !verifyUnsubscribeToken(userId, category, token)
  ) {
    throw new AppError(EMAIL_PREFERENCE_MESSAGES.INVALID_LINK, 400, "INVALID_LINK");
  }

  const updated = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { [`emailPreferences.${category}`]: subscribed } },
    { new: true },
  )
    .select("_id")
    .lean();

  if (!updated) {
    throw new AppError(EMAIL_PREFERENCE_MESSAGES.INVALID_LINK, 400, "INVALID_LINK");
  }
};
