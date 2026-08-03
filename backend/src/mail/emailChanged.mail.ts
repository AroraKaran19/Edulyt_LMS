import { defineMailTemplate } from "../utils/mailTemplates";

export type EmailChangedVariables = {
  name: string;
  /** Masked, e.g. "k****@example.com". Never the full new address. */
  maskedNewEmail: string;
  /** When the change took effect, already formatted in IST. */
  changedAt: string;
  year: number;
};

/**
 * After-the-fact notice that an account's email was changed, sent to the OLD
 * address.
 *
 * This is the only message in the flow that lands somewhere an attacker does
 * not control. The OTP proves the requester owns the destination address, which
 * stops typos but not an attacker, who is perfectly happy to own it. Once the
 * password has been defeated, nothing else in the flow ever reaches the real
 * owner, and the thing being taken is the account's recovery channel.
 *
 * Carries no code and nothing clickable but the support mailto, so the message
 * is not itself a phishing surface. The new address is masked for the same
 * reason: the old inbox may no longer be the learner's.
 *
 * Subject in the dashboard: `Your Airkrit account email was changed`. Past
 * tense on purpose: this one reports something already done rather than asking
 * for an action, and that is what makes a victim open it.
 */
const EMAIL_CHANGED_TEMPLATE_ID = "airkrit_email_change_notification";

export const emailChangedMail = defineMailTemplate<EmailChangedVariables>(
  EMAIL_CHANGED_TEMPLATE_ID,
  "email-changed-notice",
);
