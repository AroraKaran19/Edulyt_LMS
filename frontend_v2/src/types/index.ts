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

// ===================
// Type Exports
// ===================

export interface Discount {
  discount: "percentage" | "fixed";
  startDate?: Date;
  endDate?: Date;
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
