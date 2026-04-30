import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  generatePresignedUrl,
  deleteFileFromS3,
  validateFile,
  getFileValidationRules,
  PresignedUrlRequest,
} from "../services/upload.services";

/**
 * Generate presigned URL for file upload
 * @route POST /api/upload/presigned-url
 * @access User
 */
export const generatePresignedUrlController = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      fileName,
      fileType,
      folderName,
      fileSize: fileSizeBody,
    } = req.body as PresignedUrlRequest & { fileSize?: number | string };

    if (!fileName || !fileType || !folderName) {
      return res.status(400).json({
        success: false,
        error: {
          message: "fileName, fileType, and folderName are required",
          type: "ValidationError",
          statusCode: 400,
        },
      });
    }

    const fileSize =
      typeof fileSizeBody === "number"
        ? fileSizeBody
        : fileSizeBody != null && fileSizeBody !== ""
          ? Number(fileSizeBody)
          : undefined;

    try {
      const presignedData = await generatePresignedUrl({
        fileName,
        fileType,
        folderName,
        fileSize:
          typeof fileSize === "number" && Number.isFinite(fileSize)
            ? fileSize
            : undefined,
      });

      return sendSuccessResponse(
        res,
        presignedData,
        "Presigned URL generated successfully"
      );
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            type: "ValidationError",
            statusCode: error.statusCode,
          },
        });
      }
      console.error("Error generating presigned URL:", error);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to generate presigned URL",
          type: "ServerError",
          statusCode: 500,
        },
      });
    }
  }
);

/**
 * Delete a file from S3
 * @route DELETE /api/upload/:s3Key
 * @access User
 */
export const deleteFileController = asyncHandler(
  async (req: Request, res: Response) => {
    const { s3Key } = req.params;

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: {
          message: "S3 key is required",
          type: "ValidationError",
          statusCode: 400,
        },
      });
    }

    try {
      await deleteFileFromS3(s3Key);

      return sendSuccessResponse(res, null, "File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to delete file",
          type: "ServerError",
          statusCode: 500,
        },
      });
    }
  }
);

/**
 * Get file validation rules for a specific folder
 * @route GET /api/upload/validation-rules/:folderName
 * @access Public
 */
export const getValidationRulesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { folderName } = req.params;

    if (!folderName) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Folder name is required",
          type: "ValidationError",
          statusCode: 400,
        },
      });
    }

    try {
      const rules = getFileValidationRules(folderName);

      return sendSuccessResponse(
        res,
        rules,
        "Validation rules retrieved successfully"
      );
    } catch (error) {
      console.error("Error getting validation rules:", error);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to get validation rules",
          type: "ServerError",
          statusCode: 500,
        },
      });
    }
  }
);

/**
 * Validate file before upload
 * @route POST /api/upload/validate
 * @access Public
 */
export const validateFileController = asyncHandler(
  async (req: Request, res: Response) => {
    const { fileType, fileSize, folderName } = req.body;

    if (!fileType || !fileSize || !folderName) {
      return res.status(400).json({
        success: false,
        error: {
          message: "fileType, fileSize, and folderName are required",
          type: "ValidationError",
          statusCode: 400,
        },
      });
    }

    try {
      const rules = getFileValidationRules(folderName);
      const validation = validateFile(
        fileType,
        fileSize,
        rules.allowedTypes,
        rules.maxSize
      );

      if (validation.valid) {
        return sendSuccessResponse(
          res,
          { valid: true },
          "File validation passed"
        );
      } else {
        return res.status(400).json({
          success: false,
          error: {
            message: validation.error,
            type: "ValidationError",
            statusCode: 400,
          },
        });
      }
    } catch (error) {
      console.error("Error validating file:", error);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to validate file",
          type: "ServerError",
          statusCode: 500,
        },
      });
    }
  }
);
