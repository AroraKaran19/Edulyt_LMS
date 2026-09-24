import mongoose from "mongoose";
import {
  CaApplicationModel,
  CaDocumentJobModel,
  CaMeetingModel,
  CaTaskModel,
  CaTaskSubmissionModel,
  UserModel,
} from "../models";
import { AppError } from "../middlewares/error.middleware";
import { normalizePhone } from "./phoneVerification.services";
import { decryptCaText } from "../lib/caPii";
import { addIstCalendarDays, parseIstDateOnly, todayIst, ymdIst } from "../utils/ist";
import { tenureEndDate } from "../lib/caApplication";
import { caDesignation } from "../lib/caDocuments";
import { AMBASSADOR_KINDS } from "./crmProfile.services";
import { attachApprovedApplication, type CaAttachOutcome } from "./caApplicationAttach.services";
import { allocateNextInternId } from "./internId.services";
import { enqueueCaDocumentJob, rearmFailedCaDocumentJobs } from "./caDocumentJob.services";
import { getCaPageSettings } from "./caPageSettings.services";
import type { CaDocumentKind } from "../models/caDocumentJob.schema";
import type { AmbassadorKind } from "../types/crm";
import type {
  CaAddress,
  CaApplication,
  CaApplicationStatus,
  CaAttachIssue,
} from "../types/caApplication";

export interface CaViewer {
  userId: mongoose.Types.ObjectId;
  userType: string;
  name: string;
}

export const isCaOwnerRole = (userType: string | undefined): boolean =>
  userType === "marketer" || userType === "sales";

export const caScopeFilter = (viewer: CaViewer): Record<string, unknown> =>
  isCaOwnerRole(viewer.userType) ? { "referrer.userId": viewer.userId } : {};

export const assertCaAdmin = (viewer: CaViewer): void => {
  if (isCaOwnerRole(viewer.userType)) {
    throw new AppError("Only an admin can do this", 403);
  }
};

/**
 * Lists and owners never get the address; nobody gets the payout except
 * through `revealCaApplication`.
 */
export const CA_ROW_PROJECTION = { payout: 0, address: 0 };
export const CA_ADMIN_DETAIL_PROJECTION = { payout: 0 };

export const fullName = (u: { firstName?: string; lastName?: string } | null | undefined): string =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();

export interface CaApplicationRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  collegeName: string;
  degree: string;
  careerStage: string;
  collegeEmail: string;
  languages: string[];
  whatsappJoined: boolean;
  /** Null unless an admin opened the detail. */
  address: CaAddress | null;
  /** Set only once the CA has changed their own payout details. */
  payoutChangedAt: string | null;
  joiningDate: string | null;
  durationMonths: number;
  endDate: string | null;
  referrer: { userId: string; name: string } | null;
  status: CaApplicationStatus;
  kind: AmbassadorKind | null;
  owner: { userId: string; name: string } | null;
  decidedBy: string;
  decidedAt: string | null;
  attachedAt: string | null;
  attachIssue: CaAttachIssue | null;
  hasAccount: boolean;
  internId: string | null;
  documents: {
    offerLetter: string | null;
    lor: string | null;
    internshipCertificate: string | null;
    trainingCertificate: string | null;
  };
  completion: {
    hold: boolean;
    issuedAt: string | null;
    outcome: "eligible" | "not-eligible" | null;
    certificateOverride: "pass" | "fail" | null;
  };
  createdAt: string;
  /** Admin detail only: document jobs that used up their retries. */
  failedDocumentJobs?: { kind: CaDocumentKind; error: string | null }[];
}

type CaRowSource = Omit<CaApplication, "payout">;

const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);

