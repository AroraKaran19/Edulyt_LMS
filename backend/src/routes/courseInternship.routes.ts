import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import {
  verifyAdmin,
  requirePermission,
  requireAnyPermission,
} from "../middlewares/admin.middleware";
import {
  listCourseInternshipsController,
  getCourseInternshipController,
  createCourseInternshipController,
  updateCourseInternshipController,
  deleteCourseInternshipController,
} from "../controllers/courseInternship.controller";

const router = Router();

router.use(verifyUser);
router.use(verifyAdmin);

/** Owning the programs themselves. */
const OWNER = requirePermission("courses.course-internships");

/** GET /api/course-internships?page=1&limit=20&search=&status=all|active|inactive */
// The course editor attaches a program from this list, so Manage Courses
// must be able to read it without owning the programs.
router.get(
  "/",
  requireAnyPermission("courses.course-internships", "courses.manage"),
  listCourseInternshipsController,
);

/** POST /api/course-internships — create */
router.post("/", OWNER, createCourseInternshipController);

/** GET/PATCH/DELETE /api/course-internships/:programId */
router.get("/:programId", OWNER, getCourseInternshipController);
router.patch("/:programId", OWNER, updateCourseInternshipController);
router.delete("/:programId", OWNER, deleteCourseInternshipController);

export default router;
