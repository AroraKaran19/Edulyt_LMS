import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createVideoNoteService,
  deleteVideoNoteService,
  listVideoNotesService,
  updateVideoNoteService,
} from "../services/notes.services";

/**
 * `userId` always comes from the verified session, never from the request, so
 * there is no path by which a caller can read or write another user's notes.
 */
const requireUserId = (req: Request): string => {
  const userId = req.user?._id;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }
  return String(userId);
};

export const getVideoNotes = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { courseId } = req.query;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await listVideoNotesService(userId, String(courseId));

    sendSuccessResponse(res, result, "Notes fetched successfully", 200);
  }
);

export const createVideoNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { courseId, lessonId, contentId, content, timestamp } = req.body;

    const note = await createVideoNoteService({
      userId,
      courseId,
      lessonId,
      contentId,
      content,
      timestamp,
    });

    sendSuccessResponse(res, note, "Note created successfully", 201);
  }
);

export const updateVideoNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { id } = req.params;
    const { content } = req.body;

    const note = await updateVideoNoteService(id, userId, content);

    sendSuccessResponse(res, note, "Note updated successfully", 200);
  }
);

export const deleteVideoNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { id } = req.params;

    await deleteVideoNoteService(id, userId);

    sendSuccessResponse(res, null, "Note deleted successfully", 200);
  }
);
