export interface NavItem {
  label: string;
  href: string;
	featureBox?: string;
}

export interface Filter {
  label: string;
  value: string;
  featureBox?: {
    value: string;
  };
}

// Re-export all types
export * from "./course";
export * from "./instructor";