import { Router } from 'express';
import { courseRoutes } from './course.routes';

const router = Router();

// Mount course routes
router.use('/courses', courseRoutes);


export { router as apiRoutes }; 