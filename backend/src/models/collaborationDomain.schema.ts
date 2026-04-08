import mongoose, { Schema } from "mongoose";
import { CollaborationDomain } from "../types/collaborationDomain";
import {
  LessonAccessControl,
  ModuleAccessControl,
  PartialAccessControl,
} from "../types";

// --- Nested schemas (same shape as enrollment.schema.ts partial access) ---

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

const collaborationDomainSchema = new Schema<CollaborationDomain>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
      validate: {
        validator(v: string) {
          const s = v.startsWith("@") ? v.slice(1) : v;
          if (!s || s.includes(" ") || !s.includes(".")) return false;
          const hostnamePart =
            s.startsWith("*.") && s.length > 2 ? s.slice(2) : s;
          if (!hostnamePart) return false;
          // Exact: college.edu, sub.college.ac.in — or wildcard *.suffix (any.sub.test.com)
          return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(
            hostnamePart
          );
        },
        message:
          "Invalid email domain (e.g. college.edu, @college.edu, or *.college.edu for apex + single-label subdomains)",
      },
    },
    isActive: { type: Boolean, default: true, index: true },
    collaborationKind: {
      type: String,
      enum: ["course_allot", "discount"],
      required: true,
      index: true,
    },
    /** Course allot: ≥1 course. Discount: must be empty. */
    courses: {
      type: [{ type: Schema.Types.ObjectId, ref: "Course", index: true }],
      default: [],
    },
    /** Only for course-access partnerships — not stored when `benefit` is set (discount-only). */
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

collaborationDomainSchema.index({ isActive: 1, domain: 1 });

function normalizeDomainValue(domain: string): string {
  if (!domain.startsWith("@")) return `@${domain}`;
  return domain;
}

collaborationDomainSchema.pre("save", function (next) {
  if (this.domain) {
    this.domain = normalizeDomainValue(this.domain);
  }
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

collaborationDomainSchema.pre("findOneAndUpdate", function (next) {
  const raw = this.getUpdate() as Record<string, unknown>;
  if (!raw || typeof raw !== "object") return next();

  const apply = (obj: Record<string, unknown>) => {
    if (typeof obj.domain === "string" && !obj.domain.startsWith("@")) {
      obj.domain = normalizeDomainValue(obj.domain);
    }
  };

  apply(raw);
  if (raw.$set && typeof raw.$set === "object") {
    apply(raw.$set as Record<string, unknown>);
  }
  next();
});

collaborationDomainSchema.pre("validate", function (next) {
  const benefit = this.benefit;
  if (!this.collaborationKind) {
    this.invalidate(
      "collaborationKind",
      "collaborationKind is required (course_allot or discount)"
    );
    return next();
  }

  const kind = this.collaborationKind;
  const courseCount = Array.isArray(this.courses) ? this.courses.length : 0;

  if (kind === "discount") {
    this.set("enrollmentAccess", undefined);
    this.set("courses", []);
    if (!benefit) {
      this.invalidate(
        "benefit",
        "Discount partnerships require a benefit (percentage or fixed amount)"
      );
    }
  } else {
    this.set("benefit", undefined);
    if (!this.enrollmentAccess) {
      this.invalidate(
        "enrollmentAccess",
        "Course allot requires enrollment access rules (full, partial, or top-N)"
      );
    }
    if (courseCount === 0) {
      this.invalidate(
        "courses",
        "Course allot requires at least one linked course"
      );
    }
  }

  const access = this.enrollmentAccess;
  if (!access) return next();

  if (access.mode === "partial") {
    const n = access.topNSettings?.contentsPerLesson;
    const hasTopN = n != null && n >= 1;
    const mods = access.partialAccess?.accessibleModules;
    const hasExplicit =
      Array.isArray(mods) &&
      mods.length > 0;

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
      this.invalidate("benefit.value", "value must be >= 0 when benefit type is fixed");
    }
  }

  next();
});

export const CollaborationDomainModel = mongoose.model<CollaborationDomain>(
  "CollaborationDomain",
  collaborationDomainSchema
);
