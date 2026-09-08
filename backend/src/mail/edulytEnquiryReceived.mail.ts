import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * Variables for `edulyt-enquiry-received.html`.
 *
 * All plain text: the template carries no conditional block, so nothing has to
 * arrive pre-rendered as HTML the way the internship templates do.
 *
 * The enquiry's own answers are deliberately absent. This is a bare
 * acknowledgement, so it cannot contradict itself if a detail was mistyped.
 */
export type EdulytEnquiryReceivedVariables = {
  /** First name alone reads better here than the lead's stored full name. */
  name: string;
  /** A variable, not baked in: changing a link in the template means another
   *  upload and another wait on MSG91 approval. */
  ctaUrl: string;
  ctaLabel: string;
  year: number;
};

/**
 * Sent to the enquirer when their details reach us from the Edulyt marketing
 * site, in Edulyt's branding.
 *
 * Transactional: it is the receipt for an action the visitor just took, so it
 * uses `defineMailTemplate` and consults no preference.
 *
 * Nothing calls this yet. `POST /leads` is guarded by
 * `requireVerifiedLeadContact`, so a lead cannot be captured from the marketing
 * site until the phone OTP step is wired end to end; the send belongs in
 * `createLead` alongside that work.
 *
 * Subject in the dashboard: `We have your enquiry, {{name}}`.
 */
const EDULYT_ENQUIRY_RECEIVED_TEMPLATE_ID = "edulyt_enquiry_received";

export const edulytEnquiryReceivedMail =
  defineMailTemplate<EdulytEnquiryReceivedVariables>(
    EDULYT_ENQUIRY_RECEIVED_TEMPLATE_ID,
    "edulyt-enquiry-received",
    "edulyt",
  );
