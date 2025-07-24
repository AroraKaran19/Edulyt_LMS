// Types - Data types for Edulyt platform
export interface NavItem {
  label: string;
  href: string;
  isDashboard?: boolean;
}

export interface Filter {
    label: string;
    value: string;
    featureBox?: {
      value: string;
    };
  }
  
 
// Re-export all types
export * from './course';
export * from './instructor';
export * from './user'; 