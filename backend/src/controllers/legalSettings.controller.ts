import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { parseBrandInput } from "../services/brandOwnership.services";
import {
  getAllLegalSettings,
  getLegalSettings,
  updateLegalSettings,
} from "../services/legalSettings.services";

/** Public read: the documents of the site asking. */
export const getLegalSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getLegalSettings(req.brand);
    sendSuccessResponse(res, data, "Legal settings fetched", 200);
  },
);

/** Admin read: every brand's documents, keyed by brand. */
export const getAdminLegalSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await getAllLegalSettings();
    sendSuccessResponse(res, data, "Legal settings fetched", 200);
  },
);

/** Admin update of one brand's documents. */
export const patchLegalSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const brand = parseBrandInput(req.body?.brand, "document");
    const data = await updateLegalSettings(brand, req.body ?? {});
    sendSuccessResponse(res, data, "Legal settings updated", 200);
  },
);
