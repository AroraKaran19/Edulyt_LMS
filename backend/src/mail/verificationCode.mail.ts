import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * Variables for `airkrit_verification-code.html`. The OTP is split per digit because
 * the template renders each digit in its own tile.
 *
 * Declared as a type alias rather than an interface: only aliases get an
 * implicit index signature, which `defineMailTemplate`'s constraint needs.
 */
export type VerificationCodeVariables = {
  /**
   * Names what the code unlocks, as a noun phrase completing "continue with:".
   * For example "the Diwali scholarship test". Keep it short: the template
   * gives it one highlighted line.
   */
  purpose: string;
  /**
   * The full code. Used by the dashboard subject line, which reads
   * "{{otp}} is your Airkrit verification code" - without it the subject renders
   * with the code missing. The body uses the per-digit variables.
   */
  otp: string;
  otp1: string;
  otp2: string;
  otp3: string;
  otp4: string;
  otp5: string;
  otp6: string;
  expiryMinutes: number;
  year: number;
};

/**
 * The general-purpose verification code.
 *
 * Signup and email-change keep their own templates because each says something
 * this one deliberately cannot: signup carries the welcome bonus, and email
 * change echoes the address being moved to plus account-security advice. Every
 * other flow that just needs to prove someone reads an inbox should use this
 * one rather than adding a template and waiting on another MSG91 approval.
 *
 * `defineMailTemplate`, not the opt-out variant: a security code is
 * transactional, and the recipient may have no account to hold a preference on.
 * For the same reason the copy carries no name and no account language.
 *
 * Dashboard subject: "{{otp}} is your Airkrit verification code".
 *
 * Code first so it shows in the notification preview, where a phone's one-time-code
 * autofill can read it without the mail being opened. `purpose` is deliberately
 * absent: it is caller-supplied and unbounded, so a long campaign title would
 * truncate the code out of view on mobile.
 */
const VERIFICATION_CODE_TEMPLATE_ID = "airkrit_verification_code";

export const verificationCodeMail =
  defineMailTemplate<VerificationCodeVariables>(
    VERIFICATION_CODE_TEMPLATE_ID,
    "verification-code",
    { ids: { edulyt: "edulyt_verification_code" } },
  );
