/**
 * The scope every enquiry-form code and session is keyed to.
 *
 * A fixed literal, unlike the scholarship scope which carries a campaign id:
 * there is one enquiry form, and a code issued for it is worthless anywhere
 * else.
 */
export const ENQUIRY_SCOPE = "enquiry";

/**
 * How long a verified enquiry session lives. Long enough to finish the form
 * after both codes, short enough that a token left in a shared browser is not a
 * standing permit to submit leads as that address.
 */
export const ENQUIRY_SESSION_MINUTES = 45;

/** Completes "continue with:" in the verification email template. */
export const ENQUIRY_OTP_PURPOSE = "your Airkrit plan details";
