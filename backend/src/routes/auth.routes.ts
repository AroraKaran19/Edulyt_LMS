import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { 
  authenticate, 
  rateLimit, 
  authCors,
  requestLogger 
} from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Apply CORS and logging to all auth routes
router.use(authCors);
router.use(requestLogger);

// Rate limiting for auth routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per window
  message: 'Too many authentication attempts, please try again later'
});

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per window
  message: 'Too many requests, please try again later'
});

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, name, firstName?, lastName?, username?, role? }
 */
router.post('/register', authRateLimit, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password, rememberMe? }
 */
router.post('/login', authRateLimit, authController.login);

/**
 * @route   POST /api/auth/oauth/callback
 * @desc    OAuth authentication callback
 * @access  Public
 * @body    { provider, providerData }
 */
router.post('/oauth/callback', authRateLimit, authController.oauthCallback);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh-token', authRateLimit, authController.refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', strictRateLimit, authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @body    { token, password }
 */
router.post('/reset-password', strictRateLimit, authController.resetPassword);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 * @body    { token }
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 * @body    { email }
 */
router.post('/resend-verification', strictRateLimit, authController.resendVerification);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/session
 * @desc    Get current user session
 * @access  Private
 */
router.get('/session', authenticate, authController.getSession);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 * @body    { refreshToken? }
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices (invalidate all refresh tokens)
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.post('/change-password', authenticate, strictRateLimit, authController.changePassword);

// Health check route
/**
 * @route   GET /api/auth/health
 * @desc    Health check for auth service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router; 