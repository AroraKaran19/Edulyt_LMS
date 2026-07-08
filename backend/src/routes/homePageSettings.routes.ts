import { NextFunction, Request, Response, Router } from "express";
import { getHomePageSettingsController } from "../controllers/homePageSettings.controller";

const router = Router();

/**
 * Let browsers/CDN cache the public homepage payload briefly. The content is a
 * rarely-changed CMS singleton; `stale-while-revalidate` keeps the page instant
 * while a fresh copy is fetched in the background. Only applied to the public
 * read — the admin editor route is never cached.
 */
function publicCacheHeaders(_req: Request, res: Response, next: NextFunction) {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  next();
}

/**
 * Public read of the marketing home page CMS singleton.
 * Mounted at `/api/home-page-settings` (no auth) — the public homepage hits this.
 * Admin edit lives under `/api/admin/home-page-settings`.
 */
router.get("/", publicCacheHeaders, getHomePageSettingsController);

export default router;
