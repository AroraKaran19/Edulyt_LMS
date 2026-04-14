import { Router } from "express";
import {
  createPartnerCollege,
  getAllPartnerColleges,
  getPartnerCollegeById,
  updatePartnerCollege,
  deletePartnerCollege,
} from "../controllers/partnerCollege.controller";
import { verifyAdmin } from "../middlewares/admin.middleware";
import { verifyUser } from "../middlewares/user.middleware";

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
router.post("/", verifyUser, verifyAdmin, createPartnerCollege);

/**
 * @route   PUT /api/partner-colleges/:id
 * @desc    Update a partner college
 * @access  Admin
 */
router.put("/:id", verifyUser, verifyAdmin, updatePartnerCollege);

/**
 * @route   DELETE /api/partner-colleges/:id
 * @desc    Delete a partner college
 * @access  Admin
 */
router.delete("/:id", verifyUser, verifyAdmin, deletePartnerCollege);

export default router;
