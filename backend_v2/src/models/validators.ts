import { Plan, Quiz } from "@/types";
import { Review } from "@/types/review";

export const validateUrl = (url: string) => {
  return url.startsWith("https://") || url.startsWith("http://");
};

export const validatePlans = (plans: { elite?: Plan; essential?: Plan }) => {
  return !!(plans.elite || plans.essential);
};

export const validateAudience = (audience: string) => {
  return audience === "college-students" || audience === "professionals";
};

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
  // Accept both +91XXXXXXXXXX and XXXXXXXXXX formats
  return /^(\+91[0-9]{10}|[0-9]{10})$/.test(phone);
};

export const validateGithubUrl = (url: string) => {
  return url.startsWith("https://github.com/");
};
