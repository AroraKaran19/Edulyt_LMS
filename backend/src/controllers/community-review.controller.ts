import { Request, Response } from "express";
import {
  asyncHandler,
  AppError,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  addReplyToCommunityReviewService,
  adminDeleteCommunityReviewService,
  adminListCommunityReviewsService,
  approveCommunityReviewService,
  createCommunityReviewService,
  listCommunityReviewRepliesService,
  listPublicCommunityReviewsService,
  rejectCommunityReviewService,
  toggleLikeCommunityReviewService,
} from "../services/community-review.services";
import {
  CommunityReviewStatus,
  CommunityReviewTag,
} from "../types";

export const createCommunityReview = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user?._id) {
      throw new AppError("Unauthorized", 401);
    }
    if (user.userType !== "student") {
      throw new AppError("Only students can post community reviews", 403);
    }

    const { title, review, tag, anonymous } = req.body as {
      title?: string;
      review?: string;
      tag?: CommunityReviewTag;
      anonymous?: boolean;
    };

    const result = await createCommunityReviewService({
      userId: anonymous ? null : String(user._id),
      title: title ?? "",
      review: review ?? "",
      tag: tag as CommunityReviewTag,
    });

    sendSuccessResponse(res, result, "Community review created", 201);
  }
);

/**
 * Public listing. Only returns approved reviews — `status` is fixed inside the
 * service layer, so even a crafted ?status=pending_approval query is ignored
 * and cannot leak unmoderated content.
 */
export const listPublicCommunityReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, tag, search } = req.query as {
      page?: string | number;
      limit?: string | number;
      tag?: CommunityReviewTag;
      search?: string;
    };

    const result = await listPublicCommunityReviewsService({
      page: Number(page),
      limit: Number(limit),
      tag,
      search,
      currentUserId: req.user?._id ? String(req.user._id) : undefined,
    });

    sendSuccessResponse(res, result, "Community reviews fetched", 200);
  }
);

export const adminDeleteCommunityReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("Community review id is required", 400);

    await adminDeleteCommunityReviewService(id);
    sendSuccessResponse(res, { deleted: true }, "Community review deleted", 200);
  }
);

export const toggleLikeCommunityReview = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user?._id) throw new AppError("Unauthorized", 401);
    const { id } = req.params;
    if (!id) throw new AppError("Community review id is required", 400);

    const result = await toggleLikeCommunityReviewService(id, String(user._id));
    sendSuccessResponse(
      res,
      result,
      result.liked ? "Liked" : "Unliked",
      200
    );
  }
);

export const addReplyToCommunityReview = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user?._id) throw new AppError("Unauthorized", 401);

    const { id } = req.params;
    const { message, anonymous } = req.body as {
      message?: string;
      anonymous?: boolean;
    };
    if (!id) throw new AppError("Community review id is required", 400);

    const reply = await addReplyToCommunityReviewService(
      id,
      anonymous ? null : String(user._id),
      message ?? ""
    );

    sendSuccessResponse(res, reply, "Reply added", 201);
  }
);

export const listCommunityReviewReplies = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query as {
      page?: string | number;
      limit?: string | number;
    };
    if (!id) throw new AppError("Community review id is required", 400);

    const result = await listCommunityReviewRepliesService({
      reviewId: id,
      page: Number(page),
      limit: Number(limit),
    });
    sendSuccessResponse(res, result, "Replies fetched", 200);
  }
);

export const adminListCommunityReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      status,
      tag,
      search,
    } = req.query as {
      page?: string | number;
      limit?: string | number;
      status?: CommunityReviewStatus;
      tag?: CommunityReviewTag;
      search?: string;
    };

    const result = await adminListCommunityReviewsService({
      page: Number(page),
      limit: Number(limit),
      status,
      tag,
      search,
    });

    sendSuccessResponse(res, result, "Community reviews fetched", 200);
  }
);

export const adminApproveCommunityReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("Community review id is required", 400);

    const result = await approveCommunityReviewService(id);
    if (!result) throw new AppError("Community review not found", 404);

    sendSuccessResponse(res, result, "Community review approved", 200);
  }
);

export const adminRejectCommunityReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("Community review id is required", 400);

    const result = await rejectCommunityReviewService(id);
    if (!result) throw new AppError("Community review not found", 404);

    sendSuccessResponse(res, result, "Community review rejected", 200);
  }
);
