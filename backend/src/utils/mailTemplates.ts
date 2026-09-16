import {
  MailRecipient,
  MailSendResult,
  MailTemplateOptions,
  MailVariables,
  SendTemplateMailOptions,
  defineMailTemplate,
  queueTemplateMail,
  sendTemplateMail,
} from "./mailer";
import { DEFAULT_BRAND, type Brand } from "../constants/brands";
import { brandPageBaseUrl } from "../lib/brandSiteUrl";
import { EmailPreferenceCategory } from "../constants/emailPreferences";
import {
  buildUnsubscribeUrl,
  resolveRecipientPreferences,
} from "../services/emailPreferences.services";

/**
 * Shared configuration behind every MSG91 email template: how a template is
 * declared, and how opt-out preferences are applied to one.
 *
 * The templates themselves are not declared here. Each lives in its own module
 * under `src/mail/`, named after its HTML in `src/templates/emails/`, and is
 * re-exported from `src/mail/index.ts`.
 *
 * Adding a template:
 *  1. Upload the HTML from `src/templates/emails/` to the MSG91 dashboard and
 *     wait for approval (10-30 minutes).
 *  2. Add `src/mail/<name>.mail.ts` declaring it with its id and the variables
 *     the template references, and export it from `src/mail/index.ts`.
 *
 * Ids are hardcoded in those modules rather than read from env. They are
 * dashboard identifiers, not secrets, and keeping the id beside the variable
 * contract means the two get reviewed together. A wrong id fails loudly at send
 * time instead of silently resolving to nothing.
 *
 * The generic argument is the contract: callers get a compile error if they
 * miss a variable, and the names must match the template's placeholders exactly
 * (MSG91 substitutes by name, and an unmatched placeholder ships to the learner
 * as raw text).
 *
 * Example, in `src/mail/welcome.mail.ts`:
 *
 *   export const welcomeMail = defineMailTemplate<{
 *     name: string;
 *     loginUrl: string;
 *   }>("6890fa1cd6fc0561ab1f2c34", "welcome");
 *
 *   welcomeMail.send(
 *     { email: user.email, name: user.name },
 *     { name: user.name, loginUrl: `${process.env.AIRKRIT_FRONTEND_URL}/login` },
 *   );
 *
 * `send` is queued and returns immediately - never await it in a request path.
 * Use `sendNow` only when the caller must act on the delivery outcome.
 */

export { defineMailTemplate };

/** Variables every opt-out template gets on top of its own, injected per recipient. */
type WithUnsubscribe<V extends MailVariables> = V & { unsubscribeUrl: string };

export interface OptOutMailTemplate<V extends MailVariables> {
  templateId: string;
  label: string;
  category: EmailPreferenceCategory;
  send: (
    to: SendTemplateMailOptions["to"],
    variables: V,
    options?: Omit<SendTemplateMailOptions, "templateId" | "to" | "variables">,
  ) => void;
  sendNow: (
    to: SendTemplateMailOptions["to"],
    variables: V,
    options?: Omit<SendTemplateMailOptions, "templateId" | "to" | "variables">,
  ) => Promise<MailSendResult>;
}

/**
 * Drops opted-out recipients and gives each survivor their own signed
 * `unsubscribeUrl`.
 *
 * Both jobs belong here rather than at the call sites: a feature that sends
 * mail should not have to remember to check a preference, and forgetting once
 * means mailing someone who asked you not to.
 */
const applyPreferences = async <V extends MailVariables>(
  to: SendTemplateMailOptions["to"],
  variables: V,
  category: EmailPreferenceCategory,
  brand: Brand,
): Promise<Array<MailRecipient>> => {
  const entries = (Array.isArray(to) ? to : [to]).map((entry) =>
    typeof entry === "string" ? { email: entry } : entry,
  );

  const preferences = await resolveRecipientPreferences(
    entries.map((entry) => entry.email),
    category,
  );

  const recipients: MailRecipient[] = [];
  for (const entry of entries) {
    const preference = preferences.get(entry.email.trim().toLowerCase());
    if (preference && !preference.subscribed) continue;

    recipients.push({
      ...entry,
      variables: {
        ...variables,
        ...entry.variables,
        // No account behind the address means no preference to manage; the
        // link resolves to a page that says the link is not valid.
        unsubscribeUrl: preference
          ? buildUnsubscribeUrl(preference.userId, category, brand)
          : `${brandPageBaseUrl(brand)}/unsubscribe`,
      } as WithUnsubscribe<V>,
    });
  }

  return recipients;
};

/**
 * Declares a template a learner is allowed to switch off.
 *
 * Use this only for mail someone can live without. Anything the learner is
 * mid-task on - codes, resets, receipts, certificates - must stay on
 * `defineMailTemplate`, which never consults a preference.
 */
export const defineOptOutMailTemplate = <V extends MailVariables>(
  templateId: string,
  label: string,
  category: EmailPreferenceCategory,
  templateOptions: MailTemplateOptions = {},
): OptOutMailTemplate<V> => {
  const { brand: lockedBrand, ids } = templateOptions;
  const brandFor = (caller?: Brand): Brand =>
    lockedBrand ?? caller ?? DEFAULT_BRAND;
  const idFor = (brand: Brand): string => ids?.[brand] ?? templateId;

  const dispatch = async (
    to: SendTemplateMailOptions["to"],
    variables: V,
    options: Omit<SendTemplateMailOptions, "templateId" | "to" | "variables">
      | undefined,
    immediate: boolean,
  ): Promise<MailSendResult> => {
    const brand = brandFor(options?.brand);
    const recipients = await applyPreferences(to, variables, category, brand);

    if (!recipients.length) {
      return { ok: true, outcome: "skipped", reason: "all recipients opted out" };
    }

    const payload: SendTemplateMailOptions = {
      ...options,
      brand,
      templateId: idFor(brand),
      to: recipients,
    };

    if (immediate) return sendTemplateMail(payload);
    queueTemplateMail(payload, `${label} email`);
    return { ok: true, outcome: "sent", requestIds: [] };
  };

  return {
    templateId,
    label,
    category,

    send: (to, variables, options) => {
      // The preference lookup is async, so it runs before queueing rather than
      // inside the queue. Failures are logged, never thrown at the caller.
      void dispatch(to, variables, options, false).catch((error) => {
        console.error(
          `❌ Could not queue ${label} email:`,
          error instanceof Error ? error.message : error,
        );
      });
    },

    sendNow: (to, variables, options) => dispatch(to, variables, options, true),
  };
};

