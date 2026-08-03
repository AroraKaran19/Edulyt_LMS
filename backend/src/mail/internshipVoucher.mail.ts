import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * "You have earned an internship voucher."
 *
 * Replaces the old `internship-via-course` email, which told a learner a specific
 * internship had been unlocked by their course. That was never how the benefit
 * works: a qualifying course purchase issues a single-use voucher
 * (`InternshipVoucher`), and the learner redeems it against whichever internship
 * they choose. So this template names no programme.
 *
 * Transactional, so no unsubscribe: it reports the outcome of one purchase the
 * learner made, once, and there is nothing recurring to opt out of. The voucher
 * costs them nothing and is already sitting on their account either way.
 */
export type InternshipVoucherAwardedVariables = {
  name: string;
  /** The course whose purchase earned the voucher. */
  courseName: string;
  /** Human-readable code, e.g. `INTV-A3X9F2`. */
  voucherCode: string;
  /**
   * Deep link that opens the claim modal for this voucher, `/vouchers?claim=CODE`.
   * The modal is the internship picker, so this is the whole redemption flow in
   * one click for a logged-in learner. Logged out, they land on it after signing
   * in, and an unknown or spent code just shows the voucher list.
   */
  ctaUrl: string;
  /** Public internship listing, for learners who want to look before claiming. */
  browseUrl: string;
  year: number;
};

/** Subject in the dashboard: `You've earned a free internship voucher`. */
export const internshipVoucherAwardedMail =
  defineMailTemplate<InternshipVoucherAwardedVariables>(
    "airkrit_internship_via_course_voucher",
    "internship-voucher-awarded",
  );
