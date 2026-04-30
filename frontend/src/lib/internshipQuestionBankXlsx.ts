import * as XLSX from "xlsx";
import {
  QUESTION_CATEGORY_VALUES,
  type QuestionCategoryValue,
} from "@/constants/questionCategories";

/** Matches POST /api/internship-questions and bulk body items */
export type InternshipQuestionCreateBody = {
  questionText: string;
  type: "mcq" | "file_upload";
  usageType: "exam" | "task" | "both";
  score: number;
  isActive?: boolean;
  options?: { text: string; isCorrect: boolean }[];
  referenceFile?: string;
  category?: string | null;
};

export type ParsedQuestionRow =
  | { ok: true; body: InternshipQuestionCreateBody }
  | { ok: false; message: string };

const CATEGORY_SET = new Set<string>(QUESTION_CATEGORY_VALUES);

function normalizeHeaderKey(k: string): string {
  return String(k).trim().toLowerCase().replace(/[\s_-]+/g, "");
}

/** Map raw sheet row object to normalized key -> trimmed string */
function normalizeRow(
  row: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = normalizeHeaderKey(k);
    if (!key) continue;
    if (v === null || v === undefined) {
      out[key] = "";
    } else if (typeof v === "number" && !Number.isNaN(v)) {
      out[key] = String(v);
    } else {
      out[key] = String(v).trim();
    }
  }
  return out;
}

function cell(norm: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = norm[normalizeHeaderKey(k)];
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

function parseBool(raw: string, defaultTrue: boolean): boolean {
  const t = raw.trim().toLowerCase();
  if (!t) return defaultTrue;
  if (["true", "1", "yes", "y"].includes(t)) return true;
  if (["false", "0", "no", "n"].includes(t)) return false;
  return defaultTrue;
}

function resolveCategory(raw: string): QuestionCategoryValue | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (CATEGORY_SET.has(t)) return t as QuestionCategoryValue;
  const lower = t.toLowerCase();
  const found = QUESTION_CATEGORY_VALUES.find(
    (c) => c.toLowerCase() === lower,
  );
  return found;
}

/** 1-based index among filled options: Excel 1,2,3… or A,B,C… */
function parseCorrectChoice(
  raw: string,
  numOptions: number,
): { ok: true; index0: number } | { ok: false; message: string } {
  const t = raw.trim().toUpperCase();
  if (!t) {
    return { ok: false, message: "correctOption is required for MCQ" };
  }
  let idx0: number;
  if (/^[1-9][0-9]?$/.test(t)) {
    idx0 = parseInt(t, 10) - 1;
  } else if (/^[A-Z]$/.test(t)) {
    idx0 = t.charCodeAt(0) - "A".charCodeAt(0);
  } else {
    return {
      ok: false,
      message: `correctOption must be 1–${numOptions} or A–${String.fromCharCode(64 + numOptions)}`,
    };
  }
  if (idx0 < 0 || idx0 >= numOptions) {
    return {
      ok: false,
      message: `correctOption out of range (1–${numOptions})`,
    };
  }
  return { ok: true, index0: idx0 };
}

function isRowEmpty(norm: Record<string, string>): boolean {
  return Object.values(norm).every((v) => !String(v).trim());
}

