import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * The two internship closure emails.
 *
 * Both are transactional: a learner cannot switch off being told whether they
 * earned their certificate, so neither uses `defineOptOutMailTemplate`.
 *
 * See `lib/internshipClosureMail.ts` for how `reasonLine` and `helpText` are
 * derived from the five closure outcomes.
 */

/** Variables for `airkrit_certification-exam-passed.html`. */
export type InternshipCertificateIssuedVariables = {
  name: string;
  /** Outcome sentence, HTML. Built by `buildReasonLine`. */
  reasonLine: string;
  internshipName: string;
  /** Public S3 URL of the certificate PDF, behind the download button. */
  certificateUrl: string;
  /** LinkedIn share composer link. Built by `buildLinkedInShareUrl`. */
  linkedInUrl: string;
  year: number;
};

/**
 * Variables for `airkrit_internship-certificate-pending.html`.
 *
 * No `certificateUrl` and no `linkedInUrl`: this template is sent precisely when
 * the certificate file does not exist, and there is nothing to verify yet.
 */
export type InternshipCertificatePendingVariables = {
  name: string;
  reasonLine: string;
  internshipName: string;
  year: number;
};

/** Variables for `airkrit_certification-exam-failed.html`. */
export type InternshipCertificateWithheldVariables = {
  name: string;
  /** Outcome sentence, HTML. Built by `buildReasonLine`. */
  reasonLine: string;
  /** Body of the "Talk to our team" card. Built by `buildHelpText`. */
  helpText: string;
  /**
   * Support number, used for both the `tel:` href and the button label.
   * Hyphens are visual separators under RFC 3966, so one value serves both.
   */
  contactPhone: string;
  year: number;
};

/**
 * Certificate issued. Always sent with the PDF attached: the template says so
 * in the body card and again in the preheader, so a send without `attachments`
 * makes the email lie.
 */
export const internshipCertificateIssuedMail =
  defineMailTemplate<InternshipCertificateIssuedVariables>(
    "airkrit_internship_passed",
    "internship-certificate-issued",
    // Internships are Edulyt's, whichever site the learner came from. Sends as
    // Airkrit until cutover (`productMailBrand`).
    // TODO(brand-assets): artwork still has the Airkrit logo; swap before cutover.
    { brand: "edulyt" },
  );

/**
 * Earned, but the certificate could not be generated.
 *
 * Sent when the certificate job exhausts its retries, alongside an ops alert.
 * Tracked by its own marker on the enrollment rather than the terminal one, so
 * that once the job is repaired the learner still receives the real certificate.
 */
export const internshipCertificatePendingMail =
  defineMailTemplate<InternshipCertificatePendingVariables>(
    "airkrit_internship_passed_cert_pending",
    "internship-certificate-pending",
    // Internships are Edulyt's, whichever site the learner came from. Sends as
    // Airkrit until cutover (`productMailBrand`).
    // TODO(brand-assets): artwork still has the Airkrit logo; swap before cutover.
    { brand: "edulyt" },
  );

/**
 * No certificate: the learner's Success Points fell short of the threshold.
 *
 * Note this is never about failing the certification exam. Issuance is decided on
 * points alone and the exam only contributes bonus points, so a learner who
 * failed it simply finished under the mark.
 */
export const internshipCertificateWithheldMail =
  defineMailTemplate<InternshipCertificateWithheldVariables>(
    "airkrit_internship_failed",
    "internship-certificate-withheld",
    // Internships are Edulyt's, whichever site the learner came from. Sends as
    // Airkrit until cutover (`productMailBrand`).
    // TODO(brand-assets): artwork still has the Airkrit logo; swap before cutover.
    { brand: "edulyt" },
  );
