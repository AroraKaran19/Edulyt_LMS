import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * MSG91 transactional email.
 *
 * Sending is asynchronous by design: `send` / `queueTemplateMail` put the mail
 * on a bounded in-process queue and return synchronously, so no request ever
 * waits on MSG91 and a mail failure can never fail the operation that triggered
 * it. Failures are logged. Only reach for the awaited `sendNow` /
 * `sendTemplateMail` when the caller genuinely needs the outcome.
 *
 * Templates live in the MSG91 dashboard; the backend only ever sends a
 * template id plus its variables. Declare each template once in its own module
 * under `src/mail/` with `defineMailTemplate` so its variables are typed at
 * the call site:
 *
 *   // src/mail/welcome.mail.ts
 *   export const welcomeMail = defineMailTemplate<{
 *     name: string;
 *     loginUrl: string;
 *   }>("6890fa1cd6fc0561ab1f2c34", "welcome");
 *
 *   // anywhere - note: no await
 *   welcomeMail.send(
 *     { email: user.email, name: user.name },
 *     { name: user.name, loginUrl: `${process.env.FRONTEND_URL}/login` },
 *   );
 *
 * Template ids are declared in code, never read from env: they are dashboard
 * identifiers rather than secrets, and keeping them in the repo means the id
 * and the variables it expects are reviewed together.
 *
 * In one-shot contexts (scripts, workers, shutdown) await `flushMailQueue()`
 * before the process exits or queued mail is dropped.
 *
 * Required env: MSG91_AUTHKEY.
 * Optional env: MSG91_EMAIL_FROM (default noreply@mail.airkrit.com),
 * MSG91_EMAIL_FROM_NAME, MSG91_EMAIL_DOMAIN (defaults to the from address's
 * domain), MAIL_ENABLED=false to turn sending into a logged no-op.
 */

const MSG91_SEND_URL = "https://control.msg91.com/api/v5/email/send";

const DEFAULT_FROM_EMAIL = "noreply@mail.airkrit.com";

/** Conservative cap: one request carries at most this many recipient entries. */
const MAX_RECIPIENTS_PER_REQUEST = 100;

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 400;
const REQUEST_TIMEOUT_MS = 15000;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface MailAddress {
  email: string;
  name?: string;
}

/** Values are stringified; null/undefined are dropped so templates never render "undefined". */
export type MailVariables = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface MailRecipient extends MailAddress {
  /** Merged over the shared `variables` of the send. */
  variables?: MailVariables;
  cc?: MailAddress[];
  bcc?: MailAddress[];
}

/** Passed through to MSG91 unchanged. `file` is a publicly reachable URL. */
export interface MailAttachment {
  file: string;
  filename?: string;
}

export interface SendTemplateMailOptions {
  templateId: string;
  /** A bare email, an address, or a list of either. Each entry is its own email. */
  to: string | MailRecipient | Array<string | MailRecipient>;
  /** Shared template variables; per-recipient `variables` win on conflict. */
  variables?: MailVariables;
  cc?: MailAddress[];
  bcc?: MailAddress[];
  replyTo?: string | MailAddress;
  attachments?: MailAttachment[];
  /** Overrides the configured sender. Must still be on the verified domain. */
  from?: MailAddress;
}

export type MailSendResult =
  | { ok: true; outcome: "sent"; requestIds: string[] }
  | { ok: true; outcome: "skipped"; reason: string }
  | {
      ok: false;
      outcome: "failed";
      error: string;
      httpStatus?: number;
      /** Ids of the batches that did land before the failure. */
      requestIds: string[];
    };

interface MailerConfig {
  authKey: string;
  domain: string;
  from: MailAddress;
}

interface Msg91RecipientPayload {
  to: MailAddress[];
  cc?: MailAddress[];
  bcc?: MailAddress[];
  variables?: Record<string, string>;
}

export interface Msg91EmailPayload {
  recipients: Msg91RecipientPayload[];
  from: MailAddress;
  domain: string;
  template_id: string;
  reply_to?: MailAddress[];
  attachments?: MailAttachment[];
}

