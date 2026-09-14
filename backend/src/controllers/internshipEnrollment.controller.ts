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
  switchInternshipBatch,
  listMyInternshipEnrollments,
  adminUpdateEnrollmentStatus,
  adminChangeEnrollmentBatch,
  adminUpdateEnrollmentDuration,
  adminSetCertificateOverride,
  deleteInternshipEnrollmentAdmin,
  listEntranceExamCohortsAdmin,
  listCertificationExamCohortsAdmin,
  adminBulkApproveMeritToEnrolled,
  getLearnerEntranceExam,
  getLearnerProgramBySlug,
  withdrawPaymentPendingEnrollmentForLearner,
  submitInternshipDocumentation,
  adminUpdateInternshipDocumentation,
  adminVerifyInternshipDocumentation,
  getInternshipVerification,
  listInternshipsWithPendingDocReview,
  adminBulkApproveInternshipDocumentation,
} from "../services/internshipEnrollment.services";
import {
  getAllOfferLetterJobsService,
  retryOfferLetterJobService,
} from "../services/offerLetterJob.services";
import type { OfferLetterJobStatus } from "../types/offerLetterJob";
import { readableBrands } from "../lib/brandScope";

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
      readableBrands(req.brand),
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
 * @route   GET /api/internship-enrollments/verify/:internId
 * @desc    Public — verify an issued offer letter by intern ID (scanned from QR).
 *          Returns name + program + status, no PII.
 * @access  Public
 */
export const getInternshipVerificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const internId = String(req.params.internId ?? "").trim();
    if (!internId) throw new AppError("internId is required", 400);
    const result = await getInternshipVerification(internId);
    sendSuccessResponse(res, result, "Verification successful", 200);
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
 * @route   POST /api/internship-enrollments/me/:enrollmentId/switch-batch
 * @desc    Learner moves a pre-exam (`exam_registered`) registration to another
 *          cohort of the same internship. Hard-deletes the old enrollment and
 *          creates a fresh one for the target batch.
 * @access  Authenticated user (non-partner)
 */
export const switchInternshipBatchController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const { enrollmentId } = req.params as { enrollmentId?: string };
    const { batchId } = req.body as { batchId?: string };
    if (!enrollmentId) throw new AppError("enrollmentId is required", 400);
    if (!batchId) throw new AppError("batchId is required", 400);

    const result = await switchInternshipBatch(
      new mongoose.Types.ObjectId(String(userId)),
      enrollmentId,
      batchId,
    );
    sendSuccessResponse(res, result, "Moved to the selected cohort", 200);
  },
);

/**
 * @route   GET /api/internship-enrollments/admin
 * @desc    Paginated internship enrollments (admin)
 * @query   page, limit, search, status (one status or a comma-separated group),
 *          internshipId, batchId, lifecycle (program|pipeline|all),
 *          certificateOutcome, enrollmentType, enrolledFrom, enrolledTo,
 *          meritPoolFirst (true|false)
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
      batchSearch,
      lifecycle: lifecycleQ,
      certificateOutcome: certificateOutcomeQ,
      enrollmentType: enrollmentTypeQ,
      enrolledFrom,
      enrolledTo,
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
    const certificateOutcome =
      certificateOutcomeQ === "certified" ||
      certificateOutcomeQ === "not_certified" ||
      certificateOutcomeQ === "pending"
        ? certificateOutcomeQ
        : undefined;
    const meritPoolFirst =
      meritPoolFirstQ === "true" || meritPoolFirstQ === "1";
    const result = await listInternshipEnrollmentsAdmin(p, l, {
      search: typeof search === "string" ? search : undefined,
      status: typeof status === "string" ? status : undefined,
      internshipId: typeof internshipId === "string" ? internshipId : undefined,
      batchId: typeof batchId === "string" ? batchId : undefined,
      batchSearch: typeof batchSearch === "string" ? batchSearch : undefined,
      lifecycle,
      certificateOutcome,
      enrollmentType,
      enrolledFrom: typeof enrolledFrom === "string" ? enrolledFrom : undefined,
      enrolledTo: typeof enrolledTo === "string" ? enrolledTo : undefined,
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
 * @route   PATCH /api/internship-enrollments/admin/:enrollmentId/duration
 * @desc    Change the learner's program duration (months).
 * @body    { months: number }
 * @access  Admin
 */
