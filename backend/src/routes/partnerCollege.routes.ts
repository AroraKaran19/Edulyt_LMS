import { Router } from "express";
import {
  createPartnerCollege,
  getAllPartnerColleges,
  getPartnerCollegeById,
  updatePartnerCollege,
  deletePartnerCollege,
} from "../controllers/partnerCollege.controller";
import { adminGuard } from "../middlewares/admin.middleware";

const router = Router();

/**
 * @route   GET /api/partner-colleges
 * @desc    Get all partner colleges
 * @access  Public
 */
router.get("/", getAllPartnerColleges);

/**
 * @route   GET /api/partner-colleges/:id
 * @desc    Get a partner college by ID
 * @access  Public
 */
router.get("/:id", getPartnerCollegeById);

/**
 * @route   POST /api/partner-colleges
 * @desc    Create a new partner college
 * @access  Admin
 */
router.post("/", ...adminGuard("settings.partnership-import"),createPartnerCollege);

/**
 * @route   PUT /api/partner-colleges/:id
 * @desc    Update a partner college
 * @access  Admin
 */
router.put("/:id", ...adminGuard("settings.partnership-import"),updatePartnerCollege);

/**
 * @route   DELETE /api/partner-colleges/:id
 * @desc    Delete a partner college
 * @access  Admin
 */
router.delete("/:id", ...adminGuard("settings.partnership-import"),deletePartnerCollege);

export default router;
