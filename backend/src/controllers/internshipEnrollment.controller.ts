import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  listInternshipEnrollmentsAdmin,
  getInternshipEnrollmentByIdAdmin,
  registerForExam,
  registerForPaidSeat,
  listMyInternshipEnrollments,
  adminUpdateEnrollmentStatus,
  adminChangeEnrollmentBatch,
  deleteInternshipEnrollmentAdmin,
  listEntranceExamCohortsAdmin,
  listCertificationExamCohortsAdmin,
  adminBulkApproveMeritToEnrolled,
  getLearnerEntranceExam,
  getLearnerProgramBySlug,
  withdrawPaymentPendingEnrollmentForLearner,
  submitInternshipDocumentation,
  adminUpdateInternshipDocumentation,
} from "../services/internshipEnrollment.services";

/**
 * @route   GET /api/internship-enrollments/me
 * @desc    Learner lists their internship enrollments (dashboard)
 * @query   page, limit, search, statuses (comma-separated, e.g. exam_registered,exam_attempted)
 * @access  Authenticated user
 */
export const listMyInternshipEnrollmentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const statusesRaw = req.query.statuses;
    const statuses =
      typeof statusesRaw === "string" && statusesRaw.trim()
        ? statusesRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const result = await listMyInternshipEnrollments(
      new mongoose.Types.ObjectId(String(userId)),
      page,
      limit,
      search,
      statuses,
    );
    sendSuccessResponse(
      res,
      result,
      "Internship enrollments fetched successfully",
      200,
    );
  },
);

/**
 * @route   DELETE /api/internship-enrollments/me/:enrollmentId
 * @desc    Learner removes an unpaid direct-seat row (`payment_pending`) and pending orders
 * @access  Authenticated user
 */
export const withdrawPaymentPendingEnrollmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const enrollmentId = String(req.params.enrollmentId ?? "").trim();
    if (!enrollmentId) throw new AppError("enrollmentId is required", 400);

    await withdrawPaymentPendingEnrollmentForLearner(
      new mongoose.Types.ObjectId(String(userId)),
      enrollmentId,
    );
    sendSuccessResponse(res, null, "Registration removed", 200);
  },
);

/**
 * @route   POST /api/internship-enrollments
 * @desc    Learner registers for an entrance exam
 * @body    { internshipId, batchId, path?, applicationAnswers? }
 * @access  Authenticated user
 */
export const registerForExamController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const { internshipId, batchId, path, applicationAnswers } = req.body as {
      internshipId?: string;
      batchId?: string;
      /** `"paid"` = book seat / pay without entrance; else merit / entrance exam. */
      path?: string;
      /** Full public enroll form snapshot (JSON object). */
      applicationAnswers?: unknown;
    };
    if (!internshipId) throw new AppError("internshipId is required", 400);
    if (!batchId) throw new AppError("batchId is required", 400);

    const opts = { applicationAnswers };

    const result =
      path === "paid"
        ? await registerForPaidSeat(
            new mongoose.Types.ObjectId(String(userId)),
            internshipId,
            batchId,
            opts,
          )
        : await registerForExam(
            new mongoose.Types.ObjectId(String(userId)),
            internshipId,
            batchId,
            opts,
          );
    sendSuccessResponse(res, result, "Registered for exam successfully", 201);
  },
);

/**
 * @route   GET /api/internship-enrollments/admin
 * @desc    Paginated internship enrollments (admin)
 * @query   page, limit, search, status, internshipId, batchId, lifecycle (program|pipeline|all), enrollmentType, meritPoolFirst (true|false)
 * @access  Admin
 */
export const listInternshipEnrollmentsAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      internshipId,
      batchId,
      lifecycle: lifecycleQ,
      enrollmentType: enrollmentTypeQ,
      meritPoolFirst: meritPoolFirstQ,
    } = req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    const lifecycle =
      typeof lifecycleQ === "string" &&
      (lifecycleQ === "program" ||
        lifecycleQ === "pipeline" ||
        lifecycleQ === "all")
        ? lifecycleQ
        : "program";
    const enrollmentType =
      enrollmentTypeQ === "merit" || enrollmentTypeQ === "paid"
        ? enrollmentTypeQ
        : undefined;
    const meritPoolFirst =
      meritPoolFirstQ === "true" || meritPoolFirstQ === "1";
    const result = await listInternshipEnrollmentsAdmin(p, l, {
      search: typeof search === "string" ? search : undefined,
      status: typeof status === "string" ? status : undefined,
      internshipId: typeof internshipId === "string" ? internshipId : undefined,
      batchId: typeof batchId === "string" ? batchId : undefined,
      lifecycle,
      enrollmentType,
      meritPoolFirst,
    });
    sendSuccessResponse(
      res,
      result,
      "Internship enrollments fetched successfully",
      200,
    );
  },
);

/**
 * @route   GET /api/internship-enrollments/admin/:enrollmentId
 * @desc    Single enrollment for admin detail
 * @access  Admin
 */
export const getInternshipEnrollmentByIdAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;
    const row = await getInternshipEnrollmentByIdAdmin(String(enrollmentId));
    sendSuccessResponse(res, row, "Enrollment fetched successfully", 200);
  },
);

/**
 * @route   PATCH /api/internship-enrollments/admin/:enrollmentId/status
 * @desc    Admin transitions an enrollment status (approve, reject, enroll, etc.)
 * @body    { status, rejectionNote? }
 * @access  Admin
 */
export const adminUpdateEnrollmentStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminUserId = req.user?._id;
    if (!adminUserId) throw new AppError("Unauthorized", 401);

    const { enrollmentId } = req.params;
    const { status, rejectionNote } = req.body as {
      status?: string;
      rejectionNote?: string;
    };
    if (!status) throw new AppError("status is required", 400);

    const row = await adminUpdateEnrollmentStatus(
      String(enrollmentId),
      status,
      new mongoose.Types.ObjectId(String(adminUserId)),
      rejectionNote,
    );
    sendSuccessResponse(res, row, "Enrollment status updated", 200);
  },
);

/**
 * @route   PATCH /api/internship-enrollments/admin/:enrollmentId/batch
 * @desc    Move enrollment to another cohort (same internship)
 * @body    { batchId: string }
 * @access  Admin
 */
export const adminChangeEnrollmentBatchController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminUserId = req.user?._id;
    if (!adminUserId) throw new AppError("Unauthorized", 401);

    const { enrollmentId } = req.params;
    const { batchId } = req.body as { batchId?: string };
    if (!batchId || typeof batchId !== "string") {
      throw new AppError("batchId is required", 400);
    }

    const row = await adminChangeEnrollmentBatch(
      String(enrollmentId),
      batchId.trim(),
      new mongoose.Types.ObjectId(String(adminUserId)),
    );
    sendSuccessResponse(res, row, "Enrollment batch updated", 200);
  },
);

/**
 * @route   POST /api/internship-enrollments/admin/approve-to-enrolled
 * @desc    Admin confirms merit-path learners to enrolled in one step (server-side).
 * @body    { enrollmentIds: string[] }
 * @access  Admin
 */
export const adminBulkApproveToEnrolledController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminUserId = req.user?._id;
    if (!adminUserId) throw new AppError("Unauthorized", 401);

    const { enrollmentIds } = req.body as { enrollmentIds?: unknown };
    if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      throw new AppError("enrollmentIds must be a non-empty array", 400);
    }
    const ids = enrollmentIds
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
    if (ids.length === 0) {
      throw new AppError("enrollmentIds must contain valid strings", 400);
    }

    const result = await adminBulkApproveMeritToEnrolled(
      ids,
      new mongoose.Types.ObjectId(String(adminUserId)),
    );
    sendSuccessResponse(res, result, "Approve to enrolled completed", 200);
  },
);

/**
 * @route   DELETE /api/internship-enrollments/admin/:enrollmentId
 * @access  Admin
 */
export const deleteInternshipEnrollmentAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;
    await deleteInternshipEnrollmentAdmin(String(enrollmentId));
    sendSuccessResponse(res, { ok: true }, "Enrollment removed", 200);
  },
);

