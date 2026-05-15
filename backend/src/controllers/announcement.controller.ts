import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createAnnouncementService,
  listAnnouncementsService,
  deleteAnnouncementService,
} from "../services/announcement.services";
import { AnnouncementAudience } from "../types";

const AUDIENCES: AnnouncementAudience[] = ["student", "partner"];

const parseAudience = (raw: unknown): AnnouncementAudience | null =>
  AUDIENCES.includes(raw as AnnouncementAudience)
    ? (raw as AnnouncementAudience)
    : null;

/** Admin: create an announcement for one dashboard audience. */
export const createAnnouncement = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, message, audience } = req.body as {
      title?: string;
      message?: string;
      audience?: string;
    };
    if (!title?.trim()) throw new AppError("Title is required", 400);
    if (!message?.trim()) throw new AppError("Message is required", 400);
    const aud = parseAudience(audience);
    if (!aud) {
      throw new AppError("Audience must be 'student' or 'partner'", 400);
    }
    const created = await createAnnouncementService(
      { title, message, audience: aud },
      req.user?._id,
    );
    sendSuccessResponse(res, created, "Announcement created", 201);
  },
);

/** Admin: every announcement, newest first (optionally filtered by audience). */
export const listAnnouncementsAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const audience = parseAudience(req.query.audience);
    const announcements = await listAnnouncementsService(
      audience ?? undefined,
    );
    sendSuccessResponse(
      res,
      { announcements },
      "Announcements fetched",
    );
  },
);

/**
 * Announcements for the caller's own dashboard, newest first. Partners get
 * `partner` announcements; everyone else gets `student` announcements.
 */
export const getAnnouncementFeed = asyncHandler(
  async (req: Request, res: Response) => {
    const audience: AnnouncementAudience =
      req.user?.userType === "partner" ? "partner" : "student";
    const announcements = await listAnnouncementsService(audience);
    sendSuccessResponse(
      res,
      { announcements },
      "Announcement feed fetched",
    );
  },
);

/** Admin: delete an announcement. */
export const deleteAnnouncement = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("Announcement id is required", 400);
    const deleted = await deleteAnnouncementService(id);
    if (!deleted) throw new AppError("Announcement not found", 404);
    sendSuccessResponse(res, null, "Announcement deleted");
  },
);
