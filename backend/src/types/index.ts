// Types - Data types for Edulyt platform

export interface Discount {
    discount: "percentage" | "fixed";
    startDate?: Date;
    endDate?: Date;
    value: number;
    isActive?: boolean;
}
 
// Re-export all types
export * from './course';
export * from './instructor';
export * from './user'; 
export * from './review';
export * from './faq';
