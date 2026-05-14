/**
 * Live meeting (Zoom/Meet/etc.) for a single internship batch. Attendance is
 * recorded via two admin-controlled checkpoint links (link1, link2). Student
 * is **present** only if both clicked within their respective windows.
 *
 * Click tracking lives embedded on the meeting doc (clickedCount). Only
 * absent students get a persisted `LiveMeetingAttendance` row (storage
 * optimized — present students leave no trace).
 */

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
  startDateTime: string;
  endDateTime: string | null;
  link1: {
    expiryMins: number;
    activatedAt: string | null;
    clickedCount: number;
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

export interface CreateLiveMeetingBody {
  internshipId: string;
  batchId: string;
  name: string;
  description?: string;
  meetingLink: string;
  startDateTime: string;
  endDateTime?: string;
  link1ExpiryMins: number;
  link2ExpiryMins: number;
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
  link1Clicked: boolean;
  link2Clicked: boolean;
  verdict: "present" | "absent" | "pending";
}

export interface AdminLiveMeetingAttendanceResponse {
  meeting: AdminLiveMeetingListItem;
  rows: AdminLiveMeetingAttendanceRow[];
}

export type StudentAttendResult =
  | { ok: true; slot: 1 | 2; alreadyMarked: boolean; meetingName: string }
  | { ok: false; reason: "expired" | "not-activated" | "not-enrolled" | "invalid" };

/**
 * Student-safe view of a live meeting on the dashboard — no admin tokens,
 * just what the learner needs to see and join.
 */
export interface StudentLiveMeetingItem {
  _id: string;
  name: string;
  description: string;
  meetingLink: string;
  startDateTime: string;
  endDateTime: string | null;
  phase: LiveMeetingPhase;
  link1Clicked: boolean;
  link2Clicked: boolean;
}
