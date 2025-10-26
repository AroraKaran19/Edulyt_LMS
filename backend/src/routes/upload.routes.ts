import {
  generatePresignedUrlController,
  deleteFileController,
  getValidationRulesController,
  validateFileController,
} from "../controllers/upload.controller";
import { verifyUser } from "../middlewares/user.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   POST /api/upload/presigned-url
 * @desc    Generate presigned URL for file upload
 * @access  User
 */
router.post("/presigned-url", verifyUser, generatePresignedUrlController);

/**
 * @route   DELETE /api/upload/:s3Key
 * @desc    Delete a file from S3
 * @access  User
 */
router.delete("/:s3Key", verifyUser, deleteFileController);

/**
 * @route   GET /api/upload/validation-rules/:folderName
 * @desc    Get file validation rules for a specific folder
 * @access  Public
 */
router.get("/validation-rules/:folderName", getValidationRulesController);

/**
 * @route   POST /api/upload/validate
 * @desc    Validate file before upload
 * @access  Public
 */
router.post("/validate", validateFileController);

export default router;
