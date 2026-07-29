import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import {
  verifyAdmin,
  requirePermission,
  verifySuperAdmin,
} from "../middlewares/admin.middleware";
import {
  getUsers,
  getAdminUserOptions,
  getUserById,
  updateUserStatus,
  deleteUser,
  getUserStats,
  updateUserProfile,
  getCurrentUserProfile,
  getCurrentUserStats,
  changeUserPassword,
  changeUserEmail,
  setUserPassword,
  unlinkGoogleAccount,
  unlinkLinkedInAccount,
  adminUpdateUser,
  adminChangeUserPassword,
  adminCreatePartner,
} from "../controllers/user.controller";

const router = Router();

// User profile routes
router.get("/me", verifyUser, getCurrentUserProfile);
router.get("/me/stats", verifyUser, getCurrentUserStats);
router.put("/me", verifyUser, updateUserProfile);
router.put("/change-password", verifyUser, changeUserPassword);
router.put("/set-password", verifyUser, setUserPassword);
router.put("/change-email", verifyUser, changeUserEmail);
router.delete("/unlink-google", verifyUser, unlinkGoogleAccount);
router.delete("/unlink-linkedin", verifyUser, unlinkLinkedInAccount);

// Admin routes
router.use(verifyUser);
router.use(verifyAdmin);
router.use(requirePermission("users.manage"));

/**
 * @route   GET /api/users/admin
 * @desc    Get all users with pagination and filtering
 * @access  Admin
 */
router.get("/admin", getUsers);

/**
 * @route   GET /api/users/admin/options
 * @desc    Lightweight user picker options for admin modals
 * @access  Admin
 */
router.get("/admin/options", getAdminUserOptions);

/**
 * @route   GET /api/users/admin/:userId
 * @desc    Get user by ID
 * @access  Admin
 */
router.get("/admin/:userId", getUserById);

/**
 * @route   PUT /api/users/admin/:userId
 * @desc    Update any user's profile (handles all user types)
 * @access  Super admin
 */
router.put("/admin/:userId", verifySuperAdmin, adminUpdateUser);

/**
 * @route   PUT /api/users/admin/:userId/status
 * @desc    Update user status (enable / disable an account)
 * @access  Super admin
 */
router.put("/admin/:userId/status", verifySuperAdmin, updateUserStatus);

/**
 * @route   PUT /api/users/admin/:userId/password
 * @desc    Change any user's password (admin only, no current password required)
 * @access  Admin
 */
router.put("/admin/:userId/password", adminChangeUserPassword);

/**
 * @route   DELETE /api/users/admin/:userId
 * @desc    Delete user (permanent delete)
 * @access  Super admin
 */
router.delete("/admin/:userId", verifySuperAdmin, deleteUser);

/**
 * @route   POST /api/users/admin/partner
 * @desc    Create a partner user (college-side partner portal account).
 *          Body: { firstName, lastName?, email, phone?, password, instituteName }
 *          `instituteName` must match an existing PartnerCollege name.
 * @access  Admin
 */
router.post("/admin/partner", adminCreatePartner);

/**
 * @route   GET /api/users/admin/stats/overview
 * @desc    Get user statistics overview
 * @access  Admin
 */
router.get("/admin/stats/overview", getUserStats);

export default router;
