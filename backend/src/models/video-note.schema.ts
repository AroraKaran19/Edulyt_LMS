import mongoose from "mongoose";
import { VideoNote } from "../types/notes";

/**
 * A learner's private note against a playback position in a course video.
 *
 * Never read by anyone but its author, which is why there is no moderation
 * state, no approval flag, and no instructor-facing query on this collection.
 */
const videoNoteSchema = new mongoose.Schema<VideoNote>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessonId: {
      type: String,
      required: true,
    },
    contentId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    timestamp: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

// The one read the feature performs: a learner's whole note set for a course,
// newest first. Its `userId` prefix also serves the account-deletion cascade in
// `user.services.ts`.
videoNoteSchema.index({ userId: 1, courseId: 1, createdAt: -1 });

// Course deletion clears notes by course alone (`course.services.ts`), which
// the index above cannot serve because `courseId` is not its prefix.
videoNoteSchema.index({ courseId: 1 });

export const VideoNoteModel = mongoose.model("VideoNote", videoNoteSchema);
