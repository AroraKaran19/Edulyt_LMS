import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post("/login", authController.login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh a token
 * @access  Public
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @route   POST /api/auth/oauth-signin
 * @desc    Handle OAuth sign in (Google, LinkedIn)
 * @access  Public
 */
router.post("/oauth-signin", authController.oauthSignIn);

export default router;