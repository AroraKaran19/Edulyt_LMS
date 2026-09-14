import crypto from "crypto";
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import {
  LiveClassModel,
  LiveClassAttendanceModel,
  CourseModel,
  EnrollmentModel,
  UserModel,
} from "../models";
import { validateUrl } from "../models/validators";
import { deleteFilesFromS3, extractS3KeyFromUrl } from "./upload.services";
import type {
  AdminLiveClassAttendanceResponse,
  AdminLiveClassAttendanceRow,
  AdminLiveClassListItem,
  AdminLiveClassListResponse,
  CreateLiveClassBody,
  LiveClassPhase,
  LiveClassRefSummary,
  LiveClassVerdict,
  StudentCourseLiveClassesPage,
  StudentLiveClassAttendResult,
  StudentLiveClassItem,
  StudentLiveClassesPage,
  UpdateLiveClassBody,
} from "../types/live-classes";
import { asBrand, type Brand } from "../constants/brands";

/**
 * Only these enrollments may see / attend a live class, and only these make up
 * the attendance roster. Live classes have always been an elite-plan feature —
 * keeping the gate here means the roster can never drift from the access rule.
 */
const ELITE_PLAN = "elite";
const ENROLLED_STATUSES = ["active", "completed"] as const;

const COURSE_REF_FIELDS = "title thumbnail slug";
const INSTRUCTOR_REF_FIELDS = "firstName lastName email profilePicture";

// ───────── helpers ─────────

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
  return `${frontendBase()}/live-class/attend/${token}`;
}

function parsePositiveInt(value: unknown, field: string): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseInt(value, 10)
        : NaN;
  if (!Number.isFinite(n) || n < 1) {
    throw new AppError(`${field} must be a whole number of at least 1`, 400);
  }
  return Math.floor(n);
}

function parseDate(value: unknown, field: string): Date {
  if (!value) throw new AppError(`${field} is required`, 400);
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`${field} must be a valid date`, 400);
  }
  return d;
}

function parseUrl(value: unknown, field: string, required: boolean): string {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) {
    if (required) {
      throw new AppError(
        `${field} must be a valid URL (http:// or https://)`,
        400,
      );
    }
    return "";
  }
  if (!validateUrl(v)) {
    throw new AppError(
      `${field} must be a valid URL (http:// or https://)`,
      400,
    );
  }
  return v;
}

function requireObjectId(
  value: unknown,
  field: string,
): mongoose.Types.ObjectId {
  const raw = String(value ?? "").trim();
  if (!mongoose.Types.ObjectId.isValid(raw)) {
    throw new AppError(`Invalid ${field}`, 400);
  }
  return new mongoose.Types.ObjectId(raw);
}

/** Accepts an ObjectId, a populated doc, or a raw id string. */
function refId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

/** Serializes a possibly-populated ref down to what the UI renders. */
function serializeRef(value: unknown): LiveClassRefSummary | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const v = value as Record<string, unknown>;
    const out: LiveClassRefSummary = { _id: String(v._id) };
    for (const key of [
      "title",
      "slug",
      "thumbnail",
      "firstName",
      "lastName",
      "email",
      "profilePicture",
    ] as const) {
      if (typeof v[key] === "string") out[key] = v[key] as string;
    }
    return out;
  }
  return { _id: String(value) };
}

interface LinkDoc {
  token: string;
  expiryMins: number;
  activatedAt?: Date | null;
  clickedBy?: unknown[];
}

interface OverrideDoc {
  user: unknown;
  verdict: "present" | "absent";
}

