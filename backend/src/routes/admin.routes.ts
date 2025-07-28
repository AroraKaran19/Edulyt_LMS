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
 *   Body: { basicInfo: { courseTitle: "...", courseDescription: "..." }, ... }
 */
router.post('/courses', adminController.addCourse);

/**
 * @route   POST /api/admin/add/courses
 * @desc    Add a new course to the database (legacy endpoint)
 * @access  Private (Admin only)
 * @body    Course data object
 * @example 
 *   POST /api/admin/add/courses
 *   Body: { basicInfo: { courseTitle: "...", courseDescription: "..." }, ... }
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
 * @route   GET /api/admin/courses/:courseId
 * @desc    Get a specific course by ID for admin view (including inactive courses)
 * @access  Private (Admin only)
 * @params  
 *   - courseId: Course ID (URL parameter)
 * @example 
 *   GET /api/admin/courses/course_67890
 */
router.get('/courses/:courseId', adminController.getCourseByIdAdmin);

/**
 * @route   PUT /api/admin/courses/:courseId
 * @desc    Update a course by ID (Admin only)
 * @access  Private (Admin only)
 * @params  
 *   - courseId: Course ID (URL parameter)
 * @body    Course data object
 * @example 
 *   PUT /api/admin/courses/course_67890
 *   Body: { basicInfo: { courseTitle: "...", courseDescription: "..." }, ... }
 */
router.put('/courses/:courseId', adminController.updateCourse);
router.options('/courses/:courseId', (req, res) => {
  res.status(200).end();
});

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
 * @route   DELETE /api/admin/courses/:courseId
 * @desc    Delete course by ID (Admin only)
 * @access  Private (Admin only)
 * @params  
 *   - courseId: Course ID (URL parameter)
 * @example 
 *   DELETE /api/admin/courses/course-123
 */
router.delete('/courses/:courseId', adminController.deleteCourse);

/**
 * @route   POST /api/admin/courses/:courseId/cleanup-s3
 * @desc    Manually cleanup S3 assets for a course (Admin utility)
 * @access  Private (Admin only)
 * @params  
 *   - courseId: Course ID (URL parameter)
 * @example 
 *   POST /api/admin/courses/course-123/cleanup-s3
 */
router.post('/courses/:courseId/cleanup-s3', adminController.cleanupCourseS3Assets);

export { router as adminRoutes }; 