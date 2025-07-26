import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../services/s3.service';

export class MultipartUploadController {
  private s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();
  }

  /**
   * Initialize a multipart upload for large files
   * @param req - Express request object
   * @param res - Express response object
   */
  initializeMultipartUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, fileType, uploadType = 'large-files' } = req.body;

      if (!fileName || !fileType) {
        res.status(400).json({
          success: false,
          message: 'fileName and fileType are required'
        });
        return;
      }

      // Validate file type for large uploads
      const allowedTypes = [
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
        'application/zip', 'application/x-zip-compressed',
        'application/octet-stream', // For generic large files
        'application/pdf'
      ];

      if (!allowedTypes.includes(fileType)) {
        res.status(400).json({
          success: false,
          message: `File type ${fileType} is not allowed for large uploads. Allowed types: ${allowedTypes.join(', ')}`
        });
        return;
      }

      // Generate unique key
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uploadType}/${uuidv4()}.${fileExtension}`;

      // Initialize multipart upload
      const result = await this.s3Service.createMultipartUpload(
        uniqueFileName,
        fileType,
        {
          originalName: fileName,
          uploadType: 'multipart-large-file',
          initiatedAt: new Date().toISOString()
        }
      );

      res.status(200).json({
        success: true,
        message: 'Multipart upload initialized successfully',
        data: {
          uploadId: result.uploadId,
          fileName: uniqueFileName,
          publicUrl: this.s3Service.getPublicUrl(uniqueFileName)
        }
      });

    } catch (error) {
      console.error('Error initializing multipart upload:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize multipart upload',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Generate presigned URLs for uploading file parts
   * @param req - Express request object
   * @param res - Express response object
   */
  generatePartUploadUrls = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, uploadId, partNumbers } = req.body;

      if (!fileName || !uploadId || !partNumbers || !Array.isArray(partNumbers)) {
        res.status(400).json({
          success: false,
          message: 'fileName, uploadId, and partNumbers array are required'
        });
        return;
      }

      // Validate part numbers (S3 supports 1-10000 parts)
      if (partNumbers.some((num: number) => num < 1 || num > 10000)) {
        res.status(400).json({
          success: false,
          message: 'Part numbers must be between 1 and 10000'
        });
        return;
      }

      // Generate presigned URLs for each part (valid for 2 hours for large uploads)
      const urlPromises = partNumbers.map(async (partNumber: number) => {
        const presignedUrl = await this.s3Service.generateMultipartUploadUrl(
          fileName,
          uploadId,
          partNumber,
          7200 // 2 hours
        );
        return { partNumber, presignedUrl };
      });

      const partUrls = await Promise.all(urlPromises);

      res.status(200).json({
        success: true,
        message: 'Part upload URLs generated successfully',
        data: {
          uploadId,
          fileName,
          partUrls,
          expiresIn: 7200
        }
      });

    } catch (error) {
      console.error('Error generating part upload URLs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate part upload URLs',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Complete multipart upload
   * @param req - Express request object
   * @param res - Express response object
   */
  completeMultipartUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, uploadId, parts } = req.body;

      if (!fileName || !uploadId || !parts || !Array.isArray(parts)) {
        res.status(400).json({
          success: false,
          message: 'fileName, uploadId, and parts array are required'
        });
        return;
      }

      // Validate parts format
      const isValidParts = parts.every((part: any) => 
        part.ETag && typeof part.PartNumber === 'number' && part.PartNumber >= 1
      );

      if (!isValidParts) {
        res.status(400).json({
          success: false,
          message: 'Each part must have ETag and PartNumber'
        });
        return;
      }

      // Complete the multipart upload
      const result = await this.s3Service.completeMultipartUpload(fileName, uploadId, parts);

      res.status(200).json({
        success: true,
        message: 'Large file upload completed successfully',
        data: {
          fileName,
          url: result.location,
          etag: result.etag
        }
      });

    } catch (error) {
      console.error('Error completing multipart upload:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete multipart upload',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Abort multipart upload
   * @param req - Express request object
   * @param res - Express response object
   */
  abortMultipartUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, uploadId } = req.body;

      if (!fileName || !uploadId) {
        res.status(400).json({
          success: false,
          message: 'fileName and uploadId are required'
        });
        return;
      }

      await this.s3Service.abortMultipartUpload(fileName, uploadId);

      res.status(200).json({
        success: true,
        message: 'Multipart upload aborted successfully'
      });

    } catch (error) {
      console.error('Error aborting multipart upload:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to abort multipart upload',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * List completed parts of a multipart upload
   * @param req - Express request object
   * @param res - Express response object
   */
  listUploadedParts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, uploadId } = req.query;

      if (!fileName || !uploadId) {
        res.status(400).json({
          success: false,
          message: 'fileName and uploadId query parameters are required'
        });
        return;
      }

      const parts = await this.s3Service.listMultipartUploadParts(
        fileName as string,
        uploadId as string
      );

      res.status(200).json({
        success: true,
        message: 'Uploaded parts retrieved successfully',
        data: {
          fileName,
          uploadId,
          parts,
          totalParts: parts.length
        }
      });

    } catch (error) {
      console.error('Error listing uploaded parts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list uploaded parts',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };
} 