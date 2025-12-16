export interface Category {
  _id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  showOnHomePage?: boolean;
  categoryImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
