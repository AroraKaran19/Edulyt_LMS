import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';

const router = Router();
const courseController = new CourseController();

/**
 * @route   GET /api/courses
 * @desc    Get all courses with pagination and filtering
 * @access  Public
 * @params  
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - category: Filter by categories (comma-separated: "programming,design,business")
 *   - search: Search in title, description, or short description (optional)
 * @example 
 *   GET /api/courses?page=1&limit=10&category=programming,design&search=javascript
 *   GET /api/courses?search=&category=1,2,3
 */
router.get('/', courseController.getAllCourses);

/**
 * @route   GET /api/courses/featured
 * @desc    Get all featured courses
 * @access  Public
 */
router.get('/featured', courseController.getFeaturedCourses);

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (should be protected with auth middleware)
 */
router.post('/', courseController.createCourse);

export { router as courseRoutes }; 