import crypto from "crypto";
import mongoose from "mongoose";
import { InternshipLiveMeetingModel } from "../models/liveMeeting.schema";
import { InternshipLiveMeetingAttendanceModel } from "../models/liveMeetingAttendance.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { AppError } from "../middlewares/error.middleware";
import { validateUrl } from "../models/validators";
import type {
  AdminLiveMeetingAttendanceResponse,
  AdminLiveMeetingAttendanceRow,
  AdminLiveMeetingListItem,
  CreateInternshipLiveMeetingBody,
  LiveMeetingPhase,
  StudentAttendResult,
  StudentLiveMeetingItem,
} from "../types/internship-live-meeting";

const ENROLLED_STATUSES = ["enrolled", "completed"] as const;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function frontendBase(): string {
  return (process.env.FRONTEND_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function attendanceUrl(token: string): string {
  return `${frontendBase()}/live-meeting/attend/${token}`;
}

function parseNonNegInt(value: unknown, field: string): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseInt(value, 10)
        : NaN;
  if (Number.isNaN(n) || !Number.isFinite(n) || n < 0) {
    throw new AppError(`${field} must be a non-negative integer`, 400);
  }
  return Math.floor(n);
}

function parsePositiveInt(value: unknown, field: string): number {
  const n = parseNonNegInt(value, field);
  if (n < 1) {
    throw new AppError(`${field} must be at least 1`, 400);
  }
  return n;
}

function parseDate(value: unknown, field: string): Date {
  if (!value) {
    throw new AppError(`${field} is required`, 400);
  }
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`${field} must be a valid date`, 400);
  }
  return d;
}

async function assertBatchExists(
  internshipId: string,
  batchId: string,
): Promise<void> {
  if (
    !mongoose.Types.ObjectId.isValid(internshipId) ||
    !mongoose.Types.ObjectId.isValid(batchId)
  ) {
    throw new AppError("Invalid internshipId or batchId", 400);
  }
  const internship = await InternshipModel.findById(internshipId)
    .select("batches._id")
    .lean();
  if (!internship) {
    throw new AppError("Internship not found", 404);
  }
  const batches = (internship.batches ?? []) as { _id?: unknown }[];
  const found = batches.some((b) => String(b._id) === batchId);
  if (!found) {
    throw new AppError("Batch not found on the given internship", 404);
  }
}

function computePhase(meeting: {
  link1: { activatedAt?: Date | null; expiryMins: number };
  link2: { activatedAt?: Date | null; expiryMins: number };
}): LiveMeetingPhase {
  const now = Date.now();
  const l1Active =
    meeting.link1.activatedAt != null &&
    now < new Date(meeting.link1.activatedAt).getTime() +
      meeting.link1.expiryMins * 60_000;
  const l2Active =
    meeting.link2.activatedAt != null &&
    now < new Date(meeting.link2.activatedAt).getTime() +
      meeting.link2.expiryMins * 60_000;
  const l1Closed = meeting.link1.activatedAt != null && !l1Active;
  const l2Closed = meeting.link2.activatedAt != null && !l2Active;

  if (l2Active) return "link2-active";
  if (l1Active) return "link1-active";
  if (l1Closed && l2Closed) return "closed";
  if (l1Closed) return "link1-closed";
  return "not-activated";
}

type LiveMeetingVerdict = "present" | "absent" | "pending";

/** True once both link windows have been activated and have expired. */
function bothWindowsClosed(meeting: {
  link1: { activatedAt?: Date | null; expiryMins: number };
  link2: { activatedAt?: Date | null; expiryMins: number };
}): boolean {
  const now = Date.now();
  const l1Closes = meeting.link1.activatedAt
    ? new Date(meeting.link1.activatedAt).getTime() +
      meeting.link1.expiryMins * 60_000
    : Infinity;
  const l2Closes = meeting.link2.activatedAt
    ? new Date(meeting.link2.activatedAt).getTime() +
      meeting.link2.expiryMins * 60_000
    : Infinity;
  return (
    meeting.link1.activatedAt != null &&
    meeting.link2.activatedAt != null &&
    now >= l1Closes &&
    now >= l2Closes
  );
}

