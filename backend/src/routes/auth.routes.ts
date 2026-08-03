import {
  changePassword,
  generateResetPasswordToken,
  getMySessionsController,
  login,
  logout,
  partnerLogin,
  oauthSignin,
  refreshToken,
  register,
  resendRegistrationOtp,
  resetPassword,
  verifyRegistrationOtp,
  revokeOtherSessionsController,
  revokeSessionController,
} from "../controllers/auth.controller";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyTokenForRefresh } from "../middlewares/autoRefresh.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Start registration: stores a pending signup and emails a code.
 *          No account exists until POST /register/verify-otp succeeds.
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/register/verify-otp
 * @desc    Confirm the emailed code and create the account
 * @access  Public
 */
router.post("/register/verify-otp", verifyRegistrationOtp);

/**
 * @route   POST /api/auth/register/resend-otp
 * @desc    Email a fresh code for a pending signup
 * @access  Public
 */
router.post("/register/resend-otp", resendRegistrationOtp);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/partner/login
 * @desc    Partner portal credential login (main /login rejects partners server-side).
 * @access  Public
 */
router.post("/partner/login", partnerLogin);

/**
 * @route   POST /api/auth/oauth-signin
 * @desc    Handle OAuth sign in (Google, LinkedIn)
 * @access  Public
 */
router.post("/oauth-signin", oauthSignin);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using access token
 * @access  User
 */
router.post("/refresh-token", verifyTokenForRefresh, refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Revoke the current device's refresh-token family (server-side logout)
 * @access  User (must present a valid refresh token)
 */
router.post("/logout", verifyTokenForRefresh, logout);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post("/reset-password", resetPassword);

/**
 * @route   POST /api/auth/generate-reset-password-token
 * @desc    Email a password reset link. Answers identically whether or not the
 *          address has an account, and returns no token: the link exists only
 *          in the inbox it was sent to.
 * @access  Public
 */
router.post("/generate-reset-password-token", generateResetPasswordToken);

/**
 * @route   POST /api/auth/change-password
 * @desc    Reset password
 * @access  User
 */
router.post("/change-password", verifyUser, changePassword);

/**
 * @route   GET /api/auth/sessions
 * @desc    List the user's active login sessions (one per device).
 * @access  User
 */
router.get("/sessions", verifyUser, getMySessionsController);

/**
 * @route   POST /api/auth/sessions/revoke   Body: { family }
 * @desc    Sign out a specific device.
 * @access  User
 */
router.post("/sessions/revoke", verifyUser, revokeSessionController);

/**
 * @route   POST /api/auth/sessions/revoke-others
 * @desc    Sign out every device except the current one.
 * @access  User
 */
router.post(
  "/sessions/revoke-others",
  verifyUser,
  revokeOtherSessionsController,
);

export default router;
