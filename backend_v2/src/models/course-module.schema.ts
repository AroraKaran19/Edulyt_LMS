import mongoose from "mongoose";
import {
  Content,
  CourseLesson,
  CourseModule,
  Document,
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
          timeLimit: {
            type: Number,
            min: [0, "Time limit must be positive"],
            required: false,
          },
          _id: false,
        },
      ],
      required: true,
    },
    passingScore: {
      type: Number,
      min: [0, "Passing score must be positive"],
      required: false,
    },
    maxAttempts: {
      type: Number,
      min: [1, "Max attempts must be at least 1"],
      required: false,
    },
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
          _id: false,
        },
      ],
      required: true,
    },
    thumbnailUrl: {
      type: String,
      validate: {
        validator: function (value: string) {
          // Allow empty strings or valid URLs
          return !value || validateUrl(value);
        },
        message: "Thumbnail must be a valid URL",
      },
      required: false,
    },
    duration: {
      type: Number,
      min: [0, "Duration must be positive"],
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

// ===================
// Document Schema
// ===================

const documentSchema = new mongoose.Schema<Document>(
  {
    documentUrl: {
      type: String,
      required: true,
      validate: {
        validator: validateUrl,
        message: "Document URL must be a valid URL",
      },
    },
  },
  { timestamps: true }
);

// ===================
// Content Schema
// ===================

const contentSchema = new mongoose.Schema<Content>(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseLesson",
      required: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
    },
    title: { type: String, required: true },
    description: {
      type: String,
      maxlength: 1500,
    },
    type: { type: String, required: true, enum: ["video", "quiz", "document"] },
    readingMaterials: [readingMaterialSchema],
  },
  { timestamps: true, discriminatorKey: "type" }
);

// ===================
// Course Lesson Schema
// ===================

const courseLessonSchema = new mongoose.Schema<CourseLesson>(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
    },
    title: { type: String, required: true },
    description: {
      type: String,
      maxlength: 1500,
    },
    contents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
        required: false,
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===================
// Course Module Schema
// ===================

const courseModuleSchema = new mongoose.Schema<CourseModule>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: { type: String, required: true },
    thumbnailUrl: {
      type: String,
      required: true,
      validate: {
        validator: validateUrl,
        message: "Thumbnail must be a valid URL",
      },
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseLesson",
      },
    ],
    description: {
      type: String,
      maxlength: 1500,
    },
    isActive: { type: Boolean, default: true, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===================
// Indexes
// ===================

// Indexes

courseModuleSchema.index({ courseId: 1 }); // For finding modules by course
courseModuleSchema.index({ courseId: 1, title: 1 }); // For searching modules by course and title
courseModuleSchema.index({ title: 1, lessons: 1 }); // For searching modules by title and lesson IDs
courseModuleSchema.index({ isActive: 1 }); // For filtering active modules
courseLessonSchema.index({ moduleId: 1, title: 1 }); // For searching lessons by module ID and title
courseLessonSchema.index({ contents: 1 }); // For searching lessons by content IDs

// ===================
// Models
// ===================

export const CourseModuleModel = mongoose.model<CourseModule>(
  "CourseModule",
  courseModuleSchema
);

export const CourseLessonModel = mongoose.model<CourseLesson>(
  "CourseLesson",
  courseLessonSchema
);

export const ContentModel = mongoose.model<Content>("Content", contentSchema);

// ===================
// Discriminators
// ===================

export const VideoContentModel = ContentModel.discriminator(
  "video",
  videoSchema
);
export const QuizContentModel = ContentModel.discriminator("quiz", quizSchema);
export const DocumentContentModel = ContentModel.discriminator(
  "document",
  documentSchema
);
