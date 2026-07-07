import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { adminGuard } from "../middlewares/admin.middleware";
import {
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/coupon.controller";

const router = Router();

/**
 * @route   GET /api/coupons
 * @desc    Get all coupons (Admin only)
 * @access  Admin
 */
router.get("/", ...adminGuard("coupons"),getAllCoupons);

/**
 * @route   GET /api/coupons/:couponId
 * @desc    Get coupon by ID (Admin only)
 * @access  Admin
 */
router.get("/:couponId", ...adminGuard("coupons"),getCouponById);

/**
 * @route   GET /api/coupons/code/:code
 * @desc    Get coupon by code (Admin only)
 * @access  Admin
 */
router.get("/code/:code", ...adminGuard("coupons"),getCouponByCode);

/**
 * @route   POST /api/coupons
 * @desc    Create a new coupon (Admin only)
 * @access  Admin
 */
router.post("/", ...adminGuard("coupons"),createCoupon);

/**
 * @route   PUT /api/coupons/:couponId
 * @desc    Update a coupon (Admin only)
 * @access  Admin
 */
router.put("/:couponId", ...adminGuard("coupons"),updateCoupon);

/**
 * @route   DELETE /api/coupons/:couponId
 * @desc    Delete a coupon (Admin only)
 * @access  Admin
 */
router.delete("/:couponId", ...adminGuard("coupons"),deleteCoupon);

/**
 * @route   POST /api/coupons/validate
 * @desc    Validate a coupon code (Authenticated users)
 * @access  Private
 */
router.post("/validate", verifyUser, validateCoupon);

export default router;
