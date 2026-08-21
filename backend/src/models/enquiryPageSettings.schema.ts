import mongoose, { Schema } from "mongoose";

/**
 * Singleton for the `/enquiry` CMS, keyed `global`. Mirrors
 * `frontend/src/types/enquiry-page-settings.ts`; empty fields fall back to the
 * page's shipped constants.
 */

const ctaSchema = new Schema(
  {
    label: { type: String, default: "" },
    href: { type: String, default: "" },
    source: { type: String, enum: ["upload", "url"], default: "url" },
    s3Key: { type: String, default: "" },
  },
  { _id: false },
);

const offerSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    label: { type: String, default: "" },
    headline: { type: String, default: "" },
    body: { type: String, default: "" },
  },
  { _id: false },
);

const partnerLogoSchema = new Schema(
  {
    name: { type: String, default: "" },
    src: { type: String, default: "" },
    height: { type: Number, default: 24 },
    ratio: { type: Number, default: 1 },
  },
  { _id: false },
);

const heroSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    headingLine1: { type: String, default: "" },
    headingLine2: { type: String, default: "" },
    introHtml: { type: String, default: "" },
    primaryCta: { type: ctaSchema, default: () => ({}) },
    secondaryCta: { type: ctaSchema, default: () => ({}) },
    ratingScore: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    ratingSource: { type: String, default: "" },
    ratingLabel: { type: String, default: "" },
    partnersHeading: { type: String, default: "" },
    partners: { type: [partnerLogoSchema], default: [] },
    marquee: { type: [String], default: [] },
  },
  { _id: false },
);

/** The certificates summary groups by this exact string, so it is an enum. */
const AVAILABILITY_VALUES = [
  "Every plan, on completion",
  "Plan 03, on completion",
  "Free on Plan 03, add-on elsewhere",
];

const certificateSchema = new Schema(
  {
    title: { type: String, default: "" },
    issuer: { type: String, default: "" },
    blurb: { type: String, default: "" },
    src: { type: String, default: "" },
    availability: {
      type: String,
      enum: AVAILABILITY_VALUES,
      default: AVAILABILITY_VALUES[0],
    },
  },
  { _id: false },
);

const certificatesSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    heading: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    lead: { type: String, default: "" },
    items: { type: [certificateSchema], default: [] },
  },
  { _id: false },
);

const badgeSchema = new Schema(
  {
    name: { type: String, default: "" },
    issuer: { type: String, default: "" },
    level: { type: String, default: "" },
    src: { type: String, default: "" },
  },
  { _id: false },
);

const badgesSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    heading: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    lead: { type: String, default: "" },
    items: { type: [badgeSchema], default: [] },
  },
  { _id: false },
);

const resumeSchema = new Schema(
  {
    partner: { type: String, default: "" },
    credential: { type: String, default: "" },
    src: { type: String, default: "" },
  },
  { _id: false },
);

const resumesSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    heading: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    lead: { type: String, default: "" },
    items: { type: [resumeSchema], default: [] },
  },
  { _id: false },
);

const languageSchema = new Schema(
  {
    label: { type: String, default: "" },
    native: { type: String, default: "" },
    code: { type: String, default: "" },
  },
  { _id: false },
);

const languagesSchema = new Schema(
  {
    heading: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    lead: { type: String, default: "" },
    items: { type: [languageSchema], default: [] },
  },
  { _id: false },
);

const planSchema = new Schema(
  {
    /** The lead proxy validates against exactly these, so a fourth needs code. */
    id: { type: Number, enum: [1, 2, 3] },
    no: { type: String, default: "" },
    name: { type: String, default: "" },
    price: { type: Number, default: 0 },
    tagline: { type: String, default: "" },
    bestFor: { type: String, default: "" },
    badge: { type: String, default: "" },
  },
  { _id: false },
);

const perkStateSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["included", "addon", "excluded"],
      default: "excluded",
    },
    note: { type: String, default: "" },
    price: { type: Number, default: 0 },
  },
  { _id: false },
);

const perkSchema = new Schema(
  {
    label: { type: String, default: "" },
    id: { type: String, default: "" },
    /** Keyed "1" | "2" | "3": Mongo object keys are strings. */
    by: {
      type: Map,
      of: perkStateSchema,
      default: () => new Map(),
    },
  },
  { _id: false },
);

const perkGroupSchema = new Schema(
  {
    title: { type: String, default: "" },
    perks: { type: [perkSchema], default: [] },
  },
  { _id: false },
);

const promoImageSchema = new Schema(
  {
    src: { type: String, default: "" },
    alt: { type: String, default: "" },
    source: { type: String, enum: ["upload", "url"], default: "url" },
    s3Key: { type: String, default: "" },
  },
  { _id: false },
);

const plansSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    heading: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    lead: { type: String, default: "" },
    summaryHeader: { type: String, default: "" },
    mncAddonPrice: { type: Number, default: 0 },
    plans: { type: [planSchema], default: [] },
    perkGroups: { type: [perkGroupSchema], default: [] },
    promoImage: { type: promoImageSchema, default: () => ({}) },
  },
  { _id: false },
);

const stepSchema = new Schema(
  {
    no: { type: String, default: "" },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
  },
  { _id: false },
);

const howItRunsSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    heading: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    lead: { type: String, default: "" },
    steps: { type: [stepSchema], default: [] },
  },
  { _id: false },
);

const trackRecordSchema = new Schema(
  {
    heading: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    lead: { type: String, default: "" },
  },
  { _id: false },
);

const closingSchema = new Schema(
  {
    heading: { type: String, default: "" },
    body: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
  },
  { _id: false },
);

const enquiryPageSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    offer: { type: offerSchema, default: () => ({}) },
    hero: { type: heroSchema, default: () => ({}) },
    certificates: { type: certificatesSchema, default: () => ({}) },
    badges: { type: badgesSchema, default: () => ({}) },
    resumes: { type: resumesSchema, default: () => ({}) },
    languages: { type: languagesSchema, default: () => ({}) },
    plans: { type: plansSchema, default: () => ({}) },
    howItRuns: { type: howItRunsSchema, default: () => ({}) },
    trackRecord: { type: trackRecordSchema, default: () => ({}) },
    closing: { type: closingSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const EnquiryPageSettingsModel = mongoose.model(
  "EnquiryPageSettings",
  enquiryPageSettingsSchema,
);
