/**
 * Copy for the internship closure emails.
 *
 * The certificate is decided on Success Points alone: every enrolled learner is
 * judged the same way once their programme window closes, and a certification
 * exam only contributes bonus points toward the total. So a learner who fails
 * that exam is never told the exam cost them the certificate, because it did
 * not. Their points total fell short, which is what the copy says.
 *
 * MSG91 substitutes variables and evaluates nothing, so the sentences that
 * differ per outcome are built here rather than branched inside the HTML.
 */
import { escapeHtml } from "./htmlEscape";
import { linkedInShareUrl, postLines } from "./linkedInShare";

/** Support line shown on the withheld email. */
export const CONTACT_PHONE = "+91-8929252575";

/**
 * How an internship closed, from the learner's point of view.
 *
 * `passed` covers both a generated certificate and one still pending, because
 * the reason they earned it is the same either way. Which template goes out is
 * decided by whether a certificate document exists, not here.
 */
export type InternshipClosureOutcome =
  | { kind: "passed" }
  | { kind: "points_short"; earned: number; requiredPoints: number };

/** Matches the emphasis the templates use for a programme name. */
const strong = (value: string): string =>
  `<strong style="color:#2B1508;">${escapeHtml(value)}</strong>`;

/** Points are compared as percentages upstream and can arrive fractional. */
const points = (value: number): string => String(Math.round(value));

/**
 * The outcome sentence, as HTML.
 *
 * Formal register: this is the platform recording an outcome, not commiserating.
 * The shortfall wording names both numbers, because a learner denied a
 * certificate deserves to see the arithmetic rather than a vague "fell short".
 */
export const buildReasonLine = (
  outcome: InternshipClosureOutcome,
  internshipName: string,
): string => {
  const name = strong(internshipName);

  switch (outcome.kind) {
    case "passed":
      return `You have completed ${name} and met the Success Points requirement for certification.`;

    case "points_short":
      return (
        `Your ${name} internship has now closed. Certification requires ` +
        `${points(outcome.requiredPoints)} Success Points; your final total was ` +
        `${points(outcome.earned)}, so the certificate has not been issued.`
      );
  }
};

// Names the LOR only when one was actually generated, so the email stays honest.
export const buildAttachmentNote = (
  internshipName: string,
  hasLor: boolean,
): string => {
  const name = strong(internshipName);
  return hasLor
    ? `PDF copies of your ${name} certificate and Letter of Recommendation are included with this email.`
    : `A PDF copy of your ${name} certificate is included with this email.`;
};

/**
 * Body of the "Talk to our team" card on the withheld email.
 *
 * The only thing the certification exam still changes. Offering a retake to
 * someone whose cohort never ran an exam sends them into a support call about
 * something that does not exist.
 */
export const buildHelpText = (hadCertificationExam: boolean): string =>
  hadCertificationExam
    ? "Our team can discuss your options with you, including whether your batch permits a retake."
    : "Our team can discuss the options available to you from here.";

/**
 * Post text seeded into LinkedIn's composer.
 *
 * Written in the learner's voice, not the platform's: a post that reads like the
 * company wrote it gets deleted rather than published. They can edit it before
 * posting, which is the point.
 *
 * LinkedIn truncates at roughly 140 characters behind a "see more", so the first
 * line has to carry the message on its own.
 */
export const buildLinkedInPostText = (
  internshipName: string,
  verificationUrl: string,
): string =>
  postLines([
    `Completed the ${internshipName} internship at Airkrit India, and I'm now certified.`,
    "",
    "It was project-based from week one, which is where most of the learning actually happened.",
    "",
    verificationUrl,
    "",
    "#AirkritIndia #Internship",
  ]);

/**
 * Share link for the certificate.
 *
 * Points at the verification page rather than the certificate PDF. LinkedIn
 * cannot unfurl a PDF into a preview card, a raw file link is a poor thing to
 * click from a feed, and the verification page is what actually proves the
 * certificate is genuine.
 */
export const buildLinkedInShareUrl = (
  internshipName: string,
  verificationUrl: string,
): string =>
  linkedInShareUrl(buildLinkedInPostText(internshipName, verificationUrl));
