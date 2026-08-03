/**
 * Paging the team when something breaks that nobody would otherwise see.
 *
 * The workers run in-process on `setInterval`. A throw inside a tick is caught
 * and logged and the loop carries on; a throw outside one kills the process with
 * no signal at all. In production that means silent failure, which is what this
 * exists to fix.
 *
 * Two rules shape the implementation:
 *
 *  - A worker in a crash loop must not send an alert every tick, so sends are
 *    throttled per alert kind, twice over: an in-process map for cheapness, and a
 *    shared row in `opsalertlogs` so the window survives restarts and covers all
 *    PM2 apps at once. Suppressed alerts are counted and reported by the next one
 *    that gets through, so quiet never means "nothing happened".
 *  - An alert about a dying process cannot use the mail queue, because that queue
 *    lives in process memory and dies with it. Those callers pass
 *    `immediate: true` and the send is awaited before the process exits.
 */
import { escapeHtmlToBr } from "../lib/htmlEscape";
import { internalAlertMail } from "../mail/internalAlert.mail";
import { OpsAlertLogModel } from "../models/opsAlertLog.schema";

/** Repeat alerts of the same kind are dropped for this long. */
const DEFAULT_THROTTLE_MS = 15 * 60 * 1000;

/** Cap so a flood of distinct keys cannot grow memory without bound. */
const MAX_TRACKED_KEYS = 500;

const lastSentAt = new Map<string, number>();

/**
 * Claim the right to send for `key`, or report that a recent alert covers it.
 *
 * Marks before sending rather than after, so two concurrent callers cannot both
 * decide they are first.
 */
const claimThrottleSlot = (key: string, windowMs: number): boolean => {
  const now = Date.now();
  const previous = lastSentAt.get(key);
  if (previous !== undefined && now - previous < windowMs) return false;

  if (lastSentAt.size >= MAX_TRACKED_KEYS) {
    for (const [k, at] of lastSentAt) {
      if (now - at >= windowMs) lastSentAt.delete(k);
    }
  }

  lastSentAt.set(key, now);
  return true;
};

/**
 * Second gate: the same window, shared across processes and across restarts.
 *
 * Returns how many alerts of this kind were suppressed since the last email when
 * the caller may send, `null` when it may not, and `undefined` when the database
 * could not answer.
 *
 * That last case matters. A Mongo outage is exactly the failure this system exists
 * to report, and it is also the failure that stops this query working, so the
 * caller treats `undefined` as permission to send. The in-process gate has already
 * bounded that to one email per window per process, which is no worse than having
 * no shared throttle at all.
 */
const claimSharedSlot = async (
  key: string,
  windowMs: number,
): Promise<number | null | undefined> => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowMs);

  try {
    // Existing row whose window has expired: take it and report what it absorbed.
    const stale = await OpsAlertLogModel.findOneAndUpdate(
      { key, lastSentAt: { $lte: cutoff } },
      { $set: { lastSentAt: now, suppressedCount: 0 } },
      { returnDocument: "before" },
    ).lean<{ suppressedCount?: number } | null>();
    if (stale) return Number(stale.suppressedCount ?? 0);

    // No match means either no row at all, or one still inside its window. Filter
    // on `key` so this cannot collide with the unique index; whoever inserts wins.
    const res = await OpsAlertLogModel.updateOne(
      { key },
      { $setOnInsert: { key, lastSentAt: now, suppressedCount: 0 } },
      { upsert: true },
    );
    if (res.upsertedCount === 1) return 0;

    // Row exists and is inside its window. Count this one and stay quiet.
    await OpsAlertLogModel.updateOne({ key }, { $inc: { suppressedCount: 1 } });
    return null;
  } catch (error) {
    console.error(
      "[Ops Alert] Shared throttle unavailable, falling back to in-process only:",
      error instanceof Error ? error.message : error,
    );
    return undefined;
  }
};

/** Comma-separated so one alert can reach a team rather than a person. */
const alertRecipients = (): string[] =>
  (process.env.OPS_ALERT_EMAIL || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

/** Uppercased so the badge in the template and any log line agree on one form. */
const currentEnvironment = (): string =>
  (process.env.NODE_ENV || "unknown").trim().toUpperCase();

/**
 * `CRITICAL` means a queue has stopped draining and someone should act now.
 * `WARNING` means something failed but the system is still moving.
 */
export type OpsAlertSeverity = "CRITICAL" | "WARNING";

export interface OpsAlertOptions {
  /** Defaults to `WARNING`, so only a deliberate caller can page loudly. */
  severity?: OpsAlertSeverity;
  /** Headline. One line, scannable in an inbox list. */
  title: string;
  /** Detail. Plain text, newlines fine; escaped and converted before sending. */
  body: string;
  /**
   * Throttle bucket. Alerts sharing a key collapse into one email per window, so
   * key on the *kind* of failure rather than on the individual occurrence. Use
   * the title when there is nothing better.
   */
  key?: string;
  /**
   * Await the send instead of queueing it. Required from any handler that is
   * about to let the process exit.
   */
  immediate?: boolean;
  throttleMs?: number;
}

/**
 * Email the ops address, unless a recent alert of the same kind already did.
 *
 * Never throws and never rejects. An alert that took down the worker it was
 * reporting on would be worse than no alert, so every failure here is logged and
 * swallowed. Returns whether an email was actually dispatched, which is useful in
 * tests and harmless to ignore.
 */
export const sendOpsAlert = async (
  options: OpsAlertOptions,
): Promise<boolean> => {
  try {
    const recipients = alertRecipients();
    if (!recipients.length) return false;

    const key = options.key ?? options.title;
    const windowMs = options.throttleMs ?? DEFAULT_THROTTLE_MS;

    // Cheap in-process gate first, so a crash loop or a hot tick does not hit the
    // database once per occurrence.
    if (!claimThrottleSlot(key, windowMs)) return false;

    const suppressed = await claimSharedSlot(key, windowMs);
    if (suppressed === null) return false;

    const body =
      suppressed && suppressed > 0
        ? `${suppressed} further alert(s) of this kind were suppressed since the last email.\n\n${options.body}`
        : options.body;

    const variables = {
      severity: options.severity ?? "WARNING",
      alertTitle: options.title,
      alertBody: escapeHtmlToBr(body),
      environment: currentEnvironment(),
      year: new Date().getFullYear(),
    };

    if (options.immediate) {
      await internalAlertMail.sendNow(recipients, variables);
    } else {
      internalAlertMail.send(recipients, variables);
    }

    return true;
  } catch (error) {
    console.error(
      "[Ops Alert] Could not send alert:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
};

/** Test seam. Throttle state is per-process and otherwise leaks between cases. */
export const __resetOpsAlertThrottle = (): void => {
  lastSentAt.clear();
};
