import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createQnAService,
  deleteQnAService,
  getAllQnAsService,
  getQnAByIdService,
  updateQnAService,
  addReplyToQnAService,
  removeReplyFromQnAService,
  approveQnAService,
  rejectQnAService,
} from "../services/qna.services";

export const getAllQnAs = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    courseId,
    lessonId,
    contentId,
    approved,
  } = req.query;
  const isAdmin = req.user?.userType === "admin";

  if (Number(page) < 1 || Number(limit) < 1) {
    throw new AppError("Page and limit must be positive numbers", 400);
  }

  const result = await getAllQnAsService(
    Number(page),
    Number(limit),
    String(search),
    courseId as string,
    lessonId as string,
    contentId as string,
    isAdmin,
    approved !== undefined ? approved === "true" : undefined
  );

  // Always return a consistent response shape for the frontend:
  // { qnas: [], total, page, totalPages }
  if (!result || result.qnas.length === 0) {
    sendSuccessResponse(
      res,
      {
        qnas: [],
        total: 0,
        page: Number(page),
        totalPages: 0,
      },
      "No QnAs found",
      200
    );
    return;
  }

  sendSuccessResponse(res, result, "QnAs fetched successfully", 200);
  return;
});

export const getQnAById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user?.userType === "admin";
  
  if (!id) {
    throw new AppError("QnA ID is required", 400);
  }

  const result = await getQnAByIdService(id, isAdmin);
  if (!result) {
    sendSuccessResponse(res, null, "QnA not found", 200);
    return;
  }

  sendSuccessResponse(res, result, "QnA fetched successfully", 200);
  return;
});

export const createQnA = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, lessonId, contentId, message } = req.body;
  const user = req.user;

  if (!courseId || !user?._id || !message) {
    throw new AppError(
      "Course ID, user ID, and message are required",
      400
    );
  }

  const result = await createQnAService({
    courseId,
    lessonId: lessonId || null,
    contentId: contentId || null,
    userId: user._id,
    message,
  });

  if (!result) {
    throw new AppError("Failed to create QnA", 500);
  }

  sendSuccessResponse(res, result, "QnA created successfully", 201);
  return;
});

export const updateQnA = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  const isAdmin = req.user?.userType === "admin";

  if (!id) {
    throw new AppError("QnA ID is required", 400);
  }
  if (!message) {
    throw new AppError("Message is required for update", 400);
  }

  const result = await updateQnAService(id, { message }, isAdmin);
  if (!result) {
    throw new AppError("Failed to update QnA", 500);
  }

  sendSuccessResponse(res, result, "QnA updated successfully", 200);
  return;
});

export const deleteQnA = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new AppError("QnA ID is required", 400);
  }

  const result = await deleteQnAService(id);
  if (!result) {
    throw new AppError("Failed to delete QnA", 500);
  }

  sendSuccessResponse(res, result, "QnA deleted successfully", 200);
  return;
});

export const addReply = asyncHandler(async (req: Request, res: Response) => {
  const { qnaId } = req.params;
  const { message } = req.body;
  const user = req.user;

  if (!qnaId) {
    throw new AppError("QnA ID is required", 400);
  }
  if (!user?._id || !message) {
    throw new AppError("User ID and message are required", 400);
  }

  const result = await addReplyToQnAService(qnaId, user._id, message);
  if (!result) {
    throw new AppError("Failed to add reply", 500);
  }

  sendSuccessResponse(res, result, "Reply added successfully", 201);
  return;
});

export const removeReply = asyncHandler(async (req: Request, res: Response) => {
  const { qnaId, replyId } = req.params;
  const user = req.user;

  if (!qnaId || !replyId) {
    throw new AppError("QnA ID and reply ID are required", 400);
  }
  if (!user?._id) {
    throw new AppError("User ID is required", 400);
  }

  const result = await removeReplyFromQnAService(qnaId, replyId, user._id);
  if (!result) {
    throw new AppError("Failed to remove reply", 500);
  }

  sendSuccessResponse(res, result, "Reply removed successfully", 200);
  return;
});

// Approve Q&A (instructor/admin only)
export const approveQnA = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Q&A ID is required", 400);
  }

  const result = await approveQnAService(id);

  if (!result) {
    throw new AppError("Q&A not found", 404);
  }

  sendSuccessResponse(res, result, "Q&A approved successfully", 200);
  return;
});

// Reject/Un-approve Q&A (instructor/admin only)
export const rejectQnA = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Q&A ID is required", 400);
  }

  const result = await rejectQnAService(id);

  if (!result) {
    throw new AppError("Q&A not found", 404);
  }

  sendSuccessResponse(res, result, "Q&A rejected successfully", 200);
  return;
});
