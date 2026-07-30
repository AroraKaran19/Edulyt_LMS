import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { adminGuard } from "../middlewares/admin.middleware";
import {
  adminAdjustSuccessPoints,
  getMySuccessPoints,
  getMySuccessPointsHistory,
  getPublicRedemptionRate,
  getPublicRewardRates,
  getUserSuccessPointsHistory,
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
 * @route   GET /api/success-points/reward-rates
 * @desc    Public read of the milestone reward point values (login,
 *          community review, internship registration) — read by reward-
 *          earning forms to preview how many points the action grants.
 * @access  Public
 */
router.get("/reward-rates", getPublicRewardRates);

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
  ...adminGuard("users.manage"),
  adminAdjustSuccessPoints,
);

/**
 * @route   GET /api/success-points/admin/history/:userId
 * @desc    One student's wallet ledger for the admin user drawer — a page of
 *          entries (newest first) plus all-time balance / earned / spent.
 * @access  Admin
 */
router.get(
  "/admin/history/:userId",
  ...adminGuard("users.manage"),
  getUserSuccessPointsHistory,
);

export default router;
