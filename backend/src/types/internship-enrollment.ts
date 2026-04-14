import { Internship, User } from ".";

export interface InternshipEnrollment {
  _id?: string;
  internship: Internship["_id"];
  /** Batch snapshot (copied from internship at enrollment time, preserved if batch deleted) */
  batch?: {
    name: string;
    applicationLastDate: Date;
    examDate: Date;
    internshipStartDate: Date;
    status: "active" | "inactive" | "completed";
  };
  user: User["_id"];
  enrolledAt: Date;
  status: "active" | "completed" | "dropped" | "revoked" | "paused";
  lastUpdated?: Date;
}
