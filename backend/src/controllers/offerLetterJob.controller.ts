import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getAllOfferLetterJobsService,
  retryOfferLetterJobService,
} from "../services/offerLetterJob.services";

/**
 * Get all offer letter jobs (admin)
 * @route GET /api/admin/offer-letter-jobs
 * @access Admin
 */
export const getAllOfferLetterJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await getAllOfferLetterJobsService({
      page,
      limit,
      status: status as
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | undefined,
      search,
    });

    sendSuccessResponse(res, result, "Offer letter jobs retrieved successfully", 200);
  },
);

/**
 * Retry a failed offer letter job (admin)
 * @route POST /api/admin/offer-letter-jobs/:jobId/retry
 * @access Admin
 */
export const retryOfferLetterJob = asyncHandler(
  async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const job = await retryOfferLetterJobService(jobId);
    sendSuccessResponse(res, job, "Job queued for retry successfully", 200);
  },
);
