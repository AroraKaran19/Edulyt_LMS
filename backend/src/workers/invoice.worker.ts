import {
  getNextPendingInvoiceJobService,
  updateInvoiceJobStatusService,
  incrementInvoiceJobRetryService,
} from "../services/invoiceJob.services";
import { generateInvoiceForOrderService } from "../services/invoice.services";
import { InvoiceJob } from "../types/invoiceJob";

const MAX_RETRIES = 3;

/** How often the worker wakes to drain the queue (ms). Env: INVOICE_WORKER_POLL_MS (default 60s). */
const POLL_INTERVAL_MS = Math.max(
  200,
  Number(process.env.INVOICE_WORKER_POLL_MS) || 60_000,
);

/** Max jobs claimed per poll tick. Env: INVOICE_WORKER_MAX_JOBS_PER_TICK (default 5). */
const MAX_JOBS_PER_TICK = Math.max(
  1,
  Number(process.env.INVOICE_WORKER_MAX_JOBS_PER_TICK) || 5,
);

/**
 * Max jobs running at once. Each one spawns a LibreOffice process, so this is
 * the knob that bounds memory on the worker box, not MAX_JOBS_PER_TICK.
 * Env: INVOICE_WORKER_MAX_PARALLEL (default 2).
 */
const MAX_PARALLEL = Math.max(
  1,
  Math.min(
    MAX_JOBS_PER_TICK,
    Number(process.env.INVOICE_WORKER_MAX_PARALLEL) || 2,
  ),
);

/** Run tasks with at most `concurrency` in flight (sliding pool). */
async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  const c = Math.min(Math.max(1, concurrency), items.length);
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: c }, () => worker()));
}

async function processInvoiceJob(job: InvoiceJob): Promise<void> {
  const { jobId, orderId } = job;

  try {
    console.log(`[Invoice Worker] Processing job ${jobId} for order ${orderId}`);

    const result = await generateInvoiceForOrderService(orderId, (percent) =>
      updateInvoiceJobStatusService(jobId, { progress: percent }).then(() => undefined),
    );

    await updateInvoiceJobStatusService(jobId, {
      status: "completed",
      progress: 100,
      invoiceNumber: result.invoiceNumber,
      invoiceUrl: result.invoiceUrl,
    });

    console.log(
      result.alreadyExisted
        ? `[Invoice Worker] Job ${jobId}: order ${orderId} was already invoiced (${result.invoiceNumber}).`
        : `[Invoice Worker] Job ${jobId} completed. Invoice ${result.invoiceNumber} -> ${result.invoiceUrl}`,
    );
  } catch (error: any) {
    console.error(`[Invoice Worker] Error processing job ${jobId}:`, error);

    const currentRetryCount = job.retryCount || 0;
    if (currentRetryCount < MAX_RETRIES) {
      await incrementInvoiceJobRetryService(jobId);
      await updateInvoiceJobStatusService(jobId, {
        status: "pending",
        error: `Retry ${currentRetryCount + 1}/${MAX_RETRIES}: ${error.message}`,
      });
      console.log(
        `[Invoice Worker] Job ${jobId} will be retried (${currentRetryCount + 1}/${MAX_RETRIES})`,
      );
    } else {
      await updateInvoiceJobStatusService(jobId, {
        status: "failed",
        error: error.message || "Invoice generation failed",
      });
      console.log(`[Invoice Worker] Job ${jobId} failed after ${MAX_RETRIES} retries`);
    }
  }
}

/**
 * Start the invoice worker.
 *
 * Off in development by default: it renders real PDFs, allocates real invoice
 * numbers out of the shared counter, and writes them to S3. Force on with
 * INVOICE_WORKER_ENABLED=true when you genuinely need it locally.
 */
export function startInvoiceWorker(): void {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.INVOICE_WORKER_ENABLED !== "true"
  ) {
    console.log(
      "[Invoice Worker] Disabled in development (set INVOICE_WORKER_ENABLED=true to force on).",
    );
    return;
  }

  console.log("[Invoice Worker] Starting invoice generation worker...");

  let tickRunning = false;

  const processJobs = async () => {
    if (tickRunning) return;
    tickRunning = true;
    try {
      const jobs: InvoiceJob[] = [];
      for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
        const job = await getNextPendingInvoiceJobService();
        if (!job) break;
        jobs.push(job);
      }
      if (jobs.length > 0) {
        await runPool(jobs, MAX_PARALLEL, (job) => processInvoiceJob(job));
        console.log(
          `[Invoice Worker] Finished ${jobs.length} job(s) this tick (parallelism ${MAX_PARALLEL}, max batch ${MAX_JOBS_PER_TICK}).`,
        );
      }
    } catch (error) {
      console.error("[Invoice Worker] Error in job processing loop:", error);
    } finally {
      tickRunning = false;
    }
  };

  void processJobs();

  setInterval(() => {
    void processJobs();
  }, POLL_INTERVAL_MS);

  console.log(
    `[Invoice Worker] Worker started. Poll every ${POLL_INTERVAL_MS}ms, batch <=${MAX_JOBS_PER_TICK}, parallel <=${MAX_PARALLEL}.`,
  );
}
