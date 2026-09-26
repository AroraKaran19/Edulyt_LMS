export type CaTaskMineStatus = "upcoming" | "open" | "in-review" | "passed" | "failed" | "missed";

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

export interface CaTaskMineRow {
  id: string;
  title: string;
  successPoints: number;
  startFromDay: number;
  endOnDay: number;
  opensAt: string | null;
  deadline: string | null;
  status: CaTaskMineStatus;
  score: number | null;
}

export interface CaTaskAttemptQuestionAnswer {
  question: string;
  selectedOptions?: string[];
  isCorrect?: boolean;
  awardedScore?: number;
  currentFile?: string;
  learnerComment?: string;
  status?: "pending" | "approved" | "rejected";
  reviewNote?: string;
}

export interface CaTaskSnapshotOption {
  optionId: string;
  text: string;
}

export interface CaTaskSnapshotQuestion {
  questionId: string;
  questionText: string;
  type: string;
  score: number;
  options?: CaTaskSnapshotOption[];
}

export interface CaTaskAttemptView {
  task: { id: string; title: string; description: string; totalScore: number; passScore: number; successPoints: number };
  opensAt: string | null;
  deadline: string | null;
  status: CaTaskMineStatus;
  /** Always present, before and after submission. Options never carry `isCorrect`. */
  questions: CaTaskSnapshotQuestion[];
  submission: {
    submittedAt: string;
    totalAwardedScore: number;
    passed: boolean;
    status: "submitted" | "reviewed";
    mcqResponses: CaTaskAttemptQuestionAnswer[];
    fileResponses: CaTaskAttemptQuestionAnswer[];
  } | null;
}

export interface CaReviewQueueRow {
  submissionId: string;
  applicationId: string;
  applicantName: string;
  taskId: string;
  taskTitle: string;
  submittedAt: string;
  pendingQuestions: {
    questionId: string;
    questionText: string;
    currentFile: string;
    learnerComment: string;
    maxScore: number;
  }[];
}