export const toCaApplicationRow = (doc: CaRowSource): CaApplicationRow => ({
  id: String(doc._id),
  name: doc.name,
  email: doc.email,
  phone: doc.phone,
  collegeName: doc.collegeName ?? "",
  degree: doc.degree ?? "",
  careerStage: doc.careerStage ?? "",
  collegeEmail: doc.collegeEmail ?? "",
  languages: doc.languages ?? [],
  whatsappJoined: Boolean(doc.whatsappJoined),
  address: doc.address ?? null,
  payoutChangedAt: iso(doc.payoutChangedAt),
  joiningDate: ymdIst(doc.joiningDate),
  durationMonths: doc.durationMonths,
  endDate: ymdIst(doc.endDate),
  referrer: doc.referrer
    ? { userId: String(doc.referrer.userId), name: doc.referrer.name }
    : null,
  status: doc.status,
  kind: doc.kind ?? null,
  owner: doc.ownerUserId ? { userId: String(doc.ownerUserId), name: doc.ownerName ?? "" } : null,
  decidedBy: doc.decidedBy?.name ?? "",
  decidedAt: iso(doc.decidedAt),
  attachedAt: iso(doc.attachedAt),
  attachIssue: doc.attachIssue ?? null,
  hasAccount: Boolean(doc.userId),
  internId: doc.internId ?? null,
  documents: {
    offerLetter: doc.documents?.offerLetter?.url ?? null,
    lor: doc.documents?.lor?.url ?? null,
    internshipCertificate: doc.documents?.internshipCertificate?.url ?? null,
    trainingCertificate: doc.documents?.trainingCertificate?.url ?? null,
  },
  completion: {
    hold: Boolean(doc.completion?.hold),
    issuedAt: iso(doc.completion?.issuedAt),
    outcome: doc.completion?.outcome ?? null,
    certificateOverride: doc.completion?.certificateOverride ?? null,
  },
  createdAt: new Date(doc.createdAt).toISOString(),
});

const LIST_STATUSES: CaApplicationStatus[] = ["pending", "approved"];

export interface ListCaApplicationsQuery {
  status?: unknown;
  referrer?: unknown;
  q?: unknown;
  page?: unknown;
  limit?: unknown;
}

/**
 * Only the open tabs are listable, which is also what keeps an email or phone
 * search on the partial unique indexes: those cover `open: true` rows only.
 */
