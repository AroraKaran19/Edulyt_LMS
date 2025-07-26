import mongoose, { Schema, Document } from 'mongoose';

// ===================
// Instructor Interface
// ===================

export interface IInstructor extends Document {
  name: string;
  profileImage?: string;
  experience: string;
  rating: number;
  totalStudents: number;
  totalCourses: number;
  bio: string;
  currentPosition?: string;
  currentCompany?: string;
  previousExperience?: string[];
  education?: string[];
  linkedinUrl: string;
  // Timestamps from Document
  createdAt: Date;
  updatedAt: Date;
}

// ===================
// Instructor Schema
// ===================

const InstructorSchema = new Schema<IInstructor>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  profileImage: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Experience cannot exceed 500 characters']
  },
  rating: {
    type: Number,
    required: true,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  totalStudents: {
    type: Number,
    required: true,
    min: [0, 'Total students cannot be negative'],
    default: 0
  },
  totalCourses: {
    type: Number,
    required: true,
    min: [0, 'Total courses cannot be negative'],
    default: 0
  },
  bio: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  currentPosition: {
    type: String,
    trim: true,
    maxlength: [200, 'Current position cannot exceed 200 characters']
  },
  currentCompany: {
    type: String,
    trim: true,
    maxlength: [200, 'Current company cannot exceed 200 characters']
  },
  previousExperience: [{
    type: String,
    trim: true,
    maxlength: [300, 'Previous experience entry cannot exceed 300 characters']
  }],
  education: [{
    type: String,
    trim: true,
    maxlength: [300, 'Education entry cannot exceed 300 characters']
  }],
  linkedinUrl: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [
      /^https?:\/\/(www\.)?linkedin\.com\/.*$/,
      'Please provide a valid LinkedIn URL'
    ]
  }
}, {
  timestamps: true,
  collection: 'instructors',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===================
// Indexes
// ===================

// Remove _id index as MongoDB creates it automatically
InstructorSchema.index({ name: 1 });
InstructorSchema.index({ rating: -1 });
InstructorSchema.index({ totalStudents: -1 });
InstructorSchema.index({ totalCourses: -1 });
InstructorSchema.index({ createdAt: -1 });

// ===================
// Virtuals
// ===================

InstructorSchema.virtual('averageRating').get(function(this: IInstructor) {
  return Math.round(this.rating * 10) / 10; // Round to 1 decimal place
});

InstructorSchema.virtual('profileUrl').get(function(this: IInstructor) {
  return `/instructors/${this._id}`;
});

// ===================
// Methods
// ===================

InstructorSchema.methods.toPublicJSON = function(this: IInstructor) {
  return {
    _id: this._id,
    name: this.name,
    profileImage: this.profileImage,
    experience: this.experience,
    rating: this.rating,
    totalStudents: this.totalStudents,
    totalCourses: this.totalCourses,
    bio: this.bio,
    currentPosition: this.currentPosition,
    currentCompany: this.currentCompany,
    linkedinUrl: this.linkedinUrl,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// ===================
// Static Methods
// ===================

InstructorSchema.statics.findByName = function(name: string) {
  return this.find({ 
    name: { $regex: name, $options: 'i' } 
  });
};

InstructorSchema.statics.findTopRated = function(limit: number = 10) {
  return this.find()
    .sort({ rating: -1, totalStudents: -1 })
    .limit(limit);
};

InstructorSchema.statics.findByMinRating = function(minRating: number) {
  return this.find({ rating: { $gte: minRating } })
    .sort({ rating: -1 });
};

export const InstructorModel = mongoose.model<IInstructor>('Instructor', InstructorSchema);
export default InstructorModel; 