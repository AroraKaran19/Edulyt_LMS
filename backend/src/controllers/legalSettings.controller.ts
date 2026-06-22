import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getLegalSettings,
  updateLegalSettings,
} from "../services/legalSettings.services";

/** Admin + public read of the legal-documents singleton. */
export const getLegalSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await getLegalSettings();
    sendSuccessResponse(res, data, "Legal settings fetched", 200);
  },
);

/** Admin update of the legal-documents singleton. */
export const patchLegalSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await updateLegalSettings(req.body ?? {});
    sendSuccessResponse(res, data, "Legal settings updated", 200);
  },
);
