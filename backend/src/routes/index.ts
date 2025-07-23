import { Router } from 'express';
import { courseRoutes } from './course.routes';
import { adminRoutes } from './admin.routes';
import uploadRoutes from './upload.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount user routes
router.use('/users', userRoutes);

// Mount course routes
router.use('/courses', courseRoutes);

// Mount admin routes
router.use('/admin', adminRoutes);

// Mount upload routes
router.use('/upload', uploadRoutes);


export { router as apiRoutes }; 