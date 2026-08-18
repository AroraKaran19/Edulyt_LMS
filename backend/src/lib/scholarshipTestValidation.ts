import crypto from "crypto";

/** No O, 0, I, 1, or L: support reads these codes aloud on the phone. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_BODY_LENGTH = 9;

export interface CampaignConfigInput {
  questionCount: number;
  discountPercent: number;
  durationMinutes: number;
  attemptsAllowed: number;
  couponValidForDays: number;
}

export const slugifyCampaignTitle = (title: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "scholarship";
};

export const generateScholarshipCouponCode = (): string => {
  const bytes = crypto.randomBytes(CODE_BODY_LENGTH);
  let body = "";
  for (let i = 0; i < CODE_BODY_LENGTH; i += 1) {
    body += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `SCH${body}`;
};

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

export const validateCampaignConfig = (
  input: CampaignConfigInput,
): string | null => {
  const {
    questionCount,
    discountPercent,
    durationMinutes,
    attemptsAllowed,
    couponValidForDays,
  } = input;

  if (questionCount < 1) {
    return "Pick at least one question for the campaign";
  }
  if (
    !Number.isFinite(discountPercent) ||
    discountPercent < 1 ||
    discountPercent > 100
  ) {
    return "The discount must be between 1 and 100 percent";
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
    return "The attempt clock must be at least 1 minute";
  }
  if (!Number.isInteger(attemptsAllowed) || attemptsAllowed < 1) {
    return "Allow at least 1 attempt";
  }
  if (!Number.isInteger(couponValidForDays) || couponValidForDays < 1) {
    return "The coupon must stay valid for at least 1 day";
  }
  return null;
};
