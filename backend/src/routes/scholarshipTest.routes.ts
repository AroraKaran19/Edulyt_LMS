import { Router } from "express";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  previewCampaignDeletion,
  updateCampaign,
} from "../controllers/scholarshipTest.controller";
import { scholarshipGuard } from "../middlewares/scholarship.middleware";

const router = Router();

const CAMPAIGNS = "scholarship.tests";

/**
 * @route   GET /api/scholarship-tests/admin
 * @desc    List campaigns; marketers see only their own
 * @access  Marketer, admin with scholarship.tests, super-admin
 */
router.get("/admin", ...scholarshipGuard(CAMPAIGNS), listCampaigns);

/**
 * @route   POST /api/scholarship-tests/admin
 * @desc    Create a campaign and mint its coupon
 * @access  Marketer, admin with scholarship.tests, super-admin
 */
router.post("/admin", ...scholarshipGuard(CAMPAIGNS), createCampaign);

/**
 * @route   GET /api/scholarship-tests/admin/:id/deletion-preview
 * @desc    Counts the confirm dialog shows, plus whether deletion is blocked
 * @access  Marketer, admin with scholarship.tests, super-admin
 */
router.get(
  "/admin/:id/deletion-preview",
  ...scholarshipGuard(CAMPAIGNS),
  previewCampaignDeletion,
);

/**
 * @route   GET /api/scholarship-tests/admin/:id
 * @desc    One campaign with its attempt count
 * @access  Marketer, admin with scholarship.tests, super-admin
 */
router.get("/admin/:id", ...scholarshipGuard(CAMPAIGNS), getCampaign);

/**
 * @route   PATCH /api/scholarship-tests/admin/:id
 * @desc    Update the editable fields; paper is locked once attempted
 * @access  Marketer, admin with scholarship.tests, super-admin
 */
router.patch("/admin/:id", ...scholarshipGuard(CAMPAIGNS), updateCampaign);

/**
 * @route   DELETE /api/scholarship-tests/admin/:id
 * @desc    Delete a campaign, refusing while a checkout is in flight
 * @access  Marketer, admin with scholarship.tests, super-admin
 */
router.delete("/admin/:id", ...scholarshipGuard(CAMPAIGNS), deleteCampaign);

export default router;
