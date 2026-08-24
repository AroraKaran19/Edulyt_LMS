import { Router } from "express";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  previewCampaignDeletion,
  updateCampaign,
} from "../controllers/scholarshipTest.controller";
import { staffGuard } from "../middlewares/staffAccess.middleware";

const router = Router();

// Route slug is /admin/scholarship/campaigns; the key stays `scholarship.tests`
// so permissions already granted against it keep working.
const CAMPAIGNS = "scholarship.tests";

/**
 * @route   GET /api/scholarship-tests/admin
 * @desc    List campaigns; role-gated staff see only their own
 * @access  Marketer, sales, admin with scholarship.tests, super-admin
 */
router.get("/admin", ...staffGuard(CAMPAIGNS), listCampaigns);

/**
 * @route   POST /api/scholarship-tests/admin
 * @desc    Create a campaign and mint its coupon
 * @access  Marketer, sales, admin with scholarship.tests, super-admin
 */
router.post("/admin", ...staffGuard(CAMPAIGNS), createCampaign);

/**
 * @route   GET /api/scholarship-tests/admin/:id/deletion-preview
 * @desc    Counts the confirm dialog shows, plus whether deletion is blocked
 * @access  Marketer, sales, admin with scholarship.tests, super-admin
 */
router.get(
  "/admin/:id/deletion-preview",
  ...staffGuard(CAMPAIGNS),
  previewCampaignDeletion,
);

/**
 * @route   GET /api/scholarship-tests/admin/:id
 * @desc    One campaign with its attempt count
 * @access  Marketer, sales, admin with scholarship.tests, super-admin
 */
router.get("/admin/:id", ...staffGuard(CAMPAIGNS), getCampaign);

/**
 * @route   PATCH /api/scholarship-tests/admin/:id
 * @desc    Update the editable fields; paper is locked once attempted
 * @access  Marketer, sales, admin with scholarship.tests, super-admin
 */
router.patch("/admin/:id", ...staffGuard(CAMPAIGNS), updateCampaign);

/**
 * @route   DELETE /api/scholarship-tests/admin/:id
 * @desc    Delete a campaign, refusing while a checkout is in flight
 * @access  Marketer, sales, admin with scholarship.tests, super-admin
 */
router.delete("/admin/:id", ...staffGuard(CAMPAIGNS), deleteCampaign);

export default router;
