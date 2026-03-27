import { QnA, QnAReply } from "@/types";
import mongoose from "mongoose";

// Define static methods interface
interface QnAModelStatic extends mongoose.Model<QnA> {
  addReply(qnaId: string, userId: string, message: string): Promise<any>;
  removeReply(
    qnaId: string,
    replyId: string,
    userId: string | mongoose.Types.ObjectId
  ): Promise<boolean>;
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
      required: false,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: false,
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
    approved: {
      type: Boolean,
      default: false,
      required: true,
    }, // Requires instructor/admin approval
    notifyInstructor: {
      type: Boolean,
      default: true,
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
qnaSchema.index({ courseId: 1, lessonId: 1, contentId: 1, approved: 1, createdAt: -1 });
qnaSchema.index({ courseId: 1, approved: 1, notifyInstructor: 1 });
qnaSchema.index({ approved: 1, createdAt: -1 }); // For filtering by approval status
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

/** Normalize embedded ref (ObjectId or populated { _id }) for comparison. */
function embeddedRefIdString(ref: unknown): string {
  if (ref != null && typeof ref === "object" && "_id" in (ref as object)) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
}

// Static method to remove reply from QnA
qnaSchema.statics.removeReply = async function (
  qnaId: string,
  replyId: string,
  userId: string | mongoose.Types.ObjectId
) {
  const qna = await this.findById(qnaId);
  if (!qna) {
    throw new Error("QnA not found");
  }

  const rid = String(replyId);
  const uid = embeddedRefIdString(userId);

  const replyIndex = qna.replies.findIndex(
    (reply) =>
      String(reply._id) === rid &&
      embeddedRefIdString(reply.userId) === uid
  );

  if (replyIndex === -1) {
    throw new Error("Reply not found or unauthorized");
  }

  qna.replies.splice(replyIndex, 1);
  await qna.save();

  return true;
};

export const QnAModel = mongoose.model<QnA, QnAModelStatic>("QnA", qnaSchema);
