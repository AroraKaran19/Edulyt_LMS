import { Schema, model } from 'mongoose';
import {
  User,
  UserProfile,
  UserEnrollment,
  UserEnrollmentPlan
} from '../types';

// User Enrollment Plan Schema
const userEnrollmentPlanSchema = new Schema<UserEnrollmentPlan>({
  type: {
    type: String,
    required: true,
    enum: ['professionals', 'collegeStudents']
  },
  tier: {
    type: String,
    required: true,
    enum: ['elite', 'essential']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  features: [{
    type: String,
    required: true,
    trim: true
  }],
  enrolledAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
}, { _id: false });

// User Enrollment Schema
const userEnrollmentSchema = new Schema<UserEnrollment>({
  id: {
    type: String,
    required: true
  },
  courseId: {
    type: String,
    required: true,
    ref: 'Course'
  },
  enrolledDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  progress: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'paused', 'dropped'],
    default: 'active'
  },
  currentLesson: {
    type: String,
    trim: true
  },
  currentLessonContent: {
    type: String,
    trim: true
  },
  certificateId: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0,
    default: 0 // minutes
  },
  lastAccessDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  plan: {
    type: userEnrollmentPlanSchema,
    required: true
  }
}, { _id: false });

// User Profile Schema
const userProfileSchema = new Schema<UserProfile>({
  id: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, { _id: false });

// Main User Schema
const userSchema = new Schema<User>({
  // Core user information
  id: {
    type: String,
    required: true,
    unique: true
  },
  profile: {
    type: userProfileSchema,
    required: true
  },

  // Learning data
  enrollments: {
    type: [userEnrollmentSchema],
    default: []
  },

  // Administrative
  role: {
    type: String,
    required: true,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  },

  // Verification status
  isEmailVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  isProfileComplete: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Create indexes for better query performance
userSchema.index({ 'profile.email': 1 }, { unique: true });
userSchema.index({ id: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });

// Compound indexes for common queries
userSchema.index({ role: 1, status: 1 });
userSchema.index({ 'enrollments.courseId': 1, 'enrollments.status': 1 });

// Text search index for user profiles
userSchema.index({
  'profile.firstName': 'text',
  'profile.lastName': 'text',
  'profile.email': 'text'
});

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function (next) {
  this.set('updatedAt', new Date());
  next();
});

// Pre-save middleware to hash password (you might want to add bcrypt here)
userSchema.pre('save', function (next) {
  // Note: You should hash the password here using bcrypt
  // For now, we'll just proceed
  next();
});

// Virtual for full name
userSchema.virtual('fullName').get(function(this: any) {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for active enrollments count
userSchema.virtual('activeEnrollmentsCount').get(function(this: any) {
  return this.enrollments.filter((enrollment: any) => enrollment.status === 'active').length;
});

// Virtual for completed courses count
userSchema.virtual('completedCoursesCount').get(function(this: any) {
  return this.enrollments.filter((enrollment: any) => enrollment.status === 'completed').length;
});

// Methods
userSchema.methods.enrollInCourse = function(this: any, courseId: string, plan: UserEnrollmentPlan) {
  const enrollment = {
    id: `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    courseId,
    enrolledDate: new Date(),
    progress: 0,
    status: 'active',
    timeSpent: 0,
    lastAccessDate: new Date(),
    plan
  };
  
  this.enrollments.push(enrollment);
  return this.save();
};

userSchema.methods.updateProgress = function(this: any, courseId: string, progress: number, currentLesson?: string, currentLessonContent?: string) {
  const enrollment = this.enrollments.find((e: any) => e.courseId === courseId);
  if (enrollment) {
    enrollment.progress = progress;
    enrollment.lastAccessDate = new Date();
    if (currentLesson) enrollment.currentLesson = currentLesson;
    if (currentLessonContent) enrollment.currentLessonContent = currentLessonContent;
    if (progress >= 100) {
      enrollment.status = 'completed';
      enrollment.completedDate = new Date();
    }
    return this.save();
  }
  throw new Error('Enrollment not found');
};

userSchema.methods.getActiveEnrollments = function(this: any) {
  return this.enrollments.filter((enrollment: any) => enrollment.status === 'active');
};

userSchema.methods.getCompletedEnrollments = function(this: any) {
  return this.enrollments.filter((enrollment: any) => enrollment.status === 'completed');
};

export const UserModel = model<User>('User', userSchema); 