/**
 * Make a dying worker say so.
 *
 * The workers are `setInterval` loops. A throw inside a tick is caught and
 * logged and the loop carries on, but an uncaught exception or an unhandled
 * rejection outside one takes the process down, and nothing anywhere records
 * that it happened. PM2 restarts it and the only trace is a gap in the logs.
 */
import { sendOpsAlert } from "../services/opsAlert.services";

/** How long to wait for the alert before exiting anyway. */
const ALERT_TIMEOUT_MS = 5_000;

const withTimeout = (promise: Promise<unknown>): Promise<unknown> =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(resolve, ALERT_TIMEOUT_MS)),
  ]);

/**
 * Alert on fatal errors, then exit so the supervisor can restart the process.
 *
 * The alert is sent with `immediate: true`, not queued: the mail queue lives in
 * this process's memory and would die with it.
 *
 * Note the throttle inside `sendOpsAlert` is per-process, so it cannot collapse a
 * crash *loop* — each restart starts with an empty throttle and sends again. PM2's
 * own restart backoff is what bounds that. Deduplicating across restarts would
 * mean persisting throttle state, which is not worth a collection today.
 */
export const installWorkerCrashAlerts = (processName: string): void => {
  let handling = false;

  const fatal = async (kind: string, error: unknown): Promise<void> => {
    // A throw while reporting a throw must not recurse.
    if (handling) return;
    handling = true;

    const detail =
      error instanceof Error ? error.stack || error.message : String(error);
    console.error(`❌ [${processName}] ${kind}:`, error);

    await withTimeout(
      sendOpsAlert({
        immediate: true,
        severity: "CRITICAL",
        key: `worker-crash:${processName}`,
        title: `${processName} stopped unexpectedly`,
        body: [
          `process: ${processName}`,
          `cause:   ${kind}`,
          "",
          detail,
          "",
          "The process is exiting. Its supervisor should restart it; if this",
          "repeats, the queue it drains is not being processed.",
        ].join("\n"),
      }),
    );

    process.exit(1);
  };

  process.on("uncaughtException", (error) => {
    void fatal("uncaughtException", error);
  });

  process.on("unhandledRejection", (reason) => {
    void fatal("unhandledRejection", reason);
  });
};

/**
 * Alert when a worker cannot even start, then exit.
 *
 * Startup failures already exit 1, but silently. A worker that never comes up is
 * indistinguishable from one with nothing to do.
 */
export const reportWorkerStartupFailure = async (
  processName: string,
  error: unknown,
): Promise<void> => {
  console.error(`❌ Failed to start ${processName}:`, error);

  await withTimeout(
    sendOpsAlert({
      immediate: true,
      severity: "CRITICAL",
      key: `worker-startup:${processName}`,
      title: `${processName} failed to start`,
      body: [
        `process: ${processName}`,
        "",
        error instanceof Error ? error.stack || error.message : String(error),
      ].join("\n"),
    }),
  );
};
