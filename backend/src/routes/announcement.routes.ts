import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin, requirePermission } from "../middlewares/admin.middleware";
import {
  createAnnouncement,
  listAnnouncementsAdmin,
  getAnnouncementFeed,
  deleteAnnouncement,
} from "../controllers/announcement.controller";

const router = Router();

router.use(verifyUser);

/** Announcements for the caller's dashboard (student or partner), newest first. */
router.get("/feed", getAnnouncementFeed);

// ── Admin management ────────────────────────────────────────────────────────
router.get("/admin", verifyAdmin, requirePermission("settings.announcements"),listAnnouncementsAdmin);
router.post("/", verifyAdmin, requirePermission("settings.announcements"),createAnnouncement);
router.delete("/:id", verifyAdmin, requirePermission("settings.announcements"),deleteAnnouncement);

export default router;
