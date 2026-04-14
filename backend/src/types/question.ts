import { User } from ".";

export interface MCQQuestion {
  _id?: string;
  question: string;
  answers: string[];

  correctAnswers: string[];

  addedBy: User["_id"];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileQuestion {
  _id?: string;
  question: string;
  file?: string; // Uploaded by admin if any

  addedBy: User["_id"];

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MCQQuestionResponse {
  _id?: string;
  question: string;

  answers: string[];
  correctAnswers: string[];

  addedBy: User | User["_id"];

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileQuestionResponse {
  _id?: string;
	
  question: string;
  file?: string;
  addedBy: User | User["_id"];

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
