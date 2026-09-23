import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { submitCaApplication } from "../services/caApplicationSubmit.services";
import {
  approveCaApplication,
  changeCaApplicationDuration,
  changeCaApplicationOwner,
  declineCaApplication,
  forcePassCaApplication,
  fullName,
  getCaApplication,
  listCaApplications,
  listCaOwners,
  listCaTeamApplications,
  retryCaDocumentJobs,
  revealCaApplication,
  setCaCompletionHold,
  type CaViewer,
} from "../services/caApplicationReview.services";

/**
 * @route POST /api/ca-applications
 * @desc  A student applies to become a Campus Ambassador
 */
export const submitCaApplicationController = asyncHandler(
  async (req: Request, res: Response) => {
    const contact = req.verifiedContact;
    if (!contact) {
      throw new AppError("Verify your mobile number before applying", 401);
    }
    const result = await submitCaApplication(req.body ?? {}, contact);
    sendSuccessResponse(res, result, "Application received", 201);
  },
);

const viewerOf = (req: Request): CaViewer => {
  const u = req.user;
  if (!u?._id) throw new AppError("Authentication required", 401);
  return {
    userId: new mongoose.Types.ObjectId(String(u._id)),
    userType: String(u.userType),
    name: fullName(u),
  };
};

/** @route GET /api/ca-applications?status=&referrer=&q=&page=&limit= */
export const listCaApplicationsController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, await listCaApplications(viewerOf(req), req.query), "Applications fetched", 200);
});

/** @route GET /api/ca-applications/owners */
export const listCaOwnersController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, { owners: await listCaOwners(viewerOf(req)) }, "Owners fetched", 200);
});

/** @route GET /api/ca-applications/:id */
export const getCaApplicationController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, await getCaApplication(viewerOf(req), String(req.params.id)), "Application fetched", 200);
});

/** @route POST /api/ca-applications/:id/reveal */
export const revealCaApplicationController = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  sendSuccessResponse(res, await revealCaApplication(viewerOf(req), String(req.params.id)), "Revealed", 200);
});

/** @route POST /api/ca-applications/:id/approve  Body: `{ kind, ownerUserId? }` */
export const approveCaApplicationController = asyncHandler(async (req: Request, res: Response) => {
  const result = await approveCaApplication(viewerOf(req), String(req.params.id), req.body ?? {});
  sendSuccessResponse(res, result, "Application approved", 200);
});

/** @route DELETE /api/ca-applications/:id */
export const declineCaApplicationController = asyncHandler(async (req: Request, res: Response) => {
  await declineCaApplication(viewerOf(req), String(req.params.id));
  sendSuccessResponse(res, { declined: true }, "Application declined", 200);
});

/** @route PATCH /api/ca-applications/:id/owner  Body: `{ ownerUserId }` */
export const changeCaApplicationOwnerController = asyncHandler(async (req: Request, res: Response) => {
  const row = await changeCaApplicationOwner(viewerOf(req), String(req.params.id), req.body?.ownerUserId);
  sendSuccessResponse(res, row, "Team changed", 200);
});

/** @route PATCH /api/ca-applications/:id/hold  Body: `{ hold }` */
export const setCaCompletionHoldController = asyncHandler(async (req: Request, res: Response) => {
  const row = await setCaCompletionHold(viewerOf(req), String(req.params.id), req.body?.hold);
  sendSuccessResponse(res, row, row.completion.hold ? "Completion documents on hold" : "Hold lifted", 200);
});

/** @route PATCH /api/ca-applications/:id/duration  Body: `{ durationMonths }` */
export const changeCaApplicationDurationController = asyncHandler(async (req: Request, res: Response) => {
  const row = await changeCaApplicationDuration(viewerOf(req), String(req.params.id), req.body?.durationMonths);
  sendSuccessResponse(res, row, "Duration changed", 200);
});

/** @route POST /api/ca-applications/:id/force-pass */
export const forcePassCaApplicationController = asyncHandler(async (req: Request, res: Response) => {
  const row = await forcePassCaApplication(viewerOf(req), String(req.params.id));
  sendSuccessResponse(res, row, "Force-passed", 200);
});

/** @route GET /api/ca-applications/team?ownerUserId= */
export const listCaTeamApplicationsController = asyncHandler(async (req: Request, res: Response) => {
  const rows = await listCaTeamApplications(viewerOf(req), req.query.ownerUserId);
  sendSuccessResponse(res, { applications: rows }, "Team fetched", 200);
});

/** @route POST /api/ca-applications/:id/documents/retry */
export const retryCaDocumentsController = asyncHandler(async (req: Request, res: Response) => {
  const result = await retryCaDocumentJobs(viewerOf(req), String(req.params.id));
  sendSuccessResponse(res, result, "Documents queued again", 200);
});
