import mongoose from "mongoose";
import { User } from "../types"; // Assuming User type is defined in types file
import {
  validateEmail,
  validateLinkedinUrl,
  validateGithubUrl,
  validatePhoneNumber,
} from "./validators";

// ===================
// Marks Sub-Schema
// ===================

const marksSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: [0, "Score must be positive"],
      max: [100, "Score cannot exceed 100 for percentage or 10 for CGPA"], // Note: Validation can be enhanced in custom validator if needed
    },
    unit: {
      type: String,
      required: true,
      enum: ["percentage", "cgpa"],
    },
  },
  { _id: false }
);

// ===================
// Pursuing Marks Sub-Schema (for table-like structure per semester/year)
// ===================

const pursuingMarksSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50, // e.g., "Semester 1", "Year 1"
    },
    score: {
      type: Number,
      required: true,
      min: [0, "Score must be positive"],
      max: [100, "Score cannot exceed 100 for percentage or 10 for CGPA"],
    },
    unit: {
      type: String,
      required: true,
      enum: ["percentage", "cgpa"],
    },
  },
  { timestamps: true, _id: false }
);

// ===================
// Social Profiles Sub-Schema
// ===================

const socialProfilesSchema = new mongoose.Schema(
  {
    linkedin: {
      type: String,
      required: false,
      default: "",
      validate: {
        validator: validateLinkedinUrl,
        message: "LinkedIn must be a valid URL or empty",
      },
    },
    github: {
      type: String,
      required: false,
      default: "",
      validate: {
        validator: validateGithubUrl,
        message: "GitHub must be a valid URL or empty",
      },
    },
    // Can extend with more profiles like twitter, etc., for scalability
  },
  { _id: false }
);

// ===================
// User Schema
// ===================

const userSchema = new mongoose.Schema<User>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Full name must be at least 3 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validateEmail,
        message: "Email must be a valid email address",
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: validatePhoneNumber,
        message: "Phone number must be valid",
      },
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: [
        "Student",
        "Graduate",
        "Post Graduate",
        "Fresher",
        "0 - 2 Years",
        "2 - 5 Years",
        "5 - 10 Years",
      ],
    },
    universityName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    collegeName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    collegeState: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: "India",
    },
    currentDegree: {
      type: String,
      required: false,
      enum: ["graduation", "postgraduation", ""],
      default: "",
    },
    currentCourse: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    socialProfiles: {
      type: socialProfilesSchema,
      required: true,
      default: {},
    },
    placementCellEmail: {
      type: String,
      required: false,
      default: "",
      validate: {
        validator: validateEmail,
        message: "Placement cell email must be a valid email address or empty",
      },
    },
    guardianPhone: {
      type: String,
      required: false,
      default: "",
      trim: true,
      validate: {
        validator: validatePhoneNumber,
        message: "Guardian phone number must be valid or empty",
      },
    },
    isGuardianPhoneVerified: {
      type: Boolean,
      default: false,
      required: false,
    },
    tenthMarks: {
      type: marksSchema,
      required: false,
      default: null,
    },
    twelfthMarks: {
      type: marksSchema,
      required: false,
      default: null,
    },
    pursuingMarks: {
      type: [pursuingMarksSchema],
      required: false,
      default: [],
    },
    enrolledCourses: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Course",
      required: false,
      default: [],
    },
    referral: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    // Additional fields can be added here for scalability, e.g., profileImage, preferences, etc.
  },
  { timestamps: true }
);

// Indexes for scalability and query performance
userSchema.index({ username: 1 }); // Unique already, but explicit for queries
userSchema.index({ email: 1 }); // Unique already
userSchema.index({ phone: 1 }); // For lookups by phone
userSchema.index({ experienceLevel: 1 }); // For filtering by experience
userSchema.index({ country: 1 }); // For geographic filtering
userSchema.index({ collegeState: 1 }); // For state-based queries
userSchema.index({ enrolledCourses: 1 }); // For users with specific courses (multi-key index)
userSchema.index({ isActive: 1 }); // For active users
userSchema.index({ createdAt: -1 }); // Sorting by creation date descending
userSchema.index({ updatedAt: -1 }); // Sorting by update date descending

// Pre-save hook (similar to other schemas)
userSchema.pre("save", function (next) {
  this.set("updatedAt", new Date());
  next();
});

export default mongoose.model<User>("User", userSchema);
