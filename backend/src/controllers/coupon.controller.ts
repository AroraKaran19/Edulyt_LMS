import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getAllCouponsService,
  getCouponByIdService,
  getCouponByCodeService,
  createCouponService,
  updateCouponService,
  deleteCouponService,
  validateCouponService,
} from "../services/coupon.services";
import { DEFAULT_BRAND } from "../constants/brands";

export const getAllCoupons = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const isActive =
      req.query.isActive === "true"
        ? true
        : req.query.isActive === "false"
        ? false
        : undefined;

    const source =
      req.query.source === "scholarship"
        ? ("scholarship" as const)
        : req.query.source === "regular"
          ? ("regular" as const)
          : undefined;

    const result = await getAllCouponsService(
      page,
      limit,
      search,
      isActive,
      source
    );

    sendSuccessResponse(res, result, "Coupons fetched successfully", 200);
    return;
  }
);

export const getCouponById = asyncHandler(
  async (req: Request, res: Response) => {
    const { couponId } = req.params;

    if (!couponId) {
      throw new AppError("Coupon ID is required", 400);
    }

    const coupon = await getCouponByIdService(couponId);

    if (!coupon) {
      throw new AppError("Coupon not found", 404);
    }

    sendSuccessResponse(res, coupon, "Coupon fetched successfully", 200);
    return;
  }
);

export const getCouponByCode = asyncHandler(
  async (req: Request, res: Response) => {
    const { code } = req.params;

    if (!code) {
      throw new AppError("Coupon code is required", 400);
    }

    const coupon = await getCouponByCodeService(code);

    if (!coupon) {
      throw new AppError("Coupon not found", 404);
    }

    sendSuccessResponse(res, coupon, "Coupon fetched successfully", 200);
    return;
  }
);

export const createCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const couponData = req.body;
    const createdBy = req.user?._id;

    if (!createdBy) {
      throw new AppError("User not authenticated", 401);
    }

    if (!couponData.code) {
      throw new AppError("Coupon code is required", 400);
    }

    if (!couponData.discountType) {
      throw new AppError("Discount type is required", 400);
    }

    if (!couponData.discountValue) {
      throw new AppError("Discount value is required", 400);
    }

    if (!couponData.applicableType) {
      throw new AppError("Applicable type is required", 400);
    }

    if (!couponData.validFrom) {
      throw new AppError("Valid from date is required", 400);
    }

    if (!couponData.validUntil) {
      throw new AppError("Valid until date is required", 400);
    }

    const coupon = await createCouponService(couponData, createdBy);

    sendSuccessResponse(res, coupon, "Coupon created successfully", 201);
    return;
  }
);

export const updateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const { couponId } = req.params;
    const couponData = req.body;

    if (!couponId) {
      throw new AppError("Coupon ID is required", 400);
    }

    const coupon = await updateCouponService(couponId, couponData);

    if (!coupon) {
      throw new AppError("Coupon not found", 404);
    }

    sendSuccessResponse(res, coupon, "Coupon updated successfully", 200);
    return;
  }
);

export const deleteCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const { couponId } = req.params;

    if (!couponId) {
      throw new AppError("Coupon ID is required", 400);
    }

    const result = await deleteCouponService(couponId);

    if (!result) {
      throw new AppError("Coupon not found", 404);
    }

    sendSuccessResponse(res, null, "Coupon deleted successfully", 200);
    return;
  }
);

export const validateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, courseId, purchaseAmount } = req.body;
    const userId = req.user?._id;

    if (!code) {
      throw new AppError("Coupon code is required", 400);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!purchaseAmount) {
      throw new AppError("Purchase amount is required", 400);
    }

    const result = await validateCouponService({
      code,
      courseId,
      userId,
      purchaseAmount,
      brand: req.brand ?? DEFAULT_BRAND,
    });

    if (!result.valid) {
      throw new AppError(result.message, 400);
    }

    sendSuccessResponse(res, result, result.message, 200);
    return;
  }
);
