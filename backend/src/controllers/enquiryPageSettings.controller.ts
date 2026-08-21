import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getEnquiryPageSettings,
  updateEnquiryPageSection,
} from "../services/enquiryPageSettings.services";
import {
  REVALIDATE_TAGS,
  triggerRevalidate,
} from "../services/revalidate.service";

/**
 * @route GET /api/enquiry-page-settings
 * @desc  Returns the singleton enquiry page settings document.
 */
export const getEnquiryPageSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await getEnquiryPageSettings();
    sendSuccessResponse(res, data, "Enquiry page settings fetched", 200);
  },
);

/**
 * @route PATCH /api/admin/enquiry-page-settings
 * @desc  Replaces a single section. Body: `{ section, value }`.
 */
export const patchEnquiryPageSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await updateEnquiryPageSection(req.body ?? {});

    // Bust the Next cache so the edit shows on the public page right away. Not
    // awaited: the write already succeeded, and a slow or dead frontend must not
    // hold up the admin's response.
    void triggerRevalidate(REVALIDATE_TAGS.enquiryPage);

    sendSuccessResponse(res, data, "Enquiry page section updated", 200);
  },
);
