export interface Category {
  _id?: string;
  name: string;
  audience?: "college-students" | "professionals";
  description?: string;
  isActive: boolean;
  showOnHomePage?: boolean;
  categoryImage?: string;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
