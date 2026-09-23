import { Request, Response } from "express";
import mongoose from "mongoose";
import { AppError, asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import { fullName } from "../services/caApplicationReview.services";
import {
  approveCaVoucherRequest,
  declineCaVoucherRequest,
  deleteCaVoucherRequest,
  listCaVoucherEnrollments,
  listCaVoucherRequests,
  revokeCaVoucherEnrollment,
  type CaVoucherAdminActor,
} from "../services/caVoucherAdmin.services";

const actorOf = (req: Request): CaVoucherAdminActor => {
  const u = req.user;
  if (!u?._id) throw new AppError("Authentication required", 401);
  return { userId: new mongoose.Types.ObjectId(String(u._id)), name: fullName(u) };
};

/** @route GET /admin/ca-vouchers/requests?status=&search=&page=&limit= */
export const listCaVoucherRequestsController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, await listCaVoucherRequests(req.query), "Requests fetched", 200);
});

/** @route POST /admin/ca-vouchers/requests/:id/approve */
export const approveCaVoucherRequestController = asyncHandler(async (req: Request, res: Response) => {
  const actor = actorOf(req);
  sendSuccessResponse(res, await approveCaVoucherRequest(actor, req.params.id), "Request approved", 200);
});

/** @route POST /admin/ca-vouchers/requests/:id/decline */
export const declineCaVoucherRequestController = asyncHandler(async (req: Request, res: Response) => {
  const actor = actorOf(req);
  sendSuccessResponse(
    res,
    await declineCaVoucherRequest(actor, req.params.id, req.body?.reason),
    "Request declined",
    200,
  );
});

/** @route DELETE /admin/ca-vouchers/requests/:id */
export const deleteCaVoucherRequestController = asyncHandler(async (req: Request, res: Response) => {
  await deleteCaVoucherRequest(req.params.id);
  sendSuccessResponse(res, null, "Request deleted", 200);
});

/** @route GET /admin/ca-vouchers/enrollments?search=&page=&limit= */
export const listCaVoucherEnrollmentsController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, await listCaVoucherEnrollments(req.query), "Enrollments fetched", 200);
});

/** @route POST /admin/ca-vouchers/enrollments/:id/revoke */
export const revokeCaVoucherEnrollmentController = asyncHandler(async (req: Request, res: Response) => {
  const actor = actorOf(req);
  sendSuccessResponse(
    res,
    await revokeCaVoucherEnrollment(actor, req.params.id),
    "Enrollment revoked",
    200,
  );
});
