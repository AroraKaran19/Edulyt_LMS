import { EMAIL_PREFERENCE_CATEGORIES } from "../constants/emailPreferences";
import { defineOptOutMailTemplate } from "../utils/mailTemplates";

/**
 * Variables for `referral-used.html`.
 *
 * `unsubscribeUrl` is absent on purpose: `defineOptOutMailTemplate` injects a
 * signed one per recipient, so a send site cannot forget it or get it wrong.
 */
export type ReferralUsedVariables = {
  /** The referrer, who is the recipient. */
  name: string;
  /** Whoever bought using the code. */
  referredName: string;
  /** Commission, formatted with its currency symbol. */
  rewardValue: string;
  ctaUrl: string;
  year: number;
};

/**
 * Tells a referrer their code earned them a commission.
 *
 * The one opt-out template in this set. A referral notification is news a
 * learner can live without, `EMAIL_PREFERENCE_CATEGORIES.REFERRALS` exists for
 * exactly it, and the HTML already carries the unsubscribe link that promise
 * requires.
 *
 * Fires on a purchase, not a signup. Commission is only ever recorded against
 * a paid order (`recordReferralSaleForOrder`), so a signup with a code earns
 * the referrer nothing and must not claim otherwise.
 *
 * Subject in the dashboard: `You earned a referral reward!`.
 */
const REFERRAL_USED_TEMPLATE_ID = "airkrit_referral_notification";

export const referralUsedMail =
  defineOptOutMailTemplate<ReferralUsedVariables>(
    REFERRAL_USED_TEMPLATE_ID,
    "referral-used",
    EMAIL_PREFERENCE_CATEGORIES.REFERRALS,
  );
