/** A campaign runs from creation until it is paused or deleted. */
export type CampaignStatus = "live" | "paused";

export interface ScholarshipTestListRow {
  _id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  attemptsAllowed: number;
  /**
   * Inclusive bounds of the reward. Each finisher's actual percentage is rolled
   * at submit and lives on their own coupon, not here.
   */
  minDiscountPercent: number;
  maxDiscountPercent: number;
  couponValidForDays: number;
  /** Optional hero image. `s3Key` is needed to replace or clear it. */
  image?: { url: string; s3Key?: string } | null;
  isActive: boolean;
  createdBy: string;
  /** Frozen at creation, so a deleted author is still named. */
  createdByName?: string;
  createdAt: string;
  questions: string[];
}

export interface ScholarshipTestDetail extends ScholarshipTestListRow {
  description: string;
  attemptCount: number;
  /** Entitlements issued for this campaign, and how many were spent. */
  winnerCount: number;
  redeemedCount: number;
}

export interface DeletionPreview {
  blocked: boolean;
  blockedReason: string | null;
  pendingCheckouts: number;
  unclaimedEntitlements: number;
  redemptions: number;
  attempts: number;
}

export const campaignStatusOf = (
  campaign: Pick<ScholarshipTestListRow, "isActive">,
): CampaignStatus => (campaign.isActive ? "live" : "paused");

/* ── Public campaign flow ─────────────────────────────────────────────────── */

export type PublicCampaignState = "live" | "paused";

export interface PublicCampaign {
  title: string;
  slug: string;
  description: string;
  /**
   * No discount of any kind, not even the range. The size of the reward is
   * revealed only by the result endpoint, after the test is finished, so it is
   * never in devtools beforehand.
   */
  durationMinutes: number;
  attemptsAllowed: number;
  questionCount: number;
  couponValidForDays: number;
  /**
   * Empty when the campaign has no image. Present switches the hero to the
   * smaller headline and renders the image above it.
   */
  imageUrl: string;
  state: PublicCampaignState;
}

export interface PublicQuestion {
  questionId: string;
  questionText: string;
  options: { optionId: string; text: string }[];
}

export interface AttemptView {
  attemptId: string;
  attemptNumber: number;
  attemptsAllowed: number;
  expiresAt: string;
  questions: PublicQuestion[];
  answers: { questionId: string; selectedOptionIds: string[] }[];
}

export interface ScholarshipResult {
  correctCount: number;
  totalQuestions: number;
  couponCode: string;
  couponExpiresAt: string;
  discountPercent: number;
  expired: boolean;
}
