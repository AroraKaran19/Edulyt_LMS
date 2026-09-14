import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getUserCertificatesService,
  getCertificateByVerificationCodeService,
} from "../services/certificate.services";
import {
  createCertificateJobService,
  getCertificateJobService,
  getCertificateJobByEnrollmentService,
  getAllCertificateJobsService,
  retryCertificateJobService,
  reclaimStuckCertificateJobsService,
} from "../services/certificateJob.services";
import { readableBrands } from "../lib/brandScope";

/**
 * Get all certificates for the authenticated user (supports pagination)
 * @route GET /api/certificates
 * @access User
 * @query page, limit, search, recent (true = last 30 days), includeOldVersions
 */
export const getUserCertificates = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const includeOldVersions = req.query.includeOldVersions === "true";
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 12;
    const search = (req.query.search as string)?.trim() || undefined;
    const recentOnly = req.query.recent === "true";

    const result = await getUserCertificatesService(userId.toString(), {
      includeOldVersions,
      page,
      limit,
      search,
      recentOnly,
      brands: readableBrands(req.brand),
    });

    sendSuccessResponse(
      res,
      result,
      "Certificates retrieved successfully",
      200
    );
  }
);

/**
 * Get a specific certificate by ID
 * @route GET /api/certificates/:certificateId
 * @access User
 */
export const getCertificateById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { certificateId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    // Import CertificateModel to query by _id
    const { CertificateModel } = await import("../models/certificate.schema");

    // Get certificate and verify it belongs to the user
    const certificate = await CertificateModel.findOne({
      _id: certificateId,
      userId,
      isActive: true,
    })
      .populate("courseId", "title thumbnail")
      .populate("userId", "firstName lastName email")
      .lean();

    if (!certificate) {
      throw new AppError("Certificate not found", 404);
    }

    sendSuccessResponse(
      res,
      certificate,
      "Certificate retrieved successfully",
      200
    );
  }
);

/**
 * Get certificate by verification code (public endpoint)
 * @route GET /api/certificates/verify/:verificationCode
 * @access Public
 */
export const verifyCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const { verificationCode } = req.params;

    const certificate = await getCertificateByVerificationCodeService(
      verificationCode
    );

    if (!certificate) {
      throw new AppError("Certificate not found or invalid", 404);
    }

    sendSuccessResponse(
      res,
      certificate,
      "Certificate verified successfully",
      200
    );
  }
);

/**
 * Create a certificate generation job
 * @route POST /api/certificates/generate
 * @access User
 */
export const createCertificateJob = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { enrollmentId } = req.body;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (!enrollmentId) {
      throw new AppError("Enrollment ID is required", 400);
    }

    // Import EnrollmentModel to verify enrollment
    const { EnrollmentModel } = await import("../models/enrollment.schema");
    const enrollment = await EnrollmentModel.findById(enrollmentId);

    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    // Verify enrollment belongs to user
    if (
      !enrollment.userId ||
      enrollment.userId.toString() !== userId.toString()
    ) {
      throw new AppError("Unauthorized", 403);
    }

    // Check if enrollment is completed
    if (enrollment.status !== "completed") {
      throw new AppError(
        "Enrollment must be completed to generate certificate",
        400
      );
    }

    // Create job
    const job = await createCertificateJobService({
      enrollmentId: enrollmentId.toString(),
      studentName: "", // Will be fetched by worker
      courseName: "", // Will be fetched by worker
      completionDate: enrollment.completedAt || new Date(),
    });

    // Return 202 Accepted with job ID
    res.status(202).json({
      success: true,
      message: "Certificate generation job created",
      data: {
        jobId: job.jobId,
        status: job.status,
        enrollmentId: job.enrollmentId,
      },
    });
  }
);

/**
 * Get certificate job status
 * @route GET /api/certificates/job/:jobId
 * @access User
 */
export const getCertificateJobStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { jobId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const job = await getCertificateJobService(jobId);

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    // Verify job belongs to user's enrollment
    const { EnrollmentModel } = await import("../models/enrollment.schema");
    const enrollment = await EnrollmentModel.findById(job.enrollmentId);

    if (
      !enrollment ||
      !enrollment.userId ||
      enrollment.userId.toString() !== userId.toString()
    ) {
      throw new AppError("Unauthorized", 403);
    }

    sendSuccessResponse(res, job, "Job status retrieved successfully", 200);
  }
);

/**
 * Get certificate job status by enrollment ID
 * @route GET /api/certificates/job/enrollment/:enrollmentId
 * @access User
 */
export const getCertificateJobByEnrollment = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { enrollmentId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    // Verify enrollment belongs to user
    const { EnrollmentModel } = await import("../models/enrollment.schema");
    const enrollment = await EnrollmentModel.findById(enrollmentId);

    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    if (
      !enrollment.userId ||
      enrollment.userId.toString() !== userId.toString()
    ) {
      throw new AppError("Unauthorized", 403);
    }

    const job = await getCertificateJobByEnrollmentService(enrollmentId);

    if (!job) {
      throw new AppError("Job not found for this enrollment", 404);
    }

    sendSuccessResponse(res, job, "Job status retrieved successfully", 200);
  }
);

/**
 * Get all certificate jobs (admin)
 * @route GET /api/admin/certificate-jobs
 * @access Admin
 */
export const getAllCertificateJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const status = req.query.status as string | undefined;
    const certificateType = req.query.certificateType as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await getAllCertificateJobsService({
      page,
      limit,
      status: status as "pending" | "processing" | "completed" | "failed" | undefined,
      certificateType: certificateType as "course" | "internship" | undefined,
      search,
    });

    sendSuccessResponse(res, result, "Certificate jobs retrieved successfully", 200);
  }
);

/**
 * Retry a failed certificate job (admin)
 * @route POST /api/admin/certificate-jobs/:jobId/retry
 * @access Admin
 */
export const retryCertificateJob = asyncHandler(
  async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const job = await retryCertificateJobService(jobId);

    sendSuccessResponse(res, job, "Job queued for retry successfully", 200);
  }
);

/**
 * Reclaim certificate jobs wedged in `processing` (admin, manual).
 *
 * The certificate worker never sweeps on its own, so this is the only way a
 * job orphaned by a crashed process gets unblocked. Until it runs, the partial
 * unique index keeps rejecting new jobs for that enrollment.
 *
 * Takes no parameters. The stuck threshold and reclaim limit come from
 * CERTIFICATE_WORKER_STUCK_TIMEOUT_MIN / CERTIFICATE_WORKER_MAX_STUCK_RECLAIMS,
 * so the thresholds stay operator-controlled rather than settable per request.
 *
 * @route POST /api/admin/certificate-jobs/reclaim-stuck
 * @access Admin
 */
export const reclaimStuckCertificateJobs = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await reclaimStuckCertificateJobsService();

    sendSuccessResponse(
      res,
      result,
      `Reclaim sweep complete: ${result.reclaimed} requeued, ${result.failed} marked failed`,
      200,
    );
  }
);

/**
 * Get certificates for a user by userId (admin only)
 * @route GET /api/admin/users/:userId/certificates
 * @access Admin
 */
export const getCertificatesByUserId = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 100;

    const result = await getUserCertificatesService(userId, {
      includeOldVersions: false,
      limit,
    });

    const certificates = Array.isArray(result) ? result : result.certificates;
    sendSuccessResponse(
      res,
      { certificates },
      "User certificates retrieved successfully",
      200
    );
  }
);
