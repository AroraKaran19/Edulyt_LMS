import mongoose from "mongoose";

export interface CaMeetingLink {
  token: string;
  expiryMins: number;
  activatedAt?: Date | null;
  clickedBy: mongoose.Types.ObjectId[];
}

export interface CaMeetingOverride {
  applicationId: mongoose.Types.ObjectId;
  verdict: "present" | "absent";
  setBy: mongoose.Types.ObjectId;
  setAt: Date;
}

export interface CaMeeting {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  meetingLink: string;
  recordingLink: string;
  startDateTime: Date;
  endDateTime: Date | null;
  successPoints: number;
  link1: CaMeetingLink;
  link2: CaMeetingLink;
  manualOverrides: CaMeetingOverride[];
  finalizedAt: Date | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaMeetingAttendance {
  _id: mongoose.Types.ObjectId;
  meeting: mongoose.Types.ObjectId;
  application: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
