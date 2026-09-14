import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * "Your cohort has changed."
 *
 * Sent whenever an admin moves a learner to a different batch. Unlike most of the
 * set this has no send-once marker: a learner can be moved more than once, and
 * each move is news. `adminChangeEnrollmentBatch` returns early when the target
 * batch is the one they are already in, so a no-op cannot produce an email.
 *
 * Transactional. A learner cannot opt out of being told their start date moved.
 */
export type InternshipBatchChangedVariables = {
  name: string;
  internshipName: string;
  /** Cohort they were in, captured before the snapshot is overwritten. */
  oldBatch: string;
  newBatch: string;
  /** Preformatted IST date. The cohort start is an IST instant. */
  newBatchStartDate: string;
  ctaUrl: string;
  year: number;
};

/** Subject in the dashboard: `Your {{internshipName}} cohort has changed!`. */
export const internshipBatchChangedMail =
  defineMailTemplate<InternshipBatchChangedVariables>(
    "airkrit_internship_cohort_update",
    "internship-batch-changed",
    // Internships are Edulyt's, whichever site the learner came from. Sends as
    // Airkrit until cutover (`productMailBrand`).
    // TODO(brand-assets): artwork still has the Airkrit logo; swap before cutover.
    { brand: "edulyt" },
  );
