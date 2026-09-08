import {
  ScholarshipTestDailyStatModel,
  ScholarshipTestModel,
} from "../models";
import { AppError } from "../middlewares/error.middleware";
import { todayIst } from "../utils/ist";
import {
  requestEmailOtp,
  startSessionForAccount as startContactSessionForAccount,
  startUnverifiedSession,
  verifyEmailOtp,
} from "./publicContactVerification.services";
import { EMAIL_OTP_ENABLED } from "../config/featureFlags";

/**
 * The scholarship campaign's slice of `publicContactVerification.services`.
 *
 * Everything generic, the code, the throttle, the session token, the MSG91
 * handshake, lives there and is shared with the enquiry form. What stays here is
 * the campaign: resolving a slug, deciding the session's lifetime from the
 * attempt clock, and the funnel counters.
 */

/** Extra life beyond the attempt clock, so a paused attempt still resumes. */
const SESSION_GRACE_MINUTES = 60;

const SCOPE_PREFIX = "scholarship:";

/** The scope every scholarship code and session is keyed to. */
const scopeOf = (testId: unknown): string => `${SCOPE_PREFIX}${String(testId)}`;

/**
 * The campaign a session belongs to, or null when the session belongs to some
 * other public form. Sessions share one collection now, so this prefix check is
 * what stops an enquiry-form token authenticating a scholarship route.
 */
export const testIdFromScope = (scope: unknown): string | null => {
  const value = String(scope ?? "");
  return value.startsWith(SCOPE_PREFIX)
    ? value.slice(SCOPE_PREFIX.length) || null
    : null;
};

export interface OpenCampaign {
  _id: unknown;
  title: string;
  slug: string;
  durationMinutes: number;
  attemptsAllowed: number;
  questions: unknown[];
  couponValidForDays: number;
  minDiscountPercent: number;
  maxDiscountPercent: number;
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

const sessionMinutesFor = (campaign: OpenCampaign): number =>
  (campaign.durationMinutes ?? 15) + SESSION_GRACE_MINUTES;

export interface ScholarshipSession {
  sessionToken: string;
  expiresAt: Date;
  phoneVerified: boolean;
}

/**
 * What the gate hands back for a typed address: a code was sent, or the session
 * itself when no code is being sent at all.
 */
export type ScholarshipGateResult =
  | { sent: true; expiryMinutes: number; cooldownSeconds: number }
  | ScholarshipSession;

export const requestScholarshipOtp = async (
  slug: string,
  rawEmail: string,
): Promise<ScholarshipGateResult> => {
  const campaign = await loadOpenCampaign(slug);

  /*
   * With verification off the gate opens on the typed address, so this returns
   * the session a verify would have issued and the candidate never sees a code
   * field. The counter is still bumped: it measures how many people entered the
   * gate, and zeroing that funnel stage would read as a traffic collapse rather
   * than as a flag being flipped.
   */
  if (!EMAIL_OTP_ENABLED) {
    const session = await startUnverifiedSession({
      scope: scopeOf(campaign._id),
      email: rawEmail,
      sessionMinutes: sessionMinutesFor(campaign),
    });
    await bumpDailyStat(campaign._id, "otpRequested");
    return session;
  }

  const result = await requestEmailOtp({
    scope: scopeOf(campaign._id),
    email: rawEmail,
    // The campaign title is already a noun phrase, and most contain the word
    // "scholarship", so building a sentence around it produces duplicates.
    purpose: campaign.title,
    label: "Scholarship",
  });

  await bumpDailyStat(campaign._id, "otpRequested");
  return result;
};

export const verifyScholarshipOtp = async (
  slug: string,
  rawEmail: string,
  otp: string,
): Promise<{
  sessionToken: string;
  expiresAt: Date;
  phoneVerified: boolean;
}> => {
  const campaign = await loadOpenCampaign(slug);
  return verifyEmailOtp({
    scope: scopeOf(campaign._id),
    email: rawEmail,
    otp,
    sessionMinutes: sessionMinutesFor(campaign),
  });
};

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
  const campaign = await loadOpenCampaign(slug);
  return startContactSessionForAccount({
    scope: scopeOf(campaign._id),
    accountEmail,
    userId,
    sessionMinutes: sessionMinutesFor(campaign),
    verifiedProfilePhone,
  });
};

export {
  claimPhoneSend as claimScholarshipPhoneSend,
  generateOtp as generateScholarshipOtp,
  hashSessionToken,
  PHONE_SENDS_PER_SESSION as SCHOLARSHIP_PHONE_SENDS_PER_SESSION,
  verifyPhone as verifyScholarshipPhone,
} from "./publicContactVerification.services";
