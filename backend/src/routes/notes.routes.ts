import {
  createNote,
  getNotesByVideo,
  getNotesByCourse,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/notes.controller";
import { Router } from "express";

const router = Router();

/**
 * @route   POST /api/notes
 * @desc    Create a new video note
 * @access  Private (Student/Instructor)
 * @body
 *   - courseId: The ID of the course (required)
 *   - lessonId: The ID of the lesson (required)
 *   - contentId: The ID of the video content (required)
 *   - content: The note content (required, 1-2000 characters)
 *   - timestamp: The video timestamp in seconds (required, positive number)
 * @example
 *   POST /api/notes
 *   Body: {
 *     "courseId": "64a1b2c3d4e5f6789012345",
 *     "lessonId": "64a1b2c3d4e5f6789012346",
 *     "contentId": "64a1b2c3d4e5f6789012347",
 *     "content": "This is an important concept to remember",
 *     "timestamp": 120.5
 *   }
 */
router.post("/", createNote);

/**
 * @route   GET /api/notes/video/:courseId/:lessonId/:contentId
 * @desc    Get all notes for a specific video content
 * @access  Private (Student/Instructor)
 * @params
 *   - courseId: The ID of the course (required)
 *   - lessonId: The ID of the lesson (required)
 *   - contentId: The ID of the video content (required)
 * @query
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 * @example
 *   GET /api/notes/video/64a1b2c3d4e5f6789012345/64a1b2c3d4e5f6789012346/64a1b2c3d4e5f6789012347?page=1&limit=10
 */
router.get("/video/:courseId/:lessonId/:contentId", getNotesByVideo);

/**
 * @route   GET /api/notes/course/:courseId
 * @desc    Get all notes for a course
 * @access  Private (Student/Instructor)
 * @params
 *   - courseId: The ID of the course (required)
 * @query
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 * @example
 *   GET /api/notes/course/64a1b2c3d4e5f6789012345?page=1&limit=10
 */
router.get("/course/:courseId", getNotesByCourse);

/**
 * @route   GET /api/notes/:noteId
 * @desc    Get a specific note by ID
 * @access  Private (Student/Instructor)
 * @params
 *   - noteId: The ID of the note (required)
 * @example
 *   GET /api/notes/64a1b2c3d4e5f6789012345
 */
router.get("/:noteId", getNoteById);

/**
 * @route   PUT /api/notes/:noteId
 * @desc    Update a video note
 * @access  Private (Student/Instructor)
 * @params
 *   - noteId: The ID of the note (required)
 * @body
 *   - content: The updated note content (required, 1-2000 characters)
 *   - timestamp: The updated timestamp in seconds (optional, positive number)
 * @example
 *   PUT /api/notes/64a1b2c3d4e5f6789012345
 *   Body: {
 *     "content": "Updated note content",
 *     "timestamp": 150.0
 *   }
 */
router.put("/:noteId", updateNote);

/**
 * @route   DELETE /api/notes/:noteId
 * @desc    Delete a video note
 * @access  Private (Student/Instructor)
 * @params
 *   - noteId: The ID of the note (required)
 * @example
 *   DELETE /api/notes/64a1b2c3d4e5f6789012345
 */
router.delete("/:noteId", deleteNote);

export default router;
