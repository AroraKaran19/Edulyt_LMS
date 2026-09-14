import mongoose from "mongoose";
import { validateUrl } from "./validators";
import { brandPlugin } from "./plugins/brand.plugin";
import { courseBrand } from "../services/productBrand.services";

// ===================
// Live Class Schema
// ===================

const liveClassLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, trim: true },
    expiryMins: {
      type: Number,
      required: true,
      min: [1, "expiryMins must be at least 1"],
    },
    activatedAt: { type: Date, default: null },
    clickedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  { _id: false },
);

/**
 * A forced verdict for one student, set by an admin. Presence of an entry
 * overrides the computed verdict; absence means "use computed".
 */
const liveClassOverrideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verdict: {
      type: String,
      enum: ["present", "absent"],
      required: true,
    },
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    setAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const liveClassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title must not exceed 200 characters"],
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: "",
      maxlength: [2000, "Description must not exceed 2000 characters"],
    },
    imageUrl: {
      type: String,
      required: false,
      default: "",
      validate: {
        validator: (v: string) => !v || validateUrl(v),
        message: "Image URL must be a valid URL (http:// or https://)",
      },
    },

    /**
     * Optional host for THIS class — unrelated to `course.instructor`, which is
     * its own (already optional) array and is untouched by this module.
     * Requiring one per class would be wrong: a course may have none assigned,
     * and that must not block scheduling. `createdBy` is the accountable field.
     */
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null,
      ref: "User",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Course",
    },

    /** Zoom / Meet / etc. URL the admin shares with students. */
    meetingLink: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) => validateUrl(v),
        message: "Meeting link must be a valid URL (http:// or https://)",
      },
    },
    /** Optional link to the recorded session, set after the class. */
    recordingLink: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (v: string) => !v || validateUrl(v),
        message: "Recording link must be a valid URL (http:// or https://)",
      },
    },

    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },

    link1: { type: liveClassLinkSchema, required: true },
    link2: { type: liveClassLinkSchema, required: true },

    /** Admin verdict overrides, one entry per affected student. */
    manualOverrides: {
      type: [liveClassOverrideSchema],
      default: [],
    },

    finalizedAt: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

liveClassSchema.pre("save", function (next) {
  if (this.endDateTime && this.endDateTime <= this.startDateTime) {
    return next(new Error("endDateTime must be after startDateTime"));
  }
  next();
});

// NOTE: the old schema carried a TTL index on `expiresAt` that silently deleted
// every live class the moment it ended, destroying all history and attendance.
// It is gone on purpose — `src/scripts/migrate-live-classes-to-datetime.ts`
// drops the leftover `expiresAt_1` index from existing databases.

liveClassSchema.index({ course: 1, startDateTime: -1 });
liveClassSchema.index({ instructor: 1, startDateTime: -1 });
liveClassSchema.index({ startDateTime: -1 });
liveClassSchema.index({ startDateTime: 1, endDateTime: 1 });
liveClassSchema.index({ "link1.token": 1 }, { unique: true, sparse: true });
liveClassSchema.index({ "link2.token": 1 }, { unique: true, sparse: true });
liveClassSchema.plugin(brandPlugin, { derive: (doc) => courseBrand(doc.get("course")) });

const LiveClassModel = mongoose.model("LiveClass", liveClassSchema);

export default LiveClassModel;
