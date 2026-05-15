export type AnnouncementAudience = "student" | "partner";

/**
 * Dashboard announcement. Each announcement targets a single audience —
 * `student` ones surface on the learner dashboard, `partner` ones on the
 * partner portal dashboard. Admins create these from Settings → Announcements.
 */
export interface Announcement {
  _id?: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  /** Admin who created it (optional — kept for audit). */
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
