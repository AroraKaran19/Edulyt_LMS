export interface College {
  _id?: string;
  name: string;
  /** Free text, e.g. "City, State, Country" */
  location: string;
  /** Public site URL (optional). */
  website?: string;
  /** Logo or hero image URL (optional). */
  image?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