/** Read per call so tests and hot reloads see env changes. */
const mailerConfig = (): MailerConfig | null => {
  const authKey = process.env.MSG91_AUTHKEY?.trim();
  if (!authKey) return null;

  const email = process.env.MSG91_EMAIL_FROM?.trim() || DEFAULT_FROM_EMAIL;
  const name = process.env.MSG91_EMAIL_FROM_NAME?.trim();
  const domain =
    process.env.MSG91_EMAIL_DOMAIN?.trim() || email.split("@")[1] || "";

  if (!domain) return null;

  return { authKey, domain, from: name ? { email, name } : { email } };
};

const mailingEnabled = (): boolean => {
  const flag = process.env.MAIL_ENABLED?.trim().toLowerCase();
  return flag !== "false" && flag !== "0" && flag !== "no";
};

/** False when MSG91_AUTHKEY is missing or MAIL_ENABLED is switched off. */
export const isMailerConfigured = (): boolean =>
  mailingEnabled() && mailerConfig() !== null;

const asAddress = (value: string | MailRecipient): MailRecipient =>
  typeof value === "string" ? { email: value } : value;

const cleanAddress = (address: MailAddress): MailAddress => {
  const email = address.email.trim();
  const name = address.name?.trim();
  return name ? { email, name } : { email };
};

const validAddresses = (addresses?: MailAddress[]): MailAddress[] | undefined => {
  const cleaned = (addresses ?? [])
    .map(cleanAddress)
    .filter((a) => EMAIL_PATTERN.test(a.email));
  return cleaned.length ? cleaned : undefined;
};

/**
 * Stringifies values and drops empty ones. MSG91 substitutes variables as
 * text, so a number or boolean left as-is would be rejected or rendered oddly.
 */
export const normalizeVariables = (
  ...sources: Array<MailVariables | undefined>
): Record<string, string> => {
  const merged: Record<string, string> = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source ?? {})) {
      if (value === null || value === undefined) continue;
      merged[key] = typeof value === "string" ? value : String(value);
    }
  }
  return merged;
};

/**
 * Drops malformed addresses instead of letting one typo fail the whole batch;
 * the caller sees the survivors in the returned payload.
 */
export const normalizeRecipients = (
  to: SendTemplateMailOptions["to"],
  shared: {
    variables?: MailVariables;
    cc?: MailAddress[];
    bcc?: MailAddress[];
  } = {},
): { recipients: Msg91RecipientPayload[]; dropped: string[] } => {
  const entries = (Array.isArray(to) ? to : [to]).map(asAddress);
  const recipients: Msg91RecipientPayload[] = [];
  const dropped: string[] = [];
  const seen = new Set<string>();

  const sharedCc = validAddresses(shared.cc);
  const sharedBcc = validAddresses(shared.bcc);

  for (const entry of entries) {
    const address = cleanAddress(entry);
    if (!EMAIL_PATTERN.test(address.email)) {
      dropped.push(entry.email ?? String(entry));
      continue;
    }

    const key = address.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const variables = normalizeVariables(shared.variables, entry.variables);
    const cc = validAddresses(entry.cc) ?? sharedCc;
    const bcc = validAddresses(entry.bcc) ?? sharedBcc;

    recipients.push({
      to: [address],
      ...(cc ? { cc } : {}),
      ...(bcc ? { bcc } : {}),
      ...(Object.keys(variables).length ? { variables } : {}),
    });
  }

  return { recipients, dropped };
};

export const chunkRecipients = <T>(
  items: T[],
  size = MAX_RECIPIENTS_PER_REQUEST,
): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export const buildMsg91Payload = (
  recipients: Msg91RecipientPayload[],
  config: { domain: string; from: MailAddress },
  options: Pick<
    SendTemplateMailOptions,
    "templateId" | "replyTo" | "attachments"
  >,
): Msg91EmailPayload => {
  const replyTo = options.replyTo
    ? validAddresses([asAddress(options.replyTo)])
    : undefined;

  return {
    recipients,
    from: config.from,
    domain: config.domain,
    template_id: options.templateId,
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(options.attachments?.length
      ? { attachments: options.attachments }
      : {}),
  };
};

/**
 * MSG91 can answer 200 with a rejection in the body, so a 2xx alone is not
 * proof of delivery. Returns the human-readable cause, or null when clean.
 */
