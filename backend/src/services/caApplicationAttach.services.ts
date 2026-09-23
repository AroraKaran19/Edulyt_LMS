import mongoose from "mongoose";
import { CaApplicationModel, UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { attachStudentToOwner } from "./crmProfile.services";
import type { CaApplication, CaAttachIssue } from "../types/caApplication";

export interface CaAccount {
  _id: mongoose.Types.ObjectId;
  email?: string;
  userType?: string;
}

export type CaAttachOutcome =
  | "attached"
  | "no-account"
  | "not-student"
  | "other-owner"
  | "retry-later";

export type AttachableApplication = Pick<
  CaApplication,
  | "_id"
  | "email"
  | "phone"
  | "userId"
  | "ownerUserId"
  | "kind"
  | "collegeId"
  | "collegeName"
  | "degree"
  | "careerStage"
  | "address"
>;

const ATTACH_FIELDS = {
  address: 1,
  email: 1,
  phone: 1,
  userId: 1,
  ownerUserId: 1,
  kind: 1,
  collegeId: 1,
  collegeName: 1,
  degree: 1,
  careerStage: 1,
};

const blank = (field: string) => ({ $in: [{ $ifNull: [`$${field}`, ""] }, [""]] });

/**
 * Fills only what the student left empty, in one atomic pipeline update. Gated on
 * their verified phone matching the application: the application email is taken
 * as typed, so without this anyone could write into another person's profile.
 * Values go in as `$literal` because a pipeline reads a leading `$` as a field path.
 */
export const fillBlankProfileFields = async (
  app: AttachableApplication,
  userId: mongoose.Types.ObjectId,
): Promise<void> => {
  const set: Record<string, unknown> = {};
  if (app.collegeName) {
    set.collegeName = { $cond: [blank("collegeName"), { $literal: app.collegeName }, "$collegeName"] };
    set.college = { $cond: [blank("collegeName"), app.collegeId ?? "$college", "$college"] };
  }
  if (app.degree) {
    set.degreeName = { $cond: [blank("degreeName"), { $literal: app.degree }, "$degreeName"] };
  }
  if (app.careerStage) {
    set.experienceLevel = {
      $cond: [blank("experienceLevel"), { $literal: app.careerStage }, "$experienceLevel"],
    };
  }
  if (app.address?.line) {
    const keepOr = (path: string, value: string) =>
      ({ $cond: [blank(path), { $literal: value }, `$${path}`] });
    // The profile's address subdocument uses `address` for the street line.
    set.address = {
      address: keepOr("address.address", app.address.line),
      city: keepOr("address.city", app.address.city),
      state: keepOr("address.state", app.address.state),
      pincode: keepOr("address.pincode", app.address.pincode),
      country: keepOr("address.country", app.address.country),
    };
  }
  if (Object.keys(set).length === 0) return;

  // Mongoose's updateOne typings do not accept an aggregation-pipeline update
  // (`[{ $set: ... }]`); the driver supports it, so cast at the call site.
  await UserModel.updateOne(
    { _id: userId, userType: "student", phoneVerifiedAt: { $ne: null }, phone: app.phone },
    [{ $set: set }] as unknown as Record<string, unknown>,
  );
};

const markAttachIssue = (id: mongoose.Types.ObjectId, issue: CaAttachIssue) =>
  CaApplicationModel.updateOne({ _id: id, status: "approved" }, { $set: { attachIssue: issue } });

const lookupAccount = async (app: AttachableApplication): Promise<CaAccount | null> => {
  const projection = { _id: 1, email: 1, userType: 1 };
  const found = app.userId
    ? await UserModel.findById(app.userId, projection).lean()
    : await UserModel.findOne({ email: app.email }, projection).lean();
  return (found as CaAccount | null) ?? null;
};

/** `preloaded` is the sweep's batch lookup; `undefined` means look it up here. */
export const attachApprovedApplication = async (
  app: AttachableApplication,
  preloaded?: CaAccount | null,
): Promise<CaAttachOutcome> => {
  if (!app.ownerUserId || !app.kind) {
    throw new AppError("This application has not been approved", 409);
  }

  const account = preloaded !== undefined ? preloaded : await lookupAccount(app);
  if (!account) return "no-account";

  if (account.userType !== "student") {
    await markAttachIssue(app._id, "not-student");
    return "not-student";
  }

  try {
    await attachStudentToOwner(app.ownerUserId, account._id, app.kind);
  } catch (error) {
    if (error instanceof AppError && error.code === "CA_OTHER_OWNER") {
      await markAttachIssue(app._id, "other-owner");
      return "other-owner";
    }
    throw error;
  }

  await fillBlankProfileFields(app, account._id);
  const closed = await CaApplicationModel.updateOne(
    { _id: app._id, status: "approved", ownerUserId: app.ownerUserId },
    {
      $set: { status: "attached", attachedAt: new Date(), userId: account._id, attachIssue: null },
      $unset: { open: "" },
    },
  );
  if (closed.matchedCount === 0) {
    console.warn(
      `[ca-applications] application ${String(app._id)} changed before it could close; the roster was written, the sweep or admin view reconciles`,
    );
  }
  return "attached";
};

/**
 * Attaches approved applicants who have since signed up, by whatever path. One
 * query for the batch and one for their accounts, so it costs the same whether
 * one or a hundred are waiting.
 */
export const runCaAttachSweep = async (
  limit = 100,
): Promise<{ scanned: number; attached: number }> => {
  const rows = (await CaApplicationModel.find(
    { status: "approved", open: true, attachIssue: null },
    ATTACH_FIELDS,
  )
    .sort({ attachCheckedAt: 1 })
    .limit(limit)
    .lean()) as AttachableApplication[];
  if (rows.length === 0) return { scanned: 0, attached: 0 };

  const accounts = (await UserModel.find(
    { email: { $in: rows.map((r) => r.email) } },
    { _id: 1, email: 1, userType: 1 },
  ).lean()) as unknown as CaAccount[];
  const byEmail = new Map(accounts.map((a) => [String(a.email).toLowerCase(), a]));

  let attached = 0;
  const stillWaiting: mongoose.Types.ObjectId[] = [];
  for (const row of rows) {
    const account = byEmail.get(row.email);
    let outcome: CaAttachOutcome | null = null;
    if (account) {
      try {
        outcome = await attachApprovedApplication(row, account);
      } catch (error) {
        console.error(`[ca-worker] attach failed for application ${String(row._id)}:`, error);
      }
    }
    if (outcome === "attached") attached += 1;
    else stillWaiting.push(row._id);
  }

  // Moves the ones that are still waiting to the back, so applicants who never
  // sign up cannot hold the head of the queue.
  if (stillWaiting.length > 0) {
    await CaApplicationModel.updateMany(
      { _id: { $in: stillWaiting } },
      { $set: { attachCheckedAt: new Date() } },
    );
  }
  return { scanned: rows.length, attached };
};
