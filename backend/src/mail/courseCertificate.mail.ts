import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * The two course certificate emails.
 *
 * Both transactional: a learner cannot switch off being sent the certificate they
 * earned, so neither uses `defineOptOutMailTemplate`.
 *
 * There is no withheld variant. Unlike an internship, a course has no verdict:
 * it either completes or it does not, and nothing is judged after the fact.
 *
 * See `lib/courseCertificateMail.ts` for how `reasonLine` folds the Success Points
 * in when there are any.
 */

/** Variables for `airkrit_course-certificate.html`. */
export type CourseCertificateIssuedVariables = {
  name: string;
  /** Outcome sentence, HTML. Built by `buildCourseReasonLine`. */
  reasonLine: string;
  courseName: string;
  /** Public S3 URL of the certificate PDF, behind the download button. */
  certificateUrl: string;
  /** LinkedIn share composer link. Built by `buildCourseLinkedInShareUrl`. */
  linkedInUrl: string;
  year: number;
};

/**
 * Variables for `airkrit_course-certificate-pending.html`.
 *
 * No `certificateUrl` and no `linkedInUrl`: this template is sent precisely when
 * the certificate file does not exist, and there is nothing to verify yet.
 */
export type CourseCertificatePendingVariables = {
  name: string;
  reasonLine: string;
  courseName: string;
  year: number;
};

/**
 * Certificate issued. Always sent with the PDF attached, because the body card
 * and the preheader both say it is.
 *
 * Subject in the dashboard: `Your {{courseName}} certificate is here`.
 *
 * Not the shared "result, and what's next" line the internship closures use. That
 * wording exists to keep pass or fail out of the inbox, and a course has no fail,
 * so it only costs clarity here.
 */
export const courseCertificateIssuedMail =
  defineMailTemplate<CourseCertificateIssuedVariables>(
    // TODO(brand-assets): no Edulyt copy in MSG91 yet; needed by cutover, when
    // Edulyt courses start sending as Edulyt. Add its id as `ids.edulyt`.
    "course_certificate",
    "course-certificate-issued",
  );

/**
 * Completed, but the certificate could not be generated.
 *
 * Sent when the certificate job exhausts its retries, alongside an ops alert.
 * Tracked by its own marker on the enrollment rather than the terminal one, so
 * that once the job is repaired the learner still receives the real certificate.
 *
 * Subject in the dashboard: `Your {{courseName}} certificate is on its way`.
 * Deliberately different from the issued subject: this email is followed by a
 * second one carrying the actual certificate, and two identical subjects would
 * read as a duplicate and thread together, so the real one gets missed.
 */
export const courseCertificatePendingMail =
  defineMailTemplate<CourseCertificatePendingVariables>(
    // TODO(brand-assets): no Edulyt copy in MSG91 yet; needed by cutover, when
    // Edulyt courses start sending as Edulyt. Add its id as `ids.edulyt`.
    "course-cert-pending",
    "course-certificate-pending",
  );
