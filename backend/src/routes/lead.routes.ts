import { Router } from "express";
import {
  createLead,
  deleteLead,
  getLeadById,
  getLeads,
  updateLead,
} from "../controllers/lead.controller";
import { adminGuard, verifySuperAdmin } from "../middlewares/admin.middleware";
import { verifyUser } from "../middlewares/user.middleware";

const router = Router();

/**
 * @route   POST /api/leads
 * @desc    Capture a lead from a public form
 * @access  Public
 */
router.post("/", createLead);

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
