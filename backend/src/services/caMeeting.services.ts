import mongoose from "mongoose";
import { CaApplicationModel, CaMeetingAttendanceModel, CaMeetingModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { validateUrl } from "../models/validators";
import { caMeetingAttendanceUrl } from "../lib/attendanceUrl";
import {
  bothCheckpointsClosed,
  computeCheckpointPhase,
  generateCheckpointToken,
  overrideMapOf,
  resolveCheckpointVerdict,
  type CheckpointPhase,
} from "../lib/checkpointAttendance";

export interface CaMeetingAdminRow {
  id: string;
  name: string;
  description: string;
  meetingLink: string;
  recordingLink: string;
  startDateTime: string;
  endDateTime: string | null;
  successPoints: number;
  link1: { expiryMins: number; activatedAt: string | null; clickedCount: number; url: string };
  link2: { expiryMins: number; activatedAt: string | null; clickedCount: number; url: string };
  phase: CheckpointPhase;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const parseDate = (value: unknown, field: string): Date => {
  if (!value) throw new AppError(`${field} is required`, 400);
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) throw new AppError(`${field} must be a valid date`, 400);
  return d;
};

const parsePositiveInt = (value: unknown, field: string): number => {
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) throw new AppError(`${field} must be at least 1`, 400);
  return Math.floor(n);
};

const toAdminRow = (doc: any): CaMeetingAdminRow => ({
  id: String(doc._id),
  name: doc.name,
  description: doc.description ?? "",
  meetingLink: doc.meetingLink,
  recordingLink: doc.recordingLink ?? "",
  startDateTime: new Date(doc.startDateTime).toISOString(),
  endDateTime: doc.endDateTime ? new Date(doc.endDateTime).toISOString() : null,
  successPoints: doc.successPoints ?? 0,
  link1: {
    expiryMins: doc.link1.expiryMins,
    activatedAt: doc.link1.activatedAt ? new Date(doc.link1.activatedAt).toISOString() : null,
    clickedCount: Array.isArray(doc.link1.clickedBy) ? doc.link1.clickedBy.length : 0,
    url: caMeetingAttendanceUrl(doc.link1.token),
  },
  link2: {
    expiryMins: doc.link2.expiryMins,
    activatedAt: doc.link2.activatedAt ? new Date(doc.link2.activatedAt).toISOString() : null,
    clickedCount: Array.isArray(doc.link2.clickedBy) ? doc.link2.clickedBy.length : 0,
    url: caMeetingAttendanceUrl(doc.link2.token),
  },
  phase: computeCheckpointPhase(doc),
  finalizedAt: doc.finalizedAt ? new Date(doc.finalizedAt).toISOString() : null,
  createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
  updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : "",
});

export interface CreateCaMeetingBody {
  name: string;
  description?: string;
  meetingLink: string;
  recordingLink?: string;
  startDateTime: string;
  endDateTime: string;
  link1ExpiryMins: number;
  link2ExpiryMins: number;
  successPoints?: number;
}

export const createCaMeetingAdmin = async (
  body: CreateCaMeetingBody,
  createdBy: mongoose.Types.ObjectId,
): Promise<CaMeetingAdminRow> => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) throw new AppError("name is required", 400);
  const meetingLink = typeof body.meetingLink === "string" ? body.meetingLink.trim() : "";
  if (!meetingLink || !validateUrl(meetingLink)) throw new AppError("meetingLink must be a valid URL", 400);
  const recordingLink = typeof body.recordingLink === "string" ? body.recordingLink.trim() : "";
  if (recordingLink && !validateUrl(recordingLink)) throw new AppError("recordingLink must be a valid URL", 400);

  const startDateTime = parseDate(body.startDateTime, "startDateTime");
  const endDateTime = parseDate(body.endDateTime, "endDateTime");
  if (endDateTime <= startDateTime) throw new AppError("endDateTime must be after startDateTime", 400);

  const link1ExpiryMins = parsePositiveInt(body.link1ExpiryMins, "link1ExpiryMins");
  const link2ExpiryMins = parsePositiveInt(body.link2ExpiryMins, "link2ExpiryMins");

  let successPoints = 0;
  if (body.successPoints !== undefined && body.successPoints !== null) {
    const n = Math.floor(Number(body.successPoints));
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
      throw new AppError("successPoints must be a whole number between 0 and 1,000,000", 400);
    }
    successPoints = n;
  }

  const created = await CaMeetingModel.create({
    name,
    description: typeof body.description === "string" ? body.description.trim() : "",
    meetingLink,
    recordingLink,
    startDateTime,
    endDateTime,
    successPoints,
    link1: { token: generateCheckpointToken(), expiryMins: link1ExpiryMins, activatedAt: null, clickedBy: [] },
    link2: { token: generateCheckpointToken(), expiryMins: link2ExpiryMins, activatedAt: null, clickedBy: [] },
    createdBy,
  });
  return toAdminRow(created.toObject());
};

