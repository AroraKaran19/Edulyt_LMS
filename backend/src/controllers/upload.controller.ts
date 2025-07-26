import { Request, Response } from 'express';
import { S3Service } from '../services/s3.service';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { UploadFolderType } from '../types/upload';

export class UploadController {
  private s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();
  }

  /**
   * Configure multer for memory storage (files will be uploaded to S3)
   */
  public getMulterConfig() {
    const storage = multer.memoryStorage();
    
    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      // Define allowed file types
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
      const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocumentTypes];
      
      if (allAllowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allAllowedTypes.join(', ')}`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit for regular uploads (Vercel compatible). Use /multipart-upload endpoints for files up to 50GB
        files: 10 // Maximum 10 files per request
      }
    });
  }

  /**
   * Upload course thumbnail image
   * @param req - Express request object with file
   * @param res - Express response object
   */
  uploadCourseThumbnail = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided'
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: 'Only image files (JPEG, PNG, WebP) are allowed for thumbnails'
        });
        return;
      }

      // Get course ID from request body if provided
      const courseId = req.body.courseId;
      const additionalPath = courseId ? `course-${courseId}` : undefined;

      // Upload to organized folder
      const uploadResult = await this.s3Service.uploadToOrganizedFolder(
        UploadFolderType.COURSE_THUMBNAIL,
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        {
          courseId: courseId
        },
        additionalPath
      );

      res.status(200).json({
        success: true,
        message: 'Thumbnail uploaded successfully',
        data: {
          fileName: uploadResult.organizedPath,
          url: uploadResult.location,
          size: req.file.size,
          mimetype: req.file.mimetype,
          folderType: uploadResult.folderType
        }
      });

    } catch (error) {
      console.error('Error uploading course thumbnail:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload thumbnail',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Upload course preview/promotional video
   * @param req - Express request object with file
   * @param res - Express response object
   */
  uploadCourseVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided'
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: 'Only video files (MP4, AVI, MOV, WMV, FLV, WebM) are allowed'
        });
        return;
      }

      // Get course ID and video type from request body
      const courseId = req.body.courseId;
      const videoType = req.body.videoType || 'preview'; // 'preview' or 'content'
      const additionalPath = courseId ? `course-${courseId}` : undefined;

      // Determine folder type based on video type
      let folderType: UploadFolderType;
      switch (videoType) {
        case 'content':
          folderType = UploadFolderType.COURSE_CONTENT_VIDEO;
          break;
        case 'preview':
        default:
          folderType = UploadFolderType.COURSE_PREVIEW_VIDEO;
          break;
      }

      // Upload to organized folder
      const uploadResult = await this.s3Service.uploadToOrganizedFolder(
        folderType,
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        {
          courseId: courseId,
          moduleId: req.body.moduleId,
          lessonId: req.body.lessonId
        },
        additionalPath
      );

      res.status(200).json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
          fileName: uploadResult.organizedPath,
          url: uploadResult.location,
          size: req.file.size,
          mimetype: req.file.mimetype,
          folderType: uploadResult.folderType,
          videoType: videoType
        }
      });

    } catch (error) {
      console.error('Error uploading course video:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload video',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Upload instructor profile image
   * @param req - Express request object with file
   * @param res - Express response object
   */
  uploadInstructorImage = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided'
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: 'Only image files (JPEG, PNG, WebP) are allowed for profile images'
        });
        return;
      }

      // Get instructor ID from request body if provided
      const instructorId = req.body.instructorId;
      const additionalPath = instructorId ? `instructor-${instructorId}` : undefined;

      // Upload to organized folder
      const uploadResult = await this.s3Service.uploadToOrganizedFolder(
        UploadFolderType.INSTRUCTOR_PROFILE_IMAGE,
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        {
          instructorId: instructorId
        },
        additionalPath
      );

      res.status(200).json({
        success: true,
        message: 'Instructor image uploaded successfully',
        data: {
          fileName: uploadResult.organizedPath,
          url: uploadResult.location,
          size: req.file.size,
          mimetype: req.file.mimetype,
          folderType: uploadResult.folderType
        }
      });

    } catch (error) {
      console.error('Error uploading instructor image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload instructor image',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Upload course module lesson video
   * @param req - Express request object with file
   * @param res - Express response object
   */
  uploadLessonVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided'
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: 'Only video files (MP4, AVI, MOV, WMV, FLV, WebM) are allowed'
        });
        return;
      }

      // Generate unique filename
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `lesson-videos/${uuidv4()}.${fileExtension}`;

      // Upload to S3
      const uploadResult = await this.s3Service.uploadFile(
        fileName,
        req.file.buffer,
        req.file.mimetype,
        {
          originalName: req.file.originalname,
          uploadType: 'lesson-video',
          uploadedAt: new Date().toISOString()
        }
      );

      res.status(200).json({
        success: true,
        message: 'Lesson video uploaded successfully',
        data: {
          fileName,
          url: uploadResult.location,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });

    } catch (error) {
      console.error('Error uploading lesson video:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload lesson video',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Upload multiple files at once
   * @param req - Express request object with files
   * @param res - Express response object
   */
  uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files provided'
        });
        return;
      }

      const uploadPromises = req.files.map(async (file: Express.Multer.File) => {
        try {
          // Determine upload folder based on file type
          let folder = 'misc';
          if (file.mimetype.startsWith('image/')) {
            folder = 'images';
          } else if (file.mimetype.startsWith('video/')) {
            folder = 'videos';
          } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
            folder = 'documents';
          }

          // Generate unique filename
          const fileExtension = file.originalname.split('.').pop();
          const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

          // Upload to S3
          const uploadResult = await this.s3Service.uploadFile(
            fileName,
            file.buffer,
            file.mimetype,
            {
              originalName: file.originalname,
              uploadType: 'bulk-upload',
              uploadedAt: new Date().toISOString()
            }
          );

          return {
            success: true,
            originalName: file.originalname,
            fileName,
            url: uploadResult.location,
            size: file.size,
            mimetype: file.mimetype
          };

        } catch (error) {
          return {
            success: false,
            originalName: file.originalname,
            error: error instanceof Error ? error.message : 'Upload failed'
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);

      res.status(200).json({
        success: true,
        message: `Uploaded ${successful.length} files successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
        data: {
          successful,
          failed,
          totalUploaded: successful.length,
          totalFailed: failed.length
        }
      });

    } catch (error) {
      console.error('Error uploading multiple files:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload files',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Generate presigned URL for direct frontend uploads
   * @param req - Express request object
   * @param res - Express response object
   */
  generatePresignedUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, fileType, uploadType = 'general' } = req.body;

      if (!fileName || !fileType) {
        res.status(400).json({
          success: false,
          message: 'fileName and fileType are required'
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(fileType)) {
        res.status(400).json({
          success: false,
          message: `File type ${fileType} is not allowed`
        });
        return;
      }

      // Generate unique key
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uploadType}/${uuidv4()}.${fileExtension}`;

      // Generate presigned URL (valid for 1 hour)
      const presignedUrl = await this.s3Service.generatePresignedUrl(uniqueFileName, 3600, 'put');

      res.status(200).json({
        success: true,
        message: 'Presigned URL generated successfully',
        data: {
          presignedUrl,
          fileName: uniqueFileName,
          publicUrl: this.s3Service.getPublicUrl(uniqueFileName),
          expiresIn: 3600
        }
      });

    } catch (error) {
      console.error('Error generating presigned URL:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate presigned URL',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Delete uploaded file
   * @param req - Express request object
   * @param res - Express response object
   */
  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName } = req.params;

      if (!fileName) {
        res.status(400).json({
          success: false,
          message: 'fileName is required'
        });
        return;
      }

      // Delete from S3
      await this.s3Service.deleteFile(fileName);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        data: {
          fileName
        }
      });

    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };

  /**
   * Get file information
   * @param req - Express request object
   * @param res - Express response object
   */
  getFileInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName } = req.params;

      if (!fileName) {
        res.status(400).json({
          success: false,
          message: 'fileName is required'
        });
        return;
      }

      // Check if file exists and get metadata
      const exists = await this.s3Service.objectExists(fileName);
      
      if (!exists) {
        res.status(404).json({
          success: false,
          message: 'File not found'
        });
        return;
      }

      const metadata = await this.s3Service.getObjectMetadata(fileName);

      res.status(200).json({
        success: true,
        message: 'File information retrieved successfully',
        data: {
          fileName,
          exists: true,
          publicUrl: this.s3Service.getPublicUrl(fileName),
          ...metadata
        }
      });

    } catch (error) {
      console.error('Error getting file info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get file information',
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };
} 