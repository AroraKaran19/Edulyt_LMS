import {
  createQuestion,
  getQuestionsByCourse,
  getQuestionById,
  createReply,
  getRepliesByQuestion,
  resolveQuestion,
  getQuestionsByUser,
} from "../controllers/qna.controller";
import { Router } from "express";

const router = Router();

/**
 * @route   POST /api/qna/questions
 * @desc    Create a new QnA question
 * @access  Private (Student/Instructor)
 * @body
 *   - courseId: The ID of the course (required)
 *   - question: The question text (required, 10-1000 characters)
 * @example
 *   POST /api/qna/questions
 *   Body: {
 *     "courseId": "64a1b2c3d4e5f6789012345",
 *     "question": "How do I implement authentication in this course?"
 *   }
 */
router.post("/questions", createQuestion);

/**
 * @route   GET /api/qna/questions/course/:courseId
 * @desc    Get all QnA questions for a course
 * @access  Public
 * @params
 *   - courseId: The ID of the course (required)
 * @query
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - isResolved: Filter by resolved status (optional, true/false)
 * @example
 *   GET /api/qna/questions/course/64a1b2c3d4e5f6789012345?page=1&limit=10&isResolved=false
 */
router.get("/questions/course/:courseId", getQuestionsByCourse);

/**
 * @route   GET /api/qna/questions/:questionId
 * @desc    Get a specific QnA question with its details
 * @access  Public
 * @params
 *   - questionId: The ID of the question (required)
 * @example
 *   GET /api/qna/questions/64a1b2c3d4e5f6789012345
 */
router.get("/questions/:questionId", getQuestionById);

/**
 * @route   POST /api/qna/replies
 * @desc    Create a reply to a QnA question
 * @access  Private (Student/Instructor)
 * @body
 *   - questionId: The ID of the question (required)
 *   - reply: The reply text (required, 5-1000 characters)
 * @example
 *   POST /api/qna/replies
 *   Body: {
 *     "questionId": "64a1b2c3d4e5f6789012345",
 *     "reply": "You can implement authentication using JWT tokens..."
 *   }
 */
router.post("/replies", createReply);

/**
 * @route   GET /api/qna/replies/question/:questionId
 * @desc    Get all replies for a QnA question
 * @access  Public
 * @params
 *   - questionId: The ID of the question (required)
 * @query
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 * @example
 *   GET /api/qna/replies/question/64a1b2c3d4e5f6789012345?page=1&limit=10
 */
router.get("/replies/question/:questionId", getRepliesByQuestion);

/**
 * @route   PUT /api/qna/questions/:questionId/resolve
 * @desc    Mark a QnA question as resolved
 * @access  Private (Question Owner/Instructor)
 * @params
 *   - questionId: The ID of the question (required)
 * @example
 *   PUT /api/qna/questions/64a1b2c3d4e5f6789012345/resolve
 */
router.put("/questions/:questionId/resolve", resolveQuestion);

/**
 * @route   GET /api/qna/questions/user/:userId
 * @desc    Get QnA questions by user
 * @access  Private (User Owner/Admin)
 * @params
 *   - userId: The ID of the user (required)
 * @query
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 * @example
 *   GET /api/qna/questions/user/64a1b2c3d4e5f6789012345?page=1&limit=10
 */
router.get("/questions/user/:userId", getQuestionsByUser);

export default router;