/**
 * @route   GET /api/internship-enrollments/admin/entrance-exam-cohorts
 * @desc    Cohorts (batch + internship) that have an entrance exam template
 * @access  Admin
 */
export const listEntranceExamCohortsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const rows = await listEntranceExamCohortsAdmin();
    sendSuccessResponse(res, { cohorts: rows }, "Cohorts fetched", 200);
  },
);

/**
 * @route   GET /api/internship-enrollments/admin/certification-exam-cohorts
 * @desc    Cohorts (batch + internship) that have a certification exam template
 * @access  Admin
 */
export const listCertificationExamCohortsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const rows = await listCertificationExamCohortsAdmin();
    sendSuccessResponse(res, { cohorts: rows }, "Cohorts fetched", 200);
  },
);

/**
 * @route   GET /api/internship-enrollments/me/program/:slug
 * @desc    Learner fetches enrolled-program detail + unlocked task list
 * @access  Authenticated user (must be enrolled)
 */
export const getLearnerProgramBySlugController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const slug =
      typeof req.params.slug === "string" ? req.params.slug.trim() : "";
    if (!slug) throw new AppError("slug is required", 400);
    const result = await getLearnerProgramBySlug(
      new mongoose.Types.ObjectId(String(userId)),
      slug,
    );
    sendSuccessResponse(res, result, "Program detail fetched", 200);
  },
);

/**
 * @route   POST /api/internship-enrollments/me/:enrollmentId/documentation
 * @desc    Learner submits Aadhar + photo to leave `pending_documentation`
 * @body    { aadharCardNumber, learnerPhoto, learnerPhotoS3Key }
 * @access  Authenticated user (enrollment owner)
 */
export const submitInternshipDocumentationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const enrollmentId = String(req.params.enrollmentId ?? "").trim();
    if (!enrollmentId) throw new AppError("enrollmentId is required", 400);

    const { aadharCardNumber, learnerPhoto, learnerPhotoS3Key } =
      req.body as {
        aadharCardNumber?: string;
        learnerPhoto?: string;
        learnerPhotoS3Key?: string;
      };

    const result = await submitInternshipDocumentation(
      enrollmentId,
      new mongoose.Types.ObjectId(String(userId)),
      {
        aadharCardNumber: String(aadharCardNumber ?? ""),
        learnerPhoto: String(learnerPhoto ?? ""),
        learnerPhotoS3Key: String(learnerPhotoS3Key ?? ""),
      },
    );
    sendSuccessResponse(res, result, "Documentation submitted", 200);
  },
);

/**
 * @route   PATCH /api/internship-enrollments/admin/:enrollmentId/documentation
 * @desc    Admin edits the documentation (Aadhar / photo) on an enrollment
 * @body    { aadharCardNumber?, learnerPhoto?, learnerPhotoS3Key? }
 * @access  Admin
 */
export const adminUpdateInternshipDocumentationController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminUserId = req.user?._id;
    if (!adminUserId) throw new AppError("Unauthorized", 401);

    const enrollmentId = String(req.params.enrollmentId ?? "").trim();
    if (!enrollmentId) throw new AppError("enrollmentId is required", 400);

    const { aadharCardNumber, learnerPhoto, learnerPhotoS3Key } =
      req.body as {
        aadharCardNumber?: string;
        learnerPhoto?: string;
        learnerPhotoS3Key?: string;
      };

    const row = await adminUpdateInternshipDocumentation(enrollmentId, {
      aadharCardNumber,
      learnerPhoto,
      learnerPhotoS3Key,
    });
    sendSuccessResponse(res, row, "Documentation updated", 200);
  },
);

/**
 * @route   GET /api/internship-enrollments/me/entrance-exam?enrollmentId=
 * @desc    Learner fetches entrance exam questions (only within the exam window)
 * @access  Authenticated user (enrollment owner)
 */
export const getLearnerEntranceExamController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const enrollmentId =
      typeof req.query.enrollmentId === "string"
        ? req.query.enrollmentId.trim()
        : "";
    if (!enrollmentId) throw new AppError("enrollmentId is required", 400);
    const result = await getLearnerEntranceExam(
      enrollmentId,
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "Entrance exam fetched", 200);
  },
);
