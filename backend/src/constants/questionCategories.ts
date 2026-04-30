/**
 * Fixed taxonomy for internship question bank (no DB-backed categories).
 * Keep in sync with `frontend/src/constants/questionCategories.ts`.
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

const SET = new Set<string>(QUESTION_CATEGORY_VALUES);

export function isValidQuestionCategory(
  v: unknown,
): v is QuestionCategoryValue {
  return typeof v === "string" && SET.has(v);
}
