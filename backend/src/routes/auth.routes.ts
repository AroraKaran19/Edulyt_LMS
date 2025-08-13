import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

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

export default router;