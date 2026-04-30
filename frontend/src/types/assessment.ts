export interface MCQSubmission {
  responses: {
    question: string;
    selectedAnswers: string[];
  }[];
  qualifyingScore: number;
}

export interface FileSubmission {
  uploads: {
    question: string;
    file: string;
    qualifyingScore: number;
  }[];
}

type AssessmentBase = {
  _id?: string;
  internship: string;
  batch?: string;
  assessmentPoints: number;
  duration: {
    startDate: Date;
    endDate: Date;
  };
  createdBy: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Assessment =
  | (AssessmentBase & {
      submissionType: "mcq";
      mcqQuestions: string[];
    })
  | (AssessmentBase & {
      submissionType: "file";
      fileQuestions: string[];
    });

export interface AssessmentSubmission {
  _id?: string;
  assessment: string;
  internship: string;
  batch: string;
  user: string;
  enrollment?: string;
  submissionType: "mcq" | "file";
  submission: MCQSubmission | FileSubmission;
  qualifyingScore: number;
  earnedPoints?: number;
  status?: "draft" | "submitted" | "graded";
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