/**
 * Single source of truth for a student's attendance verdict. An admin override
 * wins; otherwise present iff both links were clicked; otherwise absent once
 * both windows have closed; otherwise still pending.
 */
function resolveVerdict(opts: {
  override?: "present" | "absent";
  clickedBoth: boolean;
  bothClosed: boolean;
}): LiveMeetingVerdict {
  if (opts.override) return opts.override;
  if (opts.clickedBoth) return "present";
  if (opts.bothClosed) return "absent";
  return "pending";
}

/** Map of userId → forced verdict from a meeting's `manualOverrides`. */
function overrideMapOf(
  overrides: { user: unknown; verdict: "present" | "absent" }[] | undefined,
): Map<string, "present" | "absent"> {
  return new Map(
    (overrides ?? []).map((o) => [String(o.user), o.verdict] as const),
  );
}

function serializeListItem(doc: {
  _id: unknown;
  internship: unknown;
  batchId: string;
  name: string;
  description?: string;
  meetingLink: string;
  recordingLink?: string;
  startDateTime: Date;
  endDateTime?: Date | null;
  successPoints?: number;
  link1: {
    token: string;
    expiryMins: number;
    activatedAt?: Date | null;
    clickedBy?: unknown[];
  };
  link2: {
    token: string;
    expiryMins: number;
    activatedAt?: Date | null;
    clickedBy?: unknown[];
  };
  finalizedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}): AdminLiveMeetingListItem {
  return {
    _id: String(doc._id),
    internship: String(doc.internship),
    batchId: String(doc.batchId),
    name: doc.name,
    description: doc.description ?? "",
    meetingLink: doc.meetingLink,
    recordingLink: doc.recordingLink ?? "",
    startDateTime: new Date(doc.startDateTime).toISOString(),
    endDateTime: doc.endDateTime ? new Date(doc.endDateTime).toISOString() : null,
    successPoints:
      typeof doc.successPoints === "number" && !Number.isNaN(doc.successPoints)
        ? Math.max(0, Math.floor(doc.successPoints))
        : 0,
    link1: {
      expiryMins: doc.link1.expiryMins,
      activatedAt: doc.link1.activatedAt
        ? new Date(doc.link1.activatedAt).toISOString()
        : null,
      clickedCount: Array.isArray(doc.link1.clickedBy)
        ? doc.link1.clickedBy.length
        : 0,
      url: attendanceUrl(doc.link1.token),
    },
    link2: {
      expiryMins: doc.link2.expiryMins,
      activatedAt: doc.link2.activatedAt
        ? new Date(doc.link2.activatedAt).toISOString()
        : null,
      clickedCount: Array.isArray(doc.link2.clickedBy)
        ? doc.link2.clickedBy.length
        : 0,
      url: attendanceUrl(doc.link2.token),
    },
    phase: computePhase(doc),
    finalizedAt: doc.finalizedAt ? new Date(doc.finalizedAt).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : "",
  };
}

// ───────── Admin: create ─────────

