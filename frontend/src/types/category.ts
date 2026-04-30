export interface Category {
  _id?: string;
  name: string;
  audience?: "college-students" | "professionals";
  description?: string;
  isActive: boolean;
  showOnHomePage?: boolean;
  showOnCourseList?: boolean;
  categoryImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
