import { Schema, model } from 'mongoose';
import { Instructor } from '../types';

const instructorSchema = new Schema<Instructor>({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  totalStudents: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalCourses: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  bio: {
    type: String,
    required: true,
    trim: true
  },
  currentPosition: {
    type: String,
    trim: true
  },
  previousExperience: [{
    type: String,
    trim: true
  }],
  education: [{
    type: String,
    trim: true
  }],
  linkedinUrl: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'instructors'
});

// Create indexes
// Note: id index is automatically created because it has unique: true
instructorSchema.index({ name: 1 });
instructorSchema.index({ rating: -1 });

export const InstructorModel = model<Instructor>('Instructor', instructorSchema); 