export async function createInternshipLiveMeetingAdmin(
  body: CreateInternshipLiveMeetingBody,
  createdBy: mongoose.Types.ObjectId,
): Promise<AdminLiveMeetingListItem> {
  const internshipId = String(body.internshipId ?? "").trim();
  const batchId = String(body.batchId ?? "").trim();
  await assertBatchExists(internshipId, batchId);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) throw new AppError("name is required", 400);

  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  const meetingLink =
    typeof body.meetingLink === "string" ? body.meetingLink.trim() : "";
  if (!meetingLink || !validateUrl(meetingLink)) {
    throw new AppError(
      "meetingLink must be a valid URL (http:// or https://)",
      400,
    );
  }

  const recordingLink =
    typeof body.recordingLink === "string" ? body.recordingLink.trim() : "";
  if (recordingLink && !validateUrl(recordingLink)) {
    throw new AppError(
      "recordingLink must be a valid URL (http:// or https://)",
      400,
    );
  }

  const startDateTime = parseDate(body.startDateTime, "startDateTime");
  const endDateTime = parseDate(body.endDateTime, "endDateTime");
  if (endDateTime <= startDateTime) {
    throw new AppError("endDateTime must be after startDateTime", 400);
  }

  const link1ExpiryMins = parsePositiveInt(
    body.link1ExpiryMins,
    "link1ExpiryMins",
  );
  const link2ExpiryMins = parsePositiveInt(
    body.link2ExpiryMins,
    "link2ExpiryMins",
  );

  // Optional points awarded to present learners. Defaults to 0 (no points).
  const successPointsRaw = body.successPoints;
  let successPoints = 0;
  if (successPointsRaw !== undefined && successPointsRaw !== null) {
    const n = Math.floor(Number(successPointsRaw));
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
      throw new AppError(
        "successPoints must be a whole number between 0 and 1,000,000",
        400,
      );
    }
    successPoints = n;
  }

  const created = await InternshipLiveMeetingModel.create({
    internship: new mongoose.Types.ObjectId(internshipId),
    batchId,
    name,
    description,
    meetingLink,
    recordingLink,
    startDateTime,
    endDateTime,
    successPoints,
    link1: {
      token: generateToken(),
      expiryMins: link1ExpiryMins,
      activatedAt: null,
      clickedBy: [],
    },
    link2: {
      token: generateToken(),
      expiryMins: link2ExpiryMins,
      activatedAt: null,
      clickedBy: [],
    },
    createdBy,
  });

  return serializeListItem(created.toObject());
}

// ───────── Admin: list ─────────

export async function listInternshipLiveMeetingsAdmin(
  internshipId: string,
  batchId?: string,
  page = 1,
  limit = 20,
): Promise<{
  meetings: AdminLiveMeetingListItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  if (!mongoose.Types.ObjectId.isValid(internshipId)) {
    throw new AppError("Invalid internshipId", 400);
  }
  const p = Math.max(1, page);
  const l = Math.min(100, Math.max(1, limit));
  const skip = (p - 1) * l;

  const filter: Record<string, unknown> = {
    internship: new mongoose.Types.ObjectId(internshipId),
  };
  if (batchId) {
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      throw new AppError("Invalid batchId", 400);
    }
    filter.batchId = batchId;
  }

  const total = await InternshipLiveMeetingModel.countDocuments(filter);
  const docs = await InternshipLiveMeetingModel.find(filter)
    .sort({ startDateTime: -1, createdAt: -1 })
    .skip(skip)
    .limit(l)
    .lean();

  return {
    meetings: docs.map(serializeListItem),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}

// ───────── Admin: get one ─────────

export async function getInternshipLiveMeetingAdmin(
  id: string,
): Promise<AdminLiveMeetingListItem> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid meeting id", 400);
  }
  const doc = await InternshipLiveMeetingModel.findById(id).lean();
  if (!doc) throw new AppError("Meeting not found", 404);
  return serializeListItem(doc);
}

// ───────── Admin: update editable fields ─────────

/**
 * Update the editable fields after creation — the meeting URL and the optional
 * recording URL. Each is applied only when present in the body; `recordingLink`
 * may be set to "" to clear it. All other fields are immutable post-creation —
 * admins can delete + recreate if they need to change anything structural.
 */
export async function updateInternshipLiveMeetingAdmin(
  id: string,
  body: {
    meetingLink?: string;
    recordingLink?: string;
    successPoints?: number;
  },
): Promise<AdminLiveMeetingListItem> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid meeting id", 400);
  }

  const update: {
    meetingLink?: string;
    recordingLink?: string;
    successPoints?: number;
  } = {};

  if (body.meetingLink !== undefined) {
    const ml = typeof body.meetingLink === "string" ? body.meetingLink.trim() : "";
    if (!ml || !validateUrl(ml)) {
      throw new AppError(
        "meetingLink must be a valid URL (http:// or https://)",
        400,
      );
    }
    update.meetingLink = ml;
  }

  if (body.recordingLink !== undefined) {
    const rl =
      typeof body.recordingLink === "string" ? body.recordingLink.trim() : "";
    if (rl && !validateUrl(rl)) {
      throw new AppError(
        "recordingLink must be a valid URL (http:// or https://)",
        400,
      );
    }
    update.recordingLink = rl;
  }

  if (body.successPoints !== undefined) {
    // Locked once attendance is finalized — present learners are already
    // credited at the old value, and re-pricing the meeting after the fact
    // would desync earned points from the "total achievable" calculation.
    const existing = await InternshipLiveMeetingModel.findById(id)
      .select("finalizedAt")
      .lean();
    if (!existing) throw new AppError("Meeting not found", 404);
    if (existing.finalizedAt) {
      throw new AppError(
        "Success points can't be changed after attendance is finalized.",
        400,
      );
    }
    const n = Math.floor(Number(body.successPoints));
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
      throw new AppError(
        "successPoints must be a whole number between 0 and 1,000,000",
        400,
      );
    }
    update.successPoints = n;
  }

  if (Object.keys(update).length === 0) {
    throw new AppError("No editable fields provided", 400);
  }

  const updated = await InternshipLiveMeetingModel.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) throw new AppError("Meeting not found", 404);
  return serializeListItem(updated);
}

