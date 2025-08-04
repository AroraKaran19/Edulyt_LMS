import { Request, Response } from 'express';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getBucketName } from '../config/s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 1000 * 1024 * 1024, // 100GB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, we'll validate in the controller
    cb(null, true);
  },
});

export class UploadController {
  /**
   * Upload file to S3 with dynamic folder creation
   * @route POST /api/upload
   * @access Public (need to be protected with auth middleware in production)
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      const { folderName } = req.body;
      
      if (!folderName) {
        res.status(400).json({
          success: false,
          message: 'Folder name is required',
          error: 'folderName field is missing in request body'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
          error: 'file field is missing in request'
        });
        return;
      }

      const file = req.file;
      const s3Client = await getS3Client();
      const bucketName = getBucketName();

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      
      // Create S3 key with folder structure
      const s3Key = `${folderName}/${uniqueFileName}`;

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      });

      await s3Client.send(uploadCommand);

      // Generate public URL
      const publicUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileName: uniqueFileName,
          originalName: file.originalname,
          url: publicUrl,
          size: file.size,
          mimetype: file.mimetype,
          folderName: folderName,
          s3Key: s3Key
        }
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Ensure we always send a JSON response
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to upload file',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Upload multiple files to S3 with dynamic folder creation
   * @route POST /api/upload/multiple
   * @access Public (need to be protected with auth middleware in production)
   */
  async uploadMultipleFiles(req: Request, res: Response): Promise<void> {
    try {
      const { folderName } = req.body;
      
      if (!folderName) {
        res.status(400).json({
          success: false,
          message: 'Folder name is required',
          error: 'folderName field is missing in request body'
        });
        return;
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded',
          error: 'files field is missing or empty in request'
        });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const s3Client = await getS3Client();
      const bucketName = getBucketName();

      const uploadPromises = files.map(async (file) => {
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const uniqueFileName = `${uuidv4()}${fileExtension}`;
        
        // Create S3 key with folder structure
        const s3Key = `${folderName}/${uniqueFileName}`;

        // Upload to S3
        const uploadCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
        });

        await s3Client.send(uploadCommand);

        // Generate public URL
        const publicUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

        return {
          fileName: uniqueFileName,
          originalName: file.originalname,
          url: publicUrl,
          size: file.size,
          mimetype: file.mimetype,
          folderName: folderName,
          s3Key: s3Key
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      res.status(200).json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: {
          files: uploadedFiles,
          folderName: folderName,
          totalFiles: uploadedFiles.length
        }
      });

    } catch (error) {
      console.error('Error uploading multiple files:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload files',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

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
          message: 'fileName, fileType, and folderName are required',
          error: 'Missing required fields in request body'
        });
        return;
      }

      const s3Client = await getS3Client();
      const bucketName = getBucketName();

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

      // Generate public URL
      const publicUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

      res.status(200).json({
        success: true,
        message: 'Presigned URL generated successfully',
        data: {
          presignedUrl,
          fileName: uniqueFileName,
          publicUrl,
          expiresIn: 3600,
          folderName: folderName,
          s3Key: s3Key
        }
      });

    } catch (error) {
      console.error('Error generating presigned URL:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate presigned URL',
        error: error instanceof Error ? error.message : 'Unknown error'
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
          message: 'S3 key is required',
          error: 's3Key parameter is missing'
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
        message: 'File deleted successfully',
        data: {
          s3Key: decodedS3Key
        }
      });

    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: error instanceof Error ? error.message : 'Unknown error'
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
          message: 'S3 key is required',
          error: 's3Key parameter is missing'
        });
        return;
      }

      const bucketName = getBucketName();
      const decodedS3Key = decodeURIComponent(s3Key);
      
      // Generate public URL
      const publicUrl = `https://${bucketName}.s3.amazonaws.com/${decodedS3Key}`;
      
      // Extract folder name and file name from S3 key
      const pathParts = decodedS3Key.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const folderName = pathParts.slice(0, -1).join('/');

      res.status(200).json({
        success: true,
        message: 'File information retrieved successfully',
        data: {
          s3Key: decodedS3Key,
          fileName: fileName,
          folderName: folderName,
          url: publicUrl
        }
      });

    } catch (error) {
      console.error('Error getting file info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get file information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get multer middleware for single file upload
   */
  static getSingleUploadMiddleware() {
    return upload.single('file');
  }

  /**
   * Get multer middleware for multiple file upload
   */
  static getMultipleUploadMiddleware() {
    return upload.array('files', 10); // Max 10 files
  }
}