interface LiveClassDoc {
  _id: unknown;
  brand?: unknown;
  title: string;
  description?: string;
  imageUrl?: string;
  course?: unknown;
  instructor?: unknown;
  meetingLink: string;
  recordingLink?: string;
  startDateTime: Date;
  endDateTime: Date;
  link1?: LinkDoc;
  link2?: LinkDoc;
  manualOverrides?: OverrideDoc[];
  finalizedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const EMPTY_LINK: LinkDoc = {
  token: "",
  expiryMins: 0,
  activatedAt: null,
  clickedBy: [],
};

/**
 * A row that predates the migration has no `link1`/`link2`. Reading one is not
 * worth a 500 across the whole list — it reads as a never-activated link, and
 * the migration script backfills it properly.
 */
function linkOf(
  doc: { link1?: LinkDoc; link2?: LinkDoc },
  slot: 1 | 2,
): LinkDoc {
  return (slot === 1 ? doc.link1 : doc.link2) ?? EMPTY_LINK;
}

/** Milliseconds after which a link window closes, or null if never activated. */
function closesAt(link: {
  activatedAt?: Date | null;
  expiryMins: number;
}): number | null {
  if (!link.activatedAt) return null;
  return new Date(link.activatedAt).getTime() + link.expiryMins * 60_000;
}

function computePhase(doc: {
  link1?: LinkDoc;
  link2?: LinkDoc;
}): LiveClassPhase {
  const now = Date.now();
  const l1Closes = closesAt(linkOf(doc, 1));
  const l2Closes = closesAt(linkOf(doc, 2));

  const l1Active = l1Closes !== null && now < l1Closes;
  const l2Active = l2Closes !== null && now < l2Closes;
  const l1Closed = l1Closes !== null && !l1Active;
  const l2Closed = l2Closes !== null && !l2Active;

  if (l2Active) return "link2-active";
  if (l1Active) return "link1-active";
  if (l1Closed && l2Closed) return "closed";
  if (l1Closed) return "link1-closed";
  return "not-activated";
}

/** True once both windows have been activated *and* both have elapsed. */
function bothWindowsClosed(doc: {
  link1?: LinkDoc;
  link2?: LinkDoc;
}): boolean {
  const l1 = closesAt(linkOf(doc, 1));
  const l2 = closesAt(linkOf(doc, 2));
  if (l1 === null || l2 === null) return false;
  const now = Date.now();
  return now >= l1 && now >= l2;
}

/**
 * Single source of truth for a student's attendance verdict. An admin override
 * wins; otherwise present iff both links were opened; otherwise absent once
 * both windows have closed; otherwise still pending.
 */
function resolveVerdict(opts: {
  override?: "present" | "absent";
  clickedBoth: boolean;
  bothClosed: boolean;
}): LiveClassVerdict {
  if (opts.override) return opts.override;
  if (opts.clickedBoth) return "present";
  if (opts.bothClosed) return "absent";
  return "pending";
}

/** Map of userId → forced verdict from a class's `manualOverrides`. */
function overrideMapOf(
  overrides: OverrideDoc[] | undefined,
): Map<string, "present" | "absent"> {
  return new Map(
    (overrides ?? []).map((o) => [String(o.user), o.verdict] as const),
  );
}

function serializeAdminItem(doc: LiveClassDoc): AdminLiveClassListItem {
  const link1 = linkOf(doc, 1);
  const link2 = linkOf(doc, 2);
  return {
    _id: String(doc._id),
    brand: asBrand(doc.brand),
    title: doc.title,
    description: doc.description ?? "",
    imageUrl: doc.imageUrl ?? "",
    course: serializeRef(doc.course),
    instructor: serializeRef(doc.instructor),
    // Tolerant of "" — migrated rows that had no join URL to recover land here
    // and stay editable in the admin UI instead of blowing up the list.
    meetingLink: doc.meetingLink ?? "",
    recordingLink: doc.recordingLink ?? "",
    startDateTime: new Date(doc.startDateTime).toISOString(),
    endDateTime: new Date(doc.endDateTime).toISOString(),
    link1: {
      expiryMins: link1.expiryMins,
      activatedAt: link1.activatedAt
        ? new Date(link1.activatedAt).toISOString()
        : null,
      clickedCount: Array.isArray(link1.clickedBy) ? link1.clickedBy.length : 0,
      url: link1.token ? attendanceUrl(link1.token) : "",
    },
    link2: {
      expiryMins: link2.expiryMins,
      activatedAt: link2.activatedAt
        ? new Date(link2.activatedAt).toISOString()
        : null,
      clickedCount: Array.isArray(link2.clickedBy) ? link2.clickedBy.length : 0,
      url: link2.token ? attendanceUrl(link2.token) : "",
    },
    phase: computePhase(doc),
    finalizedAt: doc.finalizedAt
      ? new Date(doc.finalizedAt).toISOString()
      : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : "",
  };
}

function serializeStudentItem(
  doc: LiveClassDoc,
  userId: string,
): StudentLiveClassItem {
  const l1 = (linkOf(doc, 1).clickedBy ?? []).map((u) => String(u));
  const l2 = (linkOf(doc, 2).clickedBy ?? []).map((u) => String(u));
  return {
    _id: String(doc._id),
    title: doc.title,
    description: doc.description ?? "",
    imageUrl: doc.imageUrl ?? "",
    course: serializeRef(doc.course),
    instructor: serializeRef(doc.instructor),
    meetingLink: doc.meetingLink ?? "",
    recordingLink: doc.recordingLink ?? "",
    startDateTime: new Date(doc.startDateTime).toISOString(),
    endDateTime: new Date(doc.endDateTime).toISOString(),
    phase: computePhase(doc),
    link1Clicked: l1.includes(userId),
    link2Clicked: l2.includes(userId),
  };
}

/**
 * Resolves the optional host and enforces the course/instructor relationship.
 *
 * Instructors are always pinned to themselves and must be assigned to the
 * course. Admins may name any instructor, or none at all — a course with no
 * instructors assigned still gets to have live classes. Returning null means
 * "unhosted", which is valid; it must never silently fall back to the acting
 * admin, who is not an instructor.
 */
async function resolveInstructor(
  courseId: mongoose.Types.ObjectId,
  requestedInstructorId: string | undefined,
  actorId: string,
  isAdmin: boolean,
): Promise<mongoose.Types.ObjectId | null> {
  const course = await CourseModel.findById(courseId)
    .select("instructor")
    .lean();
  if (!course) throw new AppError("Course not found", 404);

  const courseInstructors = new Set(
    ((course.instructor ?? []) as unknown[]).map(refId),
  );

  if (!isAdmin) {
    if (!courseInstructors.has(actorId)) {
      throw new AppError("Instructor is not assigned to this course", 403);
    }
    return new mongoose.Types.ObjectId(actorId);
  }

  const target = String(requestedInstructorId ?? "").trim();
  if (!target) return null;

  const targetId = requireObjectId(target, "instructor");
  if (!courseInstructors.has(String(targetId))) {
    const instructor = await UserModel.findById(targetId)
      .select("userType")
      .lean();
    if (!instructor) throw new AppError("Instructor not found", 404);
    if (instructor.userType !== "instructor") {
      throw new AppError("Specified user is not an instructor", 400);
    }
  }

  return targetId;
}

/** Throws unless the actor is an admin or the owning instructor. */
async function assertCanManage(
  liveClassId: mongoose.Types.ObjectId,
  actorId: string,
  isAdmin: boolean,
): Promise<LiveClassDoc> {
  const doc = await LiveClassModel.findById(liveClassId).lean();
  if (!doc) throw new AppError("Live class not found", 404);
  if (!isAdmin && refId(doc.instructor) !== actorId) {
    throw new AppError("You can only manage your own live classes", 403);
  }
  return doc as unknown as LiveClassDoc;
}

// ───────── Create ─────────

export const createLiveClassService = async (
  body: CreateLiveClassBody,
  actorId: string,
  isAdmin: boolean = false,
): Promise<AdminLiveClassListItem> => {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 3) {
    throw new AppError("Title must be at least 3 characters", 400);
  }

