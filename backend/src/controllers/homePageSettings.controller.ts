import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getHomePageSettings,
  updateHomePageSection,
} from "../services/homePageSettings.services";
import { triggerRevalidate } from "../services/revalidate.service";

/**
 * @route GET /api/admin/home-page-settings
 * @desc  Returns the singleton home page settings document with refs hydrated.
 */
export const getHomePageSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await getHomePageSettings();
    sendSuccessResponse(res, data, "Home page settings fetched", 200);
  },
);

/**
 * @route PATCH /api/admin/home-page-settings
 * @desc  Replaces a single section. Body: `{ section: keyof HomePageSettings, value: <slice> }`.
 */
export const patchHomePageSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await updateHomePageSection(req.body ?? {});

    // Bust the Next cache so the edit shows on the public homepage right away.
    // Not awaited: the write already succeeded, and a slow or dead frontend must
    // not hold up the admin's response.
    void triggerRevalidate();

    sendSuccessResponse(res, data, "Home page section updated", 200);
  },
);
