import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getPointsSettings,
  updatePointsSettings,
} from "../services/pointsSettings.services";

export const getPointsSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await getPointsSettings();
    sendSuccessResponse(res, data, "Points settings fetched", 200);
  },
);

export const patchPointsSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await updatePointsSettings(req.body ?? {});
    sendSuccessResponse(res, data, "Points settings updated", 200);
  },
);
