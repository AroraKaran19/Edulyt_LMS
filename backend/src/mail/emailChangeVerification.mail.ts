import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * Variables for `airkrit_email-change-verification.html`. The OTP is split per digit
 * because the template renders each digit in its own tile.
 *
 * Declared as a type alias rather than an interface: only aliases get an
 * implicit index signature, which `defineMailTemplate`'s constraint needs.
 */
export type EmailChangeVerificationVariables = {
  name: string;
  /** The address being moved to, echoed so the reader can spot a wrong one. */
  newEmail: string;
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
 * Code confirming ownership of the address an account is being moved to.
 *
 * Goes to the NEW address, never the current one: the whole point is proving
 * whoever asked can read mail there. `defineMailTemplate`, not the opt-out
 * variant, because nobody unsubscribes from a security code.
 *
 * Dashboard subject: "Hi {{name}}, confirm your new email".
 */
const EMAIL_CHANGE_VERIFICATION_TEMPLATE_ID = "new-email-verification";

export const emailChangeVerificationMail =
  defineMailTemplate<EmailChangeVerificationVariables>(
    EMAIL_CHANGE_VERIFICATION_TEMPLATE_ID,
    "email-change-verification",
    { ids: { edulyt: "edulyt_email_change_verification" } },
  );
