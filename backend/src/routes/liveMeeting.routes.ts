import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin, requirePermission } from "../middlewares/admin.middleware";
import {
  activateInternshipLiveMeetingLinkController,
  attendInternshipLiveMeetingController,
  createInternshipLiveMeetingController,
  deleteInternshipLiveMeetingController,
  getInternshipLiveMeetingAttendanceController,
  getInternshipLiveMeetingController,
  listInternshipLiveMeetingsController,
  setInternshipLiveMeetingAttendanceOverrideController,
  updateInternshipLiveMeetingController,
} from "../controllers/liveMeeting.controller";

const router = Router();

// ── Authenticated user ──
router.use(verifyUser);

/**
 * @route   POST /api/internship-live-meetings/attend/:token
 * @desc    Student records attendance via a checkpoint link.
 * @access  Authenticated user
 */
router.post("/attend/:token", attendInternshipLiveMeetingController);

// ── Admin ──
router.use(verifyAdmin);
router.use(requirePermission("internships.live-meetings"));

/** POST /api/internship-live-meetings — create */
router.post("/", createInternshipLiveMeetingController);

/** GET /api/internship-live-meetings/admin?internshipId=&batchId=&page=&limit= */
router.get("/admin", listInternshipLiveMeetingsController);

/** GET /api/internship-live-meetings/admin/:meetingId */
router.get("/admin/:meetingId", getInternshipLiveMeetingController);

/** PATCH /api/internship-live-meetings/admin/:meetingId */
router.patch("/admin/:meetingId", updateInternshipLiveMeetingController);

/** GET /api/internship-live-meetings/admin/:meetingId/attendance */
router.get(
  "/admin/:meetingId/attendance",
  getInternshipLiveMeetingAttendanceController,
);

/** POST /api/internship-live-meetings/admin/:meetingId/attendance/override */
router.post(
  "/admin/:meetingId/attendance/override",
  setInternshipLiveMeetingAttendanceOverrideController,
);

/** POST /api/internship-live-meetings/admin/:meetingId/activate/:slot */
router.post(
  "/admin/:meetingId/activate/:slot",
  activateInternshipLiveMeetingLinkController,
);

/** DELETE /api/internship-live-meetings/admin/:meetingId */
router.delete("/admin/:meetingId", deleteInternshipLiveMeetingController);

export default router;
