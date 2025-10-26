import {
  changePassword,
  generateAccessToken,
  generateResetPasswordToken,
  login,
  oauthSignin,
  refreshToken,
  register,
  resetPassword,
} from "../controllers/auth.controller";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyTokenForRefresh } from "../middlewares/autoRefresh.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post("/login", login);

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
 * @route   POST /api/auth/generate-access-token
 * @desc    Generate access token
 * @access  User
 */
router.post(
  "/generate-access-token",
  verifyTokenForRefresh,
  generateAccessToken
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post("/reset-password", resetPassword);

/**
 * @route   POST /api/auth/generate-reset-password-token
 * @desc    Generate reset password token
 * @access  Public
 * @todo    Need to send through email in future
 */
router.post("/generate-reset-password-token", generateResetPasswordToken);

/**
 * @route   POST /api/auth/change-password
 * @desc    Reset password
 * @access  User
 */
router.post("/change-password", verifyUser, changePassword);

export default router;
