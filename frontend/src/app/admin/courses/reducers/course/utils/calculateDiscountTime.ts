import { Course } from "@/types";

export const calculateDiscountTime = (course: Course) => {
  if (!course?.discount) return null;
  const now = new Date();
  const startDate = new Date(course?.discount?.startDate || "");
  const endDate = new Date(course?.discount?.endDate || "");
  if (startDate && endDate && endDate > now) {
    // Convert string dates to Date objects if they are strings
    const endDateObj =
      typeof endDate === "string" ? new Date(endDate) : endDate;

    const diff = endDateObj.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Ensure we don't return negative values
    return {
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, seconds),
    };
  }
  return null;
};
