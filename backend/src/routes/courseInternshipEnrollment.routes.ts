import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import {
  listMyCourseInternshipsController,
  getMyCourseInternshipController,
} from "../controllers/courseInternshipEnrollment.controller";

const router = Router();

router.use(verifyUser);

/** GET /api/course-internship-enrollments/me — the caller's course internships */
router.get("/me", listMyCourseInternshipsController);

/** GET /api/course-internship-enrollments/me/:enrollmentId — one, with tasks */
router.get("/me/:enrollmentId", getMyCourseInternshipController);

export default router;
