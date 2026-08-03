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
  setUserPassword,
  unlinkGoogleAccount,
  unlinkLinkedInAccount,
  adminUpdateUser,
  adminChangeUserPassword,
  adminCreatePartner,
} from "../controllers/user.controller";
import {
  getPhoneOtpStatus,
  requestPhoneOtp,
  verifyPhoneOtp,
} from "../controllers/phoneVerification.controller";
import {
  requestUserEmailChange,
  resendUserEmailChangeOtp,
  verifyUserEmailChange,
} from "../controllers/emailChange.controller";

const router = Router();

// User profile routes
router.get("/me", verifyUser, getCurrentUserProfile);
router.get("/me/stats", verifyUser, getCurrentUserStats);
router.put("/me", verifyUser, updateUserProfile);

// MSG91 phone verification. `/me` refuses to change `phone`, so these are the
// only way a learner's number gets set.
router.get("/me/phone/otp-status", verifyUser, getPhoneOtpStatus);
router.post("/me/phone/otp-request", verifyUser, requestPhoneOtp);
router.post("/me/phone/verify", verifyUser, verifyPhoneOtp);

router.put("/change-password", verifyUser, changeUserPassword);
router.put("/set-password", verifyUser, setUserPassword);

// Verified email change. There is deliberately no single-call route here: one
// that swapped the address on a password check alone would make the OTP below
// bypassable, and the address is the account's password-reset channel.
router.post("/change-email/request", verifyUser, requestUserEmailChange);
router.post("/change-email/verify", verifyUser, verifyUserEmailChange);
router.post("/change-email/resend", verifyUser, resendUserEmailChangeOtp);

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