export function parseInternshipQuestionRow(
  norm: Record<string, string>,
): ParsedQuestionRow {
  if (isRowEmpty(norm)) {
    return { ok: false, message: "Empty row" };
  }

  const questionText = cell(norm, "questionText", "question", "question_text");
  if (!questionText) {
    return { ok: false, message: "questionText is required" };
  }

  const typeRaw = cell(norm, "type", "questionType").toLowerCase();
  if (typeRaw !== "mcq" && typeRaw !== "file_upload") {
    return {
      ok: false,
      message: `type must be mcq or file_upload (got "${typeRaw || "empty"}")`,
    };
  }
  const type = typeRaw as "mcq" | "file_upload";

  const usageRaw = cell(norm, "usageType", "usage", "usage_type").toLowerCase();
  const usageType =
    usageRaw === "exam" || usageRaw === "task" || usageRaw === "both"
      ? usageRaw
      : usageRaw
        ? (null as "exam" | "task" | "both" | null)
        : "both";
  if (!usageType) {
    return {
      ok: false,
      message: `usageType must be exam, task, or both (got "${usageRaw}")`,
    };
  }

  const scoreRaw = cell(norm, "score", "points", "marks");
  const score = scoreRaw === "" ? NaN : Number(scoreRaw);
  if (Number.isNaN(score) || score < 0) {
    return { ok: false, message: "score must be a non-negative number" };
  }

  const categoryRaw = cell(norm, "category", "questionCategory");
  let category: string | null | undefined;
  if (categoryRaw) {
    const resolved = resolveCategory(categoryRaw);
    if (!resolved) {
      return {
        ok: false,
        message: `Invalid category "${categoryRaw}". Use a value from the Categories reference (exact match, e.g. AI&ML).`,
      };
    }
    category = resolved;
  }

  const isActive = parseBool(cell(norm, "isActive", "active"), true);

  if (type === "file_upload") {
    const referenceFile = cell(
      norm,
      "referenceFile",
      "reference",
      "reference_file",
    );
    const body: InternshipQuestionCreateBody = {
      questionText,
      type: "file_upload",
      usageType,
      score,
      isActive,
      referenceFile: referenceFile || "",
      ...(category !== undefined ? { category } : {}),
    };
    return { ok: true, body };
  }

  const optionTexts: string[] = [];
  for (let i = 1; i <= 12; i++) {
    const v = norm[`option${i}`]?.trim();
    if (v) optionTexts.push(v);
  }
  if (optionTexts.length < 2) {
    return {
      ok: false,
      message: "MCQ needs at least two non-empty option columns (option1, option2, …)",
    };
  }

  const correctRaw = cell(
    norm,
    "correctOption",
    "correct",
    "correct_answer",
    "answer",
  );
  const correct = parseCorrectChoice(correctRaw, optionTexts.length);
  if (!correct.ok) return { ok: false, message: correct.message };

  const options = optionTexts.map((text, i) => ({
    text,
    isCorrect: i === correct.index0,
  }));

  const body: InternshipQuestionCreateBody = {
    questionText,
    type: "mcq",
    usageType,
    score,
    isActive,
    options,
    ...(category !== undefined ? { category } : {}),
  };
  return { ok: true, body };
}

export type ParseInternshipQuestionWorkbookResult = {
  questions: InternshipQuestionCreateBody[];
  errors: { excelRow: number; message: string }[];
};

/**
 * Read first worksheet; row 1 = headers. Returns bodies for valid rows and per-row errors.
 */
export function parseInternshipQuestionsWorkbook(
  buffer: ArrayBuffer,
): ParseInternshipQuestionWorkbookResult {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0] || "";
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    return { questions: [], errors: [{ excelRow: 0, message: "No sheet found" }] };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: false,
  });

  const questions: InternshipQuestionCreateBody[] = [];
  const errors: { excelRow: number; message: string }[] = [];

  rows.forEach((row, i) => {
    const excelRow = i + 2;
    const norm = normalizeRow(row);
    const parsed = parseInternshipQuestionRow(norm);
    if (parsed.ok) {
      questions.push(parsed.body);
    } else if (parsed.message !== "Empty row") {
      errors.push({ excelRow, message: parsed.message });
    }
  });

  return { questions, errors };
}

export function downloadInternshipQuestionBankTemplate(): void {
  const headers = [
    "category",
    "type",
    "usageType",
    "score",
    "questionText",
    "option1",
    "option2",
    "option3",
    "option4",
    "correctOption",
    "referenceFile",
    "isActive",
  ];

  const mcqExample = [
    "Python",
    "mcq",
    "both",
    1,
    "What does len([1,2,3]) return in Python?",
    "2",
    "3",
    "4",
    "5",
    2,
    "",
    "TRUE",
  ];

  const fileExample = [
    "Excel",
    "file_upload",
    "task",
    5,
    "Upload your completed spreadsheet.",
    "",
    "",
    "",
    "",
    "",
    "",
    "TRUE",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, mcqExample, fileExample]);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 6 },
    { wch: 48 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 24 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");

  const catHeader = [["Allowed category values (copy exactly; case-sensitive — except AI&ML)"]];
  const catRows = QUESTION_CATEGORY_VALUES.map((c) => [c]);
  const wsCat = XLSX.utils.aoa_to_sheet([...catHeader, ...catRows]);
  wsCat["!cols"] = [{ wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsCat, "Categories");

  XLSX.writeFile(wb, "internship-question-bank-template.xlsx");
}
