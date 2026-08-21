import { NextFunction, Request, Response, Router } from "express";
import { getEnquiryPageSettingsController } from "../controllers/enquiryPageSettings.controller";

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

export default router;
