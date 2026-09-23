import { Request, Response } from "express";
import { AppError, asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import {
  getCaVoucherMeStatus,
  listEligibleCoursesForVoucher,
  requestCaVoucher,
} from "../services/caVoucher.services";

const requireUserId = (req: Request): string => {
  const id = req.user?._id;
  if (!id) throw new AppError("Authentication required", 401);
  return String(id);
};

/** @route GET /api/ca-vouchers/me */
export const getCaVoucherMeController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  sendSuccessResponse(res, await getCaVoucherMeStatus(userId), "Voucher status fetched", 200);
});

/** @route GET /api/ca-vouchers/courses?search=&page=&limit= */
export const listCaVoucherCoursesController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { search, page, limit } = req.query;
  sendSuccessResponse(
    res,
    await listEligibleCoursesForVoucher(userId, { search, page, limit }),
    "Courses fetched",
    200,
  );
});

/** @route POST /api/ca-vouchers/me/request */
export const requestCaVoucherController = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const created = await requestCaVoucher(userId, req.body?.courseId);
  sendSuccessResponse(res, created, "Voucher requested", 201);
});
