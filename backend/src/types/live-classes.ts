import { User } from "./user";
import { Course } from "./course";

export interface LiveClass {
  _id?: string;
  title: string;
  imageUrl?: string;
  description?: string;
  instructor: User["_id"] | string;
  course: Course["_id"] | string;

  startDate: Date;
  startTime: string; // Time in HH:mm format
  endDate: Date;
  endTime: string; // Time in HH:mm format

  createdAt?: Date;
  updatedAt?: Date;
}
