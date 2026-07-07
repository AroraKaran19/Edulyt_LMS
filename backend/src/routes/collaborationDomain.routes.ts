import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { adminGuard } from "../middlewares/admin.middleware";
import {
  listCollaborationDomains,
  getCollaborationDomainById,
  createCollaborationDomain,
  updateCollaborationDomain,
  deleteCollaborationDomain,
  resolveCollaborationForCheckout,
} from "../controllers/collaborationDomain.controller";

const router = Router();

/**
 * @route   POST /api/collaboration-domains/resolve
 * @desc    Resolve partnership pricing for checkout (authenticated user)
 * @access  Private
 */
router.post("/resolve", verifyUser, resolveCollaborationForCheckout);

/**
 * @route   GET /api/collaboration-domains
 * @desc    List collaboration domains (Admin only)
 * @access  Admin
 */
router.get("/", ...adminGuard("settings.collaboration-domains"),listCollaborationDomains);

/**
 * @route   GET /api/collaboration-domains/:collaborationDomainId
 * @desc    Get collaboration domain by ID (Admin only)
 * @access  Admin
 */
router.get(
  "/:collaborationDomainId",
  ...adminGuard("settings.collaboration-domains"),
  getCollaborationDomainById
);

/**
 * @route   POST /api/collaboration-domains
 * @desc    Create a collaboration domain (Admin only)
 * @access  Admin
 */
router.post("/", ...adminGuard("settings.collaboration-domains"),createCollaborationDomain);

/**
 * @route   PUT /api/collaboration-domains/:collaborationDomainId
 * @desc    Update a collaboration domain (Admin only)
 * @access  Admin
 */
router.put(
  "/:collaborationDomainId",
  ...adminGuard("settings.collaboration-domains"),
  updateCollaborationDomain
);

/**
 * @route   DELETE /api/collaboration-domains/:collaborationDomainId
 * @desc    Delete a collaboration domain (Admin only)
 * @access  Admin
 */
router.delete(
  "/:collaborationDomainId",
  ...adminGuard("settings.collaboration-domains"),
  deleteCollaborationDomain
);

export default router;
