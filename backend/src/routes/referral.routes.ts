import { Router } from "express";
import { verifyUser, denyPartners } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  createReferralWithdrawalController,
  getReferralCommissionConfigController,
  getReferralOverviewController,
  listAllReferralWithdrawalsAdminController,
  listMyReferralSalesController,
  listMyReferralWithdrawalsController,
  transitionReferralWithdrawalController,
  updateReferralCommissionConfigController,
  updateReferralUpiController,
  validateReferralCodeController,
} from "../controllers/referral.controller";

const router = Router();

// ── Authenticated learner endpoints ──
router.use(verifyUser);

/** GET /api/referral/me — lazy-creates the profile and returns the overview. */
router.get("/me", denyPartners, getReferralOverviewController);

/** PATCH /api/referral/me/upi — set / update the payout UPI. */
router.patch("/me/upi", denyPartners, updateReferralUpiController);

/**
 * POST /api/referral/validate-code — used by the cart to confirm a code is
 * valid (and not the buyer's own) before submitting the order.
 */
router.post("/validate-code", denyPartners, validateReferralCodeController);

/** GET /api/referral/me/sales?page=&limit= — Transactions tab. */
router.get("/me/sales", denyPartners, listMyReferralSalesController);

/** POST /api/referral/me/withdrawals — request a withdrawal (>= ₹500). */
router.post(
  "/me/withdrawals",
  denyPartners,
  createReferralWithdrawalController,
);

/** GET /api/referral/me/withdrawals?page=&limit= — learner's own request history. */
router.get(
  "/me/withdrawals",
  denyPartners,
  listMyReferralWithdrawalsController,
);

// ── Admin endpoints ──
router.use(verifyAdmin);

/** GET /api/referral/admin/config */
router.get("/admin/config", getReferralCommissionConfigController);

/** PUT /api/referral/admin/config — body: { tiers: [{ thresholdSales, commissionPercent }] } */
router.put("/admin/config", updateReferralCommissionConfigController);

/** GET /api/referral/admin/withdrawals?status=&q=&page=&limit= */
router.get(
  "/admin/withdrawals",
  listAllReferralWithdrawalsAdminController,
);

/** PATCH /api/referral/admin/withdrawals/:id/status — body: { status, notes? } */
router.patch(
  "/admin/withdrawals/:id/status",
  transitionReferralWithdrawalController,
);

export default router;
