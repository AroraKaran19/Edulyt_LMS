export type CheckpointPhase = "not-activated" | "link1-active" | "link1-closed" | "link2-active" | "closed";

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

export interface CaMeetingAttendanceRow {
  application: { id: string; name: string };
  link1Clicked: boolean;
  link2Clicked: boolean;
  verdict: "present" | "absent" | "pending";
  overridden: boolean;
}

export interface CaMeetingAttendanceResponse {
  meeting: CaMeetingAdminRow;
  rows: CaMeetingAttendanceRow[];
}

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
}