export const listCaMeetingsAdmin = async (
  page = 1,
  limit = 50,
): Promise<{ meetings: CaMeetingAdminRow[]; total: number; page: number; totalPages: number }> => {
  const p = Math.max(1, page);
  const l = Math.min(100, Math.max(1, limit));
  const [docs, total] = await Promise.all([
    CaMeetingModel.find({}).sort({ startDateTime: -1 }).skip((p - 1) * l).limit(l).lean(),
    CaMeetingModel.countDocuments({}),
  ]);
  return { meetings: docs.map(toAdminRow), total, page: p, totalPages: Math.max(1, Math.ceil(total / l)) };
};

export const getCaMeetingAdmin = async (id: string): Promise<CaMeetingAdminRow> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid meeting id", 400);
  const doc = await CaMeetingModel.findById(id).lean();
  if (!doc) throw new AppError("Meeting not found", 404);
  return toAdminRow(doc);
};

export const updateCaMeetingAdmin = async (
  id: string,
  body: { meetingLink?: string; recordingLink?: string; successPoints?: number },
): Promise<CaMeetingAdminRow> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid meeting id", 400);
  const update: Record<string, unknown> = {};

  if (body.meetingLink !== undefined) {
    const ml = typeof body.meetingLink === "string" ? body.meetingLink.trim() : "";
    if (!ml || !validateUrl(ml)) throw new AppError("meetingLink must be a valid URL", 400);
    update.meetingLink = ml;
  }
  if (body.recordingLink !== undefined) {
    const rl = typeof body.recordingLink === "string" ? body.recordingLink.trim() : "";
    if (rl && !validateUrl(rl)) throw new AppError("recordingLink must be a valid URL", 400);
    update.recordingLink = rl;
  }
  if (body.successPoints !== undefined) {
    const existing = await CaMeetingModel.findById(id).select("finalizedAt").lean();
    if (!existing) throw new AppError("Meeting not found", 404);
    if (existing.finalizedAt) {
      throw new AppError("Success points can't be changed after attendance is finalized.", 400);
    }
    const n = Math.floor(Number(body.successPoints));
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
      throw new AppError("successPoints must be a whole number between 0 and 1,000,000", 400);
    }
    update.successPoints = n;
  }
  if (Object.keys(update).length === 0) throw new AppError("No editable fields provided", 400);

  const updated = await CaMeetingModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!updated) throw new AppError("Meeting not found", 404);
  return toAdminRow(updated);
};

export const activateCaMeetingLinkAdmin = async (id: string, slot: 1 | 2): Promise<CaMeetingAdminRow> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid meeting id", 400);
  if (slot !== 1 && slot !== 2) throw new AppError("slot must be 1 or 2", 400);
  const field = slot === 1 ? "link1.activatedAt" : "link2.activatedAt";

  const updated = await CaMeetingModel.findOneAndUpdate(
    { _id: id, [field]: null },
    { $set: { [field]: new Date() } },
    { new: true },
  ).lean();
  if (!updated) {
    const exists = await CaMeetingModel.findById(id).select("_id").lean();
    if (!exists) throw new AppError("Meeting not found", 404);
    throw new AppError(`Link ${slot} is already activated`, 409);
  }
  return toAdminRow(updated);
};

export const deleteCaMeetingAdmin = async (id: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid meeting id", 400);
  const oid = new mongoose.Types.ObjectId(id);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const deleted = await CaMeetingModel.findByIdAndDelete(oid, { session });
      if (!deleted) throw new AppError("Meeting not found", 404);
      await CaMeetingAttendanceModel.deleteMany({ meeting: oid }, { session });
    });
  } finally {
    await session.endSession();
  }
};

export interface CaMeetingAttendanceRow {
  application: { id: string; name: string };
  link1Clicked: boolean;
  link2Clicked: boolean;
  verdict: "present" | "absent" | "pending";
  overridden: boolean;
}

