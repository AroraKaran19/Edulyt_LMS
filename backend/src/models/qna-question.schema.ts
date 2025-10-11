import mongoose from "mongoose";
import { QnAQuestion } from "../types/qna";

const qnaQuestionSchema = new mongoose.Schema<QnAQuestion>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    isResolved: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
qnaQuestionSchema.index({ courseId: 1, createdAt: -1 }); // For fetching questions by course
qnaQuestionSchema.index({ userId: 1, createdAt: -1 }); // For fetching questions by user
qnaQuestionSchema.index({ isResolved: 1, courseId: 1 }); // For filtering resolved/unresolved questions

export const QnAQuestionModel = mongoose.model("QnAQuestion", qnaQuestionSchema);
