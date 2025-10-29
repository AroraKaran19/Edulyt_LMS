import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getUserStats,
  updateUserProfile,
  getCurrentUserProfile,
  changeUserPassword,
} from "../controllers/user.controller";

const router = Router();

// User profile routes
router.get("/me", verifyUser, getCurrentUserProfile);
router.put("/me", verifyUser, updateUserProfile);
router.put("/change-password", verifyUser, changeUserPassword);

// Admin routes 
router.use(verifyUser);
router.use(verifyAdmin);

/**
 * @route   GET /api/users/admin
 * @desc    Get all users with pagination and filtering
 * @access  Admin
 */
router.get("/admin", getUsers);

/**
 * @route   GET /api/users/admin/:userId
 * @desc    Get user by ID
 * @access  Admin
 */
router.get("/admin/:userId", getUserById);

/**
 * @route   PUT /api/users/admin/:userId/status
 * @desc    Update user status
 * @access  Admin
 */
router.put("/admin/:userId/status", updateUserStatus);

/**
 * @route   DELETE /api/users/admin/:userId
 * @desc    Delete user (soft delete)
 * @access  Admin
 */
router.delete("/admin/:userId", deleteUser);

/**
 * @route   GET /api/users/admin/stats/overview
 * @desc    Get user statistics overview
 * @access  Admin
 */
router.get("/admin/stats/overview", getUserStats);

export default router;