  const courseId = requireObjectId(body.course, "course");
  const instructorId = await resolveInstructor(
    courseId,
    body.instructor,
    actorId,
    isAdmin,
  );

  const meetingLink = parseUrl(body.meetingLink, "meetingLink", true);
  const recordingLink = parseUrl(body.recordingLink, "recordingLink", false);
  const imageUrl = parseUrl(body.imageUrl, "imageUrl", false);

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

  const created = await LiveClassModel.create({
    title,
    description:
      typeof body.description === "string" ? body.description.trim() : "",
    imageUrl,
    course: courseId,
    instructor: instructorId,
    meetingLink,
    recordingLink,
    startDateTime,
    endDateTime,
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
    manualOverrides: [],
    createdBy: new mongoose.Types.ObjectId(actorId),
  });

  await created.populate([
    { path: "course", select: COURSE_REF_FIELDS },
    { path: "instructor", select: INSTRUCTOR_REF_FIELDS },
  ]);

  return serializeAdminItem(created.toObject() as unknown as LiveClassDoc);
};

// ───────── Update ─────────

/**
 * Editable after creation: presentation fields, both URLs, the schedule, and
 * each link's expiry window — but only while that link is still un-activated.
 * Re-timing a window learners have already opened would silently rewrite who
 * counts as present.
 */
