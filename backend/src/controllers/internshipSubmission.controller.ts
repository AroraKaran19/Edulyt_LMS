import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createInternshipSubmission,
  saveMCQAnswer,
  saveFileAnswer,
  submitSubmission,
  reviewFileResponse,
  bulkReviewTaskSubmissions,
  finalizeCertificationExamReview,
  getSubmissionById,
  listSubmissionsAdmin,
  type CreateSubmissionBody,
  type SaveMCQAnswerBody,
  type SaveFileAnswerBody,
  type ReviewFileBody,
} from "../services/internshipSubmission.services";

/**
 * @route   POST /api/internship-submissions
 * @desc    Start a new exam/task submission (writes template snapshot)
 * @access  Learner (enrolled)
 */
export const createSubmissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const body = req.body as CreateSubmissionBody;
    const result = await createInternshipSubmission(
      body,
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "Submission created", 201);
  },
);

/**
 * @route   GET /api/internship-submissions/:submissionId
 * @desc    Get a submission by id
 *          Learner gets isCorrect redacted from snapshot options (until submitted).
 *          Admin gets the full document.
 * @access  Owner or Admin
 */
export const getSubmissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const isAdmin = !!(req as { user?: { role?: string } }).user?.role === true
      || (req as { user?: { role?: string } }).user?.role === "admin";
    const result = await getSubmissionById(String(submissionId), !isAdmin);
    sendSuccessResponse(res, result, "Submission fetched", 200);
  },
);

/**
 * @route   PATCH /api/internship-submissions/:submissionId/answers/mcq
 * @desc    Add or update an MCQ answer in a draft submission
 * @access  Owner
 */
export const saveMCQAnswerController = asyncHandler(
  async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const body = req.body as SaveMCQAnswerBody;
    if (!body.question) throw new AppError("question is required", 400);
    if (!Array.isArray(body.selectedOptions)) {
      throw new AppError("selectedOptions must be an array", 400);
    }
    const result = await saveMCQAnswer(String(submissionId), body);
    sendSuccessResponse(res, result, "MCQ answer saved", 200);
  },
);

/**
 * @route   PATCH /api/internship-submissions/:submissionId/answers/file
 * @desc    Upload / replace a file answer in a draft submission
 * @access  Owner
 */
export const saveFileAnswerController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const { submissionId } = req.params;
    const body = req.body as SaveFileAnswerBody;
    if (!body.question) throw new AppError("question is required", 400);
    const result = await saveFileAnswer(
      String(submissionId),
      body,
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "File answer saved", 200);
  },
);

/**
 * @route   POST /api/internship-submissions/:submissionId/submit
 * @desc    Finalize a draft submission — auto-grades MCQ using snapshot options
 * @access  Owner
 */
export const submitController = asyncHandler(
  async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const result = await submitSubmission(String(submissionId));
    sendSuccessResponse(res, result, "Submission finalized", 200);
  },
);

/**
 * @route   POST /api/internship-submissions/admin/bulk-review
 * @desc    One verdict applied to every waiting file answer of the selected task submissions
 * @access  Admin
 */
export const bulkReviewTaskSubmissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const result = await bulkReviewTaskSubmissions(
      req.body ?? {},
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "Bulk review finished", 200);
  },
);

/**
 * @route   PATCH /api/internship-submissions/admin/:submissionId/review/:questionId
 * @desc    Reviewer awards a score to a file-upload response
 * @access  Admin
 */
export const reviewFileResponseController = asyncHandler(
  async (req: Request, res: Response) => {
    const { submissionId, questionId } = req.params;
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const body = req.body as ReviewFileBody;
    if (typeof body.awardedScore !== "number") {
      throw new AppError("awardedScore (number) is required", 400);
    }
    const result = await reviewFileResponse(
      String(submissionId),
      String(questionId),
      body,
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "File response reviewed", 200);
  },
);

/**
 * @route   POST /api/internship-submissions/admin/:submissionId/finalize-certification
 * @desc    Mark certification exam review complete (required for all certification attempts)
 * @access  Admin
 */
export const finalizeCertificationReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const result = await finalizeCertificationExamReview(
      String(submissionId),
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "Certification review finalized", 200);
  },
);

/**
 * @route   GET /api/internship-submissions/admin/:submissionId
 * @desc    Full submission detail for admin (answers not redacted)
 * @access  Admin
 */
export const getSubmissionAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const result = await getSubmissionById(String(submissionId), false);
    sendSuccessResponse(res, result, "Submission fetched", 200);
  },
);

/**
 * @route   GET /api/internship-submissions/admin
 * @desc    Paginated list of all submissions (admin)
 * @access  Admin
 */
export const listSubmissionsAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      submissionFor,
      status,
      internshipId,
      batchId,
      userId,
      taskId,
      examId,
      enrollmentId,
    } = req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("page and limit must be positive numbers", 400);
    }
    const result = await listSubmissionsAdmin(p, l, {
      submissionFor:
        submissionFor === "exam" || submissionFor === "task"
          ? (submissionFor as "exam" | "task")
          : undefined,
      status: typeof status === "string" ? status : undefined,
      internshipId: typeof internshipId === "string" ? internshipId : undefined,
      batchId: typeof batchId === "string" ? batchId : undefined,
      userId: typeof userId === "string" ? userId : undefined,
      taskId: typeof taskId === "string" ? taskId : undefined,
      examId: typeof examId === "string" ? examId : undefined,
      enrollmentId: typeof enrollmentId === "string" ? enrollmentId : undefined,
    });
    sendSuccessResponse(res, result, "Submissions fetched", 200);
  },
);
