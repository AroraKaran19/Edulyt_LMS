export interface Category {
  _id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  showOnHomePage?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
