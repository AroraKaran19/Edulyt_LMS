import mongoose, { Schema } from "mongoose";
import type { PartnershipImportConfig } from "../types/partnershipImportConfig";
import {
  LessonAccessControl,
  ModuleAccessControl,
  PartialAccessControl,
} from "../types";

const lessonAccessControlSchema = new Schema<LessonAccessControl>(
  {
    lessonId: { type: String, required: true },
    accessibleContentIds: { type: [String], default: [] },
  },
  { _id: false }
);

const moduleAccessControlSchema = new Schema<ModuleAccessControl>(
  {
    moduleId: { type: String, required: true },
    accessibleLessons: { type: [lessonAccessControlSchema], default: [] },
  },
  { _id: false }
);

const partialAccessControlSchema = new Schema<PartialAccessControl>(
  {
    accessibleModules: { type: [moduleAccessControlSchema], default: [] },
    accessType: {
      type: String,
      required: true,
      enum: ["full", "partial"],
      default: "partial",
    },
  },
  { _id: false }
);

const topNSettingsSchema = new Schema(
  {
    contentsPerLesson: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const benefitSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
    },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const enrollmentAccessSchema = new Schema(
  {
    mode: {
      type: String,
      enum: ["full", "partial"],
      required: true,
      default: "full",
    },
    partialAccess: { type: partialAccessControlSchema, default: undefined },
    topNSettings: { type: topNSettingsSchema, default: undefined },
    plan: {
      type: String,
      enum: ["elite", "essential"],
      required: true,
    },
    audience: {
      type: String,
      enum: ["college-students", "professionals"],
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const partnershipImportConfigSchema = new Schema<PartnershipImportConfig>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    isActive: { type: Boolean, default: true, index: true },
    kind: {
      type: String,
      enum: ["course_allot", "discount"],
      required: true,
      index: true,
    },
    courses: {
      type: [{ type: Schema.Types.ObjectId, ref: "Course", index: true }],
      default: [],
    },
    enrollmentAccess: {
      type: enrollmentAccessSchema,
      required: false,
    },
    benefit: { type: benefitSchema, default: undefined },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

partnershipImportConfigSchema.index({ isActive: 1, kind: 1 });

partnershipImportConfigSchema.pre("save", function (next) {
  const access = this.enrollmentAccess;
  if (access) {
    if (access.mode === "full") {
      this.set("enrollmentAccess.partialAccess", undefined);
      this.set("enrollmentAccess.topNSettings", undefined);
    } else if (access.mode === "partial") {
      const n = access.topNSettings?.contentsPerLesson;
      const hasTopN = n != null && n >= 1;
      if (hasTopN) {
        this.set("enrollmentAccess.partialAccess", undefined);
      } else {
        this.set("enrollmentAccess.topNSettings", undefined);
      }
    }
  }
  next();
});

partnershipImportConfigSchema.pre("findOneAndUpdate", function (next) {
  const raw = this.getUpdate() as Record<string, unknown>;
  if (!raw || typeof raw !== "object") return next();
  next();
});

partnershipImportConfigSchema.pre("validate", function (next) {
  const benefit = this.benefit;
  if (!this.kind) {
    this.invalidate("kind", "kind is required (course_allot or discount)");
    return next();
  }

  const kind = this.kind;
  const courseCount = Array.isArray(this.courses) ? this.courses.length : 0;

  if (kind === "discount") {
    this.set("enrollmentAccess", undefined);
    if (!benefit) {
      this.invalidate(
        "benefit",
        "Discount import configs require a benefit (percentage or fixed amount)"
      );
    }
    if (courseCount === 0) {
      this.invalidate(
        "courses",
        "Discount import requires at least one course the discount applies to"
      );
    }
  } else {
    this.set("benefit", undefined);
    if (!this.enrollmentAccess) {
      this.invalidate(
        "enrollmentAccess",
        "Course allot requires enrollment access rules"
      );
    }
    if (courseCount === 0) {
      this.invalidate("courses", "Course allot requires at least one linked course");
    }
  }

  const access = this.enrollmentAccess;
  if (!access) return next();

  if (access.mode === "partial") {
    const n = access.topNSettings?.contentsPerLesson;
    const hasTopN = n != null && n >= 1;
    const mods = access.partialAccess?.accessibleModules;
    const hasExplicit = Array.isArray(mods) && mods.length > 0;

    if (hasTopN && hasExplicit) {
      this.invalidate(
        "enrollmentAccess",
        "partial mode cannot set both topNSettings and partialAccess; use one"
      );
    } else if (!hasTopN && !hasExplicit) {
      this.invalidate(
        "enrollmentAccess",
        "partial mode requires topNSettings.contentsPerLesson (>= 1) or partialAccess with at least one module"
      );
    }
  }

  if (benefit) {
    if (benefit.type === "percentage") {
      const v = benefit.value;
      if (v < 0 || v > 100) {
        this.invalidate(
          "benefit.value",
          "value must be between 0 and 100 when benefit type is percentage"
        );
      }
    }
    if (benefit.type === "fixed" && benefit.value < 0) {
      this.invalidate(
        "benefit.value",
        "value must be >= 0 when benefit type is fixed"
      );
    }
  }

  next();
});

export const PartnershipImportConfigModel = mongoose.model<PartnershipImportConfig>(
  "PartnershipImportConfig",
  partnershipImportConfigSchema
);