export const msg91BodyError = (body: unknown): string | null => {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, any>;

  const errors = Array.isArray(data.errors) ? data.errors : [];
  const flagged =
    data.hasError === true ||
    data.status === "error" ||
    data.status === "fail" ||
    data.type === "error" ||
    errors.length > 0;

  if (!flagged) return null;

  const fromErrors = errors
    .map((e: any) =>
      typeof e === "string" ? e : e?.message || e?.error || e?.reason,
    )
    .filter(Boolean)
    .join("; ");

  const message =
    fromErrors ||
    (typeof data.message === "string" ? data.message : "") ||
    (typeof data.data === "string" ? data.data : "");

  return message || "MSG91 rejected the request";
};

const extractRequestId = (body: unknown): string | null => {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, any>;
  const candidates = [
    data.data?.unique_id,
    data.data?.request_id,
    data.data?.id,
    data.unique_id,
    data.request_id,
    typeof data.message === "string" ? data.message : undefined,
  ];
  const found = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return found ? String(found).trim() : null;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface BatchOutcome {
  ok: boolean;
  requestId?: string;
  error?: string;
  httpStatus?: number;
}

/** Retries only transport-level and 5xx/429 failures; a rejection is final. */
const postBatch = async (
  payload: Msg91EmailPayload,
  authKey: string,
): Promise<BatchOutcome> => {
  let last: BatchOutcome = { ok: false, error: "Email was never attempted" };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await axios.post(MSG91_SEND_URL, payload, {
        headers: { "Content-Type": "application/json", authkey: authKey },
        timeout: REQUEST_TIMEOUT_MS,
      });

      const bodyError = msg91BodyError(response.data);
      if (bodyError) {
        return { ok: false, error: bodyError, httpStatus: response.status };
      }

      return {
        ok: true,
        requestId: extractRequestId(response.data) ?? undefined,
      };
    } catch (error) {
      const httpStatus = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const body = axios.isAxiosError(error) ? error.response?.data : undefined;
      const message =
        msg91BodyError(body) ||
        (typeof body === "string" && body.trim() ? body.trim() : "") ||
        (error instanceof Error ? error.message : String(error));

      last = { ok: false, error: message, httpStatus };

      const retryable = httpStatus === undefined || RETRYABLE_STATUS.has(httpStatus);
      if (!retryable || attempt === MAX_ATTEMPTS) return last;

      await sleep(RETRY_BASE_DELAY_MS * attempt);
    }
  }

  return last;
};

/**
 * Sends one MSG91 template to one or more recipients. Never throws: mail is
 * auxiliary to the request that triggered it, so callers decide whether a
 * failure matters by checking `result.ok`.
 */
