import { Schema, model } from "mongoose";
import { QnAReply } from "../types/qna";

const qnaReplySchema = new Schema<QnAReply>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "QnAQuestion",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isInstructorReply: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    isAccepted: {
      type: Boolean,
      default: false,
      index: true,
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
    parentReplyId: {
      type: Schema.Types.ObjectId,
      ref: "QnAReply",
      default: null,
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
qnaReplySchema.index({ questionId: 1, createdAt: 1 });
qnaReplySchema.index({ userId: 1, isInstructorReply: 1 });
qnaReplySchema.index({ parentReplyId: 1 });
qnaReplySchema.index({ isAccepted: 1 });

// Virtual for nested replies
qnaReplySchema.virtual("nestedReplies", {
  ref: "QnAReply",
  localField: "_id",
  foreignField: "parentReplyId",
});

// Virtual for parent reply
qnaReplySchema.virtual("parentReply", {
  ref: "QnAReply",
  localField: "parentReplyId",
  foreignField: "_id",
  justOne: true,
});

// Pre-save middleware to update timestamps
qnaReplySchema.pre("save", function (next) {
  if (this.isNew) {
    this.createdAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to update question's lastActivityAt
qnaReplySchema.post("save", async function () {
  const QnAQuestionModel = model("QnAQuestion");
  await QnAQuestionModel.findByIdAndUpdate(this.questionId, {
    lastActivityAt: new Date(),
  });
});

export const QnAReplyModel = model<QnAReply>("QnAReply", qnaReplySchema);
