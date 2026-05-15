import { Router } from "express";
import { verifyUser, verifyPartner } from "../middlewares/user.middleware";
import {
  getPartnerMe,
  getPartnerDashboard,
  getPartnerCourses,
  getPartnerCourseDetail,
  getPartnerInternships,
  getPartnerInternshipDetail,
} from "../controllers/partner.controller";

const router = Router();

router.use(verifyUser, verifyPartner);

/** Partner's own context (linked college + analytics access flags). */
router.get("/me", getPartnerMe);

/** Dashboard stats scoped to the partner's college. */
router.get("/dashboard", getPartnerDashboard);

/** Courses the partner's students have enrolled in, plus top-line analytics. */
router.get("/courses", getPartnerCourses);

/** Single-course analytics (gated by courseAnalyticsEnabled). */
router.get("/courses/:slug/analytics", getPartnerCourseDetail);

/** Internships the partner's students have enrolled in, plus top-line analytics. */
router.get("/internships", getPartnerInternships);

/** Single-internship analytics (gated by internshipAnalyticsEnabled). */
router.get("/internships/:slug/analytics", getPartnerInternshipDetail);

export default router;