// ───────── Admin: activate link ─────────

export async function activateInternshipLiveMeetingLinkAdmin(
  id: string,
  slot: 1 | 2,
): Promise<AdminLiveMeetingListItem> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid meeting id", 400);
  }
  if (slot !== 1 && slot !== 2) {
    throw new AppError("slot must be 1 or 2", 400);
  }
  const field = slot === 1 ? "link1.activatedAt" : "link2.activatedAt";
  const now = new Date();

  // Conditional update: only activate if not already activated.
  const updated = await InternshipLiveMeetingModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), [field]: null },
    { $set: { [field]: now } },
    { new: true },
  ).lean();

  if (!updated) {
    // Either meeting doesn't exist OR link already activated.
    const exists = await InternshipLiveMeetingModel.findById(id)
      .select("_id")
      .lean();
    if (!exists) throw new AppError("Meeting not found", 404);
    throw new AppError(`Link ${slot} is already activated`, 409);
  }

  return serializeListItem(updated);
}

// ───────── Admin: delete ─────────

export async function deleteInternshipLiveMeetingAdmin(
  id: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid meeting id", 400);
  }
  const oid = new mongoose.Types.ObjectId(id);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const deleted = await InternshipLiveMeetingModel.findByIdAndDelete(oid, {
        session,
      });
      if (!deleted) {
        throw new AppError("Meeting not found", 404);
      }
      await InternshipLiveMeetingAttendanceModel.deleteMany(
        { meeting: oid },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}

// ───────── Admin: attendance view (with lazy finalize) ─────────

export async function getInternshipLiveMeetingAttendanceAdmin(
  id: string,
): Promise<AdminLiveMeetingAttendanceResponse> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid meeting id", 400);
  }
  const meeting = await InternshipLiveMeetingModel.findById(id).lean();
  if (!meeting) throw new AppError("Meeting not found", 404);

  const bothClosed = bothWindowsClosed(meeting);

  // Lazy finalize: insert absent docs once both windows are closed.
  if (bothClosed && !meeting.finalizedAt) {
    await finalizeAttendance(meeting._id);
  }

  // Refetch in case finalize ran.
  const fresh = await InternshipLiveMeetingModel.findById(id).lean();
  if (!fresh) throw new AppError("Meeting not found", 404);

  const overrideMap = overrideMapOf(
    fresh.manualOverrides as
      | { user: unknown; verdict: "present" | "absent" }[]
      | undefined,
  );

  // Roster: enrolled users in this batch.
  const enrollments = await InternshipEnrollmentModel.find({
    internship: fresh.internship,
    "batchSnapshot.batchId": fresh.batchId,
    status: { $in: ENROLLED_STATUSES },
  })
    .populate("user", "firstName lastName name email")
    .lean();

  const link1Set = new Set(
    (fresh.link1.clickedBy ?? []).map((u: unknown) => String(u)),
  );
  const link2Set = new Set(
    (fresh.link2.clickedBy ?? []).map((u: unknown) => String(u)),
  );

  // For verdict: present iff both clicks. Absent iff both windows closed AND
  // not present. Otherwise pending.
  const rows: AdminLiveMeetingAttendanceRow[] = enrollments.map((enr) => {
    const u = (enr.user ?? {}) as {
      _id?: unknown;
      firstName?: string;
      lastName?: string;
      name?: string;
      email?: string;
    };
    const uid = String(u._id ?? "");
    const inL1 = link1Set.has(uid);
    const inL2 = link2Set.has(uid);
    const override = overrideMap.get(uid);

    const verdict = resolveVerdict({
      override,
      clickedBoth: inL1 && inL2,
      bothClosed,
    });

    return {
      user: {
        _id: uid,
        firstName: typeof u.firstName === "string" ? u.firstName : undefined,
        lastName: typeof u.lastName === "string" ? u.lastName : undefined,
        name: typeof u.name === "string" ? u.name : undefined,
        email: typeof u.email === "string" ? u.email : undefined,
      },
      enrollmentId: String(enr._id),
      link1Clicked: inL1,
      link2Clicked: inL2,
      verdict,
      overridden: override != null,
    };
  });

  return {
    meeting: serializeListItem(fresh),
    rows,
  };
}

