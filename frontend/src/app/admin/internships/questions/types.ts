export type QuestionType = "mcq" | "file_upload";
export type QuestionUsage = "exam" | "task" | "both";

export type InternshipQuestionDetail = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
  /** Fixed taxonomy label from `QUESTION_CATEGORY_OPTIONS` (optional). */
  category?: string | null;
  referenceFile?: string;
  options?: { _id?: string; text: string; isCorrect: boolean }[];
  createdAt?: string;
  updatedAt?: string;
};
