import { Router } from "express";
import { verifyUser, denyPartners } from "../middlewares/user.middleware";
import {
  getMyVouchers,
  redeemVoucher,
} from "../controllers/internshipVoucher.controller";

const router = Router();

router.use(verifyUser);

/**
 * @route   GET /api/internship-vouchers/me
 * @desc    Voucher count + list for the authenticated user
 * @access  Private
 */
router.get("/me", getMyVouchers);

/**
 * @route   POST /api/internship-vouchers/redeem
 * @desc    Redeem a voucher by id or code
 * @access  Private
 */
router.post("/redeem", denyPartners, redeemVoucher);

export default router;
