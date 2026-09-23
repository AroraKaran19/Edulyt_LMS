import mongoose from "mongoose";

export interface CaTask {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  questions: mongoose.Types.ObjectId[];
  totalScore: number;
  passScore: number;
  successPoints: number;
  startFromDay: number;
  endOnDay: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaTaskAdminRow {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  totalScore: number;
  passScore: number;
  successPoints: number;
  startFromDay: number;
  endOnDay: number;
  isActive: boolean;
  updatedAt: string;
}

export interface CaTaskAdminDetail extends CaTaskAdminRow {
  questions: { id: string; questionText: string; type: string; score: number; category: string | null }[];
  createdAt: string;
}

export type UpsertCaTaskBody = {
  title: string;
  description?: string;
  questionIds: string[];
  passScore?: number;
  successPoints?: number;
  startFromDay: number;
  endOnDay: number;
  isActive?: boolean;
};

export interface CaTaskSnapshotOption {
  optionId: string;
  text: string;
  isCorrect: boolean;
}

export interface CaTaskSnapshotQuestion {
  questionId: string;
  questionText: string;
  type: "mcq" | "file_upload";
  score: number;
  options?: CaTaskSnapshotOption[];
}

export interface CaTaskSnapshot {
  taskId: string;
  title: string;
  description: string;
  questions: CaTaskSnapshotQuestion[];
  totalScore: number;
  passScore: number;
  successPoints: number;
  snapshotAt: Date;
}

/** What the CA-facing attempt view returns for a question: never carries `isCorrect`. */
export interface CaTaskAttemptOption {
  optionId: string;
  text: string;
}

export interface CaTaskAttemptQuestion {
  questionId: string;
  questionText: string;
  type: "mcq" | "file_upload";
  score: number;
  options?: CaTaskAttemptOption[];
}

export interface CaTaskMcqResponse {
  question: string;
  selectedOptions: string[];
  isCorrect: boolean;
  awardedScore: number;
}

export interface CaTaskFileResponse {
  question: string;
  currentFile: string;
  learnerComment: string;
  uploadHistory: { file: string; uploadedAt: Date }[];
  status: "pending" | "approved" | "rejected";
  awardedScore: number;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  reviewNote?: string;
}

export interface CaTaskSubmission {
  _id: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  templateSnapshot: CaTaskSnapshot;
  mcqResponses: CaTaskMcqResponse[];
  fileResponses: CaTaskFileResponse[];
  totalAwardedScore: number;
  pendingReview: boolean;
  status: "submitted" | "reviewed";
  passed: boolean;
  pointsAwardedAt: Date | null;
  submittedAt: Date;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CaTaskMineStatus = "upcoming" | "open" | "in-review" | "passed" | "failed" | "missed";
