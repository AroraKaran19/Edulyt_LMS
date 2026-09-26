import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getEnquiryPageSettings,
  getEnquiryPricing,
  getEnquiryQuestions,
  getEnquiryScholarship,
  stripPerVisitFields,
  updateEnquiryPageSection,
} from "../services/enquiryPageSettings.services";
import { listOwnCampaignOptions } from "../services/scholarshipAttach.services";
import { AppError } from "../middlewares/error.middleware";
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
    // Cache-headered, so it cannot vary per referral link: anything the link
    // decides is stripped here and served by its own uncached route.
    sendSuccessResponse(
      res,
      stripPerVisitFields(data),
      "Enquiry page settings fetched",
      200,
    );
  },
);

/**
 * @route GET /api/admin/enquiry-page-settings
 * @desc  The full document for the editor, including what the public copy strips.
 */
export const getAdminEnquiryPageSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    sendSuccessResponse(
      res,
      await getEnquiryPageSettings(),
      "Enquiry page settings fetched",
      200,
    );
  },
);

/**
 * @route GET /api/enquiry-page-settings/pricing?ref=CODE
 * @desc  Plan prices for one visit, or an empty set when they are withheld.
 *
 * Deliberately not part of the settings response above: that one is cached and
 * shared, and this answer depends on the link. Uncached for the same reason.
 */
export const getEnquiryPricingController = asyncHandler(
  async (req: Request, res: Response) => {
    const ref = typeof req.query.ref === "string" ? req.query.ref : undefined;
    sendSuccessResponse(
      res,
      await getEnquiryPricing(ref),
      "Pricing fetched",
      200,
    );
  },
);

/**
 * @route GET /api/enquiry-page-settings/scholarship?ref=CODE
 * @desc  The scholarship campaign this visit should advertise, or null.
 *
 */
export const getEnquiryScholarshipController = asyncHandler(
  async (req: Request, res: Response) => {
    const ref = typeof req.query.ref === "string" ? req.query.ref : undefined;
    sendSuccessResponse(
      res,
      await getEnquiryScholarship(ref),
      "Scholarship fetched",
      200,
    );
  },
);

/**
 * @route GET /api/enquiry-page-settings/questions?ref=CODE
 * @desc  The extra questions this visit's lead form asks.
 */
export const getEnquiryQuestionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const ref = typeof req.query.ref === "string" ? req.query.ref : undefined;
    sendSuccessResponse(
      res,
      { questions: await getEnquiryQuestions(ref) },
      "Questions fetched",
      200,
    );
  },
);

/**
 * @route GET /api/admin/enquiry-page-settings/scholarship-options
 * @desc  The admin's own campaigns, to populate the attach picker.
 */
export const getEnquiryScholarshipOptionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const actorId = req.user?._id;
    if (!actorId) throw new AppError("Authentication required", 401);
    sendSuccessResponse(
      res,
      { items: await listOwnCampaignOptions(String(actorId)) },
      "Campaigns fetched",
      200,
    );
  },
);

/**
 * @route PATCH /api/admin/enquiry-page-settings
 * @desc  Replaces a single section. Body: `{ section, value }`.
 */
export const patchEnquiryPageSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const actorId = req.user?._id;
    if (!actorId) throw new AppError("Authentication required", 401);
    const data = await updateEnquiryPageSection(
      req.body ?? {},
      String(actorId),
    );

    // Bust the Next cache so the edit shows on the public page right away. Not
    // awaited: the write already succeeded, and a slow or dead frontend must not
    // hold up the admin's response.
    void triggerRevalidate(REVALIDATE_TAGS.enquiryPage);

    sendSuccessResponse(res, data, "Enquiry page section updated", 200);
  },
);
