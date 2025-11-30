import express from "express";
import {
  getUserCertificates,
  getCertificateById,
  verifyCertificate,
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
 * @route   GET /api/certificates/:certificateId
 * @desc    Get specific certificate by ID
 * @access  User
 */
router.get("/:certificateId", verifyUser, getCertificateById);

export default router;

