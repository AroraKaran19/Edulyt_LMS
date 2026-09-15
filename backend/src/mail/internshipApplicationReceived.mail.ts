import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * Variables for `edulyt_internship-application-received.html`.
 *
 * Four of these carry HTML rather than text. MSG91 substitutes values and
 * evaluates nothing, so a block that appears for one registration and not
 * another cannot be branched inside the template: it has to arrive already
 * decided. `lib/internshipApplicationMail.ts` builds them, and the two
 * `*Block` fields are empty strings when they do not apply.
 */
export type InternshipApplicationReceivedVariables = {
  name: string;
  internshipName: string;
  /** Cohort name from the enrollment's batch snapshot. */
  batchName: string;
  /** IST-formatted registration date. */
  registeredDate: string;
  /** Opening sentence, HTML. Differs per registration path. */
  introLine: string;
  /** "What happens next" sentence, HTML. Differs per registration path. */
  nextStepLine: string;
  /** Success Points card, HTML, or "" when nothing was credited. */
  pointsBlock: string;
  /** Paid-seat offer card, HTML, or "" when the offer does not apply. */
  seatOfferBlock: string;
  ctaUrl: string;
  ctaLabel: string;
  year: number;
};

/**
 * Sent once, when a learner registers for an internship, on all three paths
 * (entrance exam, direct paid seat, voucher).
 *
 * Transactional: this is the receipt for an action the learner just took, so it
 * uses `defineMailTemplate` and consults no preference. The paid-seat offer it
 * can carry is promotional, but it is a card inside a transactional email
 * rather than the reason for sending one.
 *
 * Payment confirmation is a separate email (`airkrit_purchase-confirmation.html`), so
 * nothing here needs to wait on or report a payment outcome.
 *
 * Subject in the dashboard: `You're registered for {{internshipName}}`.
 */
const INTERNSHIP_APPLICATION_RECEIVED_TEMPLATE_ID =
  "airkrit_internship_registration";

export const internshipApplicationReceivedMail =
  defineMailTemplate<InternshipApplicationReceivedVariables>(
    INTERNSHIP_APPLICATION_RECEIVED_TEMPLATE_ID,
    "internship-application-received",
    // Internships are Edulyt's, whichever site the learner came from.
    { brand: "edulyt" },
  );
