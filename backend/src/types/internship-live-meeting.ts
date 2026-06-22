import { Internship, User } from ".";

/**
 * One-off live meeting (Zoom/Meet/etc.) for a single internship batch.
 *
 * Attendance is recorded via two admin-controlled checkpoint links
 * (`link1`, `link2`). A student is **present** only if they click both
 * links within their respective expiry windows; anything less is **absent**.
 *
 * Click tracking lives embedded on this document — `link{N}.clickedBy`.
 * After both link windows close, a lazy "finalize" pass inserts an
 * `InternshipLiveMeetingAttendance` document for each absent student.
 * Present students get no document (storage-optimized — absent-only).
 */
export interface InternshipLiveMeeting {
  _id?: string;
  internship: Internship["_id"];
  /** Matches `internship.batches[n]._id`. Mandatory. */
  batchId: string;

  name: string;
  description?: string;
  /** Zoom / Meet / etc. URL the admin shares with students. */
  meetingLink: string;
  /** Optional link to the recorded session, set after the meeting. */
  recordingLink?: string;

  startDateTime: Date;
  endDateTime?: Date;

  /** Internship success points awarded to learners present for this meeting. */
  successPoints?: number;

  link1: InternshipLiveMeetingLink;
  link2: InternshipLiveMeetingLink;

  /**
   * Admin verdict overrides, keyed by user. An entry forces the student's
   * attendance verdict regardless of their link clicks; no entry means the
   * computed verdict applies ("clear"). Drives both the admin view and the
   * finalize points/absent-doc logic.
   */
  manualOverrides?: InternshipLiveMeetingOverride[];

  /**
   * Set on first admin attendance-view request after both link windows have
   * closed. Triggers the one-time finalize pass that materializes absent docs.
   */
  finalizedAt?: Date | null;

  createdBy: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}

/** A forced attendance verdict for one student, set by an admin. */
export interface InternshipLiveMeetingOverride {
  user: User["_id"];
  verdict: "present" | "absent";
  setBy: User["_id"];
  setAt: Date;
}

export interface InternshipLiveMeetingLink {
  /** URL-safe random opaque token. Unique across the collection. */
  token: string;
  /** Window length in minutes, starting at `activatedAt`. Must be >= 1. */
  expiryMins: number;
  /** Null until admin activates this slot. One-shot — no re-activation. */
  activatedAt?: Date | null;
  /** User ids who clicked validly within the window. */
  clickedBy: User["_id"][];
}

/** Existence implies the student was **absent** for the meeting. */
export interface InternshipLiveMeetingAttendance {
  _id?: string;
  meeting: InternshipLiveMeeting["_id"];
  user: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Admin-facing payloads ────────────────────────────────────────────────────

export interface CreateInternshipLiveMeetingBody {
  internshipId: string;
  batchId: string;
  name: string;
  description?: string;
  meetingLink: string;
  /** Optional link to the recorded session. */
  recordingLink?: string;
  startDateTime: string | Date;
  endDateTime?: string | Date;
  link1ExpiryMins: number;
  link2ExpiryMins: number;
  /** Points awarded to learners present for this meeting. 0 = none. */
  successPoints?: number;
}

export type LiveMeetingPhase =
  | "not-activated"
  | "link1-active"
  | "link1-closed"
  | "link2-active"
  | "closed";

export interface AdminLiveMeetingListItem {
  _id: string;
  internship: string;
  batchId: string;
  name: string;
  description: string;
  meetingLink: string;
  /** Optional link to the recorded session ("" when not set). */
  recordingLink: string;
  startDateTime: string;
  endDateTime: string | null;
  /** Points awarded to learners present for this meeting. */
  successPoints: number;
  link1: {
    expiryMins: number;
    activatedAt: string | null;
    clickedCount: number;
    /** Full attendance URL (admin-only). */
    url: string;
  };
  link2: {
    expiryMins: number;
    activatedAt: string | null;
    clickedCount: number;
    url: string;
  };
  phase: LiveMeetingPhase;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLiveMeetingAttendanceRow {
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
  };
  enrollmentId: string;
  /** True if the student clicked link1 inside its window. */
  link1Clicked: boolean;
  /** True if the student clicked link2 inside its window. */
  link2Clicked: boolean;
  /** Effective verdict, after applying any admin override. */
  verdict: "present" | "absent" | "pending";
  /** True when an admin override is forcing this verdict (vs. computed). */
  overridden: boolean;
}

export interface AdminLiveMeetingAttendanceResponse {
  meeting: AdminLiveMeetingListItem;
  rows: AdminLiveMeetingAttendanceRow[];
}

/** Body for POST .../attendance/override — `clear` removes any override. */
export interface SetAttendanceOverrideBody {
  userId: string;
  verdict: "present" | "absent" | "clear";
}

// ─── Student-facing payloads ──────────────────────────────────────────────────

export type StudentAttendResult =
  | { ok: true; slot: 1 | 2; alreadyMarked: boolean; meetingName: string }
  | { ok: false; reason: "expired" | "not-activated" | "not-enrolled" | "invalid" };

/**
 * Student-safe view of a live meeting — no admin tokens / attendance URLs,
 * only what a learner needs to see on their dashboard.
 */
export interface StudentLiveMeetingItem {
  _id: string;
  name: string;
  description: string;
  meetingLink: string;
  /** Optional link to the recorded session ("" when not set). */
  recordingLink: string;
  startDateTime: string;
  endDateTime: string | null;
  phase: LiveMeetingPhase;
  /** Whether *this* student has clicked link1 inside its window. */
  link1Clicked: boolean;
  link2Clicked: boolean;
}

/** Paginated student view of live meetings for the learner's batch. */
export interface StudentLiveMeetingsPage {
  items: StudentLiveMeetingItem[];
  total: number;
  page: number;
  totalPages: number;
}
