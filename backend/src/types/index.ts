// Types - Data types for Airkrit platform

export interface Discount {
  discount: "percentage" | "fixed";
  displayTime?: string; // Time in hh:mm:ss format when discount should be displayed
  resetAfter?: number; // Time in seconds after which discount resets
  value: number;
  isActive?: boolean;
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