/**
 * The CA audience for one meeting: attached applications whose joining date
 * is on or before the meeting date and whose end date is on or after it, in
 * IST. `joiningDate`/`endDate` are already stored as IST-midnight instants,
 * so a plain instant comparison against the meeting's own date is correct.
 */
const caMeetingAudience = (startDateTime: Date) =>
  CaApplicationModel.find(
    { status: "attached", joiningDate: { $lte: startDateTime }, endDate: { $gte: startDateTime } },
    { name: 1, userId: 1 },
  ).lean();

async function finalizeCaMeeting(meetingId: mongoose.Types.ObjectId): Promise<void> {
  const meeting = await CaMeetingModel.findOneAndUpdate(
    { _id: String(meetingId), finalizedAt: null },
    { $set: { finalizedAt: new Date() } },
    { new: true },
  ).lean<any>();
  if (!meeting) return;

  const link1Set = new Set((meeting.link1?.clickedBy ?? []).map((id: unknown) => String(id)));
  const link2Set = new Set((meeting.link2?.clickedBy ?? []).map((id: unknown) => String(id)));
  const overrideMap = overrideMapOf(
    (meeting.manualOverrides ?? []).map((o: any) => ({ key: String(o.applicationId), verdict: o.verdict })),
  );

  const audience = await caMeetingAudience(meeting.startDateTime);
  const presentApplicationIds: mongoose.Types.ObjectId[] = [];
  const absentOps: { insertOne: { document: Record<string, unknown> } }[] = [];

  for (const app of audience) {
    const aid = String(app._id);
    const isPresent =
      resolveCheckpointVerdict({
        override: overrideMap.get(aid),
        clickedBoth: link1Set.has(aid) && link2Set.has(aid),
        bothClosed: true,
      }) === "present";
    if (isPresent) presentApplicationIds.push(app._id as mongoose.Types.ObjectId);
    else absentOps.push({ insertOne: { document: { meeting: meetingId, application: app._id } } });
  }

  if (absentOps.length > 0) {
    try {
      await CaMeetingAttendanceModel.bulkWrite(absentOps, { ordered: false });
    } catch (e: unknown) {
      if ((e as { code?: number })?.code !== 11000) throw e;
    }
  }

  const points = Math.max(0, Math.floor(Number(meeting.successPoints ?? 0)));
  if (points > 0 && presentApplicationIds.length > 0) {
    const presentApps = await CaApplicationModel.find(
      { _id: { $in: presentApplicationIds }, userId: { $ne: null } },
      { userId: 1 },
    ).lean<{ _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId | null }[]>();
    await CaApplicationModel.updateMany(
      { _id: { $in: presentApps.map((app) => app._id) } },
      { $inc: { caPoints: points } },
    );
  }
}

export const getCaMeetingAttendanceAdmin = async (
  id: string,
): Promise<{ meeting: CaMeetingAdminRow; rows: CaMeetingAttendanceRow[] }> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid meeting id", 400);
  const meeting = await CaMeetingModel.findById(id).lean<any>();
  if (!meeting) throw new AppError("Meeting not found", 404);

  const bothClosed = bothCheckpointsClosed(meeting);
  if (bothClosed && !meeting.finalizedAt) {
    await finalizeCaMeeting(meeting._id);
  }

  const fresh = await CaMeetingModel.findById(id).lean<any>();
  if (!fresh) throw new AppError("Meeting not found", 404);

  const overrideMap = overrideMapOf(
    (fresh.manualOverrides ?? []).map((o: any) => ({ key: String(o.applicationId), verdict: o.verdict })),
  );
  const link1Set = new Set((fresh.link1.clickedBy ?? []).map((id: unknown) => String(id)));
  const link2Set = new Set((fresh.link2.clickedBy ?? []).map((id: unknown) => String(id)));
  const audience = await caMeetingAudience(fresh.startDateTime);

  const rows: CaMeetingAttendanceRow[] = audience.map((app: any) => {
    const aid = String(app._id);
    const inL1 = link1Set.has(aid);
    const inL2 = link2Set.has(aid);
    const override = overrideMap.get(aid);
    return {
      application: { id: aid, name: app.name },
      link1Clicked: inL1,
      link2Clicked: inL2,
      verdict: resolveCheckpointVerdict({ override, clickedBoth: inL1 && inL2, bothClosed }),
      overridden: override != null,
    };
  });

  return { meeting: toAdminRow(fresh), rows };
};

