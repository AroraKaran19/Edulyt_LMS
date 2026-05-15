import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
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
router.get("/admin", verifyAdmin, listAnnouncementsAdmin);
router.post("/", verifyAdmin, createAnnouncement);
router.delete("/:id", verifyAdmin, deleteAnnouncement);

export default router;
