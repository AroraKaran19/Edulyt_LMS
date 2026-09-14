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
import { readableBrands } from "../lib/brandScope";
import {
  assertAnnouncementBrand,
  parseBrandInput,
} from "../services/brandOwnership.services";
import { isBrand } from "../constants/brands";

const AUDIENCES: AnnouncementAudience[] = ["course", "internship", "partner"];

const parseAudience = (raw: unknown): AnnouncementAudience | null =>
  AUDIENCES.includes(raw as AnnouncementAudience)
    ? (raw as AnnouncementAudience)
    : null;

/** Admin: create an announcement for one dashboard audience. */
export const createAnnouncement = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, message, audience, brand } = req.body as {
      title?: string;
      message?: string;
      audience?: string;
      brand?: string;
    };
    if (!title?.trim()) throw new AppError("Title is required", 400);
    if (!message?.trim()) throw new AppError("Message is required", 400);
    const aud = parseAudience(audience);
    if (!aud) {
      throw new AppError(
        "Audience must be 'course', 'internship', or 'partner'",
        400,
      );
    }
    const chosen = parseBrandInput(brand, "announcement");
    assertAnnouncementBrand(aud, chosen);
    const created = await createAnnouncementService(
      { title, message, audience: aud, brand: chosen },
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
      isBrand(req.query.brand) ? [req.query.brand] : undefined,
    );
    sendSuccessResponse(
      res,
      { announcements },
      "Announcements fetched",
    );
  },
);

/**
 * Announcements for the caller's own dashboard, newest first. Partners always
 * get `partner` announcements. Learners get their course dashboard feed by
 * default, or the internships feed when `?audience=internship` is requested.
 */
export const getAnnouncementFeed = asyncHandler(
  async (req: Request, res: Response) => {
    let audience: AnnouncementAudience;
    if (req.user?.userType === "partner") {
      audience = "partner";
    } else {
      audience =
        req.query.audience === "internship" ? "internship" : "course";
    }
    const announcements = await listAnnouncementsService(
      audience,
      readableBrands(req.brand),
    );
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
