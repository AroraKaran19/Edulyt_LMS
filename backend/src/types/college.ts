export interface College {
  _id?: string;
  name: string;
  /** Free text, e.g. "City, State, Country" */
  location: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
