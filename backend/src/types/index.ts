// Types - Data types for Airkrit platform

// Discount for plans and other entities (uses date range)
export interface Discount {
  discount: "percentage" | "fixed";
  value: number;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

// Discount for courses (uses time range within a day)
export interface CourseDiscount {
  discount: "percentage" | "fixed";
  value: number;
  startTime?: string; // Time in HH:mm format (e.g., "12:00" for 12 AM)
  endTime?: string; // Time in HH:mm format (e.g., "23:00" for 11 PM)
  isActive: boolean;
}

// Re-export all types
export * from "./course";
export * from "./user";
export * from "./review";
export * from "./faq";
export * from "./enrollment";
export * from "./affiliate";
export * from "./order";
export * from "./qna";
export * from "./notes";
export * from "./category";
export * from "./live-classes";
export * from "./coupon";
export * from "./collaborationDomain";
export * from "./collaborationJob";
export * from "./college";
export * from "./internship";
export * from "./internship-enrollment";
export * from "./internship-question";
export * from "./internship-exam";
export * from "./internship-task";
export * from "./internship-submission";
export * from "./partner-college";
export * from "./assessment";
export * from "./internship-meet";
export * from "./question";