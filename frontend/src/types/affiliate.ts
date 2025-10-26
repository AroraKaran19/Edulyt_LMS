import { User } from "./user";

export interface Affiliate {
  _id?: string;

  code: string;
  createdBy: User | string;

  totalReferrals: number;

  users: User[] | string[];

  createdAt?: Date;
  updatedAt?: Date;
}
