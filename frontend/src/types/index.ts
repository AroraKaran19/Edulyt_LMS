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

// ===================
// Type Exports
// ===================

export interface Discount {
  discount: "percentage" | "fixed";
  displayTime?: string; // Time in hh:mm:ss format when discount should be displayed
  resetAfter?: number; // Time in seconds after which discount resets
  value: number;
  isActive?: boolean;
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
