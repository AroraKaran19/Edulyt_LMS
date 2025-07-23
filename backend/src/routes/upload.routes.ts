import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';

const router = Router();
const uploadController = new UploadController();

// Get multer configuration
const upload = uploadController.getMulterConfig();

/**
 * @route POST /api/upload/course/thumbnail
 * @desc Upload course thumbnail image
 * @access Admin
 */
router.post('/course/thumbnail', upload.single('thumbnail'), uploadController.uploadCourseThumbnail);

/**
 * @route POST /api/upload/course/video
 * @desc Upload course preview/promotional video
 * @access Admin
 */
router.post('/course/video', upload.single('video'), uploadController.uploadCourseVideo);

/**
 * @route POST /api/upload/instructor/image
 * @desc Upload instructor profile image
 * @access Admin
 */
router.post('/instructor/image', upload.single('image'), uploadController.uploadInstructorImage);

/**
 * @route POST /api/upload/lesson/video
 * @desc Upload lesson video for course modules
 * @access Admin
 */
router.post('/lesson/video', upload.single('video'), uploadController.uploadLessonVideo);

/**
 * @route POST /api/upload/multiple
 * @desc Upload multiple files at once
 * @access Admin
 */
router.post('/multiple', upload.array('files', 10), uploadController.uploadMultipleFiles);

/**
 * @route POST /api/upload/presigned-url
 * @desc Generate presigned URL for direct frontend uploads
 * @access Admin
 */
router.post('/presigned-url', uploadController.generatePresignedUrl);

/**
 * @route DELETE /api/upload/:fileName
 * @desc Delete uploaded file
 * @access Admin
 */
router.delete('/:fileName(*)', uploadController.deleteFile);

/**
 * @route GET /api/upload/:fileName/info
 * @desc Get file information
 * @access Admin
 */
router.get('/:fileName(*)/info', uploadController.getFileInfo);

export default router; 