import { Assessment, Internship, User } from ".";

export interface InternshipMeet {
  _id?: string;
  internship: Internship["_id"];

  title: string;
  description: string;
  date: Date; // Will contain time too in ist
  link: string;
  duration: {
    startDate: Date;
    endDate: Date;
  };
  recordedLink?: string;

  assessment?: Assessment["_id"];

  status: "pending" | "completed" | "cancelled" | "rescheduled";
  rescheduledReason?: string;
  rescheduledDate?: Date; // Will contain time too in ist

  createdBy: User["_id"];
  updatedBy?: User["_id"];

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InternshipMeetResponse {
  _id?: string;
  internship: Internship | Internship["_id"];

  title: string;
  description: string;
  date: Date;
  link: string;
  duration: {
    startDate: Date;
    endDate: Date;
  };
  recordedLink?: string;

  assessment?: Assessment | Assessment["_id"];

  status: "pending" | "completed" | "cancelled" | "rescheduled";
  rescheduledReason?: string;
  rescheduledDate?: Date;

  createdBy: User | User["_id"];
  updatedBy?: User | User["_id"];

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