export const adminUpdateEnrollmentDurationController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminUserId = req.user?._id;
    if (!adminUserId) throw new AppError("Unauthorized", 401);

    const { enrollmentId } = req.params;
    const { months } = req.body as { months?: number };
    if (months === undefined || months === null) {
      throw new AppError("months is required", 400);
    }

    const row = await adminUpdateEnrollmentDuration(
      String(enrollmentId),
      Number(months),
      new mongoose.Types.ObjectId(String(adminUserId)),
    );
    sendSuccessResponse(res, row, "Enrollment duration updated", 200);
  },
);

/**
 * @route   PATCH /api/internship-enrollments/admin/:enrollmentId/certificate-override
 * @desc    Admin passes/fails a learner's certificate, or clears the override.
 * @body    { verdict: "pass" | "fail" | "clear" }
 * @access  Admin
 */
export const adminSetCertificateOverrideController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminUserId = req.user?._id;
    if (!adminUserId) throw new AppError("Unauthorized", 401);

    const { enrollmentId } = req.params;
    const { verdict } = req.body as { verdict?: "pass" | "fail" | "clear" };
    if (!verdict) throw new AppError("verdict is required", 400);

    const row = await adminSetCertificateOverride(
      String(enrollmentId),
      verdict,
      new mongoose.Types.ObjectId(String(adminUserId)),
    );
    const msg =
      verdict === "clear"
        ? "Certificate override cleared"
        : verdict === "pass"
          ? "Learner passed — certificate issued"
          : "Learner marked failed";
    sendSuccessResponse(res, row, msg, 200);
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
 * @route   GET /api/internship-enrollments/me/program/:slug/live-meetings
 * @desc    Paginated live meetings (history + upcoming) for the learner's
 *          batch on this program. Newest first.
 * @access  Authenticated user (must be enrolled & past documentation)
 */
export const getLearnerProgramLiveMeetingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const slug =
      typeof req.params.slug === "string" ? req.params.slug.trim() : "";
    if (!slug) throw new AppError("slug is required", 400);
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10),
    );
    const { getStudentLiveMeetingsBySlugPaginated } = await import(
      "../services/liveMeeting.services"
    );
    const result = await getStudentLiveMeetingsBySlugPaginated(
      new mongoose.Types.ObjectId(String(userId)),
      slug,
      page,
      limit,
    );
    sendSuccessResponse(res, result, "Live meetings fetched", 200);
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

    const { aadharCardNumber, learnerPhoto, learnerPhotoS3Key, acceptedTerms } =
      req.body as {
        aadharCardNumber?: string;
        learnerPhoto?: string;
        learnerPhotoS3Key?: string;
        acceptedTerms?: boolean;
      };

    const result = await submitInternshipDocumentation(
      enrollmentId,
      new mongoose.Types.ObjectId(String(userId)),
      {
        aadharCardNumber: String(aadharCardNumber ?? ""),
        learnerPhoto: String(learnerPhoto ?? ""),
        learnerPhotoS3Key: String(learnerPhotoS3Key ?? ""),
        acceptedTerms: acceptedTerms === true,
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
 * @route   POST /api/internship-enrollments/admin/:enrollmentId/documentation/verify
 * @desc    Admin approves or rejects submitted documentation on a docs_under_review enrollment
 * @body    { action: "approve" | "reject", rejectionNote?: string }
 * @access  Admin
 */
export const adminVerifyInternshipDocumentationController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminUserId = req.user?._id;
    if (!adminUserId) throw new AppError("Unauthorized", 401);

    const enrollmentId = String(req.params.enrollmentId ?? "").trim();
    if (!enrollmentId) throw new AppError("enrollmentId is required", 400);

    const { action, rejectionNote } = req.body as {
      action?: string;
      rejectionNote?: string;
    };

    if (action !== "approve" && action !== "reject") {
      throw new AppError('action must be "approve" or "reject"', 400);
    }

    const row = await adminVerifyInternshipDocumentation(
      enrollmentId,
      action,
      new mongoose.Types.ObjectId(String(adminUserId)),
      typeof rejectionNote === "string" ? rejectionNote : undefined,
    );

    const message =
      action === "approve"
        ? "Documentation approved — enrollment queued for offer letter"
        : "Documentation rejected — learner must resubmit";
    sendSuccessResponse(res, row, message, 200);
  },
);