export const listCaApplications = async (viewer: CaViewer, query: ListCaApplicationsQuery) => {
  const status = LIST_STATUSES.includes(query.status as CaApplicationStatus)
    ? (query.status as CaApplicationStatus)
    : "pending";
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const limit = Math.min(50, Math.max(1, Math.floor(Number(query.limit)) || 20));

  const filter: Record<string, unknown> = { status, open: true, ...caScopeFilter(viewer) };
  if (!isCaOwnerRole(viewer.userType) && typeof query.referrer === "string" && query.referrer) {
    if (query.referrer === "direct") filter["referrer.userId"] = null;
    else if (mongoose.isValidObjectId(query.referrer)) {
      filter["referrer.userId"] = new mongoose.Types.ObjectId(query.referrer);
    }
  }
  const q = String(query.q ?? "").trim();
  if (q) {
    if (q.includes("@")) filter.email = q.toLowerCase();
    else filter.phone = normalizePhone(q);
  }

  const [rows, total] = await Promise.all([
    CaApplicationModel.find(filter, CA_ROW_PROJECTION)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CaApplicationModel.countDocuments(filter),
  ]);

  return {
    applications: (rows as CaRowSource[]).map(toCaApplicationRow),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

const assertId = (id: string): void => {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Application not found", 404);
};

export const getCaApplication = async (viewer: CaViewer, id: string): Promise<CaApplicationRow> => {
  assertId(id);
  const doc = await CaApplicationModel.findOne(
    { _id: id, ...caScopeFilter(viewer) },
    isCaOwnerRole(viewer.userType) ? CA_ROW_PROJECTION : CA_ADMIN_DETAIL_PROJECTION,
  ).lean();
  if (!doc) throw new AppError("Application not found", 404);
  const row = toCaApplicationRow(doc as CaRowSource);
  if (isCaOwnerRole(viewer.userType)) return row;
  const failed = await CaDocumentJobModel.find(
    { applicationId: doc._id, status: "failed" },
    { kind: 1, error: 1 },
  ).lean();
  return { ...row, failedDocumentJobs: failed.map((j) => ({ kind: j.kind, error: j.error ?? null })) };
};

export const retryCaDocumentJobs = async (
  viewer: CaViewer,
  id: string,
): Promise<{ retried: number }> => {
  assertCaAdmin(viewer);
  assertId(id);
  const retried = await rearmFailedCaDocumentJobs(new mongoose.Types.ObjectId(id));
  if (retried === 0) throw new AppError("There are no failed documents to retry", 409);
  return { retried };
};

export const revealCaApplication = async (
  viewer: CaViewer,
  id: string,
): Promise<{ payout: { method: "upi" | "details"; value: string } | null }> => {
  assertCaAdmin(viewer);
  assertId(id);
  const doc = await CaApplicationModel.findById(id, { payout: 1 }).lean();
  if (!doc) throw new AppError("Application not found", 404);
  return {
    payout: doc.payout ? { method: doc.payout.method, value: decryptCaText(doc.payout) } : null,
  };
};

/** Every marketer and sales person, for the admin's referrer filter and team picker. */
export const listCaOwners = async (viewer: CaViewer) => {
  assertCaAdmin(viewer);
  const users = await UserModel.find(
    { userType: { $in: ["marketer", "sales"] }, status: "active" },
    { firstName: 1, lastName: 1, userType: 1 },
  )
    .sort({ firstName: 1 })
    .lean();
  return users.map((u) => ({
    userId: String(u._id),
    name: fullName(u as { firstName?: string; lastName?: string }),
    userType: String((u as { userType?: string }).userType ?? ""),
  }));
};

const pickKind = (kind: unknown): AmbassadorKind => {
  const found = AMBASSADOR_KINDS.find((k) => k === kind);
  if (!found) {
    throw new AppError("Choose marketing intern or social media marketing intern", 400);
  }
  return found;
};

const loadOwner = async (
  ownerUserId: unknown,
): Promise<{ userId: mongoose.Types.ObjectId; name: string }> => {
  if (!mongoose.isValidObjectId(ownerUserId)) {
    throw new AppError("Choose a marketer or sales person", 400);
  }
  const user = await UserModel.findOne(
    { _id: String(ownerUserId), userType: { $in: ["marketer", "sales"] }, status: "active" },
    { firstName: 1, lastName: 1 },
  ).lean();
  if (!user) throw new AppError("That team owner no longer exists", 400);
  return {
    userId: user._id as unknown as mongoose.Types.ObjectId,
    name: fullName(user as { firstName?: string; lastName?: string }),
  };
};

const missingOr = async (viewer: CaViewer, id: string, conflict: string): Promise<never> => {
  const exists = await CaApplicationModel.exists({ _id: id, ...caScopeFilter(viewer) });
  throw exists
    ? new AppError(conflict, 409, "CA_ALREADY_DECIDED")
    : new AppError("Application not found", 404);
};

/**
 * Sets `internId` only where none exists yet, so a retried caller keeps the ID
 * already printed on a letter. Shared by the approval flow and the offer-letter
 * document job: either one can be the first to see a missing ID, and both must
 * resolve the same lost-race outcome the same way.
 */
export const ensureCaInternId = async (
  id: mongoose.Types.ObjectId,
  currentInternId: string | null | undefined,
): Promise<string> => {
  if (currentInternId) return currentInternId;
  const internId = await allocateNextInternId();
  const res = await CaApplicationModel.updateOne(
    { _id: id, internId: null },
    { $set: { internId } },
  );
  if (res.modifiedCount > 0) return internId;
  const raced = await CaApplicationModel.findOne({ _id: id }, { internId: 1 }).lean();
  if (!raced?.internId) throw new AppError("Application not found", 404);
  return raced.internId;
};

/**
 * Sets the joining date to the start of today in IST, and the end date from
 * it, only where none is set yet. A retried offer-letter job reuses the dates
 * already stored, so the printed letter and the completion sweep never see
 * the tenure shift under them.
 */
export const ensureCaJoiningDate = async (
  app: Pick<CaApplication, "_id" | "joiningDate" | "endDate" | "durationMonths">,
): Promise<{ joiningDate: Date; endDate: Date }> => {
  if (app.joiningDate && app.endDate) {
    return { joiningDate: app.joiningDate, endDate: app.endDate };
  }
  const joiningDate = parseIstDateOnly(todayIst()) as Date;
  const endDate = tenureEndDate(joiningDate, app.durationMonths);
  const updated = await CaApplicationModel.findOneAndUpdate(
    { _id: app._id, joiningDate: null },
    { $set: { joiningDate, endDate } },
    { new: true, projection: { joiningDate: 1, endDate: 1 } },
  ).lean();
  if (updated) return { joiningDate: updated.joiningDate as Date, endDate: updated.endDate as Date };
  const raced = await CaApplicationModel.findOne({ _id: app._id }, { joiningDate: 1, endDate: 1 }).lean();
  return { joiningDate: raced?.joiningDate as Date, endDate: raced?.endDate as Date };
};

/**
 * The job is queued before the intern ID is assigned (not after), so a throw
 * from `ensureCaInternId` (counter or primary-election blip) still leaves the
 * job in place: the offer-letter processor's own fallback allocates the ID.
 * The job itself is idempotent for the same reason the ID assignment is.
 */
export const assignInternIdAndQueueOfferLetter = async (
  id: mongoose.Types.ObjectId,
): Promise<string> => {
  const current = await CaApplicationModel.findOne({ _id: id }, { internId: 1 }).lean();
  if (!current) throw new AppError("Application not found", 404);
  await enqueueCaDocumentJob(id, "offer-letter");
  return ensureCaInternId(id, current.internId);
};

export const setCaCompletionHold = async (
  viewer: CaViewer,
  id: string,
  hold: unknown,
): Promise<CaApplicationRow> => {
  assertId(id);
  if (typeof hold !== "boolean") throw new AppError("hold must be true or false", 400);

  const filter: Record<string, unknown> = { _id: id, status: "attached" };
  if (isCaOwnerRole(viewer.userType)) filter.ownerUserId = viewer.userId;

  const set: Record<string, unknown> = hold
    ? {
        "completion.hold": true,
        "completion.heldBy": { userId: viewer.userId, name: viewer.name },
        "completion.heldAt": new Date(),
      }
    : {
        "completion.hold": false,
        "completion.queuedAt": null,
        // Lets an admin un-stick a CA the sweep skipped (e.g. briefly off every
        // roster near their end date) by toggling the hold, without which
        // `skippedAt` would keep them out of the sweep forever.
        "completion.skippedAt": null,
      };

  const updated = await CaApplicationModel.findOneAndUpdate(
    filter,
    { $set: set },
    { new: true, projection: CA_ROW_PROJECTION },
  ).lean();
  if (!updated) throw new AppError("Ambassador not found on this team", 404);
  return toCaApplicationRow(updated as CaRowSource);
};

/** Attached CAs of one owner, for the roster's tenure and document columns. */
export const listCaTeamApplications = async (
  viewer: CaViewer,
  ownerUserId?: unknown,
): Promise<CaApplicationRow[]> => {
  let owner: mongoose.Types.ObjectId;
  if (isCaOwnerRole(viewer.userType)) {
    owner = viewer.userId;
  } else {
    if (!mongoose.isValidObjectId(ownerUserId)) {
      throw new AppError("Choose whose team to list", 400);
    }
    owner = new mongoose.Types.ObjectId(String(ownerUserId));
  }
  // Unpaginated by design (the roster fits in one screen), but bounded so a
  // very large team can never turn this into an unbounded fetch.
  const rows = await CaApplicationModel.find(
    { ownerUserId: owner, status: "attached" },
    CA_ROW_PROJECTION,
  )
    .sort({ attachedAt: -1 })
    .limit(1000)
    .lean();
  return (rows as CaRowSource[]).map(toCaApplicationRow);
};

/**
 * One conditional update decides it, so an admin and the referring marketer
 * clicking together cannot both win. Attach then runs straight away.
 */
export const approveCaApplication = async (
  viewer: CaViewer,
  id: string,
  body: { kind?: unknown; ownerUserId?: unknown },
): Promise<{ application: CaApplicationRow; outcome: CaAttachOutcome }> => {
  assertId(id);
  const kind = pickKind(body.kind);
  const owner = isCaOwnerRole(viewer.userType)
    ? { userId: viewer.userId, name: viewer.name }
    : await loadOwner(body.ownerUserId);

  const approved = await CaApplicationModel.findOneAndUpdate(
    { _id: id, status: "pending", ...caScopeFilter(viewer) },
    {
      $set: {
        status: "approved",
        kind,
        ownerUserId: owner.userId,
        ownerName: owner.name,
        decidedBy: { userId: viewer.userId, name: viewer.name },
        decidedAt: new Date(),
      },
    },
    // Attach needs the address to fill a blank profile; the response below never carries it.
    { new: true, projection: { payout: 0 } },
  ).lean();
  if (!approved) return missingOr(viewer, id, "This application was already decided");

  try {
    await assignInternIdAndQueueOfferLetter(approved._id as mongoose.Types.ObjectId);
  } catch (error) {
    console.error(`[ca-applications] intern ID assignment for ${id} failed:`, error);
    if (error instanceof AppError && error.statusCode === 404) {
      // The application vanished (a concurrent decline won the race before the
      // offer-letter job could even be queued): nothing left to attach.
      return missingOr(viewer, id, "This application was already decided");
    }
    // The job may not have been queued yet if the enqueue call itself threw
    // (rather than the intern ID allocation after it); try once more so the
    // approval is never stranded with no job at all.
    try {
      await enqueueCaDocumentJob(approved._id as mongoose.Types.ObjectId, "offer-letter");
    } catch (enqueueError) {
      console.error(`[ca-applications] offer-letter job enqueue retry for ${id} also failed:`, enqueueError);
    }
  }

  let outcome: CaAttachOutcome;
  try {
    outcome = await attachApprovedApplication(approved as CaRowSource);
  } catch (error) {
    console.error(`[ca-applications] attach after approving ${id} failed, the sweep retries:`, error);
    outcome = "retry-later";
  }
  const fresh = await CaApplicationModel.findById(id, CA_ROW_PROJECTION).lean();
  return {
    application: toCaApplicationRow((fresh ?? { ...approved, address: null }) as CaRowSource),
    outcome,
  };
};

export const declineCaApplication = async (viewer: CaViewer, id: string): Promise<void> => {
  assertId(id);
  const res = await CaApplicationModel.deleteOne({
    _id: id,
    status: isCaOwnerRole(viewer.userType) ? "pending" : { $in: ["pending", "approved"] },
    internId: null,
    ...caScopeFilter(viewer),
  });
  if (res.deletedCount > 0) return;

  const existing = await CaApplicationModel.findOne(
    { _id: id, ...caScopeFilter(viewer) },
    { status: 1, internId: 1 },
  ).lean();
  if (!existing) throw new AppError("Application not found", 404);
  // Once an offer letter has been issued, the "already on a team" message is
  // wrong (they may not have joined yet): name the real reason instead.
  const conflict =
    existing.status === "approved" && existing.internId
      ? "An offer letter has been issued, so this can no longer be declined"
      : "They are already on a team. Remove them from the roster instead.";
  throw new AppError(conflict, 409, "CA_ALREADY_DECIDED");
};

export const changeCaApplicationDuration = async (
  viewer: CaViewer,
  id: string,
  durationMonths: unknown,
): Promise<CaApplicationRow> => {
  assertCaAdmin(viewer);
  assertId(id);
  const months = Number(durationMonths);
  if (!Number.isInteger(months) || months < 1 || months > 6) {
    throw new AppError("Duration must be 1 to 6 months", 400);
  }

  const current = await CaApplicationModel.findOne(
    { _id: id, joiningDate: { $ne: null }, "completion.issuedAt": null, "completion.outcome": { $ne: "not-eligible" } },
    { joiningDate: 1 },
  ).lean();
  if (!current?.joiningDate) {
    throw new AppError(
      "Duration can only be changed once the CA has joined and before the tenure is decided",
      409,
    );
  }
  const endDate = tenureEndDate(current.joiningDate, months);

  const updated = await CaApplicationModel.findOneAndUpdate(
    {
      _id: id,
      joiningDate: { $ne: null },
      "completion.issuedAt": null,
      "completion.outcome": { $ne: "not-eligible" },
    },
    { $set: { durationMonths: months, endDate } },
    { new: true, projection: CA_ROW_PROJECTION },
  ).lean();
  if (!updated) {
    throw new AppError(
      "Duration can only be changed once the CA has joined and before the tenure is decided",
      409,
    );
  }
  return toCaApplicationRow(updated as CaRowSource);
};

export const changeCaApplicationOwner = async (
  viewer: CaViewer,
  id: string,
  ownerUserId: unknown,
): Promise<CaApplicationRow> => {
  assertCaAdmin(viewer);
  assertId(id);
  const owner = await loadOwner(ownerUserId);
  const updated = await CaApplicationModel.findOneAndUpdate(
    { _id: id, status: "approved" },
    { $set: { ownerUserId: owner.userId, ownerName: owner.name, attachIssue: null } },
    { new: true, projection: CA_ROW_PROJECTION },
  ).lean();
  if (!updated) {
    throw new AppError("Only an approved application that has not joined yet can move teams", 409);
  }
  return toCaApplicationRow(updated as CaRowSource);
};

/**
 * Admin override of one CA's certificate verdict: "pass" is always eligible,
 * "fail" never is, `null` clears the override back to the percentage rule.
 * Blocked once the completion documents are already issued — there is
 * nothing left for the override to change at that point.
 */
export const setCaCertificateOverride = async (
  viewer: CaViewer,
  id: string,
  override: unknown,
): Promise<CaApplicationRow> => {
  assertCaAdmin(viewer);
  assertId(id);
  if (override !== "pass" && override !== "fail" && override !== null) {
    throw new AppError("override must be pass, fail, or null", 400);
  }
  const updated = await CaApplicationModel.findOneAndUpdate(
    { _id: id, status: "attached", "completion.issuedAt": null },
    { $set: { "completion.certificateOverride": override } },
    { new: true, projection: CA_ROW_PROJECTION },
  ).lean();
  if (!updated) {
    throw new AppError("Ambassador not found, or their documents have already been issued", 404);
  }

  // A "pass" must actually produce the documents when the sweep had already
  // written them off as not-eligible; "fail" and "clear" only record state,
  // since the sweep (not this call) decides what to send.
  if (override === "pass" && updated.completion?.outcome === "not-eligible") {
    const flipped = await CaApplicationModel.findOneAndUpdate(
      { _id: id, "completion.outcome": "not-eligible" },
      { $set: { "completion.outcome": "eligible", "completion.queuedAt": new Date() } },
      { new: true, projection: CA_ROW_PROJECTION },
    ).lean();
    if (flipped) {
      await enqueueCaDocumentJob(new mongoose.Types.ObjectId(id), "completion");
      return toCaApplicationRow(flipped as CaRowSource);
    }
  }
  return toCaApplicationRow(updated as CaRowSource);
};

/** The signed-in user's own attached CA application, or null if they have none. */
export const getAttachedCaApplication = async (
  userId: mongoose.Types.ObjectId,
): Promise<{ _id: mongoose.Types.ObjectId; joiningDate: Date | null; endDate: Date | null } | null> => {
  const doc = await CaApplicationModel.findOne(
    { userId, status: "attached" },
    { joiningDate: 1, endDate: 1 },
  ).lean();
  if (!doc) return null;
  return { _id: doc._id as mongoose.Types.ObjectId, joiningDate: doc.joiningDate ?? null, endDate: doc.endDate ?? null };
};

export interface CaAvailablePointsSources {
  tasks: { successPoints: number; startFromDay: number }[];
  meetings: { successPoints: number; startDateTime: Date }[];
}

/**
 * Every active task and every meeting that has already started, as of `now`.
 * Load this ONCE per tick (or once per request) and reuse it across CAs via
 * `sumCaAvailablePoints` — the lists are the same for everyone, only the
 * CA's own joining/end date decides which of them fall inside their tenure.
 * `tasks` reads the `{isActive, startFromDay}` index; `meetings` reads `{startDateTime}`.
 */
export const loadCaAvailablePointsSources = async (
  now: Date = new Date(),
): Promise<CaAvailablePointsSources> => {
  const [tasks, meetings] = await Promise.all([
    CaTaskModel.find({ isActive: true }, { successPoints: 1, startFromDay: 1 }).lean<
      { successPoints?: number; startFromDay?: number }[]
    >(),
    CaMeetingModel.find({ startDateTime: { $lte: now } }, { successPoints: 1, startDateTime: 1 }).lean<
      { successPoints?: number; startDateTime: Date }[]
    >(),
  ]);
  return {
    tasks: tasks.map((t) => ({
      successPoints: Math.max(0, Number(t.successPoints ?? 0)),
      startFromDay: Math.max(0, Number(t.startFromDay ?? 0)),
    })),
    meetings: meetings.map((m) => ({
      successPoints: Math.max(0, Number(m.successPoints ?? 0)),
      startDateTime: new Date(m.startDateTime),
    })),
  };
};

/**
 * Points available to one CA for their tenure so far: every task whose
 * opening day (joining date + startFromDay, in IST) has arrived, plus every
 * meeting that fell inside [joiningDate, min(endDate, now)]. Pure — no DB
 * access — so a sweep can compute `sources` once and call this per row.
 */
export const sumCaAvailablePoints = (
  app: { joiningDate?: Date | string | null; endDate?: Date | string | null },
  sources: CaAvailablePointsSources,
  now: Date = new Date(),
): number => {
  const joiningDate = app.joiningDate ? new Date(app.joiningDate) : null;
  if (!joiningDate || Number.isNaN(joiningDate.getTime())) return 0;
  const endDate = app.endDate ? new Date(app.endDate) : null;
  const cutoffMs =
    endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < now.getTime()
      ? endDate.getTime()
      : now.getTime();

  let total = 0;
  for (const t of sources.tasks) {
    const opensAt = addIstCalendarDays(joiningDate, t.startFromDay);
    if (opensAt && opensAt.getTime() <= cutoffMs) total += t.successPoints;
  }
  for (const m of sources.meetings) {
    const ms = m.startDateTime.getTime();
    if (ms >= joiningDate.getTime() && ms <= cutoffMs) total += m.successPoints;
  }
  return total;
};

/** Convenience for a single CA (e.g. the desk API): loads sources fresh and sums. */
export const computeCaAvailablePoints = async (
  app: { joiningDate?: Date | string | null; endDate?: Date | string | null },
  now: Date = new Date(),
): Promise<number> => {
  const sources = await loadCaAvailablePointsSources(now);
  return sumCaAvailablePoints(app, sources, now);
};

/** Points a CA needs to clear the gate. 0 at a 0% threshold, regardless of the pool. */
export const requiredCaPoints = (availablePoints: number, thresholdPct: number): number =>
  Math.ceil((availablePoints * thresholdPct) / 100);

export interface CaDeskSummary {
  isCa: boolean;
  designation: string | null;
  kind: AmbassadorKind | null;
  collegeName: string | null;
  joiningDate: string | null;
  endDate: string | null;
  durationMonths: number | null;
  caPoints: number;
  thresholdPct: number;
  /** Points on every task and meeting inside the tenure so far. */
  availablePoints: number;
  /** ceil(availablePoints * thresholdPct / 100). */
  requiredPoints: number;
  pointsFromTasks: number;
  pointsFromMeetings: number;
}

/** The signed-in user's Ambassador desk: their attached CA row, plus a points breakdown. */
export const getCaDeskSummary = async (
  userId: mongoose.Types.ObjectId,
): Promise<CaDeskSummary> => {
  const [application, settings] = await Promise.all([
    CaApplicationModel.findOne(
      { userId, status: "attached" },
      { kind: 1, collegeName: 1, joiningDate: 1, endDate: 1, durationMonths: 1, caPoints: 1 },
    ).lean(),
    getCaPageSettings(),
  ]);
  const thresholdPct = settings.enrollment.certificationThresholdPct;

  if (!application) {
    return {
      isCa: false,
      designation: null,
      kind: null,
      collegeName: null,
      joiningDate: null,
      endDate: null,
      durationMonths: null,
      caPoints: 0,
      thresholdPct,
      availablePoints: 0,
      requiredPoints: 0,
      pointsFromTasks: 0,
      pointsFromMeetings: 0,
    };
  }

  const kind = application.kind ?? null;
  const caPoints = application.caPoints ?? 0;
  const [pointsAgg, availablePoints] = await Promise.all([
    CaTaskSubmissionModel.aggregate<{ total: number }>([
      { $match: { applicationId: application._id, passed: true, pointsAwardedAt: { $ne: null } } },
      { $group: { _id: null, total: { $sum: "$templateSnapshot.successPoints" } } },
    ]).then((rows) => rows[0]),
    computeCaAvailablePoints(application),
  ]);
  const pointsFromTasks = pointsAgg?.total ?? 0;
  const requiredPoints = requiredCaPoints(availablePoints, thresholdPct);

  return {
    isCa: true,
    designation: kind ? caDesignation(settings.documents.designations, kind) : null,
    kind,
    collegeName: application.collegeName ?? null,
    joiningDate: ymdIst(application.joiningDate),
    endDate: ymdIst(application.endDate),
    durationMonths: application.durationMonths ?? null,
    caPoints,
    thresholdPct,
    availablePoints,
    requiredPoints,
    pointsFromTasks,
    pointsFromMeetings: Math.max(0, caPoints - pointsFromTasks),
  };
};

export type CaDirectoryState = "active" | "ended" | "all";

export type CaDirectoryOutcome =
  | "active"
  | "upcoming"
  | "issued"
  | "not-eligible"
  | "on-hold"
  | "awaiting-review";

export interface CaDirectoryQuery {
  state?: unknown;
  search?: unknown;
  ownerUserId?: unknown;
  kind?: unknown;
  page?: unknown;
  limit?: unknown;
}

export interface CaDirectoryRow {
  id: string;
  name: string;
  email: string;
  internId: string | null;
  kind: AmbassadorKind | null;
  ownerName: string;
  joiningDate: string | null;
  endDate: string | null;
  durationMonths: number;
  caPoints: number;
  migrated: boolean;
  outcome: CaDirectoryOutcome;
  certificateOverride: "pass" | "fail" | null;
}

type CaDirectorySource = Pick<
  CaRowSource,
  | "_id"
  | "name"
  | "email"
  | "internId"
  | "kind"
  | "ownerName"
  | "joiningDate"
  | "endDate"
  | "durationMonths"
  | "caPoints"
  | "migrated"
  | "completion"
>;

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Priority order matters: an override or a sweep verdict outranks a hold (both
 * explain why nothing was issued), and a hold outranks "awaiting review" (which
 * means the sweep simply hasn't looked yet).
 */
const directoryOutcome = (
  doc: Pick<CaDirectorySource, "joiningDate" | "endDate" | "completion">,
  startOfTodayIst: Date,
): CaDirectoryOutcome => {
  if (doc.joiningDate && new Date(doc.joiningDate).getTime() > Date.now()) return "upcoming";
  const completion = doc.completion;
  if (completion?.issuedAt) return "issued";
  if (completion?.certificateOverride === "fail" || completion?.outcome === "not-eligible") {
    return "not-eligible";
  }
  if (completion?.hold) return "on-hold";
  if (doc.endDate && new Date(doc.endDate).getTime() < startOfTodayIst.getTime()) return "awaiting-review";
  return "active";
};

const toCaDirectoryRow = (doc: CaDirectorySource, startOfTodayIst: Date): CaDirectoryRow => ({
  id: String(doc._id),
  name: doc.name,
  email: doc.email,
  internId: doc.internId ?? null,
  kind: doc.kind ?? null,
  ownerName: doc.ownerName ?? "",
  joiningDate: ymdIst(doc.joiningDate),
  endDate: ymdIst(doc.endDate),
  durationMonths: doc.durationMonths,
  caPoints: doc.caPoints ?? 0,
  migrated: Boolean(doc.migrated),
  outcome: directoryOutcome(doc, startOfTodayIst),
  certificateOverride: doc.completion?.certificateOverride ?? null,
});

/**
 * Every Campus Ambassador there has ever been, with whether they are
 * currently active. Owners are pinned to their own `ownerUserId`; admins see
 * everyone and may filter by it. Counts reuse the same scope/search/kind
 * filter so the tab counters track what's on screen.
 */
export const listCaDirectory = async (
  viewer: CaViewer,
  query: CaDirectoryQuery,
): Promise<{
  rows: CaDirectoryRow[];
  total: number;
  page: number;
  totalPages: number;
  counts: { active: number; ended: number };
}> => {
  const now = new Date();
  const startOfTodayIst = parseIstDateOnly(todayIst()) as Date;

  const state: CaDirectoryState =
    query.state === "ended" || query.state === "all" ? (query.state as CaDirectoryState) : "active";
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit)) || 20));

  const baseConditions: Record<string, unknown>[] = [{ status: "attached" }];
  if (isCaOwnerRole(viewer.userType)) {
    baseConditions.push({ ownerUserId: viewer.userId });
  } else if (mongoose.isValidObjectId(query.ownerUserId)) {
    baseConditions.push({ ownerUserId: new mongoose.Types.ObjectId(String(query.ownerUserId)) });
  }

  const kind = AMBASSADOR_KINDS.find((k) => k === query.kind);
  if (kind) baseConditions.push({ kind });

  const search = String(query.search ?? "").trim();
  if (search) {
    baseConditions.push({
      $or: [
        { email: search.toLowerCase() },
        { internId: search },
        { name: { $regex: `^${escapeRegex(search)}`, $options: "i" } },
      ],
    });
  }

  const activeStateConditions: Record<string, unknown>[] = [
    { joiningDate: { $ne: null, $lte: now } },
    { $or: [{ endDate: null }, { endDate: { $gte: startOfTodayIst } }] },
  ];
  const endedStateConditions: Record<string, unknown>[] = [
    { endDate: { $ne: null, $lt: startOfTodayIst } },
  ];

  const buildFilter = (stateConditions: Record<string, unknown>[]): Record<string, unknown> => {
    const all = [...baseConditions, ...stateConditions];
    return all.length === 1 ? all[0] : { $and: all };
  };

  const listFilter = buildFilter(
    state === "active" ? activeStateConditions : state === "ended" ? endedStateConditions : [],
  );
  const activeFilter = buildFilter(activeStateConditions);
  const endedFilter = buildFilter(endedStateConditions);
  const needsSeparateTotal = state === "all";

  // Ending soonest first for the active tab; most recently ended first otherwise
  // (there is no natural "ending soonest" order once a tenure is over).
  const sort = state === "active" ? { endDate: 1 as const } : { endDate: -1 as const };

  const [rows, activeCount, endedCount, totalAll] = await Promise.all([
    CaApplicationModel.find(listFilter, CA_ROW_PROJECTION)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CaApplicationModel.countDocuments(activeFilter),
    CaApplicationModel.countDocuments(endedFilter),
    needsSeparateTotal ? CaApplicationModel.countDocuments(listFilter) : Promise.resolve(0),
  ]);

  const total = state === "active" ? activeCount : state === "ended" ? endedCount : totalAll;

  return {
    rows: (rows as CaDirectorySource[]).map((doc) => toCaDirectoryRow(doc, startOfTodayIst)),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    counts: { active: activeCount, ended: endedCount },
  };
};
