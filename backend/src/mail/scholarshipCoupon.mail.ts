import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * "You finished the scholarship test, here is your code."
 *
 * The only place the reward is ever named. The result page used to reveal the
 * percentage and the code, which made the code readable by anyone who typed a
 * participant's address into the gate; moving it here means the code travels to
 * the inbox that owns the address instead.
 *
 * Transactional, so no unsubscribe: it reports the outcome of one test the
 * candidate just sat, once.
 *
 * No `name` variable. The scholarship gate collects an address and nothing
 * else, so there is no name to greet them with, and the template does not ask
 * for one.
 */
export type ScholarshipCouponVariables = {
  /** The campaign they finished, e.g. `IIT Scholarship Test 2026`. */
  campaignTitle: string;
  /** Whole number, no `%` sign: the template supplies that. */
  discountPercent: number;
  couponCode: string;
  /**
   * Pre-formatted IST date, e.g. `12 October 2026`. Formatted by the caller
   * because MSG91 templates cannot format a date, and a raw ISO string in a
   * sentence reads as a bug.
   */
  validUntil: string;
  /**
   * A variable, not baked in: changing a link in the artwork means another
   * upload and another wait on MSG91 approval.
   */
  ctaUrl: string;
  ctaLabel: string;
  year: number;
};

/**
 * Subject in the dashboard: `You won {{discountPercent}}% off`.
 *
 * No brand argument, so it sends as `DEFAULT_BRAND` (airkrit). That is where
 * the code is redeemed, which is what the mail has to look like it belongs to.
 */
const SCHOLARSHIP_COUPON_TEMPLATE_ID = "airkrit_scholarship_coupon";

export const scholarshipCouponMail =
  defineMailTemplate<ScholarshipCouponVariables>(
    SCHOLARSHIP_COUPON_TEMPLATE_ID,
    "scholarship-coupon",
  );
