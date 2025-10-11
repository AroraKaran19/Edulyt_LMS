import mongoose from "mongoose";
import { VideoNote } from "../types/notes";

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

// Indexes
videoNoteSchema.index({ userId: 1, courseId: 1, createdAt: -1 }); // For fetching user's notes by course
videoNoteSchema.index({ lessonId: 1, contentId: 1, timestamp: 1 }); // For fetching notes by lesson/content
videoNoteSchema.index({ userId: 1, lessonId: 1, contentId: 1 }); // For fetching user's notes for specific video

export const VideoNoteModel = mongoose.model("VideoNote", videoNoteSchema);
