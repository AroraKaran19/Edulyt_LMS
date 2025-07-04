import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';

const router = Router();
const courseController = new CourseController();

/**
 * @route POST /api/courses
 * @desc Create a new course
 * @access Private (should be protected with auth middleware)
 */
router.post('/', courseController.createCourse);


export { router as courseRoutes }; 