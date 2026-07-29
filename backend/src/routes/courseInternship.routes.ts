import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin, requirePermission } from "../middlewares/admin.middleware";
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
router.use(requirePermission("courses.course-internships"));

/** GET /api/course-internships?page=1&limit=20&search=&status=all|active|inactive */
router.get("/", listCourseInternshipsController);

/** POST /api/course-internships — create */
router.post("/", createCourseInternshipController);

/** GET/PATCH/DELETE /api/course-internships/:programId */
router.get("/:programId", getCourseInternshipController);
router.patch("/:programId", updateCourseInternshipController);
router.delete("/:programId", deleteCourseInternshipController);

export default router;
