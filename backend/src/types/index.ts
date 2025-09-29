// Types - Data types for Airkrit platform

export interface Discount {
    discount: "percentage" | "fixed";
    startDate?: Date;
    endDate?: Date;
    value: number;
    isActive?: boolean;
}
 
// Re-export all types
export * from './course';
export * from './user'; 
export * from './review';
export * from './faq';
export * from './enrollment';
export * from './affiliate';
export * from './order';
