import type { Brand } from "@/constants/brands";

/**
 * Course live classes.
 *
 * Same mechanics as internship live meetings, scoped to a course: attendance is
 * recorded via two admin-activated links. A learner is **present** only if they
 * open both inside their respective windows; anything less is **absent**, and
 * verdicts stay `pending` until both windows close. An admin can force either
 * verdict, which always beats the computed one.
 */

export type LiveClassPhase =
  | "not-activated"
  | "link1-active"
  | "link1-closed"
  | "link2-active"
  | "closed";

export type LiveClassVerdict = "present" | "absent" | "pending";

/** Populated course/instructor ref, flattened to what the UI renders. */
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

export interface LiveClassLinkView {
  expiryMins: number;
  /** ISO string, or null while the link has not been opened yet. */
  activatedAt: string | null;
  clickedCount: number;
  /** Full attendance URL the admin shares in the class. Admin view only. */
  url: string;
}

/** Admin / instructor view — includes the attendance URLs. */
export interface LiveClass {
  _id: string;
  brand?: Brand;
  title: string;
  description: string;
  imageUrl: string;
  course: LiveClassRefSummary | null;
  instructor: LiveClassRefSummary | null;
  /** Zoom / Meet / etc. URL shared with students. */
  meetingLink: string;
  /** "" when no recording has been attached yet. */
  recordingLink: string;
  /** Single ISO timestamp — replaces the old startDate + startTime pair. */
  startDateTime: string;
  endDateTime: string;
  link1: LiveClassLinkView;
  link2: LiveClassLinkView;
  phase: LiveClassPhase;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiveClassResponse {
  liveClasses: LiveClass[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateLiveClassData {
  course: string;
  title: string;
  description?: string;
  imageUrl?: string;
  /** Admin-only, and optional — a course may have no instructor assigned. */
  instructor?: string;
  meetingLink: string;
  recordingLink?: string;
  /** ISO string. */
  startDateTime: string;
  endDateTime: string;
  link1ExpiryMins: number;
  link2ExpiryMins: number;
}

export type UpdateLiveClassData = Partial<CreateLiveClassData>;

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface LiveClassAttendanceRow {
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  enrollmentId: string;
  link1Clicked: boolean;
  link2Clicked: boolean;
  /** Effective verdict, after applying any admin override. */
  verdict: LiveClassVerdict;
  /** True when an admin override is forcing this verdict (vs. computed). */
  overridden: boolean;
}

export interface LiveClassAttendanceResponse {
  liveClass: LiveClass;
  rows: LiveClassAttendanceRow[];
}

/** Body for the admin attendance-override request. `clear` removes any override. */
export interface SetLiveClassAttendanceOverrideBody {
  userId: string;
  verdict: "present" | "absent" | "clear";
}

// ─── Student view ─────────────────────────────────────────────────────────────

/** Student-safe projection — no tokens, no attendance URLs. */
export interface StudentLiveClassItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  course: LiveClassRefSummary | null;
  instructor: LiveClassRefSummary | null;
  meetingLink: string;
  recordingLink: string;
  startDateTime: string;
  endDateTime: string;
  phase: LiveClassPhase;
  /** Whether *this* learner opened each link inside its window. */
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
   * False when the learner holds no elite-plan enrollment at all — the UI says
   * "not part of your plan" rather than the misleading "no live classes".
   */
  hasEliteAccess: boolean;
}

/**
 * Per-course feed for the course player's "Live Classes" tab. `hasAccess` is
 * the same idea scoped to THIS course, so the tab renders an upsell rather
 * than an error.
 */
export interface StudentCourseLiveClassesPage
  extends StudentLiveClassesPageBase {
  hasAccess: boolean;
}

export interface LiveClassAttendResult {
  ok: true;
  slot: 1 | 2;
  alreadyMarked: boolean;
  liveClassTitle: string;
}
