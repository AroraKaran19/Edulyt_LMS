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
