import mongoose from "mongoose";
import { VideoNoteModel } from "../models";
import { CourseModel } from "../models/course.schema";
import { UserModel } from "../models/user.schema";
import { AppError } from "../middlewares/error.middleware";
import { VideoNote } from "../types/notes";

/**
 * Create a new video note
 * @param userId - The ID of the user creating the note
 * @param courseId - The ID of the course
 * @param lessonId - The ID of the lesson
 * @param contentId - The ID of the video content
 * @param content - The note content
 * @param timestamp - The video timestamp in seconds
 * @returns Promise<VideoNote>
 */
export const createVideoNote = async (
  userId: string,
  courseId: string,
  lessonId: string,
  contentId: string,
  content: string,
  timestamp: number
): Promise<VideoNote> => {
  try {
    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Validate timestamp is not negative
    if (timestamp < 0) {
      throw new AppError("Timestamp must be a positive number", 400);
    }

    // Create the note
    const videoNote = new VideoNoteModel({
      userId,
      courseId,
      lessonId,
      contentId,
      content,
      timestamp,
    });

    const savedNote = await videoNote.save();
    return savedNote as VideoNote;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in createVideoNote:", error);
    throw new AppError(
      `Failed to create note: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get all notes for a specific video content
 * @param userId - The ID of the user
 * @param courseId - The ID of the course
 * @param lessonId - The ID of the lesson
 * @param contentId - The ID of the video content
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @returns Promise<{notes: VideoNote[], total: number, page: number, totalPages: number}>
 */
export const getVideoNotes = async (
  userId: string,
  courseId: string,
  lessonId: string,
  contentId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  notes: VideoNote[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Input validation
    if (page < 1 || limit < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    if (limit > 100) {
      throw new AppError("Limit cannot exceed 100 items per page", 400);
    }

    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const notes = await VideoNoteModel.find({
      userId,
      courseId,
      lessonId,
      contentId,
    })
      .sort({ timestamp: 1, createdAt: 1 }) // Sort by timestamp first, then by creation time
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await VideoNoteModel.countDocuments({
      userId,
      courseId,
      lessonId,
      contentId,
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      notes: notes as VideoNote[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in getVideoNotes:", error);
    throw new AppError(
      `Failed to retrieve notes: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get all notes for a course
 * @param userId - The ID of the user
 * @param courseId - The ID of the course
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @returns Promise<{notes: VideoNote[], total: number, page: number, totalPages: number}>
 */
export const getCourseNotes = async (
  userId: string,
  courseId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  notes: VideoNote[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Input validation
    if (page < 1 || limit < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    if (limit > 100) {
      throw new AppError("Limit cannot exceed 100 items per page", 400);
    }

    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const notes = await VideoNoteModel.find({
      userId,
      courseId,
    })
      .populate("lessonId", "title")
      .populate("contentId", "title")
      .sort({ createdAt: -1 }) // Sort by creation time (newest first)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await VideoNoteModel.countDocuments({
      userId,
      courseId,
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      notes: notes as VideoNote[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in getCourseNotes:", error);
    throw new AppError(
      `Failed to retrieve course notes: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Update a video note
 * @param noteId - The ID of the note to update
 * @param userId - The ID of the user (must be note owner)
 * @param content - The updated note content
 * @param timestamp - The updated timestamp (optional)
 * @returns Promise<VideoNote>
 */
export const updateVideoNote = async (
  noteId: string,
  userId: string,
  content: string,
  timestamp?: number
): Promise<VideoNote> => {
  try {
    // Validate note exists and belongs to user
    const existingNote = await VideoNoteModel.findOne({
      _id: noteId,
      userId,
    });

    if (!existingNote) {
      throw new AppError("Note not found or unauthorized", 404);
    }

    // Prepare update data
    const updateData: any = {
      content,
      updatedAt: new Date(),
    };

    if (timestamp !== undefined) {
      if (timestamp < 0) {
        throw new AppError("Timestamp must be a positive number", 400);
      }
      updateData.timestamp = timestamp;
    }

    // Update the note
    const updatedNote = await VideoNoteModel.findByIdAndUpdate(
      noteId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    return updatedNote as VideoNote;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in updateVideoNote:", error);
    throw new AppError(
      `Failed to update note: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Delete a video note
 * @param noteId - The ID of the note to delete
 * @param userId - The ID of the user (must be note owner)
 * @returns Promise<{success: boolean, message: string}>
 */
export const deleteVideoNote = async (
  noteId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate note exists and belongs to user
    const existingNote = await VideoNoteModel.findOne({
      _id: noteId,
      userId,
    });

    if (!existingNote) {
      throw new AppError("Note not found or unauthorized", 404);
    }

    // Delete the note
    await VideoNoteModel.findByIdAndDelete(noteId);

    return {
      success: true,
      message: "Note deleted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in deleteVideoNote:", error);
    throw new AppError(
      `Failed to delete note: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get a specific video note by ID
 * @param noteId - The ID of the note
 * @param userId - The ID of the user (must be note owner)
 * @returns Promise<VideoNote | null>
 */
export const getVideoNoteById = async (
  noteId: string,
  userId: string
): Promise<VideoNote | null> => {
  try {
    const note = await VideoNoteModel.findOne({
      _id: noteId,
      userId,
    }).lean();

    return note as VideoNote | null;
  } catch (error) {
    console.error("Database error in getVideoNoteById:", error);
    throw new AppError(
      `Failed to retrieve note: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};
