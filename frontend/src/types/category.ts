import type { Brand } from "@/constants/brands";

export interface Category {
  _id?: string;
  name: string;
  audience?: "college-students" | "professionals";
  brand?: Brand;
  description?: string;
  isActive: boolean;
  showOnHomePage?: boolean;
  showOnCourseList?: boolean;
  categoryImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
