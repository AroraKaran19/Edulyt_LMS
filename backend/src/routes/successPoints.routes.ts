import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  adminAdjustSuccessPoints,
  getMySuccessPoints,
  getMySuccessPointsHistory,
  getPublicRedemptionRate,
  transferSuccessPoints,
} from "../controllers/successPoints.controller";

const router = Router();

/**
 * @route   GET /api/success-points/redemption-rate
 * @desc    Public read of the configured ₹/point redemption rate (read by the
 *          checkout page to preview the discount).
 * @access  Public
 */
router.get("/redemption-rate", getPublicRedemptionRate);

/**
 * @route   GET /api/success-points/me
 * @desc    Current user's success-points balance
 * @access  Authenticated
 */
router.get("/me", verifyUser, getMySuccessPoints);

/**
 * @route   GET /api/success-points/history
 * @desc    Paginated success-points history (newest first)
 * @access  Authenticated
 */
router.get("/history", verifyUser, getMySuccessPointsHistory);

/**
 * @route   POST /api/success-points/transfer
 * @desc    Transfer success points to another student by email.
 *          Atomic — a failed transfer never deducts from the sender.
 * @access  Authenticated
 */
router.post("/transfer", verifyUser, transferSuccessPoints);

/**
 * @route   POST /api/success-points/admin/adjust
 * @desc    Admin grant / deduction of success points on a student account.
 *          Body: { userId, points } — points is signed; the resulting
 *          balance may go negative.
 * @access  Admin
 */
router.post(
  "/admin/adjust",
  verifyUser,
  verifyAdmin,
  adminAdjustSuccessPoints,
);

export default router;
