import crypto from "crypto";
import mongoose from "mongoose";
import {
  CertificateModel,
  EnrollmentModel,
  OrderModel,
  QnAModel,
  ReviewModel,
  UserModel,
  VideoNoteModel,
} from "../models";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { CourseInternshipEnrollmentModel } from "../models/courseInternshipEnrollment.schema";
import { InternshipVoucherModel } from "../models/internshipVoucher.schema";
import { RoleChangeJobModel } from "../models/roleChangeJob.schema";
import { AppError } from "../middlewares/error.middleware";

/** Loose model handle: the collections below share no common document type. */
type AnyModel = mongoose.Model<Record<string, unknown>>;

/** Ids kept per collection. Beyond this the set is marked truncated. */
const ID_CAP = 500;

export type RoleChangeDirection = "to-staff" | "to-student";

interface Actor {
  userId?: mongoose.Types.ObjectId | null;
  name?: string;
  email?: string;
}

/**
 * Every collection holding a learner's own footprint, and the field each keys
 * the user by. Mirrors the account-deletion cascade in `user.services.ts` plus
 * the internship side, which that cascade predates.
 */
const LEARNER_COLLECTIONS: {
  name: string;
  model: AnyModel;
  field: string;
}[] = [
  { name: "enrollments", model: EnrollmentModel as unknown as AnyModel, field: "userId" },
  { name: "orders", model: OrderModel as unknown as AnyModel, field: "userId" },
  { name: "certificates", model: CertificateModel as unknown as AnyModel, field: "userId" },
  { name: "videoNotes", model: VideoNoteModel as unknown as AnyModel, field: "userId" },
  { name: "reviews", model: ReviewModel as unknown as AnyModel, field: "userId" },
  { name: "qna", model: QnAModel as unknown as AnyModel, field: "userId" },
  {
    name: "internshipEnrollments",
    model: InternshipEnrollmentModel as unknown as AnyModel,
    field: "user",
  },
  {
    name: "internshipSubmissions",
    model: InternshipSubmissionModel as unknown as AnyModel,
    field: "userId",
  },
  {
    name: "courseInternshipEnrollments",
    model: CourseInternshipEnrollmentModel as unknown as AnyModel,
    field: "user",
  },
  {
    name: "internshipVouchers",
    model: InternshipVoucherModel as unknown as AnyModel,
    field: "userId",
  },
];

/**
 * Refuses a role change while an earlier one for this account is unfinished.
 *
 * Without it a double-click queues two purges, and a demotion could race a
 * running promotion purge. A `failed` job blocks too: that account is
 * half-purged, and flipping its role again would bury the evidence.
 */
export const assertNoRoleChangeInFlight = async (
  userId: mongoose.Types.ObjectId,
) => {
  const blocking = await RoleChangeJobModel.findOne(
    { userId, status: { $in: ["pending", "processing", "failed"] } },
    { status: 1, direction: 1, jobId: 1 },
  )
    .sort({ createdAt: -1 })
    .lean();
  if (!blocking) return;

  if (blocking.status === "failed") {
    throw new AppError(
      `A previous role change for this account failed (job ${blocking.jobId}) ` +
        "and needs looking at before the role can change again.",
      409,
    );
  }
  throw new AppError(
    "A role change for this account is still running. Try again shortly.",
    409,
  );
};

export const enqueueRoleChangeJob = async (
  userId: mongoose.Types.ObjectId,
  direction: RoleChangeDirection,
  fromUserType: string,
  toUserType: string,
  actor: Actor,
) => {
  const target = await UserModel.findById(userId, {
    firstName: 1,
    lastName: 1,
    email: 1,
  }).lean();

  return RoleChangeJobModel.create({
    jobId: crypto.randomUUID(),
    userId,
    user: {
      name:
        [target?.firstName, target?.lastName].filter(Boolean).join(" ").trim() ||
        "",
      email: target?.email ?? "",
    },
    direction,
    fromUserType,
    toUserType,
    requestedByUserId: actor.userId ?? null,
    requestedBy: { name: actor.name ?? "", email: actor.email ?? "" },
    status: "pending",
  });
};

/**
 * Deletes the learner footprint of an account that has become staff.
 *
 * Collections are cleared one at a time rather than in a `Promise.all`, because
 * the manifest has to record what actually went: a parallel failure would leave
 * some collections cleared and no record of which.
 */
const purgeLearnerData = async (userId: mongoose.Types.ObjectId) => {
  const removed: {
    collection: string;
    count: number;
    ids: string[];
    truncated: boolean;
  }[] = [];

  for (const entry of LEARNER_COLLECTIONS) {
    const filter: mongoose.FilterQuery<Record<string, unknown>> = {
      [entry.field]: userId,
    };
    // Read the ids before deleting: afterwards there is nothing left to name.
    const docs = await entry.model.find(filter, { _id: 1 }).limit(ID_CAP).lean();
    const total = await entry.model.countDocuments(filter);
    if (total === 0) continue;

    await entry.model.deleteMany(filter);
    removed.push({
      collection: entry.name,
      count: total,
      ids: docs.map((d) => String((d as { _id: unknown })._id)),
      truncated: total > docs.length,
    });
  }

  return removed;
};

/**
 * Retires a departing staff member's CRM identity without destroying history.
 *
 * Nothing is deleted here: leads keep the creator and owner snapshots taken at
 * capture, so past attribution and conversion counts stay exactly as they were
 * and a mistaken demotion can be traced and undone.
 */
const retireCrmFootprint = async (userId: mongoose.Types.ObjectId) => {
  const demoted = await UserModel.updateMany(
    { crmParentUserId: userId },
    { $set: { crmCodeActive: false }, $unset: { crmParentUserId: "" } },
  );

  await UserModel.updateOne(
    { _id: userId },
    {
      $set: { crmCodeActive: false },
      // The code itself is kept, so re-promoting restores the same link rather
      // than invalidating whatever they already shared.
      $unset: { crmExtraQuestion: "", crmAmbassadorKind: "" },
    },
  );

  return demoted.modifiedCount;
};

/** Runs one claimed job. Throws on failure so the worker can record it. */
export const runRoleChangeJob = async (job: {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  direction: RoleChangeDirection;
}) => {
  if (job.direction === "to-staff") {
    const removed = await purgeLearnerData(job.userId);
    const total = removed.reduce((n, r) => n + r.count, 0);
    await RoleChangeJobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "completed",
          processedAt: new Date(),
          removed,
          error: null,
          summary:
            total === 0
              ? "No learner data to remove."
              : `Deleted ${total} learner record(s) across ${removed.length} collection(s).`,
        },
      },
    );
    return;
  }

  const detached = await retireCrmFootprint(job.userId);
  await RoleChangeJobModel.updateOne(
    { _id: job._id },
    {
      $set: {
        status: "completed",
        processedAt: new Date(),
        removed: [],
        error: null,
        summary:
          `CRM access retired. ${detached} ambassador(s) detached. ` +
          "Nothing was deleted: leads keep their attribution snapshots.",
      },
    },
  );
};
