export type QuestionType = "mcq" | "file_upload";
export type QuestionUsage = "exam" | "task" | "both";

export type InternshipQuestionDetail = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
  /** Question category (optional). */
  categoryId?: string | null;
  referenceFile?: string;
  options?: { _id?: string; text: string; isCorrect: boolean }[];
  createdAt?: string;
  updatedAt?: string;
};
