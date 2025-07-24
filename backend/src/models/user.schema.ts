import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { 
  UserProfile, 
  SocialProfile, 
  UserLearningStats,
  UserEnrollment, 
  UserGoal, 
  UserAchievement, 
  UserNotification, 
  UserActivity, 
  ScholarshipApplication, 
  InternshipApplication 
} from '../types/user';

// ===================
// Sub-schema definitions
// ===================

const AddressSchema = new Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String
}, { _id: false });

const UserVideoNoteSchema = new Schema({
  contentId: { type: String, required: true },
  note: { type: String, required: true },
  timestamp: { type: Number, required: true },
  isPrivate: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const DocumentSchema = new Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

// ===================
// Main User Interface
// ===================

export interface IUser extends Document {
  _id: string;
  profile: UserProfile;
  socialProfiles?: SocialProfile[];
  enrollments: UserEnrollment[];
  learningStats: UserLearningStats;
  goals: UserGoal[];
  achievements: UserAchievement[];
  notifications: UserNotification[];
  activities: UserActivity[];
  scholarshipApplications: ScholarshipApplication[];
  internshipApplications: InternshipApplication[];
  role: 'student' | 'instructor' | 'admin' | 'moderator' | 'third-party';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'banned';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
  isInstructor?: boolean;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'friends';
      showProgress: boolean;
      showAchievements: boolean;
    };
    learning: {
      autoplay: boolean;
      playbackSpeed: number;
      subtitles: boolean;
      quality: 'auto' | '1080p' | '720p' | '480p' | '360p';
    };
  };
  analytics?: {
    totalLoginDays: number;
    averageSessionTime: number;
    deviceTypes: string[];
    referralSource?: string;
    lastActiveDevice?: string;
    geolocation?: {
      country: string;
      city: string;
    };
  };
  
  // Virtual properties
  fullName: string;
  email: string;
  name: string;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  toPublicJSON(): Partial<IUser>;
}

// ===================
// Main User Schema
// ===================

const UserSchema = new Schema<IUser>({
  profile: {
    _id: { type: String, required: true },
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: { 
      type: String, 
      required: true, 
      minlength: 6,
      select: false 
    },
    phone: { 
      type: String,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    profileImage: String,
    bio: { type: String, maxlength: 500 },
    address: AddressSchema,
    occupation: String,
    organization: String,
    experience: String,
    linkedinUrl: String,
    githubUrl: String,
    portfolioUrl: String,
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    emailNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  },
  socialProfiles: [{
    provider: {
      type: String,
      enum: ['google', 'linkedin'],
      required: true
    },
    providerId: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    picture: String,
    connectedAt: { type: Date, default: Date.now }
  }],
  enrollments: [{
    courseId: { type: String, required: true },
    enrolledDate: { type: Date, default: Date.now },
    completedDate: Date,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'expired'],
      default: 'active'
    },
    currentModule: String,
    currentLesson: String,
    currentLessonContent: String,
    lastWatchedTimestamp: Number,
    completedModules: [String],
    completedLessons: [String],
    completedLessonContent: [String],
    timeSpent: { type: Number, default: 0 },
    lastAccessDate: { type: Date, default: Date.now },
    totalVideoWatched: { type: Number, default: 0 },
    plan: {
      tier: {
        type: String,
        enum: ['elite', 'essential'],
        required: true
      },
      price: { type: Number, required: true },
      enrolledAt: { type: Date, default: Date.now },
      expiresAt: Date,
      paymentId: String,
      discountApplied: {
        code: String,
        amount: Number,
        type: {
          type: String,
          enum: ['percentage', 'fixed']
        }
      }
    },
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    reviewDate: Date,
    certificateId: String,
    certificateIssuedAt: Date,
    certificateUrl: String,
    notes: [UserVideoNoteSchema]
  }],
  learningStats: {
    totalTimeSpent: { type: Number, default: 0 },
    coursesCompleted: { type: Number, default: 0 },
    coursesInProgress: { type: Number, default: 0 },
    certificatesEarned: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    streak: {
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActivityDate: Date,
      totalActiveDays: { type: Number, default: 0 }
    },
    weeklyGoal: Number,
    dailyGoal: Number
  },
  goals: [{
    type: {
      type: String,
      enum: ['daily_time', 'weekly_time', 'monthly_courses', 'streak', 'custom'],
      required: true
    },
    title: { type: String, required: true },
    description: String,
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'courses', 'days', 'lessons'],
      required: true
    },
    deadline: Date,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
  }],
  achievements: [{
    type: {
      type: String,
      enum: ['first_course', 'streak_7', 'streak_30', 'fast_learner', 'course_master', 'review_writer'],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    iconUrl: String,
    unlockedAt: { type: Date, default: Date.now },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common'
    }
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['course_update', 'new_course', 'certificate', 'reminder', 'announcement', 'promotion'],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actionUrl: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    metadata: {
      courseId: String,
      enrollmentId: String
    }
  }],
  activities: [{
    type: {
      type: String,
      enum: ['course_enrolled', 'lesson_completed', 'quiz_passed', 'certificate_earned', 'course_completed', 'note_added', 'bookmark_added'],
      required: true
    },
    description: { type: String, required: true },
    courseId: String,
    moduleId: String,
    lessonId: String,
    metadata: {
      score: Number,
      timeSpent: Number
    },
    createdAt: { type: Date, default: Date.now }
  }],
  scholarshipApplications: [{
    courseId: { type: String, required: true },
    applicationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'waitlisted'],
      default: 'pending'
    },
    documents: [DocumentSchema],
    essay: String,
    reviewNotes: String,
    reviewedAt: Date,
    reviewedBy: String,
    notificationSent: { type: Boolean, default: false }
  }],
  internshipApplications: [{
    internshipId: { type: String, required: true },
    applicationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'interview_scheduled', 'completed'],
      default: 'pending'
    },
    resume: String,
    coverLetter: String,
    portfolio: String,
    documents: [DocumentSchema],
    interviewDate: Date,
    interviewNotes: String,
    reviewedAt: Date,
    reviewedBy: String
  }],
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin', 'moderator', 'third-party'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification', 'banned'],
    default: 'active'
  },
  lastLoginAt: Date,
  lastActiveAt: Date,
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isProfileComplete: { type: Boolean, default: false },
  isInstructor: { type: Boolean, default: false },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public'
      },
      showProgress: { type: Boolean, default: true },
      showAchievements: { type: Boolean, default: true }
    },
    learning: {
      autoplay: { type: Boolean, default: true },
      playbackSpeed: { type: Number, default: 1.0 },
      subtitles: { type: Boolean, default: false },
      quality: {
        type: String,
        enum: ['auto', '1080p', '720p', '480p', '360p'],
        default: 'auto'
      }
    }
  },
  analytics: {
    totalLoginDays: { type: Number, default: 0 },
    averageSessionTime: { type: Number, default: 0 },
    deviceTypes: [String],
    referralSource: String,
    lastActiveDevice: String,
    geolocation: {
      country: String,
      city: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===================
// Indexes
// ===================

UserSchema.index({ 'profile.email': 1 });
UserSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isEmailVerified: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastActiveAt: -1 });
UserSchema.index({ 'socialProfiles.providerId': 1 });
UserSchema.index({ 'enrollments.courseId': 1 });
UserSchema.index({ 'scholarshipApplications.courseId': 1 });
UserSchema.index({ 'internshipApplications.internshipId': 1 });

