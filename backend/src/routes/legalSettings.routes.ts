import { Router } from "express";
import { getLegalSettingsController } from "../controllers/legalSettings.controller";

const router = Router();

/**
 * Public read of the legal-documents singleton (Terms & Conditions URLs).
 * Mounted at `/api/legal-settings` (no auth) — the course cart and internship
 * enrollment flow hit this. Admin edit lives under `/api/admin/legal-settings`.
 */
router.get("/", getLegalSettingsController);

export default router;
