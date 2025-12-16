import express from "express";
import {
  getUserCertificates,
  getCertificateById,
  verifyCertificate,
  createCertificateJob,
  getCertificateJobStatus,
  getCertificateJobByEnrollment,
} from "../controllers/certificate.controller";
import { verifyUser } from "../middlewares/user.middleware";

const router = express.Router();

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates for authenticated user
 * @access  User
 */
router.get("/", verifyUser, getUserCertificates);

/**
 * @route   GET /api/certificates/verify/:verificationCode
 * @desc    Verify certificate by verification code (public)
 * @access  Public
 */
router.get("/verify/:verificationCode", verifyCertificate);

/**
 * @route   POST /api/certificates/generate
 * @desc    Create a certificate generation job
 * @access  User
 */
router.post("/generate", verifyUser, createCertificateJob);

/**
 * @route   GET /api/certificates/job/:jobId
 * @desc    Get certificate job status by job ID
 * @access  User
 */
router.get("/job/:jobId", verifyUser, getCertificateJobStatus);

/**
 * @route   GET /api/certificates/job/enrollment/:enrollmentId
 * @desc    Get certificate job status by enrollment ID
 * @access  User
 */
router.get("/job/enrollment/:enrollmentId", verifyUser, getCertificateJobByEnrollment);

/**
 * @route   GET /api/certificates/:certificateId
 * @desc    Get specific certificate by ID
 * @access  User
 */
router.get("/:certificateId", verifyUser, getCertificateById);

export default router;

