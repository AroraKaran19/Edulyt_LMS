import express from "express";
import QnAController from "../controllers/qna.controller";
import { verifyUser } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @route   POST /api/qna/questions
 * @desc    Create a new question
 * @access  Private (user)
 * @body    { courseId, title, description, priority?, tags?, isAnonymous? }
 * @return  Question object
 */
router.post(
  "/questions",
  verifyUser,
  QnAController.createQuestion
);

/**
 * @route   GET /api/qna/questions
 * @desc    Get questions with filters and pagination
 * @access  Private (user)
 * @query   courseId?, userId?, status?, priority?, search?, tags?, dateFrom?, dateTo?, page?, limit?
 * @return  Array of questions with pagination
 */
router.get(
  "/questions",
  verifyUser,
  QnAController.getQuestions
);

/**
 * @route   GET /api/qna/questions/user
 * @desc    Get user's questions
 * @access  Private (user)
 * @query   page?, limit?, status?
 * @return  Array of user's questions with pagination
 */
router.get(
  "/questions/user",
  verifyUser,
  QnAController.getUserQuestions
);

/**
 * @route   GET /api/qna/questions/course/:courseId
 * @desc    Get course questions
 * @access  Private (user)
 * @query   page?, limit?, status?, priority?, search?
 * @return  Array of course questions with pagination
 */
router.get(
  "/questions/course/:courseId",
  verifyUser,
  QnAController.getCourseQuestions
);

/**
 * @route   GET /api/qna/questions/:questionId
 * @desc    Get a single question with details
 * @access  Private (user)
 * @return  Question object with replies
 */
router.get(
  "/questions/:questionId",
  verifyUser,
  QnAController.getQuestionById
);

/**
 * @route   PUT /api/qna/questions/:questionId
 * @desc    Update a question
 * @access  Private (user - question owner)
 * @body    { title?, description?, status?, priority?, tags? }
 * @return  Updated question object
 */
router.put(
  "/questions/:questionId",
  verifyUser,
  QnAController.updateQuestion
);

/**
 * @route   DELETE /api/qna/questions/:questionId
 * @desc    Delete a question
 * @access  Private (user - question owner)
 * @return  Success message
 */
router.delete(
  "/questions/:questionId",
  verifyUser,
  QnAController.deleteQuestion
);

/**
 * @route   POST /api/qna/questions/:questionId/replies
 * @desc    Create a reply to a question
 * @access  Private (user - enrolled or instructor)
 * @body    { content, parentReplyId? }
 * @return  Reply object
 */
router.post(
  "/questions/:questionId/replies",
  verifyUser,
  QnAController.createReply
);

/**
 * @route   GET /api/qna/questions/:questionId/replies
 * @desc    Get replies for a question
 * @access  Private (user)
 * @query   page?, limit?
 * @return  Array of replies with pagination
 */
router.get(
  "/questions/:questionId/replies",
  verifyUser,
  QnAController.getReplies
);

/**
 * @route   PUT /api/qna/replies/:replyId
 * @desc    Update a reply
 * @access  Private (user - reply owner or question owner)
 * @body    { content?, isAccepted? }
 * @return  Updated reply object
 */
router.put(
  "/replies/:replyId",
  verifyUser,
  QnAController.updateReply
);

/**
 * @route   DELETE /api/qna/replies/:replyId
 * @desc    Delete a reply
 * @access  Private (user - reply owner or question owner)
 * @return  Success message
 */
router.delete(
  "/replies/:replyId",
  verifyUser,
  QnAController.deleteReply
);

/**
 * @route   POST /api/qna/vote
 * @desc    Vote on a question or reply
 * @access  Private (user)
 * @body    { itemId, itemType, voteType }
 * @return  Success message
 */
router.post(
  "/vote",
  verifyUser,
  QnAController.vote
);

/**
 * @route   GET /api/qna/stats
 * @desc    Get QnA statistics
 * @access  Private (user)
 * @query   courseId?
 * @return  QnA statistics
 */
router.get(
  "/stats",
  verifyUser,
  QnAController.getQnAStats
);

export default router;
