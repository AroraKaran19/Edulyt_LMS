import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  listInternshipsPublic,
  listFeaturedInternshipsPublic,
  listInternshipsAdmin,
  getInternshipAdmin,
  getInternshipEnrollPreview,
  getInternshipBySlug,
  checkSlugAvailability,
  createInternship,
  updateInternship,
  deleteInternship,
} from "../controllers/internship.controller";

const router = Router();

/**
 * @route   GET /api/internships
 * @desc    List active internships (public, paginated + search + audience filter)
 * @access  Public
 */
router.get("/", listInternshipsPublic);

/**
 * @route   GET /api/internships/featured
 * @desc    List active, featured internships (public)
 * @access  Public
 */
router.get("/featured", listFeaturedInternshipsPublic);

/**
 * @route   GET /api/internships/slug/:slug/enroll-preview
 * @desc    Batches + entrance exam windows for public enroll form
 * @access  Public
 */
router.get("/slug/:slug/enroll-preview", getInternshipEnrollPreview);

/**
 * @route   GET /api/internships/slug/:slug
 * @desc    Get internship by slug (public, populated)
 * @access  Public
 */
router.get("/slug/:slug", getInternshipBySlug);

router.use(verifyUser);

/**
 * @route   GET /api/internships/check-slug/:slug
 * @desc    Check slug availability (optional excludeId query param)
 * @access  Private
 */
router.get("/check-slug/:slug", checkSlugAvailability);

router.use(verifyAdmin);

/**
 * @route   GET /api/internships/admin
 * @desc    List all internships (admin, paginated + filters)
 * @access  Admin
 */
router.get("/admin", listInternshipsAdmin);

/**
 * @route   GET /api/internships/admin/id/:id
 * @desc    Get internship by ID (admin, populated)
 * @access  Admin
 */
router.get("/admin/id/:id", getInternshipAdmin);

/**
 * @route   POST /api/internships/metadata
 * @desc    Create internship (metadata + batches)
 * @access  Admin
 */
router.post("/metadata", createInternship);

/**
 * @route   PUT /api/internships/:id/metadata
 * @desc    Update internship (metadata)
 * @access  Admin
 */
router.put("/:id/metadata", updateInternship);

/**
 * @route   DELETE /api/internships/:id
 * @desc    Delete internship
 * @access  Admin
 */
router.delete("/:id", deleteInternship);

export default router;