export const updateLiveClassService = async (
  liveClassId: string,
  body: UpdateLiveClassBody,
  actorId: string,
  isAdmin: boolean = false,
): Promise<AdminLiveClassListItem> => {
  const oid = requireObjectId(liveClassId, "live class ID");
  const current = await assertCanManage(oid, actorId, isAdmin);

  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 3) {
      throw new AppError("Title must be at least 3 characters", 400);
    }
    update.title = title;
  }

  if (body.description !== undefined) {
    update.description = String(body.description ?? "").trim();
  }

  if (body.imageUrl !== undefined) {
    update.imageUrl = parseUrl(body.imageUrl, "imageUrl", false);
  }

  if (body.meetingLink !== undefined) {
    update.meetingLink = parseUrl(body.meetingLink, "meetingLink", true);
  }

  if (body.recordingLink !== undefined) {
    update.recordingLink = parseUrl(body.recordingLink, "recordingLink", false);
  }

  // Admins may reassign; instructors never can (the controller strips it, this
  // is the backstop).
  if (body.instructor !== undefined && isAdmin) {
    update.instructor = await resolveInstructor(
      requireObjectId(refId(current.course), "course"),
      String(body.instructor),
      actorId,
      true,
    );
  }

  const start =
    body.startDateTime !== undefined
      ? parseDate(body.startDateTime, "startDateTime")
      : new Date(current.startDateTime);
  const end =
    body.endDateTime !== undefined
      ? parseDate(body.endDateTime, "endDateTime")
      : new Date(current.endDateTime);
  if (body.startDateTime !== undefined || body.endDateTime !== undefined) {
    if (end <= start) {
      throw new AppError("endDateTime must be after startDateTime", 400);
    }
    if (body.startDateTime !== undefined) update.startDateTime = start;
    if (body.endDateTime !== undefined) update.endDateTime = end;
  }

  for (const slot of [1, 2] as const) {
    const key = slot === 1 ? "link1ExpiryMins" : "link2ExpiryMins";
    const value = body[key];
    if (value === undefined) continue;
    if (linkOf(current, slot).activatedAt) {
      throw new AppError(
        `Attendance ${slot} is already activated — its window can no longer be changed.`,
        400,
      );
    }
    update[`link${slot}.expiryMins`] = parsePositiveInt(value, key);
  }

  if (Object.keys(update).length === 0) {
    throw new AppError("No editable fields provided", 400);
  }

  const updated = await LiveClassModel.findByIdAndUpdate(
    oid,
    { $set: update },
    { new: true, runValidators: true },
  )
    .populate("course", COURSE_REF_FIELDS)
    .populate("instructor", INSTRUCTOR_REF_FIELDS)
    .lean();

  if (!updated) throw new AppError("Live class not found", 404);
  return serializeAdminItem(updated as unknown as LiveClassDoc);
};

// ───────── Admin: list ─────────

