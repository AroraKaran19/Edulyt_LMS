import { Request, Response } from "express";
import { asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import {
  getCaPageSettings,
  serializeCaPageSettings,
  updateCaPageSection,
} from "../services/caPageSettings.services";
import { REVALIDATE_TAGS, triggerRevalidate } from "../services/revalidate.service";

/** Offer letter designations are internal, so the public payload leaves them out. */
export const getPublicCaPageSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const { documents: _documents, ...publicSettings } = serializeCaPageSettings(await getCaPageSettings());
    sendSuccessResponse(res, publicSettings, "CA page settings fetched", 200);
  },
);

export const getAdminCaPageSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    sendSuccessResponse(
      res,
      serializeCaPageSettings(await getCaPageSettings()),
      "CA page settings fetched",
      200,
    );
  },
);

export const patchCaPageSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await updateCaPageSection(req.body ?? {});
    void triggerRevalidate(REVALIDATE_TAGS.caPage);
    sendSuccessResponse(res, serializeCaPageSettings(data), "CA page section updated", 200);
  },
);
