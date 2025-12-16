import { AppError } from "../middlewares/error.middleware";
import { CouponModel, CourseModel } from "../models";
import {
  Coupon,
  ValidateCouponRequest,
  ValidateCouponResponse,
} from "../types";
import mongoose from "mongoose";

export const getAllCouponsService = async (
  page: number,
  limit: number,
  search: string,
  isActive?: boolean
): Promise<{
  coupons: Coupon[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {};

  if (search) {
    filters.$or = [
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (isActive !== undefined) {
    filters.isActive = isActive;
  }

  const total = await CouponModel.countDocuments(filters);
  const coupons = await CouponModel.find(filters)
    .populate("createdBy", "firstName lastName email")
    .populate("applicableCourses", "title thumbnail")
    .populate("applicableCategories", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    coupons: coupons as Coupon[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getCouponByIdService = async (
  couponId: string
): Promise<Coupon | null> => {
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    return null;
  }

  const coupon = await CouponModel.findById(couponId)
    .populate("createdBy", "firstName lastName email")
    .populate("applicableCourses", "title thumbnail")
    .populate("applicableCategories", "name")
    .lean();

  return coupon as Coupon | null;
};

export const getCouponByCodeService = async (
  code: string
): Promise<Coupon | null> => {
  const coupon = await CouponModel.findOne({ code: code.toUpperCase() })
    .populate("createdBy", "firstName lastName email")
    .populate("applicableCourses", "title thumbnail")
    .populate("applicableCategories", "name")
    .lean();

  return coupon as Coupon | null;
};

export const createCouponService = async (
  couponData: Partial<Coupon>,
  createdBy: string
): Promise<Coupon> => {
  // Check if code already exists
  const existingCoupon = await CouponModel.findOne({
    code: couponData.code?.toUpperCase(),
  });

  if (existingCoupon) {
    throw new AppError("Coupon code already exists", 400);
  }

  // Validate dates
  if (
    couponData.validFrom &&
    couponData.validUntil &&
    new Date(couponData.validUntil) <= new Date(couponData.validFrom)
  ) {
    throw new AppError("Valid until date must be after valid from date", 400);
  }

  // Validate percentage discount
  if (
    couponData.discountType === "percentage" &&
    couponData.discountValue &&
    couponData.discountValue > 100
  ) {
    throw new AppError("Percentage discount cannot exceed 100", 400);
  }

  const coupon = new CouponModel({
    ...couponData,
    code: couponData.code?.toUpperCase(),
    createdBy,
    usageCount: 0,
  });

  const savedCoupon = await coupon.save();

  return savedCoupon.populate([
    { path: "createdBy", select: "firstName lastName email" },
    { path: "applicableCourses", select: "title thumbnail" },
    { path: "applicableCategories", select: "name" },
  ]) as any;
};

export const updateCouponService = async (
  couponId: string,
  couponData: Partial<Coupon>
): Promise<Coupon | null> => {
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    throw new AppError("Invalid coupon ID", 400);
  }

  // Check if code is being updated and if it already exists
  if (couponData.code) {
    const existingCoupon = await CouponModel.findOne({
      code: couponData.code.toUpperCase(),
      _id: { $ne: couponId },
    });

    if (existingCoupon) {
      throw new AppError("Coupon code already exists", 400);
    }
    couponData.code = couponData.code.toUpperCase();
  }

  // Validate dates if provided
  if (couponData.validFrom || couponData.validUntil) {
    const coupon = await CouponModel.findById(couponId);
    if (!coupon) {
      throw new AppError("Coupon not found", 404);
    }

    const validFrom = couponData.validFrom
      ? new Date(couponData.validFrom)
      : coupon.validFrom;
    const validUntil = couponData.validUntil
      ? new Date(couponData.validUntil)
      : coupon.validUntil;

    if (validUntil <= validFrom) {
      throw new AppError("Valid until date must be after valid from date", 400);
    }
  }

  // Validate percentage discount
  if (
    couponData.discountType === "percentage" &&
    couponData.discountValue &&
    couponData.discountValue > 100
  ) {
    throw new AppError("Percentage discount cannot exceed 100", 400);
  }

  const updatedCoupon = await CouponModel.findByIdAndUpdate(
    couponId,
    { $set: couponData },
    { new: true, runValidators: true }
  )
    .populate("createdBy", "firstName lastName email")
    .populate("applicableCourses", "title thumbnail")
    .populate("applicableCategories", "name")
    .lean();

  return updatedCoupon as Coupon | null;
};

export const deleteCouponService = async (
  couponId: string
): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    throw new AppError("Invalid coupon ID", 400);
  }

  const result = await CouponModel.findByIdAndDelete(couponId);
  return !!result;
};

export const validateCouponService = async (
  request: ValidateCouponRequest
): Promise<ValidateCouponResponse> => {
  const { code, courseId, userId, purchaseAmount } = request;

  // Find the coupon
  const coupon = await CouponModel.findOne({
    code: code.toUpperCase(),
  }).lean();

  if (!coupon) {
    return {
      valid: false,
      message: "Invalid coupon code",
    };
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    return {
      valid: false,
      message: "This coupon is no longer active",
    };
  }

  // Check validity dates
  const now = new Date();
  if (now < new Date(coupon.validFrom)) {
    return {
      valid: false,
      message: "This coupon is not yet valid",
    };
  }

  if (now > new Date(coupon.validUntil)) {
    return {
      valid: false,
      message: "This coupon has expired",
    };
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageCount && coupon.usageCount >= coupon.usageLimit) {
    return {
      valid: false,
      message: "This coupon has reached its usage limit",
    };
  }

  // Check minimum purchase amount
  if (coupon.minPurchaseAmount && purchaseAmount < coupon.minPurchaseAmount) {
    return {
      valid: false,
      message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`,
    };
  }

  // Check if coupon applies to this course
  if (coupon.applicableType === "specific-courses") {
    const courseIds = (coupon.applicableCourses as string[]) || [];
    if (!courseIds.some((id) => id.toString() === courseId)) {
      return {
        valid: false,
        message: "This coupon is not applicable to this course",
      };
    }
  } else if (coupon.applicableType === "specific-categories") {
    // Get course and check its categories
    const course = await CourseModel.findById(courseId).select("category");
    if (!course) {
      return {
        valid: false,
        message: "Course not found",
      };
    }

    const categoryIds = (coupon.applicableCategories as string[]) || [];
    const courseCategories = (course.category as string[]) || [];

    const hasMatchingCategory = categoryIds.some((catId) =>
      courseCategories.some(
        (courseCat) => courseCat.toString() === catId.toString()
      )
    );

    if (!hasMatchingCategory) {
      return {
        valid: false,
        message: "This coupon is not applicable to this course category",
      };
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = (purchaseAmount * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  // Apply max discount cap if set
  if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
    discountAmount = coupon.maxDiscountAmount;
  }

  // Ensure discount doesn't exceed purchase amount
  if (discountAmount > purchaseAmount) {
    discountAmount = purchaseAmount;
  }

  const finalAmount = purchaseAmount - discountAmount;

  return {
    valid: true,
    message: "Coupon applied successfully",
    coupon: coupon as Coupon,
    discountAmount,
    finalAmount,
  };
};

export const incrementCouponUsageService = async (
  couponId: string
): Promise<boolean> => {
  const result = await CouponModel.findByIdAndUpdate(
    couponId,
    { $inc: { usageCount: 1 } },
    { new: true }
  );

  return !!result;
};
