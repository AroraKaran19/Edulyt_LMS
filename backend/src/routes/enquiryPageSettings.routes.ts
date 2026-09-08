import { NextFunction, Request, Response, Router } from "express";
import {
  getEnquiryPageSettingsController,
  getEnquiryPricingController,
} from "../controllers/enquiryPageSettings.controller";

const router = Router();

/**
 * Brief browser/CDN caching for the public payload. Only the public read is
 * cached; the admin editor route never is.
 */
function publicCacheHeaders(_req: Request, res: Response, next: NextFunction) {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  next();
}

router.get("/", publicCacheHeaders, getEnquiryPageSettingsController);

/**
 * @route   GET /api/enquiry-page-settings/pricing?ref=CODE
 * @desc    Plan prices for this visit, or none when withheld
 * @access  Public
 *
 * No cache headers on purpose: the answer depends on the referral link, and a
 * shared cache would serve one visitor's pricing to another.
 */
router.get("/pricing", getEnquiryPricingController);

export default router;
