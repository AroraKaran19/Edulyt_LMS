import mongoose from "mongoose";
import { CaApplicationModel, CaTaskModel, CaTaskSubmissionModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { isCaOwnerRole, type CaViewer } from "./caApplicationReview.services";

export type { CaViewer };

export interface CaReviewQueueRow {
  submissionId: string;
  applicationId: string;
  applicantName: string;
  taskId: string;
  taskTitle: string;
  submittedAt: string;
  pendingQuestions: { questionId: string; questionText: string; currentFile: string; learnerComment: string }[];
}

/**
 * The owner scope first resolves the owner's attached application ids, then
 * queries the submission's own `{ pendingReview, applicationId }` index, so
 * neither step scans an unindexed field.
 */
export const listCaReviewQueue = async (viewer: CaViewer): Promise<CaReviewQueueRow[]> => {
  const filter: Record<string, unknown> = { pendingReview: true };
  if (isCaOwnerRole(viewer.userType)) {
    const owned = await CaApplicationModel.find({ ownerUserId: viewer.userId, status: "attached" }, { _id: 1 }).lean();
    filter.applicationId = { $in: owned.map((o) => o._id) };
  }

  const submissions = await CaTaskSubmissionModel.find(filter, {
    applicationId: 1,
    taskId: 1,
    submittedAt: 1,
    fileResponses: 1,
    templateSnapshot: 1,
  }).lean<any[]>();
  if (submissions.length === 0) return [];

  const applicationIds = [...new Set(submissions.map((s) => String(s.applicationId)))];
  const taskIds = [...new Set(submissions.map((s) => String(s.taskId)))];
  const [applications, tasks] = await Promise.all([
    CaApplicationModel.find({ _id: { $in: applicationIds } }, { name: 1 }).lean(),
    CaTaskModel.find({ _id: { $in: taskIds } }, { title: 1 }).lean(),
  ]);
  const nameByApp = new Map(applications.map((a) => [String(a._id), a.name]));
  const titleByTask = new Map(tasks.map((t) => [String(t._id), t.title]));

  return submissions.map((s) => {
    const questionText = new Map(
      (s.templateSnapshot?.questions ?? []).map((q: any) => [q.questionId, q.questionText]),
    );
    return {
      submissionId: String(s._id),
      applicationId: String(s.applicationId),
      applicantName: nameByApp.get(String(s.applicationId)) ?? "",
      taskId: String(s.taskId),
      taskTitle: titleByTask.get(String(s.taskId)) ?? "",
      submittedAt: new Date(s.submittedAt).toISOString(),
      pendingQuestions: (s.fileResponses ?? [])
        .filter((r: any) => r.status === "pending")
        .map((r: any) => ({
          questionId: r.question,
          questionText: questionText.get(r.question) ?? "",
          currentFile: r.currentFile ?? "",
          learnerComment: r.learnerComment ?? "",
        })),
    };
  });
};

export interface ReviewCaTaskAnswerBody {
  verdict: "approved" | "rejected";
  awardedScore?: number;
  note?: string;
}

const scoreFileTotal = (fileResponses: { awardedScore?: number }[]): number =>
  fileResponses.reduce((sum, r) => sum + (r.awardedScore ?? 0), 0);

export const reviewCaTaskAnswer = async (
  viewer: CaViewer,
  submissionId: string,
  questionId: string,
  body: ReviewCaTaskAnswerBody,
): Promise<{ finalized: boolean; passed: boolean | null }> => {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) throw new AppError("Invalid submission id", 400);
  if (body.verdict !== "approved" && body.verdict !== "rejected") {
    throw new AppError("verdict must be approved or rejected", 400);
  }

  const submission = await CaTaskSubmissionModel.findOne(
    { _id: submissionId },
    { applicationId: 1 },
  ).lean<{ applicationId: mongoose.Types.ObjectId } | null>();
  if (!submission) throw new AppError("Submission not found", 404);

  if (isCaOwnerRole(viewer.userType)) {
    const app = await CaApplicationModel.findOne(
      { _id: submission.applicationId },
      { ownerUserId: 1 },
    ).lean<{ ownerUserId: mongoose.Types.ObjectId | null } | null>();
    if (!app || String(app.ownerUserId) !== String(viewer.userId)) {
      throw new AppError("This ambassador is not on your team", 403);
    }
  }

  const awardedScore =
    body.verdict === "approved" ? Math.max(0, Math.floor(Number(body.awardedScore ?? 0))) : 0;

  const reviewed = await CaTaskSubmissionModel.findOneAndUpdate(
    { _id: submissionId, "fileResponses.question": questionId, "fileResponses.status": "pending" },
    {
      $set: {
        "fileResponses.$.status": body.verdict,
        "fileResponses.$.awardedScore": awardedScore,
        "fileResponses.$.reviewNote": (body.note ?? "").trim(),
        "fileResponses.$.reviewedBy": viewer.userId,
        "fileResponses.$.reviewedAt": new Date(),
      },
    },
    { new: true },
  ).lean<any>();
  if (!reviewed) throw new AppError("That answer was already reviewed", 409);

  const stillPending = (reviewed.fileResponses ?? []).some((r: any) => r.status === "pending");
  if (stillPending) return { finalized: false, passed: null };

  const mcqTotal = (reviewed.mcqResponses ?? []).reduce((s: number, r: any) => s + (r.awardedScore ?? 0), 0);
  const fileTotal = scoreFileTotal(reviewed.fileResponses ?? []);
  const totalAwardedScore = mcqTotal + fileTotal;
  const passed = totalAwardedScore >= (reviewed.templateSnapshot?.passScore ?? 0);
  const successPoints = reviewed.templateSnapshot?.successPoints ?? 0;

  const finalized = await CaTaskSubmissionModel.findOneAndUpdate(
    { _id: submissionId, status: "submitted" },
    {
      $set: {
        status: "reviewed",
        pendingReview: false,
        totalAwardedScore,
        passed,
        reviewedAt: new Date(),
        pointsAwardedAt: passed && successPoints > 0 ? new Date() : null,
      },
    },
    { new: true },
  ).lean<any>();
  if (!finalized) return { finalized: false, passed: null };

  if (passed && successPoints > 0) {
    try {
      await CaApplicationModel.updateOne({ _id: finalized.applicationId }, { $inc: { caPoints: successPoints } });
    } catch (error) {
      await CaTaskSubmissionModel.updateOne({ _id: submissionId }, { $set: { pointsAwardedAt: null } });
      throw error;
    }
  }

  return { finalized: true, passed };
};
