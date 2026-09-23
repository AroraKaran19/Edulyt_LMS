import mongoose, { Schema } from "mongoose";

/**
 * Singleton for the `/campus-ambassador` page, keyed `airkrit`. `form.fields` is
 * Mixed because the service rebuilds it through `resolveCaFields` on every read
 * and write, so a schema per field would only duplicate that.
 */
const enrollmentSchema = new Schema(
  {
    acceptingApplications: { type: Boolean, default: false },
    durations: { type: [Number], default: [] },
    minSuccessPoints: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const formSchema = new Schema(
  {
    fields: { type: Schema.Types.Mixed, default: () => ({}) },
    languages: { type: [String], default: [] },
    whatsappLink: { type: String, default: "" },
  },
  { _id: false },
);

const documentsSchema = new Schema(
  {
    designations: {
      marketing: { type: String, default: "" },
      "social-media": { type: String, default: "" },
    },
  },
  { _id: false },
);

const moneySchema = new Schema(
  {
    stipend: { type: Number, default: null },
    incentiveCap: { type: Number, default: null },
    joiningBonus: { type: Number, default: null },
    kitValue: { type: Number, default: null },
    lmsValue: { type: Number, default: null },
    ppoPackageLpa: { type: Number, default: null },
  },
  { _id: false },
);

const heroSchema = new Schema(
  {
    headline: { type: String, default: "" },
    lede: { type: String, default: "" },
    jdUrl: { type: String, default: "" },
  },
  { _id: false },
);

const kitSchema = new Schema(
  { photoUrl: { type: String, default: "" }, items: { type: [String], default: [] } },
  { _id: false },
);

const videoSchema = new Schema(
  {
    url: { type: String, required: true },
    role: { type: String, default: "" },
    college: { type: String, default: "" },
    duration: { type: String, default: "" },
  },
  { _id: false },
);

const faqSchema = new Schema(
  { question: { type: String, required: true }, answer: { type: String, required: true } },
  { _id: false },
);

const samplesSchema = new Schema(
  {
    offerLetter: { type: String, default: "" },
    lor: { type: String, default: "" },
    internshipCertificate: { type: String, default: "" },
    trainingCertificate: { type: String, default: "" },
  },
  { _id: false },
);

const caPageSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    enrollment: { type: enrollmentSchema, default: () => ({}) },
    form: { type: formSchema, default: () => ({}) },
    documents: { type: documentsSchema, default: () => ({}) },
    money: { type: moneySchema, default: () => ({}) },
    hero: { type: heroSchema, default: () => ({}) },
    kit: { type: kitSchema, default: () => ({}) },
    videos: { type: new Schema({ items: { type: [videoSchema], default: [] } }, { _id: false }), default: () => ({}) },
    faqs: { type: new Schema({ items: { type: [faqSchema], default: [] } }, { _id: false }), default: () => ({}) },
    samples: { type: samplesSchema, default: () => ({}) },
  },
  { timestamps: true, minimize: false },
);

export const CaPageSettingsModel = mongoose.model(
  "CaPageSettings",
  caPageSettingsSchema,
);
