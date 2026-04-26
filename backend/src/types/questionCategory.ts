import { User } from ".";

export interface QuestionCategory {
  _id?: string;
  name: string;
  isActive: boolean;
  createdBy: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}