// ===================
// Virtuals
// ===================

UserSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

UserSchema.virtual('email').get(function(this: IUser) {
  return this.profile.email;
});

UserSchema.virtual('name').get(function(this: IUser) {
  return this.fullName;
});

// ===================
// Pre-save Middleware
// ===================

UserSchema.pre('save', async function(this: IUser, next) {
  // Hash password if modified
  if (this.isModified('profile.password') && this.profile.password) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.profile.password = await bcrypt.hash(this.profile.password, salt);
    } catch (error: any) {
      return next(error);
    }
  }

  // Update profile completion status
  this.isProfileComplete = !!(
    this.profile.firstName &&
    this.profile.lastName &&
    this.profile.email &&
    this.profile.dateOfBirth &&
    this.profile.phone
  );

  // Update last active time
  this.lastActiveAt = new Date();

  next();
});

// ===================
// Methods
// ===================

UserSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.profile.password) return false;
  return bcrypt.compare(candidatePassword, this.profile.password);
};

UserSchema.methods.generateEmailVerificationToken = function(this: IUser): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  // Note: You might want to add these fields to the schema if needed
  // this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  // this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return token;
};

UserSchema.methods.generatePasswordResetToken = function(this: IUser): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  // Note: You might want to add these fields to the schema if needed
  // this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  // this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  
  return token;
};

UserSchema.methods.toPublicJSON = function(this: IUser): Partial<IUser> {
  return {
    _id: this._id,
    profile: {
      _id: this.profile._id,
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      email: this.profile.email,
      profileImage: this.profile.profileImage,
      bio: this.profile.bio,
      occupation: this.profile.occupation,
      organization: this.profile.organization
    } as any,
    role: this.role,
    status: this.status,
    isEmailVerified: this.isEmailVerified,
    isProfileComplete: this.isProfileComplete,
    learningStats: this.learningStats,
    achievements: this.achievements,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// ===================
// Static Methods
// ===================

UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ 'profile.email': email.toLowerCase() });
};

UserSchema.statics.findByEmailOrUsername = function(identifier: string) {
  return this.findOne({
    'profile.email': identifier.toLowerCase()
  });
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);
export default UserModel; 