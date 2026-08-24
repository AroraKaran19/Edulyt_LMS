import { Router } from "express";
import { resolvePublicCrmCode } from "../controllers/crmProfile.controller";

const router = Router();

/**
 * @route   GET /api/crm-public/resolve?code=X
 * @desc    Confirms a shared code and names its owner
 * @access  Public
 *
 * Unauthenticated on purpose: /enquiry serves visitors with no account, and
 * putting this behind `verifyUser` would 401 them into a login redirect.
 */
router.get("/resolve", resolvePublicCrmCode);

export default router;
