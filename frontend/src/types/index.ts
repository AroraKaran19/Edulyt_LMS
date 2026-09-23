export * from "./course";
export * from "./user";
export * from "./review";
export * from "./faq";
export * from "./affiliate";
export * from "./enrollment";
export * from "./affiliate";
export * from "./category";
export * from "./notes";
export * from "./qna";
export * from "./order";
export * from "./live-classes";
export * from "./certificate";
export * from "./assessment";
export * from "./internship";
export * from "./internship-question";
export * from "./internship-exam";
export * from "./internship-task";
export * from "./internship-submission";
export * from "./internship-enrollment";
export * from "./partner-college";
export * from "./home-page-settings";
export * from "./lead-import";

// ===================
// Type Exports
// ===================

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
  displayTime?: string; // Time remaining in HH:mm:ss format (e.g., "00:00:00" means expired)
  resetAfter?: number; // Reset after X seconds (0 means expired)
}

export interface NavItem {
  /** Functional key (drives dropdown logic, e.g. "courses"). */
  label: string;
  /** Optional text shown to the user; falls back to a capitalized `label`. */
  displayLabel?: string;
  href: string;
  count?: number;
  active?: boolean;
  className?: string;
}

export interface Filter {
  label: string;
  value: string;
  featureBox?: {
    value: string;
  };
}
