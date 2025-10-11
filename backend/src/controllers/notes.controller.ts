import { Request, Response } from "express";
import {
  createVideoNote,
  getVideoNotes,
  getCourseNotes,
  updateVideoNote,
  deleteVideoNote,
  getVideoNoteById,
} from "../services/notes.service";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";

/**
 * Create a new video note
 * @route POST /api/notes
 * @access Private (Student/Instructor)
 */
export const createNote = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, lessonId, contentId, content, timestamp } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!courseId || !lessonId || !contentId || !content || timestamp === undefined) {
      throw new AppError("Course ID, lesson ID, content ID, content, and timestamp are required", 400);
    }

    if (typeof timestamp !== "number" || timestamp < 0) {
      throw new AppError("Timestamp must be a positive number", 400);
    }

    if (content.length < 1 || content.length > 2000) {
      throw new AppError("Note content must be between 1 and 2000 characters", 400);
    }

    const videoNote = await createVideoNote(
      userId,
      courseId,
      lessonId,
      contentId,
      content,
      timestamp
    );
    sendSuccessResponse(res, videoNote, "Note created successfully", 201);
  }
);

/**
 * Get all notes for a specific video content
 * @route GET /api/notes/video/:courseId/:lessonId/:contentId
 * @access Private (Student/Instructor)
 */
export const getNotesByVideo = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, lessonId, contentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!courseId || !lessonId || !contentId) {
      throw new AppError("Course ID, lesson ID, and content ID are required", 400);
    }

    const result = await getVideoNotes(
      userId,
      courseId,
      lessonId,
      contentId,
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(res, result, "Notes retrieved successfully", 200);
  }
);

/**
 * Get all notes for a course
 * @route GET /api/notes/course/:courseId
 * @access Private (Student/Instructor)
 */
export const getNotesByCourse = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await getCourseNotes(
      userId,
      courseId,
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(res, result, "Course notes retrieved successfully", 200);
  }
);

/**
 * Get a specific note by ID
 * @route GET /api/notes/:noteId
 * @access Private (Student/Instructor)
 */
export const getNoteById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { noteId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!noteId) {
      throw new AppError("Note ID is required", 400);
    }

    const note = await getVideoNoteById(noteId, userId);

    if (!note) {
      throw new AppError("Note not found", 404);
    }

    sendSuccessResponse(res, note, "Note retrieved successfully", 200);
  }
);

/**
 * Update a video note
 * @route PUT /api/notes/:noteId
 * @access Private (Student/Instructor)
 */
export const updateNote = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { noteId } = req.params;
    const { content, timestamp } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!noteId) {
      throw new AppError("Note ID is required", 400);
    }

    if (!content) {
      throw new AppError("Note content is required", 400);
    }

    if (content.length < 1 || content.length > 2000) {
      throw new AppError("Note content must be between 1 and 2000 characters", 400);
    }

    if (timestamp !== undefined && (typeof timestamp !== "number" || timestamp < 0)) {
      throw new AppError("Timestamp must be a positive number", 400);
    }

    const updatedNote = await updateVideoNote(noteId, userId, content, timestamp);
    sendSuccessResponse(res, updatedNote, "Note updated successfully", 200);
  }
);

/**
 * Delete a video note
 * @route DELETE /api/notes/:noteId
 * @access Private (Student/Instructor)
 */
export const deleteNote = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { noteId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!noteId) {
      throw new AppError("Note ID is required", 400);
    }

    const result = await deleteVideoNote(noteId, userId);
    sendSuccessResponse(res, result, "Note deleted successfully", 200);
  }
);