export const setCaMeetingOverrideAdmin = async (
  meetingId: string,
  applicationId: string,
  verdict: "present" | "absent" | "clear",
  setBy: mongoose.Types.ObjectId,
): Promise<{ meeting: CaMeetingAdminRow; rows: CaMeetingAttendanceRow[] }> => {
  if (!mongoose.Types.ObjectId.isValid(meetingId) || !mongoose.Types.ObjectId.isValid(applicationId)) {
    throw new AppError("Invalid id", 400);
  }
  if (verdict !== "present" && verdict !== "absent" && verdict !== "clear") {
    throw new AppError("verdict must be present, absent, or clear", 400);
  }

  const mid = new mongoose.Types.ObjectId(meetingId);
  const aid = new mongoose.Types.ObjectId(applicationId);
  let meeting = await CaMeetingModel.findById(mid).lean<any>();
  if (!meeting) throw new AppError("Meeting not found", 404);

  const application = await CaApplicationModel.findOne(
    { _id: aid, status: "attached", joiningDate: { $lte: meeting.startDateTime }, endDate: { $gte: meeting.startDateTime } },
    { userId: 1 },
  ).lean<{ _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId | null } | null>();
  if (!application) throw new AppError("This CA was not part of this meeting's audience", 404);

  if (bothCheckpointsClosed(meeting) && !meeting.finalizedAt) {
    await finalizeCaMeeting(mid);
    meeting = await CaMeetingModel.findById(mid).lean<any>();
  }

  const isFinalized = meeting.finalizedAt != null;
  const clickedBoth =
    (meeting.link1.clickedBy ?? []).some((id: unknown) => String(id) === applicationId) &&
    (meeting.link2.clickedBy ?? []).some((id: unknown) => String(id) === applicationId);

  const prevOverride = overrideMapOf(
    (meeting.manualOverrides ?? []).map((o: any) => ({ key: String(o.applicationId), verdict: o.verdict })),
  ).get(applicationId);
  const newOverride = verdict === "clear" ? undefined : verdict;

  const wasPresent =
    resolveCheckpointVerdict({ override: prevOverride, clickedBoth, bothClosed: isFinalized }) === "present";
  const willBePresent =
    resolveCheckpointVerdict({ override: newOverride, clickedBoth, bothClosed: isFinalized }) === "present";

  const points = Math.max(0, Math.floor(Number(meeting.successPoints ?? 0)));

  await CaMeetingModel.updateOne({ _id: mid }, { $pull: { manualOverrides: { applicationId: aid } } });
  if (newOverride) {
    await CaMeetingModel.updateOne(
      { _id: mid },
      { $push: { manualOverrides: { applicationId: aid, verdict: newOverride, setBy, setAt: new Date() } } },
    );
  }

  if (isFinalized) {
    if (points > 0 && willBePresent && !wasPresent) {
      await CaApplicationModel.updateOne({ _id: aid }, { $inc: { caPoints: points } });
    } else if (points > 0 && wasPresent && !willBePresent) {
      // Pipeline keeps the total from going below zero in one atomic write.
      await CaApplicationModel.updateOne({ _id: aid }, [
        { $set: { caPoints: { $max: [0, { $subtract: [{ $ifNull: ["$caPoints", 0] }, points] }] } } },
      ]);
    }

    if (willBePresent) {
      await CaMeetingAttendanceModel.deleteOne({ meeting: mid, application: aid });
    } else {
      await CaMeetingAttendanceModel.updateOne(
        { meeting: mid, application: aid },
        { $setOnInsert: { meeting: mid, application: aid } },
        { upsert: true },
      );
    }
  }

  return getCaMeetingAttendanceAdmin(meetingId);
};

export type CaMeetingAttendResult =
  | { ok: true; slot: 1 | 2; alreadyMarked: boolean; meetingName: string }
  | { ok: false; reason: "invalid" | "not-activated" | "expired" | "not-eligible" | "tenure-ended" };

