import { sendOpsAlert } from "../services/opsAlert.services";
import { runCaAttachSweep } from "../services/caApplicationAttach.services";
import { reclaimStuckCaDocumentJobs } from "../services/caDocumentJob.services";
import { runCaCompletionSweep, runCaDocumentJobs } from "../services/caDocumentWorker.services";

const POLL_INTERVAL_MS = Math.max(
  5_000,
  Number(process.env.CA_WORKER_POLL_MS) || 60_000,
);

/** Same rule as the collaboration worker: on in production, off locally, env overrides. */
export const isCaWorkerEnabled = (): boolean => {
  const override = process.env.CA_WORKER_ENABLED;
  return override === "true" || (override == null && process.env.NODE_ENV === "production");
};

/** Isolates one stage so a persistent failure there cannot also stop the others (e.g. a broken attach sweep must not block offer letters). */
const runCaStage = async (name: string, fn: () => Promise<void>): Promise<void> => {
  try {
    await fn();
  } catch (error) {
    console.error(`[CA Worker] ${name} failed:`, error);
    void sendOpsAlert({
      key: `ca-worker-stage-${name}`,
      title: `CA worker ${name} failed`,
      body: `error: ${error instanceof Error ? error.stack || error.message : String(error)}`,
    });
  }
};

export const runCaWorkerTick = async (): Promise<void> => {
  await runCaStage("attach-sweep", async () => {
    const attach = await runCaAttachSweep();
    if (attach.attached > 0) {
      console.log(`[CA Worker] Attached ${attach.attached} of ${attach.scanned} approved application(s)`);
    }
  });
  await runCaStage("reclaim", () => reclaimStuckCaDocumentJobs().then(() => undefined));
  await runCaStage("completion-sweep", async () => {
    const completion = await runCaCompletionSweep();
    if (completion.queued > 0 || completion.skipped > 0) {
      console.log(`[CA Worker] Completion: ${completion.queued} queued, ${completion.skipped} no longer on a team`);
    }
  });
  await runCaStage("document-jobs", async () => {
    const jobs = await runCaDocumentJobs();
    if (jobs > 0) console.log(`[CA Worker] Processed ${jobs} document job(s)`);
  });
};

export function startCaWorker(): void {
  if (!isCaWorkerEnabled()) {
    console.log(
      `[CA Worker] Disabled (NODE_ENV=${process.env.NODE_ENV ?? "<unset>"}, CA_WORKER_ENABLED=${process.env.CA_WORKER_ENABLED ?? "<unset>"}).`,
    );
    return;
  }

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runCaWorkerTick();
    } catch (error) {
      console.error("[CA Worker] Tick error:", error);
      void sendOpsAlert({
        key: "ca-worker-tick",
        title: "CA worker tick failed",
        body: [
          "The CA loop threw. It keeps running, but approved applicants may not be",
          "joining their teams.",
          "",
          `error: ${error instanceof Error ? error.stack || error.message : String(error)}`,
        ].join("\n"),
      });
    } finally {
      running = false;
    }
  };

  void tick();
  setInterval(() => {
    void tick();
  }, POLL_INTERVAL_MS);
  console.log(`[CA Worker] Started. Poll every ${POLL_INTERVAL_MS}ms.`);
}
