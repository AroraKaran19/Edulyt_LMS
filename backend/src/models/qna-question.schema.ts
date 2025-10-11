import { Schema, model } from "mongoose";
import { QnAQuestion } from "../types/qna";

const qnaQuestionSchema = new Schema<QnAQuestion>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["open", "resolved", "closed"],
      default: "open",
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
qnaQuestionSchema.index({ courseId: 1, status: 1 });
qnaQuestionSchema.index({ userId: 1, status: 1 });
qnaQuestionSchema.index({ createdAt: -1 });
qnaQuestionSchema.index({ lastActivityAt: -1 });
qnaQuestionSchema.index({ upvotes: -1 });
qnaQuestionSchema.index({ title: "text", description: "text" });

// Virtual for reply count
qnaQuestionSchema.virtual("replyCount", {
  ref: "QnAReply",
  localField: "_id",
  foreignField: "questionId",
  count: true,
});

// Pre-save middleware to update lastActivityAt
qnaQuestionSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Pre-save middleware to update timestamps
qnaQuestionSchema.pre("save", function (next) {
  if (this.isNew) {
    this.createdAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});

export const QnAQuestionModel = model<QnAQuestion>("QnAQuestion", qnaQuestionSchema);