export const recordCaMeetingAttendanceClick = async (
  token: string,
  applicationId: mongoose.Types.ObjectId,
  tenureEndDate: Date | null,
): Promise<CaMeetingAttendResult> => {
  if (typeof token !== "string" || !token.trim()) return { ok: false, reason: "invalid" };

  const meeting = await CaMeetingModel.findOne({ $or: [{ "link1.token": token }, { "link2.token": token }] }).lean<any>();
  if (!meeting) return { ok: false, reason: "invalid" };

  const slot: 1 | 2 = meeting.link1.token === token ? 1 : 2;
  const link = slot === 1 ? meeting.link1 : meeting.link2;
  if (!link.activatedAt) return { ok: false, reason: "not-activated" };

  const idStr = String(applicationId);
  const already = (link.clickedBy ?? []).some((id: unknown) => String(id) === idStr);
  if (already) return { ok: true, slot, alreadyMarked: true, meetingName: meeting.name };

  const closesAt = new Date(link.activatedAt).getTime() + link.expiryMins * 60_000;
  if (Date.now() >= closesAt) return { ok: false, reason: "expired" };

  if (!tenureEndDate || tenureEndDate.getTime() < Date.now()) return { ok: false, reason: "tenure-ended" };

  const inAudience = await CaApplicationModel.exists({
    _id: applicationId,
    status: "attached",
    joiningDate: { $lte: meeting.startDateTime },
    endDate: { $gte: meeting.startDateTime },
  });
  if (!inAudience) return { ok: false, reason: "not-eligible" };

  const field = slot === 1 ? "link1.clickedBy" : "link2.clickedBy";
  await CaMeetingModel.updateOne({ _id: meeting._id }, { $addToSet: { [field]: applicationId } });
  return { ok: true, slot, alreadyMarked: false, meetingName: meeting.name };
};

export interface CaMeetingMineItem {
  id: string;
  name: string;
  description: string;
  meetingLink: string;
  recordingLink: string;
  startDateTime: string;
  endDateTime: string | null;
  phase: CheckpointPhase;
  link1Clicked: boolean;
  link2Clicked: boolean;
  myVerdict: "present" | "absent" | "pending";
  attendUrl: string | null;
}

export const listCaMeetingsMine = async (
  applicationId: mongoose.Types.ObjectId,
  joiningDate: Date | null,
  endDate: Date | null,
): Promise<CaMeetingMineItem[]> => {
  if (!joiningDate || !endDate) return [];
  const docs = await CaMeetingModel.find({ startDateTime: { $gte: joiningDate, $lte: endDate } })
    .sort({ startDateTime: -1 })
    .lean<any[]>();
  if (docs.length === 0) return [];

  const meetingIds = docs.map((d) => d._id);
  const absences = await CaMeetingAttendanceModel.find(
    { meeting: { $in: meetingIds }, application: applicationId },
    { meeting: 1 },
  ).lean();
  const absentSet = new Set(absences.map((a: any) => String(a.meeting)));
  const idStr = String(applicationId);

  return docs.map((doc) => {
    const link1Clicked = (doc.link1.clickedBy ?? []).some((id: unknown) => String(id) === idStr);
    const link2Clicked = (doc.link2.clickedBy ?? []).some((id: unknown) => String(id) === idStr);
    const bothClosed = bothCheckpointsClosed(doc);
    const overrideMap = overrideMapOf(
      (doc.manualOverrides ?? []).map((o: any) => ({ key: String(o.applicationId), verdict: o.verdict })),
    );
    const myVerdict = doc.finalizedAt
      ? absentSet.has(String(doc._id))
        ? "absent"
        : "present"
      : resolveCheckpointVerdict({ override: overrideMap.get(idStr), clickedBoth: link1Clicked && link2Clicked, bothClosed });
    const phase = computeCheckpointPhase(doc);
    // Only while the CA's own checkpoint is live and they have not already clicked it.
    let attendUrl: string | null = null;
    if (!doc.finalizedAt) {
      if (phase === "link1-active" && !link1Clicked) attendUrl = caMeetingAttendanceUrl(doc.link1.token);
      else if (phase === "link2-active" && !link2Clicked) attendUrl = caMeetingAttendanceUrl(doc.link2.token);
    }
    return {
      id: String(doc._id),
      name: doc.name,
      description: doc.description ?? "",
      meetingLink: doc.meetingLink,
      recordingLink: doc.recordingLink ?? "",
      startDateTime: new Date(doc.startDateTime).toISOString(),
      endDateTime: doc.endDateTime ? new Date(doc.endDateTime).toISOString() : null,
      phase,
      link1Clicked,
      link2Clicked,
      myVerdict,
      attendUrl,
    };
  });
};
