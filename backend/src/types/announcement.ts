export type AnnouncementAudience = "course" | "internship" | "partner";

/**
 * Dashboard announcement. Each announcement targets a single audience —
 * `course` ones surface on the learner course dashboard, `internship` ones on
 * the learner internships dashboard, and `partner` ones on the partner portal
 * dashboard. Admins create these from Settings → Announcements.
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
