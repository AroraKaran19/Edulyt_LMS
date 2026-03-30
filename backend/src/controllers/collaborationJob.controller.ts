import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getAllCollaborationJobsService,
  retryCollaborationJobService,
} from "../services/collaborationJob.services";
import { CollaborationJobStatus } from "../types/collaborationJob";

/**
 * @route GET /api/admin/collaboration-jobs
 * @access Admin
 */
export const getAllCollaborationJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await getAllCollaborationJobsService({
      page,
      limit,
      status: status as CollaborationJobStatus | undefined,
      search,
    });

    sendSuccessResponse(
      res,
      result,
      "Collaboration jobs retrieved successfully",
      200
    );
  }
);

/**
 * @route POST /api/admin/collaboration-jobs/:jobId/retry
 * @access Admin
 */
export const retryCollaborationJob = asyncHandler(
  async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const job = await retryCollaborationJobService(jobId);

    sendSuccessResponse(res, job, "Job queued for retry successfully", 200);
  }
);
