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
  changeUserEmail,
  setUserPassword,
  unlinkGoogleAccount,
  unlinkLinkedInAccount,
  adminUpdateUser,
  adminChangeUserPassword,
} from "../controllers/user.controller";

const router = Router();

// User profile routes
router.get("/me", verifyUser, getCurrentUserProfile);
router.put("/me", verifyUser, updateUserProfile);
router.put("/change-password", verifyUser, changeUserPassword);
router.put("/set-password", verifyUser, setUserPassword);
router.put("/change-email", verifyUser, changeUserEmail);
router.delete("/unlink-google", verifyUser, unlinkGoogleAccount);
router.delete("/unlink-linkedin", verifyUser, unlinkLinkedInAccount);

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
 * @route   PUT /api/users/admin/:userId
 * @desc    Update any user's profile (handles all user types)
 * @access  Admin
 */
router.put("/admin/:userId", adminUpdateUser);

/**
 * @route   PUT /api/users/admin/:userId/status
 * @desc    Update user status
 * @access  Admin
 */
router.put("/admin/:userId/status", updateUserStatus);

/**
 * @route   PUT /api/users/admin/:userId/password
 * @desc    Change any user's password (admin only, no current password required)
 * @access  Admin
 */
router.put("/admin/:userId/password", adminChangeUserPassword);

/**
 * @route   DELETE /api/users/admin/:userId
 * @desc    Delete user (permanent delete)
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
