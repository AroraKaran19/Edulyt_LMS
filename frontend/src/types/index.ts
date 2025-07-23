export interface NavItem {
  label: string;
  href: string;
	featureBox?: string;
  onMouseEnter?: (navItem: NavItem) => void;
  active?: boolean;
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
export * from "./course";
export * from "./auth";
// export * from "./instructor";