import { Request, Response } from "express";
import { AppError, asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import { QnAService } from "../services/qna.service";
import { QnAFilters } from "../types/qna";

export class QnAController {
  /**
   * Create a new question
   * @param req - Express request object
   * @param res - Express response object
   */
  createQuestion = asyncHandler(async (req: Request, res: Response) => {
    const { courseId, title, description, priority, tags, isAnonymous } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId || !title || !description) {
      throw new AppError("Course ID, title, and description are required", 400);
    }

    const question = await QnAService.createQuestion(courseId, userId, {
      title,
      description,
      priority,
      tags,
      isAnonymous,
    });

    sendSuccessResponse(
      res,
      { question },
      "Question created successfully",
      201
    );
  });

  /**
   * Get questions with filters and pagination
   * @param req - Express request object
   * @param res - Express response object
   */
  getQuestions = asyncHandler(async (req: Request, res: Response) => {
    const {
      courseId,
      userId,
      status,
      priority,
      search,
      tags,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.query;

    const filters: QnAFilters = {
      courseId: courseId as string,
      userId: userId as string,
      status: status as "open" | "resolved" | "closed",
      priority: priority as "low" | "medium" | "high",
      search: search as string,
      tags: tags ? (tags as string).split(",") : undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const result = await QnAService.getQuestions(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendSuccessResponse(
      res,
      result,
      "Questions fetched successfully",
      200
    );
  });

  /**
   * Get a single question with details
   * @param req - Express request object
   * @param res - Express response object
   */
  getQuestionById = asyncHandler(async (req: Request, res: Response) => {
    const { questionId } = req.params;

    if (!questionId) {
      throw new AppError("Question ID is required", 400);
    }

    const question = await QnAService.getQuestionById(questionId);

    sendSuccessResponse(
      res,
      { question },
      "Question fetched successfully",
      200
    );
  });

  /**
   * Update a question
   * @param req - Express request object
   * @param res - Express response object
   */
  updateQuestion = asyncHandler(async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const { title, description, status, priority, tags } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!questionId) {
      throw new AppError("Question ID is required", 400);
    }

    const question = await QnAService.updateQuestion(questionId, userId, {
      title,
      description,
      status,
      priority,
      tags,
    });

    sendSuccessResponse(
      res,
      { question },
      "Question updated successfully",
      200
    );
  });

  /**
   * Delete a question
   * @param req - Express request object
   * @param res - Express response object
   */
  deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!questionId) {
      throw new AppError("Question ID is required", 400);
    }

    await QnAService.deleteQuestion(questionId, userId);

    sendSuccessResponse(
      res,
      { deletedQuestionId: questionId },
      "Question deleted successfully",
      200
    );
  });

  /**
   * Create a reply to a question
   * @param req - Express request object
   * @param res - Express response object
   */
  createReply = asyncHandler(async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const { content, parentReplyId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!questionId) {
      throw new AppError("Question ID is required", 400);
    }

    if (!content) {
      throw new AppError("Content is required", 400);
    }

    const reply = await QnAService.createReply(questionId, userId, {
      content,
      parentReplyId,
    });

    sendSuccessResponse(
      res,
      { reply },
      "Reply created successfully",
      201
    );
  });

  /**
   * Get replies for a question
   * @param req - Express request object
   * @param res - Express response object
   */
  getReplies = asyncHandler(async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!questionId) {
      throw new AppError("Question ID is required", 400);
    }

    const result = await QnAService.getReplies(
      questionId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendSuccessResponse(
      res,
      result,
      "Replies fetched successfully",
      200
    );
  });

  /**
   * Update a reply
   * @param req - Express request object
   * @param res - Express response object
   */
  updateReply = asyncHandler(async (req: Request, res: Response) => {
    const { replyId } = req.params;
    const { content, isAccepted } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!replyId) {
      throw new AppError("Reply ID is required", 400);
    }

    const reply = await QnAService.updateReply(replyId, userId, {
      content,
      isAccepted,
    });

    sendSuccessResponse(
      res,
      { reply },
      "Reply updated successfully",
      200
    );
  });

  /**
   * Delete a reply
   * @param req - Express request object
   * @param res - Express response object
   */
  deleteReply = asyncHandler(async (req: Request, res: Response) => {
    const { replyId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!replyId) {
      throw new AppError("Reply ID is required", 400);
    }

    await QnAService.deleteReply(replyId, userId);

    sendSuccessResponse(
      res,
      { deletedReplyId: replyId },
      "Reply deleted successfully",
      200
    );
  });

  /**
   * Vote on a question or reply
   * @param req - Express request object
   * @param res - Express response object
   */
  vote = asyncHandler(async (req: Request, res: Response) => {
    const { itemId, itemType, voteType } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!itemId || !itemType || !voteType) {
      throw new AppError("Item ID, item type, and vote type are required", 400);
    }

    if (!["question", "reply"].includes(itemType)) {
      throw new AppError("Item type must be 'question' or 'reply'", 400);
    }

    if (!["upvote", "downvote", "remove"].includes(voteType)) {
      throw new AppError("Vote type must be 'upvote', 'downvote', or 'remove'", 400);
    }

    await QnAService.vote(itemId, userId, itemType as "question" | "reply", voteType as "upvote" | "downvote" | "remove");

    sendSuccessResponse(
      res,
      { itemId, itemType, voteType },
      "Vote processed successfully",
      200
    );
  });

  /**
   * Get QnA statistics
   * @param req - Express request object
   * @param res - Express response object
   */
  getQnAStats = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.query;

    const stats = await QnAService.getQnAStats(courseId as string);

    sendSuccessResponse(
      res,
      { stats },
      "QnA statistics fetched successfully",
      200
    );
  });

  /**
   * Get user's questions
   * @param req - Express request object
   * @param res - Express response object
   */
  getUserQuestions = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    const filters: QnAFilters = {
      userId,
      status: status as "open" | "resolved" | "closed",
    };

    const result = await QnAService.getQuestions(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendSuccessResponse(
      res,
      result,
      "User questions fetched successfully",
      200
    );
  });

  /**
   * Get course questions
   * @param req - Express request object
   * @param res - Express response object
   */
  getCourseQuestions = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { page = 1, limit = 10, status, priority, search } = req.query;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const filters: QnAFilters = {
      courseId,
      status: status as "open" | "resolved" | "closed",
      priority: priority as "low" | "medium" | "high",
      search: search as string,
    };

    const result = await QnAService.getQuestions(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendSuccessResponse(
      res,
      result,
      "Course questions fetched successfully",
      200
    );
  });
}

export default new QnAController();
