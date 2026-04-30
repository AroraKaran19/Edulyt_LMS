import { Router } from "express";
import { getHomePageSettingsController } from "../controllers/homePageSettings.controller";

const router = Router();

/**
 * Public read of the marketing home page CMS singleton.
 * Mounted at `/api/home-page-settings` (no auth) — the public homepage hits this.
 * Admin edit lives under `/api/admin/home-page-settings`.
 */
router.get("/", getHomePageSettingsController);

export default router;
