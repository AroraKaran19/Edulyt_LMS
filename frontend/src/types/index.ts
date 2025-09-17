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
    isDashboard?: boolean;
    featureBox?: string;
    onMouseEnter?: () => void;
    active?: boolean;
}

export interface Filter {
    label: string;
    value: string;
    featureBox?: {
        value: string;
    };
}

// User Types
export * from "./user";

// Course Types
export * from "./course";

// Instructor Types
export * from "./instructor";

// Review Types
export * from "./review";

// FAQ Types
export * from "./faq";

// Course Reducer (New Modular Structure)
export * from "../app/admin/courses/reducers"; 