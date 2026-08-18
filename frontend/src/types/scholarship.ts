/** A campaign runs from creation until it is paused or deleted. */
export type CampaignStatus = "live" | "paused";

export interface ScholarshipTestListRow {
  _id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  attemptsAllowed: number;
  discountPercent: number;
  couponValidForDays: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  questions: string[];
}

export interface ScholarshipTestDetail extends ScholarshipTestListRow {
  description: string;
  couponId: string;
  attemptCount: number;
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
   * No `discountPercent`. The size of the reward is revealed only by the result
   * endpoint, after the test is finished, so it is not in devtools beforehand.
   */
  durationMinutes: number;
  attemptsAllowed: number;
  questionCount: number;
  couponValidForDays: number;
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
