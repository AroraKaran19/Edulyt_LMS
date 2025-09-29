import { User } from ".";

export interface Affiliate {
    _id?: string;
    code: string;
    createdBy: User;
    totalReferrals: number;
    users: User[];
    createdAt?: Date;
    updatedAt?: Date;
}