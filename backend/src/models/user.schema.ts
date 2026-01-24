import mongoose from "mongoose";
import { User, Instructor, Student, Collaborator } from "../types";
import { validateEmail, validatePhoneNumber } from "./validators";
import bcrypt from "bcryptjs";

const googleSchema = new mongoose.Schema(
  {
    id: { type: String, required: false },
    name: { type: String, required: false },
    email: { type: String, required: false },
    image: { type: String, required: false },
    email_verified: { type: Boolean, required: false },
  },
  { _id: false }
);

const linkedinSchema = new mongoose.Schema(
  {
    sub: { type: String, required: false },
    name: { type: String, required: false },
    given_name: { type: String, required: false },
    family_name: { type: String, required: false },
    image: { type: String, required: false },
    locale: { type: String, required: false },
    providerAccountId: { type: String, required: false },
    email: { type: String, required: false },
    email_verified: { type: Boolean, required: false },
    id_token: { type: String, required: false },
    accessToken: { type: String, required: false },
  },
  { _id: false }
);

const socialProfilesSchema = new mongoose.Schema(
  {
    google: { type: googleSchema, required: false },
    linkedin: { type: linkedinSchema, required: false },
    github: { type: String, required: false },
    instagram: { type: String, required: false },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    address: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    country: { type: String, required: false },
    pincode: { type: String, required: false },
  },
  { _id: false }
);

const previousExperienceDurationSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  { _id: false }
);

const previousExperienceSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    position: { type: String, required: true },
    duration: { type: previousExperienceDurationSchema, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema<User>(
  {
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    profilePicture: { type: String, required: false },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: validateEmail,
    },
    phone: {
      type: String,
      required: false,
      validate: validatePhoneNumber,
    },
    whatsappNumber: {
      type: String,
      required: false,
      validate: validatePhoneNumber,
    },
    password: { type: String, required: true, select: false },
    userType: {
      type: String,
      required: true,
      enum: ["student", "instructor", "collaborator", "admin", "super-admin"],
      default: "student",
    },
    provider: {
      type: String,
      enum: ["credentials", "google", "linkedin"],
      default: "credentials",
      required: true,
    },
    address: {
      type: addressSchema,
      required: false,
    },
    accounts: {
      type: socialProfilesSchema,
      required: true,
      default: {},
    },
    dob: { type: Date, required: false },
    permissions: {
      type: [String],
      required: true,
      default: [],
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        deviceInfo: {
          userAgent: { type: String, required: false },
          ipAddress: { type: String, required: false },
          deviceType: { type: String, required: false },
        },
        createdAt: { type: Date, default: Date.now },
        lastUsed: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
        expiresAt: {
          type: Date,
          default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          required: true,
        },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    discriminatorKey: "userType",
    timestamps: true,
  }
);

// Add middleware to update the updatedAt field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add middleware to update the updatedAt field before updating
userSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Add middleware to update the updatedAt field before updating
userSchema.pre("updateOne", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Add middleware to update the updatedAt field before updating
userSchema.pre("updateMany", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create the base User model
const UserModel = mongoose.model<User>("User", userSchema);

// Instructor discriminator schema
const instructorSchema = new mongoose.Schema<Instructor>({
  slug: {
    type: String,
    required: false,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 5,
  },
  totalStudents: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  bio: { type: String, required: false },
  field: { type: String, required: false },
  currentPosition: { type: String, required: false },
  currentCompany: { type: String, required: false },
  previousExperience: {
    type: [previousExperienceSchema],
    required: false,
    default: [],
  },
  linkedinUrl: {
    type: String,
    required: false,
    validate: {
      validator: function (v: string) {
        if (!v) return true; // Allow empty string
        return /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(
          v
        );
      },
      message: "Invalid LinkedIn URL format",
    },
  },
  reviews: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Review",
    required: false,
    default: [],
  },
  ownedCourses: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Course",
    required: false,
    default: [],
  },
});

// Unique slug for instructors only (sparse allows other user types)
instructorSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Student discriminator schema
const studentSchema = new mongoose.Schema<Student>({
  enrollments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Enrollment",
    required: false,
    default: [],
  },
  collegeName: { type: String, required: false },
  degreeName: { type: String, required: false },
  fatherOccupation: { type: String, required: false },
  experienceLevel: { type: String, required: false },
  passingYear: {
    type: Number,
    required: false,
    min: 1900,
    max: new Date().getFullYear() + 10,
  },
  areaOfInterest: { type: String, required: false },
  experience: { type: [previousExperienceSchema], required: false },
  currentPosition: { type: String, required: false },
  currentCompany: { type: String, required: false },
  domain: { type: String, required: false },
  portfolio: {
    type: String,
    required: false,
    validate: {
      validator: function (v: string) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v); // Basic URL validation
      },
      message: "Portfolio must be a valid URL",
    },
  },
  // Joining info
  joinSource: {
    type: String,
    enum: ["direct", "affiliate", "promotion"],
    required: false,
  },
  affiliation: {
    isAffiliate: {
      type: Boolean,
      required: false,
      default: false,
    },
    affiliate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      required: false,
    },
  },
  // Orders
  orders: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "PaymentOrder",
    required: false,
    default: [],
  },
  // Pending payments
  pendingPayments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "PaymentOrder",
    required: false,
    default: [],
  },
});

// Collaborator discriminator schema
const collaboratorSchema = new mongoose.Schema<Collaborator>({
  totalReferrals: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalEarnings: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
});

// Create discriminator models
const InstructorModel = UserModel.discriminator<Instructor>(
  "instructor",
  instructorSchema
);
const StudentModel = UserModel.discriminator<Student>("student", studentSchema);
const CollaboratorModel = UserModel.discriminator<Collaborator>(
  "collaborator",
  collaboratorSchema
);

// reset password
userSchema.statics.resetPassword = async function (
  id: string,
  password: string
) {
  const user = await this.findById(id).select("+password");
  if (!user) {
    throw new Error("User not found");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  await user.save();
  return user;
};

export { UserModel, InstructorModel, StudentModel, CollaboratorModel };
