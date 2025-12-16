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
} from "../services/certificateJob.services";

/**
 * Get all certificates for the authenticated user
 * @route GET /api/certificates
 * @access User
 */
export const getUserCertificates = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const includeOldVersions = req.query.includeOldVersions === "true";
    const certificates = await getUserCertificatesService(
      userId.toString(),
      includeOldVersions
    );

    sendSuccessResponse(
      res,
      certificates,
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
