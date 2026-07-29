import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getAllInvoiceJobsService,
  retryInvoiceJobService,
  reclaimStuckInvoiceJobsService,
} from "../services/invoiceJob.services";
import { InvoiceJobStatus } from "../types/invoiceJob";

/**
 * @route GET /api/admin/invoice-jobs
 * @access Admin
 */
export const getAllInvoiceJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await getAllInvoiceJobsService({
      page,
      limit,
      status: status as InvoiceJobStatus | undefined,
      search,
    });

    sendSuccessResponse(res, result, "Invoice jobs retrieved successfully", 200);
  },
);

/**
 * @route POST /api/admin/invoice-jobs/:jobId/retry
 * @access Admin
 */
export const retryInvoiceJob = asyncHandler(
  async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const job = await retryInvoiceJobService(jobId);

    sendSuccessResponse(res, job, "Job queued for retry successfully", 200);
  },
);

/**
 * Reclaim invoice jobs wedged in `processing` (manual).
 *
 * The invoice worker never sweeps on its own, so this is the only way a job
 * orphaned by a crashed process gets unblocked. Until it runs, the partial
 * unique index keeps rejecting new invoice jobs for that order.
 *
 * Takes no parameters. The stuck threshold and reclaim limit come from
 * INVOICE_WORKER_STUCK_TIMEOUT_MIN / INVOICE_WORKER_MAX_STUCK_RECLAIMS, so the
 * thresholds stay operator-controlled rather than settable per request.
 *
 * @route POST /api/admin/invoice-jobs/reclaim-stuck
 * @access Admin
 */
export const reclaimStuckInvoiceJobs = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await reclaimStuckInvoiceJobsService();

    sendSuccessResponse(
      res,
      result,
      `Reclaim sweep complete: ${result.reclaimed} requeued, ${result.failed} marked failed`,
      200,
    );
  },
);
