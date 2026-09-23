import { Request, Response } from "express";
import mongoose from "mongoose";
import { AppError, asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import { fullName } from "../services/caApplicationReview.services";
import { listCaReviewQueue, reviewCaTaskAnswer, type CaViewer } from "../services/caReview.services";

const viewerOf = (req: Request): CaViewer => {
  const u = req.user;
  if (!u?._id) throw new AppError("Authentication required", 401);
  return { userId: new mongoose.Types.ObjectId(String(u._id)), userType: String(u.userType), name: fullName(u) };
};

/** @route GET /api/ca-reviews */
export const listCaReviewQueueController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, { reviews: await listCaReviewQueue(viewerOf(req)) }, "Review queue fetched", 200);
});

/** @route POST /api/ca-reviews/:submissionId/answers/:questionId */
export const reviewCaTaskAnswerController = asyncHandler(async (req: Request, res: Response) => {
  const result = await reviewCaTaskAnswer(
    viewerOf(req),
    String(req.params.submissionId),
    String(req.params.questionId),
    req.body ?? {},
  );
  sendSuccessResponse(res, result, result.finalized ? "Reviewed and finalized" : "Reviewed", 200);
});
