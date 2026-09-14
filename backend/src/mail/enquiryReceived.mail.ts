import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * Variables for `airkrit_enquiry-received.html` and `edulyt_enquiry-received.html`.
 *
 * All plain text: the template carries no conditional block, so nothing has to
 * arrive pre-rendered as HTML the way the internship templates do.
 *
 * The enquiry's own answers are deliberately absent. This is a bare
 * acknowledgement, so it cannot contradict itself if a detail was mistyped.
 */
export type EnquiryReceivedVariables = {
  /** First name alone reads better here than the lead's stored full name. */
  name: string;
  /** A variable, not baked in: changing a link in the template means another
   *  upload and another wait on MSG91 approval. */
  ctaUrl: string;
  ctaLabel: string;
  year: number;
};

/**
 * Sent to the enquirer when their details reach us, from whichever site they
 * enquired on.
 *
 * Transactional: it is the receipt for an action the visitor just took, so it
 * uses `defineMailTemplate` and consults no preference.
 *
 * Both brands run an enquiry form, so this follows the request's brand.
 * TODO(brand-assets): only Edulyt's artwork exists in MSG91, so lead.controller
 * sends this for Edulyt enquiries alone. Add Airkrit's id as `ids.airkrit` and
 * remove that check once it is approved.
 *
 * Subject in the dashboard: `We have your enquiry, {{name}}`.
 */
const ENQUIRY_RECEIVED_TEMPLATE_ID = "edulyt_enquiry_received";

export const enquiryReceivedMail =
  defineMailTemplate<EnquiryReceivedVariables>(
    ENQUIRY_RECEIVED_TEMPLATE_ID,
    "enquiry-received",
    { ids: { edulyt: ENQUIRY_RECEIVED_TEMPLATE_ID } },
  );
