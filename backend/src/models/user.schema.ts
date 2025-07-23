import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email: string;
  password?: string; // Optional for OAuth users
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  profileImage?: string;
  role: 'student' | 'instructor' | 'admin' | 'superadmin';
  isActive: boolean;
  isEmailVerified: boolean;
  
  // OAuth fields
  providers: {
    google?: {
      id: string;
      email: string;
      verified: boolean;
    };
    github?: {
      id: string;
      username: string;
      email: string;
    };
    linkedin?: {
      id: string;
      email: string;
    };
  };
  
  // Profile information
  profile: {
    bio?: string;
    dateOfBirth?: Date;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
      website?: string;
    };
  };
  
  // Learning/Teaching data
  enrolledCourses: string[]; // Course IDs
  createdCourses: string[]; // Course IDs for instructors
  completedCourses: string[]; // Course IDs
  certificates: string[]; // Certificate IDs
  
  // Account management
  lastLoginAt?: Date;
  loginCount: number;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  refreshTokens: string[]; // For JWT refresh token rotation
  
  // Preferences
  preferences: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    marketingEmails: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // For soft delete
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  toPublicJSON(): Partial<IUser>;
}

const UserSchema = new Schema<IUser>({
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
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  avatar: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin', 'superadmin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // OAuth providers
  providers: {
    google: {
      id: String,
      email: String,
      verified: { type: Boolean, default: false }
    },
    github: {
      id: String,
      username: String,
      email: String
    },
    linkedin: {
      id: String,
      email: String
    }
  },
  
  // Profile information
  profile: {
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    dateOfBirth: Date,
    phone: {
      type: String,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String,
      website: String
    }
  },
  
  // Learning/Teaching data
  enrolledCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  createdCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  completedCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  certificates: [{
    type: Schema.Types.ObjectId,
    ref: 'Certificate'
  }],
  
  // Account management
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  refreshTokens: [String],
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'providers.google.id': 1 });
UserSchema.index({ 'providers.github.id': 1 });
UserSchema.index({ 'providers.linkedin.id': 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function(this: IUser) {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.name;
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(this: IUser, next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate email verification token
UserSchema.methods.generateEmailVerificationToken = function(this: IUser): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Method to generate password reset token
UserSchema.methods.generatePasswordResetToken = function(this: IUser): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return token;
};

// Method to return public user data (without sensitive information)
UserSchema.methods.toPublicJSON = function(this: IUser): Partial<IUser> {
  return {
    _id: this._id,
    email: this.email,
    name: this.name,
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username,
    avatar: this.avatar,
    profileImage: this.profileImage,
    role: this.role,
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,
    profile: this.profile,
    enrolledCourses: this.enrolledCourses,
    completedCourses: this.completedCourses,
    certificates: this.certificates,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to find user by email or username
UserSchema.statics.findByEmailOrUsername = function(identifier: string) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  });
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);
export default UserModel; 