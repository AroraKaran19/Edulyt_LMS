import {
  createAuthenticationMedia,
  deleteAuthenticationMedia,
  getAllAuthenticationMedia,
  getAuthenticationMediaById,
  updateAuthenticationMedia,
  reorderAuthenticationMedia,
} from "../controllers/authentication-media.controller";
import { adminGuard } from "../middlewares/admin.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/authentication-media
 * @desc    Get all authentication media (sorted by order)
 * @access  Public
 */
router.get("/", getAllAuthenticationMedia);

/**
 * @route   GET /api/authentication-media/:id
 * @desc    Get authentication media by ID
 * @access  Public
 */
router.get("/:id", getAuthenticationMediaById);

/**
 * @route   POST /api/authentication-media
 * @desc    Create new authentication media
 * @access  Admin
 */
router.post("/", ...adminGuard("settings.authentication-media"),createAuthenticationMedia);

/**
 * @route   PUT /api/authentication-media/:id
 * @desc    Update authentication media
 * @access  Admin
 */
router.put("/:id", ...adminGuard("settings.authentication-media"),updateAuthenticationMedia);

/**
 * @route   DELETE /api/authentication-media/:id
 * @desc    Delete authentication media
 * @access  Admin
 */
router.delete("/:id", ...adminGuard("settings.authentication-media"),deleteAuthenticationMedia);

/**
 * @route   POST /api/authentication-media/reorder
 * @desc    Reorder authentication media
 * @access  Admin
 */
router.post("/reorder", ...adminGuard("settings.authentication-media"),reorderAuthenticationMedia);

export default router;

