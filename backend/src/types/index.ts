// Types - Data types for Edulyt platform

export interface Discount {
    discount: "percentage" | "fixed";
    value: number;
    isActive?: boolean;
}
 
// Re-export all types
export * from './course';
export * from './instructor';
export * from './user'; 
export * from './review';