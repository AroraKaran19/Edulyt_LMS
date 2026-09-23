import { defineMailTemplate } from "../utils/mailTemplates";

/** Variables for `airkrit_ca-application-received.html`. Subject: `We got your Campus Ambassador application`. */
export type CaApplicationReceivedVariables = {
  name: string;
  joiningDate: string;
  durationMonths: number;
  whatsappLink: string;
  year: number;
};

/**
 * Variables for `airkrit_ca-application-approved.html`, sent with the offer
 * letter attached. Subject: `You're in: your Airkrit offer letter`.
 */
export type CaApplicationApprovedVariables = {
  name: string;
  kindLabel: string;
  joiningDate: string;
  durationMonths: number;
  /** HTML. Differs for someone who already has an account and someone who does not. */
  accountLine: string;
  actionUrl: string;
  actionLabel: string;
  whatsappLink: string;
  year: number;
};

/** Variables for `airkrit_ca-completion.html`, with three attachments. Subject: `Your Campus Ambassador documents are here`. */
export type CaCompletionVariables = {
  name: string;
  designation: string;
  endDate: string;
  year: number;
};

export const caApplicationReceivedMail = defineMailTemplate<CaApplicationReceivedVariables>(
  "airkrit_ca_application_received",
  "ca-application-received",
  { brand: "airkrit" },
);

export const caApplicationApprovedMail = defineMailTemplate<CaApplicationApprovedVariables>(
  "airkrit_ca_application_approved",
  "ca-application-approved",
  { brand: "airkrit" },
);

export const caCompletionMail = defineMailTemplate<CaCompletionVariables>(
  "airkrit_ca_completion",
  "ca-completion",
  { brand: "airkrit" },
);
