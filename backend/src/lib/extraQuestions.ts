import { AppError } from "../middlewares/error.middleware";
import type { CrmExtraQuestion } from "../types/crm";

/** A lead form with more than two custom questions stops being a lead form. */
export const MAX_EXTRA_QUESTIONS = 2;

/**
 * Validates and normalises one submitted question.
 *
 * The key is derived server-side and namespaced, so a chosen label can never
 * collide with a built-in answer key such as `college` or `plan`.
 */
export const cleanQuestion = (raw: unknown): CrmExtraQuestion => {
  const q = (raw ?? {}) as Record<string, unknown>;

  const label = String(q.label ?? "").trim();
  if (label.length < 3) {
    throw new AppError("Give the question a label", 400);
  }

  const type = q.type === "select" ? "select" : "text";
  // An editor may send the options as one line per option rather than a list.
  const rawOptions = Array.isArray(q.options)
    ? q.options
    : String(q.options ?? "").split("\n");
  const options = rawOptions.map((o: unknown) => String(o ?? "").trim()).filter(Boolean);
  if (type === "select" && options.length < 2) {
    throw new AppError("A dropdown needs at least two options", 400);
  }

  const key = `extra_${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)}`;

  return {
    enabled: true,
    key,
    label: label.slice(0, 200),
    type,
    options: type === "select" ? options : [],
    required: Boolean(q.required),
  };
};

/** A whole question list, capped and with no two answers under one key. */
export const cleanQuestionList = (raw: unknown): CrmExtraQuestion[] => {
  const list = Array.isArray(raw) ? raw : [];
  if (list.length > MAX_EXTRA_QUESTIONS) {
    throw new AppError(`You can ask at most ${MAX_EXTRA_QUESTIONS} extra questions`, 400);
  }
  const questions = list.map(cleanQuestion);
  // Rejected rather than auto-suffixed, so the keys stay meaningful on the lead.
  if (new Set(questions.map((q) => q.key)).size !== questions.length) {
    throw new AppError("Two questions cannot have the same label", 400);
  }
  return questions;
};
