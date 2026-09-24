import { Router } from "express";
import {
  assignLeadsController,
  createLead,
  deleteLead,
  getLeadById,
  getLeads,
  getLeadPipelineController,
  getMyAssignedLead,
  listAssigneesController,
  listLeadCampaignsController,
  listMyAssignedLeads,
  updateLead,
  updateLeadPipelineController,
  updateMyAssignedLead,
} from "../controllers/lead.controller";
import { adminGuard, staffGuard, verifySuperAdmin } from "../middlewares/admin.middleware";
import {
  attachUserIfPresent,
  verifyUser,
} from "../middlewares/user.middleware";
import { requireVerifiedLeadContact } from "../middlewares/verifiedLeadContact.middleware";

const router = Router();

/**
 * @route   POST /api/leads
 * @desc    Capture a lead from the enquiry form
 * @access  Proved email and phone
 *
 * Two ways in. An anonymous visitor carries the contact-session token issued
 * once both codes passed. A signed-in visitor carries their normal user token,
 * and the middleware checks the number against their verified profile, which is
 * what makes changing it here require a fresh OTP.
 */
router.post("/", attachUserIfPresent, requireVerifiedLeadContact, createLead);

/**
 * @route   GET /api/leads/pipeline
 * @desc    The configured stages and sub-statuses, for the dropdowns
 * @access  Any signed-in staff member, sales included
 *
 * Above the admin block on purpose: sales needs it to render My leads, and it
 * carries no lead data of its own.
 */
router.get("/pipeline", verifyUser, getLeadPipelineController);

/**
 * @route   GET /api/leads/mine
 * @desc    The caller's own assigned leads
 * @access  Sales
 */
router.get("/mine", verifyUser, listMyAssignedLeads);

/**
 * @route   GET /api/leads/mine/:id
 * @desc    One of the caller's own leads, in full
 * @access  Sales
 */
router.get("/mine/:id", verifyUser, getMyAssignedLead);

/**
 * @route   PATCH /api/leads/mine/:id
 * @desc    Move one of the caller's own leads through the pipeline
 * @access  Sales
 *
 * Split from the admin route for the same reason the read is: sales sits
 * outside `adminGuard`, and this one cannot be widened to somebody else's lead
 * whatever id arrives.
 */
router.patch("/mine/:id", verifyUser, updateMyAssignedLead);

// ===================
// Admin Routes (must be before `/:id` — otherwise "admin" is parsed as an id)
// ===================

/**
 * @route   POST /api/leads/admin/assign
 * @desc    Assign or unassign a batch of leads
 * @access  Admin
 */
router.post("/admin/assign", ...staffGuard("leads.all"), assignLeadsController);

/**
 * @route   GET /api/leads/admin/assignees
 * @desc    Sales people an admin can assign leads to
 * @access  Admin
 */
router.get("/admin/assignees", ...staffGuard("leads.all"), listAssigneesController);

/**
 * @route   GET /api/leads/admin/campaigns
 * @desc    Campaigns that have produced at least one lead
 * @access  Admin
 */
router.get(
  "/admin/campaigns",
  ...staffGuard("leads.all"),
  listLeadCampaignsController
);

/**
 * @route   PUT /api/leads/admin/pipeline
 * @desc    Replace the stages and sub-statuses
 * @access  Admin with `settings.lead-pipeline`, super-admin
 *
 * Before `/admin/:id`, or "pipeline" is parsed as a lead id.
 */
router.put(
  "/admin/pipeline",
  ...adminGuard("settings.lead-pipeline"),
  updateLeadPipelineController
);

/**
 * @route   GET /api/leads/admin
 * @desc    List leads, newest first, with search and status filters
 * @access  Admin
 */
router.get("/admin", ...staffGuard("leads.all"), getLeads);

/**
 * @route   GET /api/leads/admin/:id
 * @desc    One lead with every answer it carried
 * @access  Admin
 */
router.get("/admin/:id", ...staffGuard("leads.all"), getLeadById);

/**
 * @route   PATCH /api/leads/admin/:id
 * @desc    Update a lead's pipeline status or note
 * @access  Admin
 */
router.patch("/admin/:id", ...staffGuard("leads.all"), updateLead);

/**
 * @route   DELETE /api/leads/admin/:id
 * @desc    Delete a lead
 * @access  Super admin
 */
router.delete("/admin/:id", verifyUser, verifySuperAdmin, deleteLead);

export default router;