async function finalizeAttendance(
  meetingId: mongoose.Types.ObjectId,
): Promise<void> {
  // Claim the finalization atomically up front. Whichever caller wins is the
  // one that writes absent docs AND credits points to present learners.
  // Subsequent calls find `finalizedAt` set and no-op — this is what keeps
  // the per-meeting points credit from double-applying on retry.
  const meeting = await InternshipLiveMeetingModel.findOneAndUpdate(
    { _id: meetingId, finalizedAt: null },
    { $set: { finalizedAt: new Date() } },
    { new: true },
  ).lean();
  if (!meeting) return;

  const link1Set = new Set(
    (meeting.link1?.clickedBy ?? []).map((u: unknown) => String(u)),
  );
  const link2Set = new Set(
    (meeting.link2?.clickedBy ?? []).map((u: unknown) => String(u)),
  );
  const overrideMap = overrideMapOf(
    meeting.manualOverrides as
      | { user: unknown; verdict: "present" | "absent" }[]
      | undefined,
  );

  const enrollments = await InternshipEnrollmentModel.find({
    internship: meeting.internship,
    "batchSnapshot.batchId": meeting.batchId,
    status: { $in: ENROLLED_STATUSES },
  })
    .select("_id user")
    .lean();

  const absentOps: { insertOne: { document: Record<string, unknown> } }[] = [];
  const presentEnrollmentIds: mongoose.Types.ObjectId[] = [];
  for (const enr of enrollments) {
    const uid = String(enr.user);
    // Both windows are closed at finalize time → effective present/absent.
    const isPresent =
      resolveVerdict({
        override: overrideMap.get(uid),
        clickedBoth: link1Set.has(uid) && link2Set.has(uid),
        bothClosed: true,
      }) === "present";
    if (isPresent) {
      presentEnrollmentIds.push(
        enr._id as unknown as mongoose.Types.ObjectId,
      );
    } else {
      absentOps.push({
        insertOne: {
          document: {
            meeting: meetingId,
            user: new mongoose.Types.ObjectId(uid),
          },
        },
      });
    }
  }

  if (absentOps.length > 0) {
    try {
      await InternshipLiveMeetingAttendanceModel.bulkWrite(absentOps, {
        ordered: false,
      });
    } catch (e: unknown) {
      // Ignore unique-index duplicate-key errors — finalize is idempotent.
      const code = (e as { code?: number })?.code;
      if (code !== 11000) throw e;
    }
  }

  // Credit `meeting.successPoints` into `enrollment.internshipSuccessPoints`
  // for every learner marked present. No-op when the admin set 0 points.
  const pointsToAward = Math.max(0, Math.floor(Number(meeting.successPoints ?? 0)));
  if (pointsToAward > 0 && presentEnrollmentIds.length > 0) {
    await InternshipEnrollmentModel.updateMany(
      { _id: { $in: presentEnrollmentIds } },
      { $inc: { internshipSuccessPoints: pointsToAward } },
    );
  }
}

// ───────── Admin: manually set a student's attendance verdict ─────────

