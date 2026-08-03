import { Router } from "express";
import {
  createVideoNote,
  deleteVideoNote,
  getVideoNotes,
  updateVideoNote,
} from "../controllers/notes.controller";
import { verifyUser } from "../middlewares/user.middleware";

const router = Router();

/**
 * Video notes are private to their author. There are no admin routes here by
 * design: nothing on the platform should read a learner's notes.
 */

/**
 * @route   GET /api/notes?courseId=
 * @desc    Every note the caller owns in one course, newest first
 * @access  Authenticated Users (own notes only)
 */
router.get("/", verifyUser, getVideoNotes);

/**
 * @route   POST /api/notes
 * @desc    Create a note anchored to a video position
 * @access  Authenticated Users (enrolled in the course)
 */
router.post("/", verifyUser, createVideoNote);

/**
 * @route   PUT /api/notes/:id
 * @desc    Update a note's text. The timestamp anchor does not move.
 * @access  Authenticated Users (Owner only)
 */
router.put("/:id", verifyUser, updateVideoNote);

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note
 * @access  Authenticated Users (Owner only)
 */
router.delete("/:id", verifyUser, deleteVideoNote);

export default router;
