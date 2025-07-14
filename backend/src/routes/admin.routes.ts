import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const adminController = new AdminController();

/**
 * @route   POST /api/admin/courses
 * @desc    Add a new course to the database
 * @access  Private (Admin only)
 * @body    Course data object
 * @example 
 *   POST /api/admin/courses
 *   Body: { title: "Course Title", description: "...", category: "programming", ... }
 */
router.post('/add/courses', adminController.addCourse);

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses (including inactive ones) with pagination and filtering
 * @access  Private (Admin only)
 * @params  
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - filter: Filter by categories (can be used multiple times)
 *   - search: Search in title, description (optional)
 * @example 
 *   GET /api/admin/courses?page=1&limit=10&filter=programming&search=javascript
 */
router.get('/courses', adminController.getAllCoursesAdmin);

/**
 * @route   PATCH /api/admin/courses/:courseId/status
 * @desc    Update course status (activate/deactivate)
 * @access  Private (Admin only)
 * @params  
 *   - courseId: Course ID (URL parameter)
 * @body    { isActive: boolean }
 * @example 
 *   PATCH /api/admin/courses/course-123/status
 *   Body: { isActive: false }
 */
router.patch('/courses/:courseId/status', adminController.updateCourseStatus);

/**
 * @route   GET /api/admin/debug/courses
 * @desc    Debug endpoint to get all courses in database (regardless of status)
 * @access  Private (Admin only)
 * @example 
 *   GET /api/admin/debug/courses
 */
router.get('/debug/courses', adminController.debugAllCourses);

export { router as adminRoutes }; 