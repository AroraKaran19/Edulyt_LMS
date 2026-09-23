import mongoose from "mongoose";
import { Lead } from "../types/lead";

// ===================
// Lead Schema
// ===================

const leadAnswerSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const actorSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, default: "" },
  },
  { _id: false }
);

const leadProgramSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true, enum: ["course", "internship"] },
    /** Course or Internship id, by `kind`. Absent when the slug matched nothing. */
    refId: { type: mongoose.Schema.Types.ObjectId, required: false },
    title: { type: String, default: "" },
    slug: { type: String, default: "" },
  },
  { _id: false }
);

/**
 * Where the lead came in from. An object rather than a string so a scholarship
 * lead can carry its campaign, and so `testId` can be nulled on campaign
 * deletion while the title and slug survive as history.
 */
const leadSourceSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      required: true,
      enum: ["enquiry", "scholarship", "import"],
      default: "enquiry",
    },
    /** Defaulted, not required: rows written before two brands existed are
     *  all Airkrit, and reading them must not fail. */
    brand: {
      type: String,
      required: false,
      enum: ["airkrit", "edulyt"],
      default: "airkrit",
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScholarshipTest",
      default: null,
    },
    title: { type: String, default: "" },
    slug: { type: String, default: "" },
    /** The campaign's author, not the `?ref=` code that brought this person. */
    campaignOwnerName: { type: String, default: "" },
    /** The course or internship page an enquiry came from. */
    program: { type: leadProgramSchema, required: false },
    /** Set for `kind: "import"`: the Excel file this row came from. */
    fileName: { type: String, required: false },
    /** Set for `kind: "import"`: the admin who ran the import. */
    importedBy: { type: actorSnapshotSchema, required: false },
  },
  { _id: false }
);

/**
 * Who this lead came from, frozen at capture. `userId` is nulled when that user
 * is deleted; everything else survives, because a departing marketer must not
 * erase the pipeline they generated. `role` is stored rather than derived for
 * the same reason: once the user is gone there is nothing to derive it from.
 */
const leadCreatorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    code: { type: String, default: "" },
    name: { type: String, default: "" },
    role: {
      type: String,
      // "ambassador" and "sales-intern" stay for rows written under earlier kinds.
      enum: [
        "marketer",
        "sales",
        "marketing-intern",
        "social-media-intern",
        "sales-intern",
        "ambassador",
      ],
      required: true,
    },
  },
  { _id: false }
);

/**
 * The creator's owner at capture time. Snapshotted, not joined: re-homing an
 * ambassador in March must not rewrite February's team totals.
 */
const leadParentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, default: "" },
  },
  { _id: false }
);

/** Append-only: conversion is flipped by hand, so the trail is the only audit. */
const statusHistorySchema = new mongoose.Schema(
  {
    /**
     * Unconstrained on purpose: entries written before the stage/sub-status
     * split carry the old five-value vocabulary ("contacted", "qualified"),
     * and an enum here would make saving any lead that has such an entry fail.
     * What may be written is checked in `leadPipeline.services`, which is the
     * only writer and updates by aggregation pipeline, where enums never run.
     */
    from: { type: String, default: null },
    fromSubStatus: { type: String, default: null },
    to: { type: String, required: true },
    toSubStatus: { type: String, default: null },
    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    changedByName: { type: String, default: "" },
    changedAt: { type: Date, required: true, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const assignmentHistorySchema = new mongoose.Schema(
  {
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    toName: { type: String, default: "" },
    byUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    byName: { type: String, default: "" },
    at: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema<Lead>(
  {
    source: { type: leadSourceSchema, required: true, default: () => ({}) },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },

    answers: { type: [leadAnswerSchema], default: [] },

    /** `null` means not resolved yet, distinct from `false`. */
    emailOnPlatform: { type: Boolean, default: null },
    emailCheckedAt: { type: Date, required: false },
    platformUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    submittedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    creator: { type: leadCreatorSchema, required: false },
    parent: { type: leadParentSchema, required: false },

    assignedTo: { type: actorSnapshotSchema, required: false },
    assignedBy: { type: actorSnapshotSchema, required: false },
    assignedAt: { type: Date, required: false },
    assignmentHistory: { type: [assignmentHistorySchema], default: [] },

    statusHistory: { type: [statusHistorySchema], default: [] },

    /**
     * Denormalised from `statusHistory`. "Conversions in March" is a different
     * date from `createdAt`, and deriving it would unwind an array across the
     * whole collection on every report load.
     */
    convertedAt: { type: Date, default: null },
    convertedBy: { type: actorSnapshotSchema, default: null },

    /** Canonical college link. Absent when the learner typed a college that is
     *  not in the directory, which `CollegeSelect` allows. */
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: false,
    },
    collegeName: { type: String, required: false, trim: true },
    /** Snapshot of `College.state`, so filtering never joins. */
    state: { type: String, required: false, trim: true },

    /**
     * Stage, the first dropdown, and the sub-status under it. Both hold a `key`
     * from `LeadPipelineSettings`, which the admin edits, so no enum can be
     * declared here; the pair is validated against the configured pipeline in
     * `leadPipeline.services`. Storing the key rather than the label is what
     * lets a stage be renamed without touching a single lead.
     */
    status: { type: String, required: true },
    subStatus: { type: String, required: true },
    note: { type: String, required: false, trim: true },

    pageQuery: { type: String, required: false },
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ "source.kind": 1, createdAt: -1 });
leadSchema.index({ "source.brand": 1, createdAt: -1 });
// `creator.userId` rather than `creator.code`: renaming a code must not split
// someone's history in two.
leadSchema.index({ "creator.userId": 1, createdAt: -1 });
leadSchema.index({ "parent.userId": 1, createdAt: -1 });
leadSchema.index({ collegeId: 1, createdAt: -1 });
leadSchema.index({ state: 1, createdAt: -1 });
leadSchema.index({ "assignedTo.userId": 1, status: 1, createdAt: -1 });
// Kept beside the status-only pairs: with `subStatus` unbounded, a stage-only
// query cannot walk these in `createdAt` order and would sort in memory.
leadSchema.index({ "assignedTo.userId": 1, status: 1, subStatus: 1, createdAt: -1 });
leadSchema.index({ status: 1, subStatus: 1, createdAt: -1 });
// Conversion reporting is by the date of the flip, not the date of capture.
leadSchema.index({ "convertedBy.userId": 1, convertedAt: -1 });
// Reversed pair for the leaderboards, which scan a date range and group by
// actor rather than filtering to one.
leadSchema.index({ createdAt: -1, "creator.userId": 1 });
leadSchema.index({ convertedAt: -1, "convertedBy.userId": 1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });
// The import duplicate check is one batched query per brand; without these,
// each falls back to the bare email/phone index and filters brand in memory.
leadSchema.index({ "source.brand": 1, email: 1 });
leadSchema.index({ "source.brand": 1, phone: 1 });
// Lets the staleness sweep find unresolved rows without a collection scan.
leadSchema.index({ emailCheckedAt: 1 });

export const LeadModel = mongoose.model<Lead>("Lead", leadSchema);
