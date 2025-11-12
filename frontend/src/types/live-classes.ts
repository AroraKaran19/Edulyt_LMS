import { User } from "./user";
import { Course } from "./course";

export interface LiveClass {
  _id?: string;
  title: string;
  imageUrl?: string;
  description?: string;
  instructor: User["_id"] | string | User;
  course: Course["_id"] | string | Course;
  startDate: Date | string;
  startTime: string; // Time in HH:mm format
  endDate: Date | string;
  endTime: string; // Time in HH:mm format
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface LiveClassResponse {
  liveClasses: LiveClass[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateLiveClassData {
  title: string;
  imageUrl?: string;
  description?: string;
  course: string;
  instructor?: string; // Optional - required for admins, auto-assigned for instructors
  startDate: Date | string;
  startTime: string; // Time in HH:mm format
  endDate: Date | string;
  endTime: string; // Time in HH:mm format
}

export interface UpdateLiveClassData extends Partial<CreateLiveClassData> {
  _id: string;
}

