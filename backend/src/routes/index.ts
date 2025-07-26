import { Router } from 'express';
import { courseRoutes } from './course.routes';
import { adminRoutes } from './admin.routes';
import { instructorRoutes } from './instructor.routes';
import uploadRoutes from './upload.routes';
import multipartUploadRoutes from './multipart-upload.routes';

const router = Router();

// Mount course routes
router.use('/courses', courseRoutes);

// Mount instructor routes
router.use('/instructors', instructorRoutes);

// Mount admin routes (protected)
router.use('/admin', adminRoutes);

// Mount upload routes
router.use('/upload', uploadRoutes);

// Mount multipart upload routes for large files
router.use('/multipart-upload', multipartUploadRoutes);


export default router; 