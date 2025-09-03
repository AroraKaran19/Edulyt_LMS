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

export class UploadController {
  /**
   * Generate presigned URL for direct uploads
   * @route POST /api/upload/presigned-url
   * @access Public (need to be protected with auth middleware in production)
   */
  async generatePresignedUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, fileType, folderName } = req.body;

      if (!fileName || !fileType || !folderName) {
        res.status(400).json({
          success: false,
          message: "fileName, fileType, and folderName are required",
          error: "Missing required fields in request body",
        });
        return;
      }

      const s3Client = await getS3Client();
      const bucketName = getBucketName();
      const region = process.env.AWS_REGION;

      if (!region) {
        throw new Error("AWS_REGION is not defined in environment variables");
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

      res.status(200).json({
        success: true,
        message: "Presigned URL generated successfully",
        data: {
          presignedUrl,
          fileName: uniqueFileName,
          publicUrl,
          expiresIn: 3600,
          folderName: folderName,
          s3Key: s3Key,
        },
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate presigned URL",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Generate presigned URL for secure file access
   * @route POST /api/upload/presigned-url/access
   * @access Public (need to be protected with auth middleware in production)
   */
  async generateAccessPresignedUrl(req: Request, res: Response): Promise<void> {
    try {
      const { s3Key, expiresIn = 60 } = req.body;

      if (!s3Key) {
        res.status(400).json({
          success: false,
          message: "s3Key is required",
          error: "Missing s3Key in request body",
        });
        return;
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

      res.status(200).json({
        success: true,
        message: "Access presigned URL generated successfully",
        data: {
          presignedUrl,
          s3Key,
          expiresIn: parseInt(expiresIn.toString()),
        },
      });
    } catch (error) {
      console.error("Error generating access presigned URL:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate access presigned URL",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete file from S3
   * @route DELETE /api/upload/:s3Key
   * @access Public (need to be protected with auth middleware in production)
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { s3Key } = req.params;

      if (!s3Key) {
        res.status(400).json({
          success: false,
          message: "S3 key is required",
          error: "s3Key parameter is missing",
        });
        return;
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

      res.status(200).json({
        success: true,
        message: "File deleted successfully",
        data: {
          s3Key: decodedS3Key,
        },
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete file",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get file information
   * @route GET /api/upload/:s3Key/info
   * @access Public
   */
  async getFileInfo(req: Request, res: Response): Promise<void> {
    try {
      const { s3Key } = req.params;

      if (!s3Key) {
        res.status(400).json({
          success: false,
          message: "S3 key is required",
          error: "s3Key parameter is missing",
        });
        return;
      }

      const bucketName = getBucketName();
      const decodedS3Key = decodeURIComponent(s3Key);
      const region = process.env.AWS_REGION;

      if (!region) {
        throw new Error("AWS_REGION is not defined in environment variables");
      }

      // Generate public URL with correct region
      const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${decodedS3Key}`;

      // Extract folder name and file name from S3 key
      const pathParts = decodedS3Key.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const folderName = pathParts.slice(0, -1).join("/");

      res.status(200).json({
        success: true,
        message: "File information retrieved successfully",
        data: {
          s3Key: decodedS3Key,
          fileName: fileName,
          folderName: folderName,
          url: publicUrl,
        },
      });
    } catch (error) {
      console.error("Error getting file info:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get file information",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