export const sendTemplateMail = async (
  options: SendTemplateMailOptions,
): Promise<MailSendResult> => {
  if (!mailingEnabled()) {
    console.warn(
      `📭 MAIL_ENABLED is off - skipped template ${options.templateId}`,
    );
    return { ok: true, outcome: "skipped", reason: "mailing disabled" };
  }

  const config = mailerConfig();
  if (!config) {
    console.warn("⚠️  MSG91 is not configured - skipping email");
    return { ok: true, outcome: "skipped", reason: "mailer not configured" };
  }

  const templateId = options.templateId?.trim();
  if (!templateId) {
    return { ok: false, outcome: "failed", error: "templateId is required", requestIds: [] };
  }

  const { recipients, dropped } = normalizeRecipients(options.to, {
    variables: options.variables,
    cc: options.cc,
    bcc: options.bcc,
  });

  if (dropped.length) {
    console.warn(
      `⚠️  Dropped ${dropped.length} invalid email recipient(s): ${dropped.join(", ")}`,
    );
  }

  if (!recipients.length) {
    return { ok: false, outcome: "failed", error: "No valid recipients", requestIds: [] };
  }

  const requestIds: string[] = [];

  for (const batch of chunkRecipients(recipients)) {
    const payload = buildMsg91Payload(batch, config, {
      templateId,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    const outcome = await postBatch(payload, config.authKey);

    if (!outcome.ok) {
      console.error(
        `❌ Email send failed (template ${templateId}) for ${batch
          .map((r) => r.to[0]?.email)
          .join(", ")}: ${outcome.error}`,
      );
      return {
        ok: false,
        outcome: "failed",
        error: outcome.error ?? "Email send failed",
        ...(outcome.httpStatus ? { httpStatus: outcome.httpStatus } : {}),
        requestIds,
      };
    }

    if (outcome.requestId) requestIds.push(outcome.requestId);
  }

  console.log(
    `📧 Sent template ${templateId} to ${recipients.length} recipient(s)`,
  );
  return { ok: true, outcome: "sent", requestIds };
};

/**
 * Bounded in-process queue. Every mail goes through here so a send can never
 * add latency to the request that triggered it, and a bulk send can never open
 * hundreds of simultaneous MSG91 connections.
 */
const MAIL_QUEUE_CONCURRENCY = 4;

const queue: Array<() => Promise<void>> = [];
const drainWaiters: Array<() => void> = [];
let activeSends = 0;

const pump = (): void => {
  while (activeSends < MAIL_QUEUE_CONCURRENCY && queue.length > 0) {
    const job = queue.shift()!;
    activeSends += 1;
    void job()
      .catch(() => undefined)
      .finally(() => {
        activeSends -= 1;
        pump();
        if (activeSends === 0 && queue.length === 0) {
          drainWaiters.splice(0).forEach((resolve) => resolve());
        }
      });
  }
};

/**
 * Queues a mail and returns immediately - the default way to send. The write
 * that triggered the mail is already persisted, so a failure is logged rather
 * than surfaced to the caller.
 */
export const queueTemplateMail = (
  options: SendTemplateMailOptions,
  context?: string,
): void => {
  queue.push(async () => {
    try {
      await sendTemplateMail(options);
    } catch (error) {
      console.error(
        `❌ Unexpected mailer error${context ? ` (${context})` : ""}:`,
        error instanceof Error ? error.message : error,
      );
    }
  });
  // Deferred so the queue never runs inside the caller's tick.
  setImmediate(pump);
};

/** Queued but not yet finished sends. */
export const pendingMailCount = (): number => queue.length + activeSends;

/**
 * Resolves once the queue is empty. Needed in one-shot contexts - scripts,
 * workers, graceful shutdown - where the process would otherwise exit with
 * mail still queued.
 */
export const flushMailQueue = (): Promise<void> => {
  if (pendingMailCount() === 0) return Promise.resolve();
  return new Promise<void>((resolve) => drainWaiters.push(resolve));
};

type TemplateSendOptions = Omit<
  SendTemplateMailOptions,
  "templateId" | "to" | "variables"
>;

export interface MailTemplate<V extends MailVariables> {
  /** The MSG91 dashboard template id. */
  templateId: string;
  /** Short name used in logs, e.g. "signup-verification". */
  label: string;
  /** Queues the mail and returns immediately. Use this everywhere. */
  send: (
    to: SendTemplateMailOptions["to"],
    variables: V,
    options?: TemplateSendOptions & { context?: string },
  ) => void;
  /**
   * Awaits MSG91 and reports the outcome. Only for callers that must act on the
   * result - an admin "resend" endpoint, a worker recording delivery state.
   */
  sendNow: (
    to: SendTemplateMailOptions["to"],
    variables: V,
    options?: TemplateSendOptions,
  ) => Promise<MailSendResult>;
}

/**
 * Declares a dashboard template as a typed sender.
 *
 * `templateId` is the id MSG91 shows for the approved template. `label` is only
 * used to make logs readable. Variable names must match the placeholders used
 * in the MSG91 template, or the recipient gets raw placeholder text.
 */
export const defineMailTemplate = <V extends MailVariables>(
  templateId: string,
  label = templateId,
): MailTemplate<V> => ({
  templateId,
  label,

  send: (to, variables, options) => {
    const { context, ...sendOptions } = options ?? {};
    queueTemplateMail(
      { ...sendOptions, templateId, to, variables },
      context ?? `${label} email`,
    );
  },

  sendNow: (to, variables, options) =>
    sendTemplateMail({ ...options, templateId, to, variables }),
});
