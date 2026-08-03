import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * Internal ops alert. Never sent to a learner, so there is no opt-out and no
 * preference check.
 *
 * Deliberately generic: one approved template the whole backend can page the
 * team through, rather than a new upload and a new approval wait every time
 * something else needs to raise a hand.
 */
export type InternalAlertVariables = {
  /**
   * Drives the subject prefix, `[{{severity}}] {{alertTitle}}`, so the inbox says
   * whether to act now before anyone opens anything. Environment deliberately
   * stays out of the subject: alerts are only configured on one deployment, so it
   * would never vary and would just spend the characters that matter.
   */
  severity: "CRITICAL" | "WARNING";
  /** One line, shown as the headline. Keep it scannable in an inbox list. */
  alertTitle: string;
  /**
   * Detail block, HTML. Already escaped with newlines converted to `<br />`
   * (see `lib/htmlEscape`), because error text is untrusted and multi-line.
   */
  alertBody: string;
  /** Which deployment raised this. Staging and production share one inbox. */
  environment: string;
  year: number;
};

/** Subject in the dashboard: `[{{severity}}] Backend alert: {{alertTitle}}`. */
export const internalAlertMail = defineMailTemplate<InternalAlertVariables>(
  "internal-email",
  "internal-alert",
);
