import type { IndianState } from "../constants/indianStates";

export interface College {
  _id?: string;
  name: string;
  /** Free text, e.g. "City, State, Country". Display only. */
  location: string;
  /** Filterable state, derived from `location` for pre-existing rows. */
  state?: IndianState;
  /** Public site URL (optional). */
  website?: string;
  /** Logo or hero image URL (optional). */
  image?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
