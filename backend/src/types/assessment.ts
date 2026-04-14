import {
  FileQuestion,
  FileQuestionResponse,
  Internship,
  InternshipEnrollment,
  InternshipResponse,
  MCQQuestion,
  MCQQuestionResponse,
  User,
} from ".";

export interface MCQSubmission {
  responses: {
    question: MCQQuestion["_id"];
    selectedAnswers: string[];
  }[];
  qualifyingScore: number;
}

export interface FileSubmission {
  uploads: {
    question: FileQuestion["_id"];
    file: string;
    qualifyingScore: number;
  }[];
}

type AssessmentBase = {
  _id?: string;
  internship: Internship["_id"];
  batch?: {
    name: string;
    applicationLastDate: Date;
    examDate: Date;
    internshipStartDate: Date;
    status: "active" | "inactive" | "completed";
  };
  assessmentPoints: number;
  duration: {
    startDate: Date;
    endDate: Date;
  };
  createdBy: User["_id"];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Assessment =
  | (AssessmentBase & {
      submissionType: "mcq";
      mcqQuestions: MCQQuestion["_id"][];
    })
  | (AssessmentBase & {
      submissionType: "file";
      fileQuestions: FileQuestion["_id"][];
    });

type AssessmentResponseBase = {
  _id?: string;
  internship: InternshipResponse | Internship["_id"];
  /** Batch data (embedded snapshot, preserved even if batch deleted from internship) */
  batch?: {
    name: string;
    applicationLastDate: Date;
    examDate: Date;
    internshipStartDate: Date;
    status: "active" | "inactive" | "completed";
  };
  assessmentPoints: number;
  duration: {
    startDate: Date;
    endDate: Date;
  };
  createdBy: User | User["_id"];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AssessmentResponse =
  | (AssessmentResponseBase & {
      submissionType: "mcq";
      mcqQuestions: (MCQQuestionResponse | MCQQuestion["_id"])[];
    })
  | (AssessmentResponseBase & {
      submissionType: "file";
      fileQuestions: (FileQuestionResponse | FileQuestion["_id"])[];
    });

export interface AssessmentSubmission {
  _id?: string;
  assessment: Assessment["_id"];
  internship: Internship["_id"];
  /** Batch snapshot (copied from internship at submission time) */
  batch?: {
    name: string;
    applicationLastDate: Date;
    examDate: Date;
    internshipStartDate: Date;
    status: "active" | "inactive" | "completed";
  };
  user: User["_id"];
  enrollment?: InternshipEnrollment["_id"];
  submissionType: "mcq" | "file";
  submission: MCQSubmission | FileSubmission;
  qualifyingScore: number;
  earnedPoints?: number;
  status?: "draft" | "submitted" | "graded";
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssessmentSubmissionResponse {
  _id?: string;
  assessment: AssessmentResponse | Assessment["_id"];
  internship: InternshipResponse | Internship["_id"];
  /** Batch snapshot (copied from internship, preserved even if batch deleted) */
  batch?: {
    name: string;
    applicationLastDate: Date;
    examDate: Date;
    internshipStartDate: Date;
    status: "active" | "inactive" | "completed";
  };
  user: User | User["_id"];
  enrollment?: InternshipEnrollment | InternshipEnrollment["_id"];
  submissionType: "mcq" | "file";
  submission: MCQSubmission | FileSubmission;
  qualifyingScore: number;
  earnedPoints?: number;
  status?: "draft" | "submitted" | "graded";
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
