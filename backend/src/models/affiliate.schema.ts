import mongoose from "mongoose";
import { Affiliate } from "../types/affiliate";
import { UserModel } from "./user.schema";

// Affiliate schema
const affiliateSchema = new mongoose.Schema<Affiliate>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      validate: {
        validator: function (v: string) {
          // Allow alphanumeric codes with optional hyphens/underscores
          return /^[A-Z0-9_-]+$/.test(v);
        },
        message:
          "Affiliate code must contain only uppercase letters, numbers, hyphens, and underscores",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totalReferrals: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    users: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure code is uppercase
affiliateSchema.pre("save", function (next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Static methods
affiliateSchema.statics.findByCode = function (code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

affiliateSchema.statics.findByCreator = function (createdBy: string) {
  return this.find({ createdBy }).sort({ createdAt: -1 });
};

affiliateSchema.statics.getTopAffiliates = function (limit: number = 10) {
  return this.find({})
    .sort({ totalReferrals: -1 })
    .limit(limit)
    .populate("createdBy", "firstName lastName email profilePicture");
};

// Instance methods
affiliateSchema.methods.addReferral = async function (userId: string) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  // Check if user is already referred by this affiliate
  if (!this.users.includes(userId)) {
    this.users.push(userId);
    this.totalReferrals += 1;
    await user.save();
    return await this.save();
  }

  return Promise.resolve(this);
};

affiliateSchema.methods.removeReferral = async function (userId: string) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const index = this.users.indexOf(userId);
  if (index > -1) {
    this.users.splice(index, 1);
    this.totalReferrals = Math.max(0, this.totalReferrals - 1);
    return await this.save();
  }
  return Promise.resolve(this);
};

affiliateSchema.methods.getReferralStats = function () {
  return {
    totalReferrals: this.totalReferrals,
    activeUsers: this.users.length,
    code: this.code,
    createdAt: this.createdAt,
  };
};

export const AffiliateModel = mongoose.model<Affiliate>(
  "Affiliate",
  affiliateSchema
);
