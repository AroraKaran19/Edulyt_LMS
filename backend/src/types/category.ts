import type { Brand } from "../constants/brands";

export interface Category {
  brand?: Brand;
  _id?: string;
  name: string;
  audience?: "college-students" | "professionals";
  description?: string;
  isActive: boolean;
  showOnCourseList?: boolean;
  showOnHomePage?: boolean;
  categoryImage?: string;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
