import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin, requirePermission } from "../middlewares/admin.middleware";
import {
  listCollegesPublic,
  listCollegesAdmin,
  getCollegeAdmin,
  createCollege,
  updateCollege,
  deleteCollege,
} from "../controllers/college.controller";

const router = Router();

router.use(verifyUser);

/**
 * @route   GET /api/colleges
 * @desc    List active colleges (for dropdowns; authenticated users)
 * @access  Private
 */
router.get("/", listCollegesPublic);

router.use(verifyAdmin);
// Everything below is admin college management.
router.use(requirePermission("settings.colleges"));

/**
 * @route   GET /api/colleges/admin
 * @desc    List colleges (admin, filters)
 * @access  Admin
 */
router.get("/admin", listCollegesAdmin);

/**
 * @route   GET /api/colleges/admin/:id
 * @desc    Get one college
 * @access  Admin
 */
router.get("/admin/:id", getCollegeAdmin);

/**
 * @route   POST /api/colleges/admin
 * @desc    Create college
 * @access  Admin
 */
router.post("/admin", createCollege);

/**
 * @route   PUT /api/colleges/admin/:id
 * @desc    Update college
 * @access  Admin
 */
router.put("/admin/:id", updateCollege);

/**
 * @route   DELETE /api/colleges/admin/:id
 * @desc    Delete college
 * @access  Admin
 */
router.delete("/admin/:id", deleteCollege);

export default router;
