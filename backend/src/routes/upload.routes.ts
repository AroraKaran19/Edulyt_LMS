import { Router } from 'express';
import { UploadController } from '../controllers';

const router = Router();
const uploadController = new UploadController();

/**
 * @route   POST /api/upload
 * @desc    Upload single file to S3 with folder creation
 * @access  Public (should be protected with auth middleware in production)
 * @body    
 *   - file: File to upload (multipart/form-data)
 *   - folderName: Name of the folder to create/use in S3 bucket
 * @example
 *   POST /api/upload
 *   Content-Type: multipart/form-data
 *   Body: { file: [file], folderName: "course-thumbnails" }
 */
router.post(
  '/', 
  UploadController.getSingleUploadMiddleware(), 
  uploadController.uploadFile.bind(uploadController)
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files to S3 with folder creation
 * @access  Public (should be protected with auth middleware in production)
 * @body    
 *   - files: Array of files to upload (multipart/form-data)
 *   - folderName: Name of the folder to create/use in S3 bucket
 * @example
 *   POST /api/upload/multiple
 *   Content-Type: multipart/form-data
 *   Body: { files: [file1, file2, file3], folderName: "lesson-materials" }
 */
router.post(
  '/multiple', 
  UploadController.getMultipleUploadMiddleware(), 
  uploadController.uploadMultipleFiles.bind(uploadController)
);

/**
 * @route   POST /api/upload/presigned-url
 * @desc    Generate presigned URL for direct S3 upload
 * @access  Public (should be protected with auth middleware in production)
 * @body    
 *   - fileName: Original file name
 *   - fileType: MIME type of the file
 *   - folderName: Name of the folder to create/use in S3 bucket
 * @example
 *   POST /api/upload/presigned-url
 *   Body: { 
 *     fileName: "image.jpg", 
 *     fileType: "image/jpeg", 
 *     folderName: "instructor-profiles" 
 *   }
 */
router.post(
  '/presigned-url', 
  uploadController.generatePresignedUrl.bind(uploadController)
);

/**
 * @route   DELETE /api/upload/:s3Key
 * @desc    Delete file from S3
 * @access  Public (should be protected with auth middleware in production)
 * @params  
 *   - s3Key: S3 key of the file to delete (URL encoded)
 * @example
 *   DELETE /api/upload/course-thumbnails%2Fimage-123.jpg
 */
router.delete(
  '/:s3Key(*)', 
  uploadController.deleteFile.bind(uploadController)
);

/**
 * @route   GET /api/upload/:s3Key/info
 * @desc    Get file information
 * @access  Public
 * @params  
 *   - s3Key: S3 key of the file (URL encoded)
 * @example
 *   GET /api/upload/course-thumbnails%2Fimage-123.jpg/info
 */
router.get(
  '/:s3Key(*)/info', 
  uploadController.getFileInfo.bind(uploadController)
);

export default router;