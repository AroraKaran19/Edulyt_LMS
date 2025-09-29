import { User } from "./user";

export interface Affiliate {
  _id?: string;

  code: string;
  createdBy: User["_id"];

  totalReferrals: number;

  users: User["_id"][];

  createdAt?: Date;
  updatedAt?: Date;
}
