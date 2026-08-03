import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * Variables for `signup-verification.html`. The OTP is split per digit because
 * the template renders each digit in its own tile.
 *
 * Declared as a type alias rather than an interface: only aliases get an
 * implicit index signature, which `defineMailTemplate`'s constraint needs.
 */
export type SignupVerificationVariables = {
  name: string;
  /**
   * The full code. Used by the dashboard subject line, which reads
   * "{{otp}} is your Airkrit verification code!" - without it the subject
   * renders with the code missing. The body uses the per-digit variables.
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
  /**
   * The welcome bonus card, or "". Built by `buildWelcomeBonusBlock`.
   *
   * This used to be a raw `successPoints` number alongside a second "with
   * points" template declaration. Both declarations pointed at the same dashboard
   * id, so the choice between them did nothing and a signup earning no bonus
   * still read "You earned 0 Success Points". One template, one id, and the card
   * simply disappears when there is no bonus.
   */
  welcomeBonusBlock: string;
};

/** Subject in the dashboard is unchanged; only the points card moved. */
export const signupVerificationMail =
  defineMailTemplate<SignupVerificationVariables>(
    "signup_verification_2",
    "signup-verification",
  );
