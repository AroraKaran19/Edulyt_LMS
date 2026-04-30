/**
 * Fixed taxonomy for internship question bank (no DB-backed categories).
 * Keep in sync with `backend/src/constants/questionCategories.ts`.
 */
export const QUESTION_CATEGORY_VALUES = [
  "SAS",
  "Python",
  "Aptitude",
  "SQL",
  "AI&ML",
  "Marketing",
  "Finance",
  "Excel",
  "Power BI",
  "Tableau",
  "R",
  "Attendance",
  "Internship",
  "QOTD",
  "Scholarship",
] as const;

export type QuestionCategoryValue = (typeof QUESTION_CATEGORY_VALUES)[number];

export const QUESTION_CATEGORY_OPTIONS: {
  value: QuestionCategoryValue;
  label: string;
}[] = QUESTION_CATEGORY_VALUES.map((value) => ({ value, label: value }));
