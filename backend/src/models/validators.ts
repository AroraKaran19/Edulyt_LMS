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

export const validateReview = (review: Review) => {
  return review.rating >= 1 && review.rating <= 5;
};