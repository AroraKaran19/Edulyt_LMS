import mongoose from "mongoose";
import {
  Content,
  CourseLesson,
  CourseModule,
  Quiz,
  ReadingMaterial,
  Video,
} from "../types";
import { validateQuiz, validateUrl } from "./validators";

// ===================
// Reading Material Schema
// ===================

const readingMaterialSchema = new mongoose.Schema<ReadingMaterial>(
  {
    content: { type: String, required: true, enum: ["pdf", "docx"] },
    estimatedReadTime: {
      type: Number,
      required: true,
      min: [0, "Estimated read time must be positive"],
    },
    downloadUrl: {
      type: String,
      validate: {
        validator: validateUrl,
        message: "Download URL must be a valid URL",
      },
    },
  },
  { timestamps: true, _id: false }
);

// ===================
// Quiz Schema
// ===================

const quizSchema = new mongoose.Schema<Quiz>(
  {
    questions: {
      type: [
        {
          question: { type: String, required: true },
          options: {
            type: [String],
            required: true,
            validate: {
              validator: validateQuiz,
              message: "Quiz must have at least 2 options",
            },
          },
          correctAnswer: { type: [String], required: true },
          timeLimit: { type: Number, min: [0, "Time limit must be positive"] },
        },
      ],
      required: true,
    },
    passingScore: { type: Number, min: [0, "Passing score must be positive"] },
    maxAttempts: { type: Number, min: [1, "Max attempts must be at least 1"] },
  },
  { timestamps: true }
);

// ===================
// Video Schema
// ===================

const videoSchema = new mongoose.Schema<Video>(
  {
    sources: {
      type: [
        {
          quality: {
            type: String,
            required: true,
            enum: ["1080p", "720p", "480p", "360p"],
          },
          videoUrl: {
            type: String,
            required: true,
            validate: {
              validator: validateUrl,
              message: "Video URL must be a valid URL",
            },
          },
        },
      ],
      required: true,
    },
    thumbnailUrl: {
      type: String,
      validate: {
        validator: validateUrl,
        message: "Thumbnail must be a valid URL",
      },
    },
    duration: { type: Number, min: [0, "Duration must be positive"] },
  },
  { timestamps: true }
);

// ===================
// Content Schema
// ===================

const contentSchema = new mongoose.Schema<Content>(
  {
    title: { type: String, required: true },
    description: { Trang: String },
    type: { type: String, required: true, enum: ["video", "quiz"] },
    readingMaterials: [readingMaterialSchema],
    isLocked: { type: Boolean, default: false, required: true },
  },
  { timestamps: true, discriminatorKey: "type" }
);

// ===================
// Course Lesson Schema
// ===================

const courseLessonSchema = new mongoose.Schema<CourseLesson>(
  {
    title: { type: String, required: true },
    description: { type: String },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
    },
    contentIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Content", required: true },
    ],
    isLocked: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

// ===================
// Course Module Schema
// ===================

const courseModuleSchema = new mongoose.Schema<CourseModule>(
  {
    title: { type: String, required: true },
    thumbnailUrl: {
      type: String,
      required: true,
      validate: {
        validator: validateUrl,
        message: "Thumbnail must be a valid URL",
      },
    },
    lessonIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseLesson",
        required: true,
      },
    ],
    description: { type: String },
    isLocked: { type: Boolean, default: false, required: true },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true }
);

// ===================
// Indexes
// ===================

// Indexes

courseModuleSchema.index({ title: 1, lessonIds: 1 }); // For searching modules by title and lesson IDs
courseModuleSchema.index({ isActive: 1 }); // For filtering active modules
courseLessonSchema.index({ moduleId: 1, title: 1 }); // For searching lessons by module ID and title
courseLessonSchema.index({ contentIds: 1 }); // For searching lessons by content IDs
contentSchema.index({ type: 1 }); // For filtering content by type
contentSchema.index({ isLocked: 1 }); // For filtering content by locked status
contentSchema.index({ isActive: 1 }); // For filtering active content

courseModuleSchema.index({ createdAt: -1 }); // For listing modules by creation date
courseModuleSchema.index({ updatedAt: -1 }); // For listing modules by update date
courseLessonSchema.index({ createdAt: -1 }); // For listing lessons by creation date
courseLessonSchema.index({ updatedAt: -1 }); // For listing lessons by update date
contentSchema.index({ createdAt: -1 }); // For listing content by creation date
contentSchema.index({ updatedAt: -1 }); // For listing content by update date

// ===================
// Discriminators
// ===================

const VideoContent = contentSchema.discriminator("video", videoSchema);
const QuizContent = contentSchema.discriminator("quiz", quizSchema);

export default {
  CourseModule: mongoose.model<CourseModule>(
    "CourseModule",
    courseModuleSchema
  ),
  CourseLesson: mongoose.model<CourseLesson>(
    "CourseLesson",
    courseLessonSchema
  ),
  Content: mongoose.model<Content>("Content", contentSchema),
  VideoContent: VideoContent,
  QuizContent: QuizContent,
};
