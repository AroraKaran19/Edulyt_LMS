import { Router } from "express";
import { verifyUser, verifyPartner } from "../middlewares/user.middleware";
import {
  getPartnerMe,
  getPartnerDashboard,
  getPartnerCourses,
  getPartnerCoursesStudents,
  getPartnerCoursesEnrollments,
  getPartnerFilterCourses,
  getPartnerFilterDomains,
  getPartnerCourseDetail,
  getPartnerInternships,
  getPartnerInternshipDetail,
  getPartnerInternshipStudents,
} from "../controllers/partner.controller";

const router = Router();

router.use(verifyUser, verifyPartner);

/** Partner's own context (linked college + analytics access flags). */
/** Partner's own context (linked college + analytics access flags). */
router.get("/me", getPartnerMe);

/** Dashboard stats scoped to the partner's college. */
router.get("/dashboard", getPartnerDashboard);

/** Courses the partner's students have enrolled in, plus top-line analytics. */
router.get("/courses", getPartnerCourses);

/** Paginated list of the partner's students with course-enrollment aggregates. */
router.get("/courses/students", getPartnerCoursesStudents);

/** Paginated enrollment rows (one per student×course) with filter options. */
router.get("/courses/enrollments", getPartnerCoursesEnrollments);

/** Paginated option lists for the Enrollments filter comboboxes. */
router.get("/courses/filter-options/courses", getPartnerFilterCourses);
router.get("/courses/filter-options/domains", getPartnerFilterDomains);

/** Single-course analytics (gated by courseAnalyticsEnabled). */
router.get("/courses/:slug/analytics", getPartnerCourseDetail);

/** Internships the partner's students have enrolled in, plus top-line analytics. */
router.get("/internships", getPartnerInternships);

/** Single-internship analytics (gated by internshipAnalyticsEnabled). */
router.get("/internships/:slug/analytics", getPartnerInternshipDetail);

/** Paginated student list for a single internship (batch/status/search filters). */
router.get("/internships/:slug/students", getPartnerInternshipStudents);

export default router;
