import mongoose, { Schema } from "mongoose";

/**
 * Singleton document for the marketing homepage CMS.
 * One row keyed by `key: "global"`. Mirrors the frontend `HomePageSettings`
 * type at `frontend/src/types/home-page-settings.ts`.
 *
 * Sections that reference existing entities (testimonials, FAQs, instructors)
 * store ObjectId arrays and are hydrated via `.populate()` on read.
 */

const heroTopCardSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false },
);

const heroComparisonRowSchema = new Schema(
  {
    feature: { type: String, default: "" },
    airkrit: { type: String, default: "" },
    youtube: { type: String, default: "" },
    others: { type: String, default: "" },
  },
  { _id: false },
);

const heroSchema = new Schema(
  {
    topCards: { type: [heroTopCardSchema], default: [] },
    comparisonHeadingHtml: { type: String, default: "" },
    comparisonRows: { type: [heroComparisonRowSchema], default: [] },
    exploreOfferingsLabel: { type: String, default: "" },
    exploreOfferingsHref: { type: String, default: "" },
    imageSrc: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
    backgroundImageSrc: { type: String, default: "" },
    comparisonAirkritLogoSrc: { type: String, default: "" },
    comparisonYoutubeLogoSrc: { type: String, default: "" },
  },
  { _id: false },
);

const studentSchema = new Schema(
  {
    badgeLabel: { type: String, default: "" },
    headingPrefix: { type: String, default: "" },
    headingHighlightCareer: { type: String, default: "" },
    confusionPrompts: { type: [String], default: [] },
    helpCtaText: { type: String, default: "" },
    imageSrc: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
  },
  { _id: false },
);

const industrySchema = new Schema(
  {
    headingPrimary: { type: String, default: "" },
    headingSecondary: { type: String, default: "" },
    helpIntroText: { type: String, default: "" },
    expertHelpBullets: { type: [String], default: [] },
    bookConsultationLabel: { type: String, default: "" },
    bookConsultationHref: { type: String, default: "" },
    imageSrc: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
  },
  { _id: false },
);

const coursePathSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    title: { type: String, default: "" },
    coursesHeadingPrefix: { type: String, default: "" },
    coursesHeadingHighlight: { type: String, default: "" },
    audience: {
      type: String,
      enum: ["college-students", "professionals"],
      default: "college-students",
    },
  },
  { _id: false },
);

const internshipPathSchema = new Schema(
  {
    titleHighlight: { type: String, default: "" },
    titleRest: { type: String, default: "" },
  },
  { _id: false },
);

const testimonialSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    headingLine1: { type: String, default: "" },
    headingHighlight1: { type: String, default: "" },
    headingLine2: { type: String, default: "" },
    headingHighlight2: { type: String, default: "" },
    testimonials: [
      { type: Schema.Types.ObjectId, ref: "Testimonial", default: [] },
    ],
  },
  { _id: false },
);

const instituteSpotlightSchema = new Schema(
  {
    first_name: { type: String, default: "" },
    last_name: { type: String, default: "" },
    avatar: { type: String, default: "" },
  },
  { _id: false },
);

const instituteSchema = new Schema(
  {
    image: { type: String, default: "" },
    name: { type: String, default: "" },
    line1: { type: String, default: "" },
    internship_student_count: { type: Number, default: 0, min: 0 },
    internship_spotlights: {
      type: [instituteSpotlightSchema],
      default: [],
    },
    line2: { type: String, default: "" },
    course_student_count: { type: Number, default: 0, min: 0 },
    course_spotlights: {
      type: [instituteSpotlightSchema],
      default: [],
    },
  },
  { _id: false },
);

const institutionsSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    headingRest: { type: String, default: "" },
    body: { type: String, default: "" },
    institutes: { type: [instituteSchema], default: [] },
  },
  { _id: false },
);

const iconCardSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
  },
  { _id: false },
);

const trainingSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    headingLine1: { type: String, default: "" },
    headingHighlight1: { type: String, default: "" },
    headingLine2: { type: String, default: "" },
    headingHighlight2: { type: String, default: "" },
    pillars: { type: [iconCardSchema], default: [] },
    imageSrc: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
  },
  { _id: false },
);

const supportHighlightSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false },
);

const supportSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    highlights: { type: [supportHighlightSchema], default: [] },
  },
  { _id: false },
);

const prepareSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    headingPrefix: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    items: { type: [iconCardSchema], default: [] },
  },
  { _id: false },
);

const futureManagersSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    headingLearn: { type: String, default: "" },
    headingHire: { type: String, default: "" },
    instructors: [
      { type: Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { _id: false },
);

const professionalSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    headingLine1: { type: String, default: "" },
    headingHighlightStudent: { type: String, default: "" },
    headingLine2: { type: String, default: "" },
    headingHighlightWorking: { type: String, default: "" },
    promptBullets: { type: [String], default: [] },
    helpCtaText: { type: String, default: "" },
    imageSrc: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
  },
  { _id: false },
);

const dreamJobSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    headingLine1: { type: String, default: "" },
    headingHighlightLearn: { type: String, default: "" },
    headingHighlightPlacement: { type: String, default: "" },
    bullets: { type: [String], default: [] },
    getStartedLabel: { type: String, default: "" },
    getStartedHref: { type: String, default: "" },
    imageSrc: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
  },
  { _id: false },
);

const valuePropSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false },
);

const pathSelectionSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    headingHighlight: { type: String, default: "" },
    introParagraphs: { type: [String], default: [] },
    valueProps: { type: [valuePropSchema], default: [] },
    backgroundImageSrc: { type: String, default: "" },
  },
  { _id: false },
);

const faqSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    faqs: [{ type: Schema.Types.ObjectId, ref: "FAQ", default: [] }],
  },
  { _id: false },
);

const homePageSettingsSchema = new Schema(
  {
    /** Fixed key so we only ever have one row. */
    key: { type: String, required: true, unique: true, default: "global" },

    hero: { type: heroSchema, default: () => ({}) },
    student: { type: studentSchema, default: () => ({}) },
    industry: { type: industrySchema, default: () => ({}) },
    coursePathStudents: { type: coursePathSchema, default: () => ({}) },
    internshipPath: { type: internshipPathSchema, default: () => ({}) },
    testimonial: { type: testimonialSchema, default: () => ({}) },
    institutions: { type: institutionsSchema, default: () => ({}) },
    training: { type: trainingSchema, default: () => ({}) },
    support: { type: supportSchema, default: () => ({}) },
    prepare: { type: prepareSchema, default: () => ({}) },
    futureManagers: { type: futureManagersSchema, default: () => ({}) },
    professional: { type: professionalSchema, default: () => ({}) },
    coursePathProfessionals: { type: coursePathSchema, default: () => ({}) },
    dreamJob: { type: dreamJobSchema, default: () => ({}) },
    pathSelection: { type: pathSelectionSchema, default: () => ({}) },
    faq: { type: faqSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const HomePageSettingsModel = mongoose.model(
  "HomePageSettings",
  homePageSettingsSchema,
);
