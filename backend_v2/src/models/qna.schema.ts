import { QnA, QnAReply } from "@/types";
import mongoose from "mongoose";

// Define static methods interface
interface QnAModelStatic extends mongoose.Model<QnA> {
  addReply(qnaId: string, userId: string, message: string): Promise<any>;
  removeReply(qnaId: string, replyId: string, userId: string): Promise<boolean>;
}

// Embedded reply schema
const qnaReplySchema = new mongoose.Schema<QnAReply>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, _id: true }
);

const qnaSchema = new mongoose.Schema<QnA>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseLesson",
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    replies: {
      type: [qnaReplySchema],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes
qnaSchema.index({ courseId: 1, lessonId: 1, contentId: 1, createdAt: -1 });
qnaSchema.index({ userId: 1, createdAt: -1 });
qnaSchema.index({ "replies.userId": 1, createdAt: -1 });

// Static method to add reply to QnA
qnaSchema.statics.addReply = async function (
  qnaId: string,
  userId: string,
  message: string
) {
  const qna = await this.findById(qnaId);
  if (!qna) {
    throw new Error("QnA not found");
  }

  const reply = {
    userId,
    message,
  };

  qna.replies.push(reply);
  await qna.save();

  return qna.replies[qna.replies.length - 1];
};

// Static method to remove reply from QnA
qnaSchema.statics.removeReply = async function (
  qnaId: string,
  replyId: string,
  userId: string
) {
  const qna = await this.findById(qnaId);
  if (!qna) {
    throw new Error("QnA not found");
  }

  const replyIndex = qna.replies.findIndex(
    (reply) =>
      reply._id?.toString() === replyId && reply.userId.toString() === userId
  );

  if (replyIndex === -1) {
    throw new Error("Reply not found or unauthorized");
  }

  qna.replies.splice(replyIndex, 1);
  await qna.save();

  return true;
};

export const QnAModel = mongoose.model<QnA, QnAModelStatic>("QnA", qnaSchema);
