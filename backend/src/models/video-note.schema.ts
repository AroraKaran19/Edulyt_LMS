import mongoose from "mongoose";
import { VideoNote } from "../types/notes";

const videoNoteSchema = new mongoose.Schema<VideoNote>(
  {
    user: {
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

// functions
videoNoteSchema.statics.getVideoNotes = async function (
  userId: string,
  courseId: string,
  lessonId: string,
  contentId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;
  const notes = await this.find({ userId, courseId, lessonId, contentId })
    .sort({ timestamp: 1, createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return notes;
};
videoNoteSchema.statics.getVideoNoteById = async function (
  noteId: string,
  userId: string
) {
  const note = await this.findOne({ _id: noteId, userId }).lean();
  return note;
};
videoNoteSchema.statics.updateVideoNote = async function (
  noteId: string,
  userId: string,
  content: string,
  timestamp?: number
) {
  const existingNote = await this.findOne({ _id: noteId, userId });
  if (!existingNote) {
    throw new Error("Note not found or unauthorized");
  }
  return await this.findByIdAndUpdate(
    noteId,
    { content, timestamp },
    { new: true, runValidators: true }
  ).lean();
};

export const VideoNoteModel = mongoose.model("VideoNote", videoNoteSchema);
