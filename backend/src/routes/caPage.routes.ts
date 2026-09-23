import { NextFunction, Request, Response, Router } from "express";
import { requireBrand } from "../middlewares/brand.middleware";
import { getPublicCaPageSettingsController } from "../controllers/caPageSettings.controller";

const router = Router();

function publicCacheHeaders(_req: Request, res: Response, next: NextFunction) {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  next();
}

/**
 * @route   GET /api/ca-page/settings
 * @desc    Batch and form configuration for the public CA page
 * @access  Public
 */
router.get("/settings", requireBrand("airkrit"), publicCacheHeaders, getPublicCaPageSettingsController);

export default router;
