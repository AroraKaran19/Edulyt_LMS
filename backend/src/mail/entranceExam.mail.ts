import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * The two entrance exam outcome emails.
 *
 * Both are sent when an admin decides an application, so neither can be inferred
 * from a learner action. The passed one fires on selection, when the enrollment
 * reaches `pending_documentation`, not when it enters `in_merit_pool`: the learner
 * API deliberately masks pool membership as `exam_attempted`, and the email's CTA
 * asks for documents the learner cannot upload until they are selected.
 */

/** Variables for `edulyt_entrance-exam-passed.html`. */
export type EntranceExamPassedVariables = {
  name: string;
  internshipName: string;
  /** Dashboard link. The learner's next action is uploading Aadhar + photo. */
  ctaUrl: string;
  year: number;
};

/** Variables for `edulyt_entrance-exam-rejected.html`. */
export type EntranceExamRejectedVariables = {
  name: string;
  internshipName: string;
  /** Direct-seat purchase link, the paid path that bypasses the merit route. */
  confirmSeatUrl: string;
  year: number;
};

/**
 * Selected for the programme.
 *
 * Subject in the dashboard: `Your {{internshipName}} entrance exam result`.
 */
export const entranceExamPassedMail =
  defineMailTemplate<EntranceExamPassedVariables>(
    "airkrit_internship_entrance_passed",
    "entrance-exam-passed",
    // Internships are Edulyt's, whichever site the learner came from.
    { brand: "edulyt" },
  );

/**
 * Not selected for the programme, with the paid seat option.
 *
 * Subject in the dashboard: `{{internshipName}}: seats still open for this batch`.
 *
 * One email covers every rejection, including learners rejected after reaching
 * `in_merit_pool`. That is why the copy says "not selected" and never names the
 * merit list: an admin can reject from the shortlist as well as from
 * `exam_attempted`, and a learner who did reach it must not be told they failed to.
 *
 * Transactional, so no unsubscribe and no preference gate despite the seat offer in
 * the body. Its purpose is telling one learner the outcome of their own
 * application, once. It is not a campaign, and there is nothing recurring for them
 * to opt out of.
 */
export const entranceExamRejectedMail =
  defineMailTemplate<EntranceExamRejectedVariables>(
    "airkrit_internship_entrance_failed",
    "entrance-exam-rejected",
    // Internships are Edulyt's, whichever site the learner came from.
    { brand: "edulyt" },
  );
