import { Plan, Quiz } from "../types";
import { Review } from "../types/review";

export const validateUrl = (url: string) => {
  return url.startsWith("https://") || url.startsWith("http://");
};

export const validatePlans = (plans: { elite?: Plan; essential?: Plan }) => {
  return !!(plans.elite || plans.essential);
};

export const validateAudience = (audience: string) => {
  return audience === "college-students" || audience === "professionals";
};

/**
 * Visible-text length of a rich-text (HTML) field, mirroring the admin course
 * form's `getTextFromHtml`. Course descriptions are authored in a WYSIWYG editor,
 * so the stored string carries markup (`<p>`, pasted `<span style="color: …">`,
 * …) that must not count toward the character limits the editor shows the
 * author — otherwise the form accepts a description and the save 500s on a
 * `maxlength` the author had no way to see.
 */
export const htmlToPlainText = (html: string): string =>
  (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .trim();

/**
 * Visible-text upper bound for a rich-text field. Only the maximum is measured
 * this way: minimums stay on the raw string, so markup-heavy but short values
 * that already exist in the database keep saving.
 */
export const richTextWithinLength = (html: string, max: number) =>
  htmlToPlainText(html).length <= max;

export const validateQuiz = (quiz: Quiz) => {
  return quiz.questions.length >= 2;
};

export const validateLinkedinUrl = (url: string) => {
  return (
    url.startsWith("https://www.linkedin.com/in/") ||
    url.startsWith("https://www.linkedin.com/in/")
  );
};

export const validateReview = (rating: number) => {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
};

export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhoneNumber = (phone: string) => {
  if (!phone || phone.trim() === "") return true; // Allow empty strings for optional fields
  const cleaned = phone.trim();
  // Accept +91 followed by 10-12 digits, or plain 10-digit Indian number
  return /^\+91[0-9]{10,12}$/.test(cleaned) || /^[0-9]{10}$/.test(cleaned);
};

export const validateGithubUrl = (url: string) => {
  return url.startsWith("https://github.com/");
};
