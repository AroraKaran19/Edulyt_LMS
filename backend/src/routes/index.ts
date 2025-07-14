import { Router } from 'express';
import { courseRoutes } from './course.routes';
import { adminRoutes } from './admin.routes';

const router = Router();

// Mount course routes
router.use('/courses', courseRoutes);

// Mount admin routes
router.use('/admin', adminRoutes);


export { router as apiRoutes }; 