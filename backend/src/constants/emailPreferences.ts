/**
 * Opt-out categories for non-essential email.
 *
 * Transactional mail is deliberately absent: verification codes, password
 * resets, receipts and certificates have no category, carry no unsubscribe
 * link, and are never gated on a preference. A learner who could switch off
 * their own OTP would be locked out of the platform with no way back in.
 */
export const EMAIL_PREFERENCE_CATEGORIES = {
  /** Someone replied to or acted on a review they posted. */
  REVIEWS: "reviews",
  /** Someone used their referral code. */
  REFERRALS: "referrals",
  /** Offers and programme suggestions. */
  PROMOTIONS: "promotions",
} as const;

export type EmailPreferenceCategory =
  (typeof EMAIL_PREFERENCE_CATEGORIES)[keyof typeof EMAIL_PREFERENCE_CATEGORIES];

export const ALL_EMAIL_PREFERENCE_CATEGORIES = Object.values(
  EMAIL_PREFERENCE_CATEGORIES,
) as EmailPreferenceCategory[];

export const isEmailPreferenceCategory = (
  value: unknown,
): value is EmailPreferenceCategory =>
  typeof value === "string" &&
  ALL_EMAIL_PREFERENCE_CATEGORIES.includes(value as EmailPreferenceCategory);

/** Shown on the unsubscribe page so the learner knows what they are switching off. */
export const EMAIL_PREFERENCE_LABELS: Record<EmailPreferenceCategory, string> = {
  reviews: "review notifications",
  referrals: "referral notifications",
  promotions: "offers and programme suggestions",
};

export const EMAIL_PREFERENCE_MESSAGES = {
  INVALID_LINK: "This unsubscribe link is not valid.",
  UNSUBSCRIBED: "You have been unsubscribed.",
  RESUBSCRIBED: "You are subscribed again.",
} as const;
