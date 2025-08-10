// ===================
// Type Exports
// ===================

export interface Discount {
    discount: "percentage" | "fixed";
    value: number;
    isActive?: boolean;
}

export interface NavItem {
    label: string;
    href: string;
    isDashboard?: boolean;
    featureBox?: string;
    onMouseEnter?: () => void;
    active?: boolean;
}

// User Types
export * from "./user";

// Course Types
export * from "./course";

// Instructor Types
export * from "./instructor";

// Review Types
export * from "./review";

// Course Reducer (New Modular Structure)
export * from "../app/admin/courses/course-reducer/index"; 