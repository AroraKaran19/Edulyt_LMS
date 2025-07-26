import { Router } from 'express';
import { MultipartUploadController } from '../controllers/multipart-upload.controller';

const router = Router();
const multipartUploadController = new MultipartUploadController();

// Initialize multipart upload for large files
router.post('/initialize', multipartUploadController.initializeMultipartUpload);

// Generate presigned URLs for uploading file parts
router.post('/generate-part-urls', multipartUploadController.generatePartUploadUrls);

// Complete multipart upload
router.post('/complete', multipartUploadController.completeMultipartUpload);

// Abort multipart upload
router.post('/abort', multipartUploadController.abortMultipartUpload);

// List uploaded parts
router.get('/parts', multipartUploadController.listUploadedParts);

export default router; 