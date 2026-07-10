import mongoose from "mongoose";
import { Certificate } from "../types/certificate";

const certificateSchema = new mongoose.Schema<Certificate>(
  {
    certificateType: {
      type: String,
      enum: ["course", "internship", "lor"],
      default: "course",
      required: true,
    },
    // Holds the Mongoose model name so refPath resolves populate correctly:
    //   course      → "Enrollment"
    //   internship  → "InternshipEnrollment"
    enrollmentModel: {
      type: String,
      enum: ["Enrollment", "InternshipEnrollment"],
      default: "Enrollment",
      required: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "enrollmentModel",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false,
      default: null,
      index: true,
    },

    // Certificate details
    certificateId: {
      type: String,
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    completionDate: {
      type: Date,
      required: true,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // Certificate metadata
    keyTopics: {
      type: String,
      default: null,
    },
    instructorName: {
      type: String,
      default: null,
    },

    // File information
    filePath: {
      type: String,
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },

    // Verification
    verificationCode: {
      type: String,
      default: null,
      index: true,
    },
    verificationUrl: {
      type: String,
      default: null,
    },

    // Analytics
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: {
      type: Date,
      default: null,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      default: null,
    },

    // Version tracking (for name changes/regeneration)
    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    replacedAt: {
      type: Date,
      default: null,
    },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
      default: null,
    },
    regenerationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
certificateSchema.index({ userId: 1, courseId: 1 });
certificateSchema.index({ userId: 1, issuedAt: -1 });
certificateSchema.index({ enrollmentId: 1, isLatest: 1 }); // For finding latest certificate per enrollment

// Pre-save hook to generate verification code if not provided
certificateSchema.pre("save", async function (next) {
  if (!this.verificationCode && this.isNew) {
    // Generate a unique verification code (e.g., based on certificateId or random)
    this.verificationCode = `VER-${this.certificateId}-${Date.now()
      .toString(36)
      .toUpperCase()}`;
  }

  // Auto-generate verification URL if not provided
  if (!this.verificationUrl && this.verificationCode) {
    this.verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify-certificate/${this.verificationCode}`;
  }

  // If this is a new certificate and isLatest is true, mark old certificates as not latest
  if (this.isNew && this.isLatest && this.enrollmentId) {
    await mongoose.model("Certificate").updateMany(
      {
        enrollmentId: this.enrollmentId,
        _id: { $ne: this._id },
        isLatest: true,
      },
      {
        isLatest: false,
        replacedAt: new Date(),
        replacedBy: this._id,
      }
    );

    // Set version number based on existing certificates
    const existingCount = await mongoose.model("Certificate").countDocuments({
      enrollmentId: this.enrollmentId,
    });
    this.version = existingCount + 1;
  }

  next();
});

export const CertificateModel = mongoose.model<Certificate>(
  "Certificate",
  certificateSchema
);
