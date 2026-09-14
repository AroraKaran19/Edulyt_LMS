import { User } from "./user";
import { Course } from "./course";
import type { Brand } from "../constants/brands";

/**
 * One-off live class (Zoom/Meet/etc.) for a single course.
 *
 * Mirrors the internship live-meeting model: attendance is recorded via two
 * admin-controlled links (`link1`, `link2`). A student is **present** only if
 * they open both within their respective expiry windows; anything less is
 * **absent**.
 *
 * Click tracking lives embedded on this document (`link{N}.clickedBy`). After
 * both windows close, a lazy "finalize" pass inserts a `LiveClassAttendance`
 * row for each absent student — present students leave no row.
 *
 * `manualOverrides` lets an admin force a verdict either way; an override
 * always beats the computed one.
 */
export interface LiveClass {
  brand?: Brand;
  _id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  /** Optional host for this class. Unrelated to `course.instructor`. */
  instructor?: User["_id"] | string | null;
  course: Course["_id"] | string;

  /** Zoom / Meet / etc. URL the admin shares with students. */
  meetingLink: string;
  /** Optional link to the recorded session, set after the class. */
  recordingLink?: string;

  /** Single source of truth for when the class starts. */
  startDateTime: Date;
  endDateTime: Date;

  link1: LiveClassLink;
  link2: LiveClassLink;

  /** Admin verdict overrides, one entry per affected student. */
  manualOverrides?: LiveClassOverride[];

  /**
   * Set on the first admin attendance-view request after both windows have
   * closed. Triggers the one-time pass that materializes the absent rows.
   */
  finalizedAt?: Date | null;

  createdBy: User["_id"] | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LiveClassLink {
  /** URL-safe random opaque token. Unique across the collection. */
  token: string;
  /** Window length in minutes, starting at `activatedAt`. Must be >= 1. */
  expiryMins: number;
  /** Null until an admin activates this slot. One-shot — no re-activation. */
  activatedAt?: Date | null;
  /** User ids who opened the link validly within the window. */
  clickedBy: User["_id"][];
}

/** A forced verdict for one student. Absence of an entry means "use computed". */
export interface LiveClassOverride {
  user: User["_id"];
  verdict: "present" | "absent";
  setBy: User["_id"];
  setAt?: Date;
}

/** Existence implies the student was **absent** for the live class. */
export interface LiveClassAttendance {
  _id?: string;
  liveClass: LiveClass["_id"];
  user: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}

export type LiveClassVerdict = "present" | "absent" | "pending";

// ─── Admin-facing payloads ────────────────────────────────────────────────────

export interface CreateLiveClassBody {
  course: string;
  title: string;
  description?: string;
  imageUrl?: string;
  /** Admin-only. Instructors always create against themselves. */
  instructor?: string;
  meetingLink: string;
  recordingLink?: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  link1ExpiryMins: number;
  link2ExpiryMins: number;
}

export interface UpdateLiveClassBody {
  title?: string;
  description?: string;
  imageUrl?: string;
  instructor?: string;
  meetingLink?: string;
  recordingLink?: string;
  startDateTime?: string | Date;
  endDateTime?: string | Date;
  link1ExpiryMins?: number;
  link2ExpiryMins?: number;
}

export type LiveClassPhase =
  | "not-activated"
  | "link1-active"
  | "link1-closed"
  | "link2-active"
  | "closed";

/** Populated ref, flattened to the few fields the UI actually renders. */
export interface LiveClassRefSummary {
  _id: string;
  title?: string;
  slug?: string;
  thumbnail?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
}

export interface AdminLiveClassListItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  course: LiveClassRefSummary | null;
  instructor: LiveClassRefSummary | null;
  meetingLink: string;
  /** Optional link to the recorded session ("" when not set). */
  recordingLink: string;
  startDateTime: string;
  endDateTime: string;
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
  phase: LiveClassPhase;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLiveClassAttendanceRow {
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  enrollmentId: string;
  /** True if the student opened link1 inside its window. */
  link1Clicked: boolean;
  /** True if the student opened link2 inside its window. */
  link2Clicked: boolean;
  /** Effective verdict, after applying any admin override. */
  verdict: LiveClassVerdict;
  /** True when an admin override is forcing this verdict (vs. computed). */
  overridden: boolean;
}

export interface AdminLiveClassAttendanceResponse {
  liveClass: AdminLiveClassListItem;
  rows: AdminLiveClassAttendanceRow[];
}

export interface AdminLiveClassListResponse {
  liveClasses: AdminLiveClassListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/** Body for the admin attendance-override request. `clear` removes any override. */
export interface SetLiveClassAttendanceOverrideBody {
  userId: string;
  verdict: "present" | "absent" | "clear";
}

// ─── Student-facing payloads ──────────────────────────────────────────────────

export type StudentLiveClassAttendResult =
  | { ok: true; slot: 1 | 2; alreadyMarked: boolean; liveClassTitle: string }
  | {
      ok: false;
      /**
       * `not-enrolled` and `not-elite` are kept distinct on purpose: telling a
       * learner who is plainly enrolled that they aren't is just confusing —
       * the real blocker is their plan.
       */
      reason:
        | "expired"
        | "not-activated"
        | "not-enrolled"
        | "not-elite"
        | "invalid";
    };

/**
 * Student-safe view of a live class — no admin tokens or attendance URLs, only
 * what a learner needs to see, join and track.
 */
export interface StudentLiveClassItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  course: LiveClassRefSummary | null;
  instructor: LiveClassRefSummary | null;
  meetingLink: string;
  /** Optional link to the recorded session ("" when not set). */
  recordingLink: string;
  startDateTime: string;
  endDateTime: string;
  phase: LiveClassPhase;
  /** Whether *this* student opened each link inside its window. */
  link1Clicked: boolean;
  link2Clicked: boolean;
}

interface StudentLiveClassesPageBase {
  liveClasses: StudentLiveClassItem[];
  total: number;
  page: number;
  totalPages: number;
}

/** Feed across every enrolled course (dashboard + /dashboard/live-classes). */
export interface StudentLiveClassesPage extends StudentLiveClassesPageBase {
  /**
   * False when the learner holds no elite-plan enrollment at all. Lets the UI
   * say "not part of your plan" instead of the misleading "no live classes".
   */
  hasEliteAccess: boolean;
}

/**
 * Per-course feed for the course player's "Live Classes" tab. `hasAccess` is
 * the same idea scoped to THIS course — false for a learner enrolled on a
 * non-elite plan. Reported rather than thrown so the tab renders an upsell
 * instead of an error.
 */
export interface StudentCourseLiveClassesPage
  extends StudentLiveClassesPageBase {
  hasAccess: boolean;
}
