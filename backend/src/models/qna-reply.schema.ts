import mongoose from "mongoose";
import { QnAReply } from "../types/qna";

const qnaReplySchema = new mongoose.Schema<QnAReply>(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QnAQuestion",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reply: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
    isInstructorReply: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
qnaReplySchema.index({ questionId: 1, createdAt: 1 }); // For fetching replies by question
qnaReplySchema.index({ userId: 1, createdAt: -1 }); // For fetching replies by user
qnaReplySchema.index({ isInstructorReply: 1, questionId: 1 }); // For filtering instructor replies

export const QnAReplyModel = mongoose.model("QnAReply", qnaReplySchema);
