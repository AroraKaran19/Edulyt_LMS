/**
 * Copy for the course certificate emails.
 *
 * Simpler than the internship closure: a course either completes or it does not,
 * so there is no verdict and no withheld email. The only thing that varies is
 * whether the course awarded Success Points, and `completionSuccessPoints` can be
 * missing or zero (see `successPoints.services`), in which case none were.
 *
 * That variation lives in the sentence rather than in a card the template would
 * have to hide, because MSG91 substitutes variables and evaluates nothing. The
 * alternative was a second upload whose only difference was one visible row.
 */
import { escapeHtml } from "./htmlEscape";
import { linkedInShareUrl, postLines } from "./linkedInShare";

/** Matches the emphasis the templates use for a course name. */
const strong = (value: string): string =>
  `<strong style="color:#2B1508;">${escapeHtml(value)}</strong>`;

/**
 * The outcome sentence, as HTML.
 *
 * Formal register, matching the internship certificate emails. Points are named
 * only when there are some: "you earned 0 Success Points" reads as a bug.
 */
export const buildCourseReasonLine = (
  courseName: string,
  successPoints = 0,
): string => {
  const name = strong(courseName);
  const points = Math.round(successPoints);

  return points > 0
    ? `You have completed ${name} and earned ${points} Success Points for finishing it.`
    : `You have completed ${name} and met the requirements for certification.`;
};

// Names the LOR only when one was actually generated, so the email stays honest.
export const buildCourseAttachmentNote = (
  courseName: string,
  hasLor: boolean,
): string => {
  const name = strong(courseName);
  return hasLor
    ? `PDF copies of your ${name} certificate and Letter of Recommendation are included with this email.`
    : `A PDF copy of your ${name} certificate is included with this email.`;
};

/**
 * Post text seeded into LinkedIn's composer.
 *
 * The learner's voice, not the platform's: a post that reads like the company
 * wrote it gets deleted rather than published.
 */
export const buildCoursePostText = (
  courseName: string,
  verificationUrl: string,
): string =>
  postLines([
    `Completed ${courseName} at Airkrit India, and my certificate is in.`,
    "",
    "Adding what I picked up straight into the work I'm doing next.",
    "",
    verificationUrl,
    "",
    "#AirkritIndia #Learning",
  ]);

/**
 * Share link for the certificate.
 *
 * Points at the verification page rather than the PDF: LinkedIn cannot unfurl a
 * PDF into a preview card, and the verification page is what proves the
 * certificate is genuine.
 */
export const buildCourseLinkedInShareUrl = (
  courseName: string,
  verificationUrl: string,
): string =>
  linkedInShareUrl(buildCoursePostText(courseName, verificationUrl));
