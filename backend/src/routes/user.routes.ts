import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { 
  authenticate, 
  authorize, 
  authorizeOwnerOrAdmin,
  requireEmailVerification,
  rateLimit
} from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

// Rate limiting for user routes
const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  message: 'Too many requests to user endpoints'
});

const sensitiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per window
  message: 'Too many sensitive operations'
});

// Apply rate limiting to all user routes
router.use(userRateLimit);

// Public routes (no authentication required)

/**
 * @route   GET /api/users/search
 * @desc    Search users (admin only)
 * @access  Private (Admin)
 * @query   { q?, role?, status?, page?, limit? }
 */
router.get('/search', authenticate, authorize('admin', 'superadmin'), userController.searchUsers);

// Protected routes (authentication required)

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   GET /api/users/:userId/profile
 * @desc    Get user profile by ID
 * @access  Private (Owner or Admin)
 */
router.get('/:userId/profile', authenticate, authorizeOwnerOrAdmin('userId'), userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * @route   PUT /api/users/:userId/profile
 * @desc    Update user profile by ID
 * @access  Private (Owner or Admin)
 */
router.put('/:userId/profile', authenticate, authorizeOwnerOrAdmin('userId'), userController.updateProfile);

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', authenticate, userController.updatePreferences);

/**
 * @route   PUT /api/users/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.put('/avatar', authenticate, userController.updateAvatar);

/**
 * @route   GET /api/users/courses/enrolled
 * @desc    Get current user's enrolled courses
 * @access  Private
 */
router.get('/courses/enrolled', authenticate, userController.getEnrolledCourses);

/**
 * @route   GET /api/users/:userId/courses/enrolled
 * @desc    Get user's enrolled courses by ID
 * @access  Private (Owner or Admin)
 */
router.get('/:userId/courses/enrolled', authenticate, authorizeOwnerOrAdmin('userId'), userController.getEnrolledCourses);

/**
 * @route   POST /api/users/courses/enroll
 * @desc    Enroll in a course
 * @access  Private (Email verified)
 * @body    { courseId }
 */
router.post('/courses/enroll', authenticate, requireEmailVerification, userController.enrollInCourse);

/**
 * @route   POST /api/users/courses/complete
 * @desc    Mark course as completed
 * @access  Private (Email verified)
 * @body    { courseId }
 */
router.post('/courses/complete', authenticate, requireEmailVerification, userController.completeCourse);

/**
 * @route   GET /api/users/stats
 * @desc    Get current user's statistics
 * @access  Private
 */
router.get('/stats', authenticate, userController.getUserStats);

/**
 * @route   GET /api/users/:userId/stats
 * @desc    Get user statistics by ID
 * @access  Private (Owner or Admin)
 */
router.get('/:userId/stats', authenticate, authorizeOwnerOrAdmin('userId'), userController.getUserStats);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete current user's account
 * @access  Private
 * @body    { confirmPassword }
 */
router.delete('/account', authenticate, sensitiveRateLimit, userController.deleteAccount);

/**
 * @route   DELETE /api/users/:userId/account
 * @desc    Delete user account by ID
 * @access  Private (Owner or Admin)
 * @body    { confirmPassword }
 */
router.delete('/:userId/account', authenticate, sensitiveRateLimit, authorizeOwnerOrAdmin('userId'), userController.deleteAccount);

// Health check for user service
/**
 * @route   GET /api/users/health
 * @desc    Health check for user service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router; 