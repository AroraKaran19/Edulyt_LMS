import mongoose from "mongoose";

export interface IModuleProgress {
  _id?: string;
  enrollmentId: mongoose.Types.ObjectId;
  moduleId: string;
  completion: number; // 0-100 percentage
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const moduleProgressSchema = new mongoose.Schema<IModuleProgress>(
  {
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    moduleId: {
      type: String,
      required: true,
      index: true,
    },
    completion: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
      required: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
moduleProgressSchema.index({ enrollmentId: 1, moduleId: 1 }, { unique: true });
moduleProgressSchema.index({ enrollmentId: 1, completion: 1 });
moduleProgressSchema.index({ moduleId: 1, completion: 1 });

// Instance methods
moduleProgressSchema.methods.updateCompletion = function (completion: number) {
  this.completion = completion;
  
  if (completion === 100 && !this.completedAt) {
    this.completedAt = new Date();
  } else if (completion < 100 && this.completedAt) {
    this.completedAt = undefined;
  }
  
  if (!this.startedAt) {
    this.startedAt = new Date();
  }
  
  return this.save();
};

export const ModuleProgressModel = mongoose.model<IModuleProgress>(
  "ModuleProgress",
  moduleProgressSchema
);