export const getAllLiveClassesService = async (
  page: number = 1,
  limit: number = 10,
  courseId?: string,
  search?: string,
  brand?: Brand,
): Promise<AdminLiveClassListResponse> => {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(100, Math.max(1, Math.floor(limit)));

  const filter: Record<string, unknown> = {};
  if (courseId) filter.course = requireObjectId(courseId, "courseId");
  if (brand) filter.brand = brand;
  const term = typeof search === "string" ? search.trim() : "";
  if (term) {
    filter.title = {
      $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const [docs, total] = await Promise.all([
    LiveClassModel.find(filter)
      .populate("course", COURSE_REF_FIELDS)
      .populate("instructor", INSTRUCTOR_REF_FIELDS)
      .sort({ startDateTime: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    LiveClassModel.countDocuments(filter),
  ]);

  return {
    liveClasses: (docs as unknown as LiveClassDoc[]).map(serializeAdminItem),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
};

// ───────── Admin: ongoing ─────────

export const getAllOngoingLiveClassesService = async (
  page: number = 1,
  limit: number = 10,
): Promise<AdminLiveClassListResponse> => {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(100, Math.max(1, Math.floor(limit)));
  const now = new Date();

  // Served straight off the { startDateTime, endDateTime } index instead of the
  // old approach of loading the whole collection and filtering in JS.
  const filter = {
    startDateTime: { $lte: now },
    endDateTime: { $gte: now },
  };

  const [docs, total] = await Promise.all([
    LiveClassModel.find(filter)
      .populate("course", COURSE_REF_FIELDS)
      .populate("instructor", INSTRUCTOR_REF_FIELDS)
      .sort({ startDateTime: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    LiveClassModel.countDocuments(filter),
  ]);

  return {
    liveClasses: (docs as unknown as LiveClassDoc[]).map(serializeAdminItem),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
};

// ───────── Instructor: list own ─────────

export const getInstructorLiveClassesService = async (
  instructorId: string,
  page: number = 1,
  limit: number = 10,
  courseId?: string,
): Promise<AdminLiveClassListResponse> => {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(100, Math.max(1, Math.floor(limit)));

  const filter: Record<string, unknown> = {
    instructor: requireObjectId(instructorId, "instructorId"),
  };
  if (courseId) filter.course = requireObjectId(courseId, "courseId");

  const [docs, total] = await Promise.all([
    LiveClassModel.find(filter)
      .populate("course", COURSE_REF_FIELDS)
      .populate("instructor", INSTRUCTOR_REF_FIELDS)
      .sort({ startDateTime: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    LiveClassModel.countDocuments(filter),
  ]);

  return {
    liveClasses: (docs as unknown as LiveClassDoc[]).map(serializeAdminItem),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
};

// ───────── Admin: get one ─────────

export const getLiveClassByIdService = async (
  liveClassId: string,
): Promise<AdminLiveClassListItem | null> => {
  if (!mongoose.Types.ObjectId.isValid(liveClassId)) return null;

  const doc = await LiveClassModel.findById(liveClassId)
    .populate("course", COURSE_REF_FIELDS)
    .populate("instructor", INSTRUCTOR_REF_FIELDS)
    .lean();

  return doc ? serializeAdminItem(doc as unknown as LiveClassDoc) : null;
};

// ───────── Admin: activate an attendance link ─────────

export const activateLiveClassLinkService = async (
  liveClassId: string,
  slot: 1 | 2,
  actorId: string,
  isAdmin: boolean = false,
): Promise<AdminLiveClassListItem> => {
  const oid = requireObjectId(liveClassId, "live class ID");
  if (slot !== 1 && slot !== 2) throw new AppError("slot must be 1 or 2", 400);

  await assertCanManage(oid, actorId, isAdmin);

  const field = `link${slot}.activatedAt`;

  // Conditional update — activation is one-shot, so a double-click or a racing
  // second admin can never restart the window.
  const updated = await LiveClassModel.findOneAndUpdate(
    { _id: oid, [field]: null },
    { $set: { [field]: new Date() } },
    { new: true },
  )
    .populate("course", COURSE_REF_FIELDS)
    .populate("instructor", INSTRUCTOR_REF_FIELDS)
    .lean();

  if (!updated) throw new AppError(`Attendance ${slot} is already activated`, 409);

  return serializeAdminItem(updated as unknown as LiveClassDoc);
};

// ───────── Admin: attendance (with lazy finalize) ─────────

export const getLiveClassAttendanceService = async (
  liveClassId: string,
  actorId: string,
  isAdmin: boolean = false,
): Promise<AdminLiveClassAttendanceResponse> => {
  const oid = requireObjectId(liveClassId, "live class ID");
  const doc = await assertCanManage(oid, actorId, isAdmin);

  if (bothWindowsClosed(doc) && !doc.finalizedAt) {
    await finalizeLiveClassAttendance(oid);
  }

  // Refetch — finalize may have stamped `finalizedAt`.
  const fresh = await LiveClassModel.findById(oid)
    .populate("course", COURSE_REF_FIELDS)
    .populate("instructor", INSTRUCTOR_REF_FIELDS)
    .lean();
  if (!fresh) throw new AppError("Live class not found", 404);

  const freshDoc = fresh as unknown as LiveClassDoc;
  const bothClosed = bothWindowsClosed(freshDoc);
  const overrideMap = overrideMapOf(freshDoc.manualOverrides);

  const enrollments = await EnrollmentModel.find({
    courseId: requireObjectId(refId(freshDoc.course), "course"),
    status: { $in: ENROLLED_STATUSES },
    planType: ELITE_PLAN,
  })
    .select("_id userId")
    .populate("userId", "firstName lastName email")
    .lean();

  const link1Set = new Set(
    (linkOf(freshDoc, 1).clickedBy ?? []).map((u) => String(u)),
  );
  const link2Set = new Set(
    (linkOf(freshDoc, 2).clickedBy ?? []).map((u) => String(u)),
  );

  const rows: AdminLiveClassAttendanceRow[] = enrollments.map((enr) => {
    const u = (enr.userId ?? {}) as {
      _id?: unknown;
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    const uid = String(u._id ?? "");
    const inL1 = link1Set.has(uid);
    const inL2 = link2Set.has(uid);
    const override = overrideMap.get(uid);

    return {
      user: {
        _id: uid,
        firstName: typeof u.firstName === "string" ? u.firstName : undefined,
        lastName: typeof u.lastName === "string" ? u.lastName : undefined,
        email: typeof u.email === "string" ? u.email : undefined,
      },
      enrollmentId: String(enr._id),
      link1Clicked: inL1,
      link2Clicked: inL2,
      verdict: resolveVerdict({
        override,
        clickedBoth: inL1 && inL2,
        bothClosed,
      }),
      overridden: override != null,
    };
  });

  return { liveClass: serializeAdminItem(freshDoc), rows };
};

/**
 * One-time pass that materializes an absent row per non-present learner.
 * Claiming `finalizedAt` atomically up front means concurrent admin views can
 * never double-run it.
 */
async function finalizeLiveClassAttendance(
  liveClassId: mongoose.Types.ObjectId,
): Promise<void> {
  const claimed = await LiveClassModel.findOneAndUpdate(
    { _id: liveClassId, finalizedAt: null },
    { $set: { finalizedAt: new Date() } },
    { new: true },
  )
    .select("course link1.clickedBy link2.clickedBy manualOverrides")
    .lean();
  if (!claimed) return;

  const link1Set = new Set(
    ((claimed.link1?.clickedBy ?? []) as unknown[]).map((u) => String(u)),
  );
  const link2Set = new Set(
    ((claimed.link2?.clickedBy ?? []) as unknown[]).map((u) => String(u)),
  );
  const overrideMap = overrideMapOf(
    claimed.manualOverrides as unknown as OverrideDoc[] | undefined,
  );

  const enrollments = await EnrollmentModel.find({
    courseId: claimed.course,
    status: { $in: ENROLLED_STATUSES },
    planType: ELITE_PLAN,
  })
    .select("userId")
    .lean();

  // An override set before the windows closed must survive finalize, so the
  // absent row is decided by the same resolver the admin view uses.
  const absentOps = enrollments
    .filter((enr) => {
      const uid = String(enr.userId);
      return (
        resolveVerdict({
          override: overrideMap.get(uid),
          clickedBoth: link1Set.has(uid) && link2Set.has(uid),
          bothClosed: true,
        }) !== "present"
      );
    })
    .map((enr) => ({
      insertOne: {
        document: {
          liveClass: liveClassId,
          user: new mongoose.Types.ObjectId(String(enr.userId)),
        },
      },
    }));

  if (absentOps.length === 0) return;

  try {
    await LiveClassAttendanceModel.bulkWrite(absentOps, { ordered: false });
  } catch (e: unknown) {
    // Duplicate-key means a prior run already wrote the row — finalize is
    // idempotent, so that is not an error.
    if ((e as { code?: number })?.code !== 11000) throw e;
  }
}

// ───────── Admin: manual verdict override ─────────

/**
 * Force a learner's verdict, or `clear` to fall back to the computed one.
 * Usable before finalize too, so an admin can fix an attendance problem while
 * the class is still running.
 */
export const setLiveClassAttendanceOverrideService = async (
  liveClassId: string,
  userId: string,
  verdict: "present" | "absent" | "clear",
  setBy: mongoose.Types.ObjectId,
  actorId: string,
  isAdmin: boolean = false,
): Promise<AdminLiveClassAttendanceResponse> => {
  const oid = requireObjectId(liveClassId, "live class ID");
  const uid = requireObjectId(userId, "user id");

  if (verdict !== "present" && verdict !== "absent" && verdict !== "clear") {
    throw new AppError("verdict must be present, absent, or clear", 400);
  }

  let doc = await assertCanManage(oid, actorId, isAdmin);

  // Roster gate: the learner must be an elite-plan enrollee on this course, or
  // the override would be an orphan entry that never surfaces anywhere.
  const enrollment = await EnrollmentModel.findOne({
    userId: uid,
    courseId: requireObjectId(refId(doc.course), "course"),
    status: { $in: ENROLLED_STATUSES },
    planType: ELITE_PLAN,
  })
    .select("_id")
    .lean();
  if (!enrollment) {
    throw new AppError("That learner is not on this class's roster", 404);
  }

  // Settle finalize first if the windows have closed, so the absent rows below
  // are reconciled against a finalized baseline rather than racing it.
  if (bothWindowsClosed(doc) && !doc.finalizedAt) {
    await finalizeLiveClassAttendance(oid);
    const refetched = await LiveClassModel.findById(oid).lean();
    if (!refetched) throw new AppError("Live class not found", 404);
    doc = refetched as unknown as LiveClassDoc;
  }

  const isFinalized = doc.finalizedAt != null;
  const clickedBoth =
    (linkOf(doc, 1).clickedBy ?? []).some((u) => String(u) === String(uid)) &&
    (linkOf(doc, 2).clickedBy ?? []).some((u) => String(u) === String(uid));

  const newOverride = verdict === "clear" ? undefined : verdict;
  const willBePresent =
    resolveVerdict({
      override: newOverride,
      clickedBoth,
      bothClosed: isFinalized,
    }) === "present";

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Pull-then-push = upsert of the single entry for this user.
      await LiveClassModel.updateOne(
        { _id: oid },
        { $pull: { manualOverrides: { user: uid } } },
        { session },
      );
      if (newOverride) {
        await LiveClassModel.updateOne(
          { _id: oid },
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

      // Post-finalize the absent row must exist iff the learner is effectively
      // absent, so the materialized record matches the effective verdict.
      if (isFinalized) {
        if (willBePresent) {
          await LiveClassAttendanceModel.deleteOne(
            { liveClass: oid, user: uid },
            { session },
          );
        } else {
          await LiveClassAttendanceModel.updateOne(
            { liveClass: oid, user: uid },
            { $setOnInsert: { liveClass: oid, user: uid } },
            { upsert: true, session },
          );
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return getLiveClassAttendanceService(liveClassId, actorId, isAdmin);
};

// ───────── Student: list across enrolled courses ─────────

export const getStudentLiveClassesService = async (
  studentId: string,
  page: number = 1,
  limit: number = 10,
  brands?: Brand[],
): Promise<StudentLiveClassesPage> => {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(50, Math.max(1, Math.floor(limit)));

  // Fetched WITHOUT the plan filter — same query, same index, one extra
  // projected field — so we can tell "no live classes scheduled" apart from
  // "your plan doesn't include them" without a second round trip.
  const enrollments = await EnrollmentModel.find({
    userId: requireObjectId(studentId, "studentId"),
    ...(brands && brands.length > 0 ? { brand: { $in: brands } } : {}),
    status: { $in: ENROLLED_STATUSES },
  })
    .select("courseId planType")
    .lean();

  const courseIds = enrollments
    .filter((e) => e.planType === ELITE_PLAN)
    .map((e) => e.courseId)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));

  const hasEliteAccess = courseIds.length > 0;

  if (!hasEliteAccess) {
    return {
      liveClasses: [],
      total: 0,
      page: p,
      totalPages: 1,
      hasEliteAccess: false,
    };
  }

  // Every class for the enrolled courses — upcoming, live and past — so the
  // learner keeps access to recordings and their own attendance history.
  const filter = { course: { $in: courseIds } };

  const [docs, total] = await Promise.all([
    LiveClassModel.find(filter)
      .populate("course", COURSE_REF_FIELDS)
      .populate("instructor", INSTRUCTOR_REF_FIELDS)
      .sort({ startDateTime: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    LiveClassModel.countDocuments(filter),
  ]);

  const uid = String(studentId);
  return {
    liveClasses: (docs as unknown as LiveClassDoc[]).map((d) =>
      serializeStudentItem(d, uid),
    ),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
    hasEliteAccess: true,
  };
};

// ───────── Student: one course's feed (course player tab) ─────────

/**
 * Live classes for a single enrolled course, newest-first — drives the
 * "Live Classes" tab in the course player. Mirrors the internship program
 * page's per-batch feed.
 *
 * A learner on a non-elite plan gets `hasAccess: false` and an empty list
 * rather than an error, so the tab can show an upsell.
 */
export const getStudentLiveClassesForCourseService = async (
  courseId: string,
  studentId: string,
  page: number = 1,
  limit: number = 10,
  brands?: Brand[],
): Promise<StudentCourseLiveClassesPage> => {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(50, Math.max(1, Math.floor(limit)));
  const courseOid = requireObjectId(courseId, "courseId");

  const enrollment = await EnrollmentModel.findOne({
    userId: requireObjectId(studentId, "studentId"),
    courseId: courseOid,
    ...(brands && brands.length > 0 ? { brand: { $in: brands } } : {}),
    status: { $in: ENROLLED_STATUSES },
  })
    .select("planType")
    .lean();

  if (!enrollment) {
    throw new AppError("You are not enrolled in this course", 403);
  }
  if (enrollment.planType !== ELITE_PLAN) {
    return { liveClasses: [], total: 0, page: p, totalPages: 1, hasAccess: false };
  }

  const filter = { course: courseOid };
  const [docs, total] = await Promise.all([
    LiveClassModel.find(filter)
      .populate("course", COURSE_REF_FIELDS)
      .populate("instructor", INSTRUCTOR_REF_FIELDS)
      .sort({ startDateTime: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    LiveClassModel.countDocuments(filter),
  ]);

  const uid = String(studentId);
  return {
    liveClasses: (docs as unknown as LiveClassDoc[]).map((d) =>
      serializeStudentItem(d, uid),
    ),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
    hasAccess: true,
  };
};

// ───────── Student: get one ─────────

export const getStudentLiveClassByIdService = async (
  liveClassId: string,
  studentId: string,
): Promise<StudentLiveClassItem> => {
  const oid = requireObjectId(liveClassId, "live class ID");

  const doc = await LiveClassModel.findById(oid)
    .populate("course", COURSE_REF_FIELDS)
    .populate("instructor", INSTRUCTOR_REF_FIELDS)
    .lean();
  if (!doc) throw new AppError("Live class not found", 404);

  const liveClassDoc = doc as unknown as LiveClassDoc;

  const enrollment = await EnrollmentModel.findOne({
    userId: requireObjectId(studentId, "studentId"),
    courseId: requireObjectId(refId(liveClassDoc.course), "course"),
    status: { $in: ENROLLED_STATUSES },
    planType: ELITE_PLAN,
  })
    .select("_id")
    .lean();

  if (!enrollment) {
    throw new AppError(
      "Access denied. Live classes are only available for elite plan enrollments.",
      403,
    );
  }

  return serializeStudentItem(liveClassDoc, String(studentId));
};

// ───────── Student: attendance click ─────────

export const recordLiveClassAttendanceClick = async (
  token: string,
  userId: mongoose.Types.ObjectId,
): Promise<StudentLiveClassAttendResult> => {
  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, reason: "invalid" };
  }

  const doc = await LiveClassModel.findOne({
    $or: [{ "link1.token": token }, { "link2.token": token }],
  })
    .select("title course link1 link2")
    .lean();

  if (!doc) return { ok: false, reason: "invalid" };

  const slot: 1 | 2 = doc.link1?.token === token ? 1 : 2;
  const link = slot === 1 ? doc.link1 : doc.link2;
  if (!link?.activatedAt) return { ok: false, reason: "not-activated" };

  // Re-clicks get a friendly confirmation even after the window shut — the
  // click was valid when it happened, so "expired" would be misleading.
  const userIdStr = String(userId);
  const alreadyInArray = ((link.clickedBy ?? []) as unknown[]).some(
    (u) => String(u) === userIdStr,
  );
  if (alreadyInArray) {
    return { ok: true, slot, alreadyMarked: true, liveClassTitle: doc.title };
  }

  const windowClosesAt = closesAt(link);
  if (windowClosesAt === null || Date.now() >= windowClosesAt) {
    return { ok: false, reason: "expired" };
  }

  // Looked up WITHOUT the plan filter so the two failure modes stay separable:
  // no enrollment at all vs. enrolled on the wrong plan.
  const enrollment = await EnrollmentModel.findOne({
    userId,
    courseId: doc.course,
    status: { $in: ENROLLED_STATUSES },
  })
    .select("_id planType")
    .lean();

  if (!enrollment) return { ok: false, reason: "not-enrolled" };
  if (enrollment.planType !== ELITE_PLAN) {
    return { ok: false, reason: "not-elite" };
  }

  const result = await LiveClassModel.updateOne(
    { _id: doc._id },
    { $addToSet: { [`link${slot}.clickedBy`]: userId } },
  );

  return {
    ok: true,
    slot,
    alreadyMarked: result.modifiedCount === 0,
    liveClassTitle: doc.title,
  };
};

// ───────── Delete ─────────

export const deleteLiveClassService = async (
  liveClassId: string,
  actorId: string,
  isAdmin: boolean = false,
): Promise<boolean> => {
  const oid = requireObjectId(liveClassId, "live class ID");
  const doc = await assertCanManage(oid, actorId, isAdmin);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const deleted = await LiveClassModel.findByIdAndDelete(oid, { session });
      if (!deleted) throw new AppError("Live class not found", 404);
      await LiveClassAttendanceModel.deleteMany(
        { liveClass: oid },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  // S3 cleanup only after the delete commits, so a rolled-back transaction can
  // never orphan a live class whose image is already gone.
  if (doc.imageUrl) {
    const key = extractS3KeyFromUrl(doc.imageUrl);
    if (key) {
      deleteFilesFromS3([key]).catch((err) =>
        console.error("[DeleteLiveClass] S3 cleanup failed:", err),
      );
    }
  }

  return true;
};
