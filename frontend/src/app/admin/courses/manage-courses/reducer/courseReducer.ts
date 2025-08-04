import { Course } from "@/types";

const initialState: Course = {
  title: "",
  description: "",
  shortDescription: "",
  category: "",
  subcategory: "",
  thumbnail: "",
  previewVideoUrl: "",

  isFeatured: false,
  isCertified: false,

  // Metrics
  enrolledCount: 0,
  totalRatings: 0,
  totalLectures: 0,

  // UI & Learning Info
  whatYouWillLearn: "",
  skills: [],
  keyFeatures: [],
  features: [],
  careerPaths: [],
  skillLevel: "",
  whoShouldJoin: "",
  prerequisites: [],
  discount: undefined,
  duration: "", // like: 3 months, 1 year, 2 years, etc. (will not be accurate)

  // Content
  modules: [],

  // Instructor
  instructor: [],

  // Pricing Plans
  plans: {
      elite: undefined,
      essential: undefined,
  },

  // Reviews
  reviews: [],
  featuredReviews: [],

  // FAQs
  faqs: [],

  // Administrative
  isActive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "",
  tags: [],
  audience: "college-students", 

  // SEO
  slug: "",
  metaTitle: "",
  metaDescription: "",
  keywords: [],

  // Scholarship
  scholarship: false,
  scholarshipDescription: "",
  scholarshipQuiz: [],

  // Language
  language: "en",
};

const courseReducer = (state: Course, action: any) => {
  switch (action.type) {
    case "SET_COURSE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};