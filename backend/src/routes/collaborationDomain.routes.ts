import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
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
router.get("/", verifyUser, verifyAdmin, listCollaborationDomains);

/**
 * @route   GET /api/collaboration-domains/:collaborationDomainId
 * @desc    Get collaboration domain by ID (Admin only)
 * @access  Admin
 */
router.get(
  "/:collaborationDomainId",
  verifyUser,
  verifyAdmin,
  getCollaborationDomainById
);

/**
 * @route   POST /api/collaboration-domains
 * @desc    Create a collaboration domain (Admin only)
 * @access  Admin
 */
router.post("/", verifyUser, verifyAdmin, createCollaborationDomain);

/**
 * @route   PUT /api/collaboration-domains/:collaborationDomainId
 * @desc    Update a collaboration domain (Admin only)
 * @access  Admin
 */
router.put(
  "/:collaborationDomainId",
  verifyUser,
  verifyAdmin,
  updateCollaborationDomain
);

/**
 * @route   DELETE /api/collaboration-domains/:collaborationDomainId
 * @desc    Delete a collaboration domain (Admin only)
 * @access  Admin
 */
router.delete(
  "/:collaborationDomainId",
  verifyUser,
  verifyAdmin,
  deleteCollaborationDomain
);

export default router;
