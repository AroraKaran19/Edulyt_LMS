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
  label: string;
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
