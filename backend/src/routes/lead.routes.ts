import { Router } from "express";
import {
  createLead,
  deleteLead,
  getLeadById,
  getLeads,
  updateLead,
} from "../controllers/lead.controller";
import { adminGuard, verifySuperAdmin } from "../middlewares/admin.middleware";
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

// ===================
// Admin Routes (must be before `/:id` — otherwise "admin" is parsed as an id)
// ===================

/**
 * @route   GET /api/leads/admin
 * @desc    List leads, newest first, with search and status filters
 * @access  Admin
 */
router.get("/admin", ...adminGuard("leads"), getLeads);

/**
 * @route   GET /api/leads/admin/:id
 * @desc    One lead with every answer it carried
 * @access  Admin
 */
router.get("/admin/:id", ...adminGuard("leads"), getLeadById);

/**
 * @route   PATCH /api/leads/admin/:id
 * @desc    Update a lead's pipeline status or note
 * @access  Admin
 */
router.patch("/admin/:id", ...adminGuard("leads"), updateLead);

/**
 * @route   DELETE /api/leads/admin/:id
 * @desc    Delete a lead
 * @access  Super admin
 */
router.delete("/admin/:id", verifyUser, verifySuperAdmin, deleteLead);

export default router;
