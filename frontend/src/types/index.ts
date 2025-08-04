// ===================
// Type Exports
// ===================

export interface Discount {
    discount: "percentage" | "fixed";
    value: number;
    isActive?: boolean;
}

// User Types
export * from "./user";

// Course Types
export * from "./course";

// Instructor Types
export * from "./instructor";

// Course Reducer (New Modular Structure)
export * from "../app/admin/courses/course-reducer/index"; 