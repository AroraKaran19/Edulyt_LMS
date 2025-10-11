import { Request, Response } from "express";
import {
  createQnAQuestion,
  getQnAQuestionsByCourse,
  getQnAQuestionById,
  createQnAReply,
  getQnAReplysByQuestion,
  markQuestionAsResolved,
  getQnAQuestionsByUser,
} from "../services/qna.service";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";

/**
 * Create a new QnA question
 * @route POST /api/qna/questions
 * @access Private (Student/Instructor)
 */
export const createQuestion = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, question } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!courseId || !question) {
      throw new AppError("Course ID and question are required", 400);
    }

    if (question.length < 10 || question.length > 1000) {
      throw new AppError(
        "Question must be between 10 and 1000 characters",
        400
      );
    }

    const qnaQuestion = await createQnAQuestion(courseId, userId, question);
    sendSuccessResponse(res, qnaQuestion, "Question created successfully", 201);
  }
);

/**
 * Get all QnA questions for a course
 * @route GET /api/qna/questions/course/:courseId
 * @access Public
 */
export const getQuestionsByCourse = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { page = 1, limit = 10, isResolved } = req.query;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await getQnAQuestionsByCourse(
      courseId,
      Number(page),
      Number(limit),
      isResolved !== undefined ? isResolved === "true" : undefined
    );

    sendSuccessResponse(res, result, "Questions retrieved successfully", 200);
  }
);

/**
 * Get a specific QnA question with its replies
 * @route GET /api/qna/questions/:questionId
 * @access Public
 */
export const getQuestionById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { questionId } = req.params;

    if (!questionId) {
      throw new AppError("Question ID is required", 400);
    }

    const question = await getQnAQuestionById(questionId);

    if (!question) {
      throw new AppError("Question not found", 404);
    }

    sendSuccessResponse(res, question, "Question retrieved successfully", 200);
  }
);

/**
 * Create a reply to a QnA question
 * @route POST /api/qna/replies
 * @access Private (Student/Instructor)
 */
export const createReply = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { questionId, reply } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!questionId || !reply) {
      throw new AppError("Question ID and reply are required", 400);
    }

    if (reply.length < 5 || reply.length > 1000) {
      throw new AppError("Reply must be between 5 and 1000 characters", 400);
    }

    const qnaReply = await createQnAReply(questionId, userId, reply);
    sendSuccessResponse(res, qnaReply, "Reply created successfully", 201);
  }
);

/**
 * Get all replies for a QnA question
 * @route GET /api/qna/replies/question/:questionId
 * @access Public
 */
export const getRepliesByQuestion = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { questionId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!questionId) {
      throw new AppError("Question ID is required", 400);
    }

    const result = await getQnAReplysByQuestion(
      questionId,
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(res, result, "Replies retrieved successfully", 200);
  }
);

/**
 * Mark a QnA question as resolved
 * @route PUT /api/qna/questions/:questionId/resolve
 * @access Private (Question Owner/Instructor)
 */
export const resolveQuestion = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { questionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!questionId) {
      throw new AppError("Question ID is required", 400);
    }

    const question = await markQuestionAsResolved(questionId, userId);
    sendSuccessResponse(res, question, "Question marked as resolved", 200);
  }
);

/**
 * Get QnA questions by user
 * @route GET /api/qna/questions/user/:userId
 * @access Private (User Owner/Admin)
 */
export const getQuestionsByUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    // Check if user is accessing their own questions or is admin
    if (
      currentUserId !== userId &&
      req.user?.userType !== "admin" &&
      req.user?.userType !== "super-admin"
    ) {
      throw new AppError("Unauthorized to access these questions", 403);
    }

    const result = await getQnAQuestionsByUser(
      userId,
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(
      res,
      result,
      "User questions retrieved successfully",
      200
    );
  }
);