/**
 * @route   GET /api/internship-enrollments/admin/documentation/pending-internships
 * @desc    List internships that have at least one `docs_under_review`
 *          enrollment, with per-internship pending counts. Drives the
 *          internship filter on the admin doc-review queue.
 * @access  Admin
 */
export const listInternshipsWithPendingDocReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const result = await listInternshipsWithPendingDocReview({
      page,
      limit,
      search,
    });
    sendSuccessResponse(res, result, "Pending-doc internships fetched", 200);
  },
);

/**
 * @route   POST /api/internship-enrollments/admin/documentation/bulk-approve
 * @desc    Bulk-approve a set of `docs_under_review` enrollments. Returns
 *          per-row results so partial failures are visible to the admin UI.
 * @body    { enrollmentIds: string[] }
 * @access  Admin
 */
export const adminBulkApproveInternshipDocumentationController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminUserId = req.user?._id;
    if (!adminUserId) throw new AppError("Unauthorized", 401);

    const { enrollmentIds } = req.body as { enrollmentIds?: unknown };
    if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      throw new AppError("enrollmentIds must be a non-empty array", 400);
    }

    const ids = enrollmentIds
      .filter((v): v is string => typeof v === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      throw new AppError("No valid enrollmentIds provided", 400);
    }

    const result = await adminBulkApproveInternshipDocumentation(
      ids,
      new mongoose.Types.ObjectId(String(adminUserId)),
    );
    sendSuccessResponse(
      res,
      result,
      `Approved ${result.ok}/${ids.length} — ${result.failed} failed`,
      200,
    );
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

/**
 * @route   GET /api/admin/offerletter-jobs
 * @desc    List offer-letter generation jobs (queue)
 * @query   page, limit, status?=pending|processing|completed|failed, search?
 *          (`pending` in query matches both pending and processing rows.)
 * @access  Admin
 */
export const listOfferLetterJobsController = asyncHandler(
  async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const statusFilter:
      | OfferLetterJobStatus
      | OfferLetterJobStatus[]
      | undefined =
      status === "pending"
        ? ["pending", "processing"]
        : status === "processing" ||
            status === "completed" ||
            status === "failed"
          ? (status as OfferLetterJobStatus)
          : undefined;

    const result = await getAllOfferLetterJobsService({
      page,
      limit,
      status: statusFilter,
      search,
    });
    sendSuccessResponse(res, result, "Offer letter jobs retrieved", 200);
  },
);

/**
 * @route   POST /api/admin/offerletter-jobs/:jobId/retry
 * @desc    Re-queue a failed offer-letter job for the worker
 * @access  Admin
 */
export const retryOfferLetterJobController = asyncHandler(
  async (req: Request, res: Response) => {
    const jobId = String(req.params.jobId ?? "").trim();
    if (!jobId) throw new AppError("jobId is required", 400);
    const job = await retryOfferLetterJobService(jobId);
    sendSuccessResponse(res, job, "Job queued for retry successfully", 200);
  },
);
