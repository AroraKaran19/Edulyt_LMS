import { Request, Response } from "express";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getBucketName } from "../config/s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { asyncHandler, AppError, sendSuccessResponse } from "../middlewares/error.middleware";

export class UploadController {
  /**
   * Generate presigned URL for direct uploads
   * @route POST /api/upload/presigned-url
   * @access Public (need to be protected with auth middleware in production)
   */
  generatePresignedUrl = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { fileName, fileType, folderName } = req.body;

    if (!fileName || !fileType || !folderName) {
      throw new AppError("fileName, fileType, and folderName are required", 400);
    }

    const s3Client = await getS3Client();
    const bucketName = getBucketName();
    const region = process.env.AWS_REGION;

    if (!region) {
      throw new AppError("AWS_REGION is not defined in environment variables", 500);
    }

    // Generate unique filename
    const fileExtension = path.extname(fileName);
    const baseName = path.basename(fileName, fileExtension);
    const uniqueFileName = `${baseName}-${uuidv4()}${fileExtension}`;

    // Create S3 key with folder structure
    const s3Key = `${folderName}/${uniqueFileName}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Generate public URL with correct region
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

    const data = {
      presignedUrl,
      fileName: uniqueFileName,
      publicUrl,
      expiresIn: 3600,
      folderName: folderName,
      s3Key: s3Key,
    };

    sendSuccessResponse(res, data, "Presigned URL generated successfully");
  });

  /**
   * Generate presigned URL for secure file access
   * @route POST /api/upload/presigned-url/access
   * @access Public (need to be protected with auth middleware in production)
   */
  generateAccessPresignedUrl = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { s3Key, expiresIn = 60 } = req.body;

    if (!s3Key) {
      throw new AppError("s3Key is required", 400);
    }

    const s3Client = await getS3Client();
    const bucketName = getBucketName();

    // Generate presigned URL for GET access
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: parseInt(expiresIn.toString()),
    });

    const data = {
      presignedUrl,
      s3Key,
      expiresIn: parseInt(expiresIn.toString()),
    };

    sendSuccessResponse(res, data, "Access presigned URL generated successfully");
  });

  /**
   * Delete file from S3
   * @route DELETE /api/upload/:s3Key
   * @access Public (need to be protected with auth middleware in production)
   */
  deleteFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { s3Key } = req.params;

    if (!s3Key) {
      throw new AppError("S3 key is required", 400);
    }

    const s3Client = await getS3Client();
    const bucketName = getBucketName();

    // Decode the S3 key (in case it was URL encoded)
    const decodedS3Key = decodeURIComponent(s3Key);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: decodedS3Key,
    });

    await s3Client.send(deleteCommand);

    const data = {
      s3Key: decodedS3Key,
    };

    sendSuccessResponse(res, data, "File deleted successfully");
  });

  /**
   * Get file information
   * @route GET /api/upload/:s3Key/info
   * @access Public
   */
  getFileInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { s3Key } = req.params;

    if (!s3Key) {
      throw new AppError("S3 key is required", 400);
    }

    const bucketName = getBucketName();
    const decodedS3Key = decodeURIComponent(s3Key);
    const region = process.env.AWS_REGION;

    if (!region) {
      throw new AppError("AWS_REGION is not defined in environment variables", 500);
    }

    // Generate public URL with correct region
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${decodedS3Key}`;

    // Extract folder name and file name from S3 key
    const pathParts = decodedS3Key.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const folderName = pathParts.slice(0, -1).join("/");

    const data = {
      s3Key: decodedS3Key,
      fileName: fileName,
      folderName: folderName,
      url: publicUrl,
    };

    sendSuccessResponse(res, data, "File information retrieved successfully");
  });
}