/**
 * Force (or clear) a student's attendance verdict for one meeting.
 *
 * - `present` / `absent` upsert an override entry; `clear` removes it so the
 *   computed verdict (link clicks) applies again.
 * - Success points stay in lockstep with the present-state. Before finalize we
 *   only record the override — the finalize pass (override-aware) credits
 *   points and writes absent docs later. After finalize, we reconcile on the
 *   spot: ±`successPoints` on a present↔not-present flip (counter floored at
 *   0), and the absent doc is inserted/removed to match.
 */
export async function setAttendanceOverrideAdmin(
  meetingId: string,
  userId: string,
  verdict: "present" | "absent" | "clear",
  setBy: mongoose.Types.ObjectId,
): Promise<AdminLiveMeetingAttendanceResponse> {
  if (!mongoose.Types.ObjectId.isValid(meetingId)) {
    throw new AppError("Invalid meeting id", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }
  if (verdict !== "present" && verdict !== "absent" && verdict !== "clear") {
    throw new AppError("verdict must be present, absent, or clear", 400);
  }

  const mid = new mongoose.Types.ObjectId(meetingId);
  const uid = new mongoose.Types.ObjectId(userId);

  let meeting = await InternshipLiveMeetingModel.findById(mid).lean();
  if (!meeting) throw new AppError("Meeting not found", 404);

  // Roster gate: the user must be an enrolled learner in this batch.
  const enrollment = await InternshipEnrollmentModel.findOne({
    internship: meeting.internship,
    user: uid,
    "batchSnapshot.batchId": meeting.batchId,
    status: { $in: ENROLLED_STATUSES },
  })
    .select("_id")
    .lean();
  if (!enrollment) {
    throw new AppError("Student is not enrolled in this batch", 404);
  }

  // Settle finalize first if the windows have closed, so `finalizedAt` and the
  // already-credited points reflect pre-override clicks before we reconcile.
  if (bothWindowsClosed(meeting) && !meeting.finalizedAt) {
    await finalizeAttendance(mid);
    const refetched = await InternshipLiveMeetingModel.findById(mid).lean();
    if (!refetched) throw new AppError("Meeting not found", 404);
    meeting = refetched;
  }

  const isFinalized = meeting.finalizedAt != null;
  const clickedBoth =
    new Set((meeting.link1.clickedBy ?? []).map((u: unknown) => String(u))).has(
      userId,
    ) &&
    new Set((meeting.link2.clickedBy ?? []).map((u: unknown) => String(u))).has(
      userId,
    );

  const prevOverride = overrideMapOf(
    meeting.manualOverrides as
      | { user: unknown; verdict: "present" | "absent" }[]
      | undefined,
  ).get(userId);
  const newOverride = verdict === "clear" ? undefined : verdict;

  // Points only ever land in the counter at/after finalize, so present-state
  // for the points math is evaluated with `bothClosed = isFinalized`.
  const wasPresent =
    resolveVerdict({ override: prevOverride, clickedBoth, bothClosed: isFinalized }) ===
    "present";
  const willBePresent =
    resolveVerdict({ override: newOverride, clickedBoth, bothClosed: isFinalized }) ===
    "present";

  const points = Math.max(0, Math.floor(Number(meeting.successPoints ?? 0)));

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // 1) Upsert/remove the override entry (pull-then-push = upsert).
      await InternshipLiveMeetingModel.updateOne(
        { _id: mid },
        { $pull: { manualOverrides: { user: uid } } },
        { session },
      );
      if (newOverride) {
        await InternshipLiveMeetingModel.updateOne(
          { _id: mid },
          {
            $push: {
              manualOverrides: {
                user: uid,
                verdict: newOverride,
                setBy,
                setAt: new Date(),
              },
            },
          },
          { session },
        );
      }

      // 2) Post-finalize: reconcile points + absent doc to the new state.
      if (isFinalized) {
        if (points > 0 && willBePresent && !wasPresent) {
          await InternshipEnrollmentModel.updateOne(
            { _id: enrollment._id },
            { $inc: { internshipSuccessPoints: points } },
            { session },
          );
        } else if (points > 0 && wasPresent && !willBePresent) {
          // Clamp at zero — never drive the counter negative.
          const enr = await InternshipEnrollmentModel.findById(enrollment._id)
            .select("internshipSuccessPoints")
            .session(session)
            .lean();
          const current = Math.max(
            0,
            Math.floor(Number(enr?.internshipSuccessPoints ?? 0)),
          );
          const dec = Math.min(points, current);
          if (dec > 0) {
            await InternshipEnrollmentModel.updateOne(
              { _id: enrollment._id },
              { $inc: { internshipSuccessPoints: -dec } },
              { session },
            );
          }
        }

        // Absent doc exists iff the learner is effectively absent.
        if (willBePresent) {
          await InternshipLiveMeetingAttendanceModel.deleteOne(
            { meeting: mid, user: uid },
            { session },
          );
        } else {
          await InternshipLiveMeetingAttendanceModel.updateOne(
            { meeting: mid, user: uid },
            { $setOnInsert: { meeting: mid, user: uid } },
            { upsert: true, session },
          );
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return getInternshipLiveMeetingAttendanceAdmin(meetingId);
}

// ───────── Student: list meetings for their batch ─────────

/**
 * Paginated student-safe view of live meetings for a given (internshipId,
 * batchId). Returns every meeting for the batch (upcoming, live, and past) so
 * learners can see the full history with attendance + recording links. Sorted
 * by `startDateTime` descending so the most recent / next-up meeting is at
 * the top.
 *
 * Tokens / admin URLs are never returned — only the meeting URL the admin
 * shared, plus whether *this* user has clicked each attendance.
 */
export async function getStudentLiveMeetingsForBatchPaginated(
  internshipId: mongoose.Types.ObjectId | string,
  batchId: string,
  userId: mongoose.Types.ObjectId,
  page = 1,
  limit = 10,
): Promise<{
  items: StudentLiveMeetingItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(50, Math.max(1, Math.floor(limit)));
  const skip = (p - 1) * l;

  const filter = { internship: internshipId, batchId };
  const [docs, total] = await Promise.all([
    InternshipLiveMeetingModel.find(filter)
      .sort({ startDateTime: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    InternshipLiveMeetingModel.countDocuments(filter),
  ]);

  const userIdStr = String(userId);
  const items = docs.map((doc): StudentLiveMeetingItem => {
    const link1ClickedBy = (doc.link1.clickedBy ?? []).map((u: unknown) =>
      String(u),
    );
    const link2ClickedBy = (doc.link2.clickedBy ?? []).map((u: unknown) =>
      String(u),
    );
    return {
      _id: String(doc._id),
      name: doc.name,
      description: doc.description ?? "",
      meetingLink: doc.meetingLink,
      recordingLink:
        typeof (doc as { recordingLink?: string }).recordingLink === "string"
          ? (doc as { recordingLink: string }).recordingLink
          : "",
      startDateTime: new Date(doc.startDateTime).toISOString(),
      endDateTime: doc.endDateTime
        ? new Date(doc.endDateTime).toISOString()
        : null,
      phase: computePhase(doc),
      link1Clicked: link1ClickedBy.includes(userIdStr),
      link2Clicked: link2ClickedBy.includes(userIdStr),
    };
  });

  return {
    items,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}

// ───────── Student: click handler ─────────

export async function recordAttendanceClick(
  token: string,
  userId: mongoose.Types.ObjectId,
): Promise<StudentAttendResult> {
  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, reason: "invalid" };
  }

  const meeting = await InternshipLiveMeetingModel.findOne({
    $or: [{ "link1.token": token }, { "link2.token": token }],
  });

  if (!meeting) return { ok: false, reason: "invalid" };

  const slot: 1 | 2 = meeting.link1.token === token ? 1 : 2;
  const link = slot === 1 ? meeting.link1 : meeting.link2;

  if (!link.activatedAt) return { ok: false, reason: "not-activated" };

  // If this user is already in clickedBy, surface "already marked"
  // regardless of whether the window has since closed — gives a friendly
  // confirmation on re-clicks rather than misleading "expired".
  const userIdStr = String(userId);
  const alreadyInArray = (link.clickedBy ?? []).some(
    (u) => String(u) === userIdStr,
  );
  if (alreadyInArray) {
    return {
      ok: true,
      slot,
      alreadyMarked: true,
      meetingName: meeting.name,
    };
  }

  const closesAt =
    new Date(link.activatedAt).getTime() + link.expiryMins * 60_000;
  if (Date.now() >= closesAt) {
    return { ok: false, reason: "expired" };
  }

  // Eligibility: enrolled student in matching batch (only checked for
  // new clicks — already-marked users above were valid at original click).
  const enrollment = await InternshipEnrollmentModel.findOne({
    internship: meeting.internship,
    user: userId,
    "batchSnapshot.batchId": meeting.batchId,
    status: { $in: ENROLLED_STATUSES },
  })
    .select("_id")
    .lean();

  if (!enrollment) return { ok: false, reason: "not-enrolled" };

  const field = slot === 1 ? "link1.clickedBy" : "link2.clickedBy";
  const result = await InternshipLiveMeetingModel.updateOne(
    { _id: meeting._id },
    { $addToSet: { [field]: userId } },
  );

  return {
    ok: true,
    slot,
    alreadyMarked: result.modifiedCount === 0,
    meetingName: meeting.name,
  };
}

// ───────── Student: paginated meetings for an enrolled program (by slug) ─────────

/**
 * Resolves the learner's enrollment for the given internship slug (canonical
 * slug first, snapshot-slug fallback), enforces the same access gate as the
 * program-detail endpoint, and returns the paginated live-meeting list for
 * their batch (newest first). Used by the program page's "Live Classes" tab.
 */
export async function getStudentLiveMeetingsBySlugPaginated(
  userId: mongoose.Types.ObjectId,
  slug: string,
  page: number,
  limit: number,
): Promise<{
  items: StudentLiveMeetingItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const trimmed = slug.trim();
  if (!trimmed) throw new AppError("slug is required", 400);
  const normalized = trimmed.toLowerCase();

  let internship = await InternshipModel.findOne({ slug: normalized })
    .select("_id")
    .lean();

  let enrollment: Record<string, unknown> | null = null;
  if (internship) {
    enrollment = await InternshipEnrollmentModel.findOne({
      user: userId,
      internship: internship._id,
    })
      .select("status batchSnapshot")
      .sort({ createdAt: -1 })
      .lean();
  } else {
    enrollment = await InternshipEnrollmentModel.findOne({
      user: userId,
      "internshipSnapshot.slug": new RegExp(`^${escapeRegex(trimmed)}$`, "i"),
    })
      .select("status batchSnapshot internship")
      .sort({ createdAt: -1 })
      .lean();
    if (enrollment) {
      internship = await InternshipModel.findById(
        enrollment.internship as mongoose.Types.ObjectId,
      )
        .select("_id")
        .lean();
    }
  }

  if (!internship) throw new AppError("Program not found", 404);
  if (!enrollment) {
    throw new AppError("You are not enrolled in this program", 403);
  }

  const status = String((enrollment as { status?: string }).status ?? "");
  const PENDING_DOCS = new Set([
    "pending_documentation",
    "docs_under_review",
    "re_pending_documentation",
  ]);
  if (PENDING_DOCS.has(status)) {
    throw new AppError(
      "Complete documentation submission first.",
      403,
      "DOCUMENTATION_PENDING",
    );
  }
  const ALLOWED = new Set(["enrolled", "completed", "paused"]);
  if (!ALLOWED.has(status)) {
    throw new AppError(
      "Your enrollment is not yet active for this program",
      403,
    );
  }

  // Cohort hasn't started yet — no live-class access before the start date
  // (mirrors the program-detail gate in getLearnerProgramBySlug).
  const startRaw = (
    enrollment as { batchSnapshot?: { internshipStartDate?: Date | string } }
  ).batchSnapshot?.internshipStartDate;
  const startTime = startRaw ? new Date(startRaw).getTime() : null;
  if (startTime !== null && !Number.isNaN(startTime) && Date.now() < startTime) {
    throw new AppError("This internship hasn't started yet", 403);
  }

  const batchId = (
    enrollment as { batchSnapshot?: { batchId?: string } }
  ).batchSnapshot?.batchId;
  if (!batchId) {
    return { items: [], total: 0, page: Math.max(1, page), totalPages: 1 };
  }

  return getStudentLiveMeetingsForBatchPaginated(
    String(internship._id),
    batchId,
    userId,
    page,
    limit,
  );
}
