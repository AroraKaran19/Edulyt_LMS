import {
  Testimonial,
  User,
  FAQ,
  PartnerCollege,
  Instructor,
  CourseDiscount,
  Review,
  PlanFeatures,
  Discount,
} from ".";

/** Enrollment pricing for a single batch (embedded on `InternshipBatches`). */
export interface InternshipBatchPlan {
  title: string;
  price: number;
  features: PlanFeatures[];
  discount?: Discount;
  isPopular?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InternshipBatchAnalytics {
  totalRatings: number;
  totalReviews: number;
  totalEnrollments: number;
  averageRating: number;
}

export type InternshipAnalytics = InternshipBatchAnalytics;

/** GET /internships & /featured — slim rows for cards (not full detail). */
export interface InternshipPublicListing {
  _id?: string;
  title: string;
  slug: string;
  thumbnail: string;
  analytics?: InternshipAnalytics;
  mentors?: (Instructor | Instructor["_id"])[];
  batches: {
    _id?: string;
    isActive?: boolean;
    plan?: { price?: number } | null;
  }[];
  discount?: CourseDiscount | null;
  plan?: { price?: number; discount?: Discount } | null;
}

export interface InternshipBatches {
  _id?: string;
  name: string;
  applicationLastDate: Date;
  examDate: Date;
  internshipStartDate: Date;
  status: "active" | "inactive" | "completed";
  createdBy?: User["_id"];
  isActive: boolean;
  reviews?: Review["_id"][];
  analytics?: InternshipBatchAnalytics;
  plan?: InternshipBatchPlan | null;
}

export interface Internship {
  _id?: string;
  title: string;
  description: string;
  thumbnail: string;

  certification: boolean;
  brochure: string;
  mode: "online" | "offline" | "hybrid";

  perks: {
    title: string;
    description: string;
    icon: string;
  }[];

  features: {
    title: string;
    description: string;
    icon: string;
  }[];

  whyJoin: {
    title: string;
    description: string;
    icon: string;
  }[];

  preRequisites: {
    icon: string;
    title: string;
  }[];

  whoCanJoin: {
    icon: string;
    title: string;
  }[];

  internshipJourney: {
    title: string;
    items: string[];
  }[];

  batches: InternshipBatches[];

  testimonials: Testimonial["_id"][];
  partnerColleges: PartnerCollege["_id"][];
  faqs: FAQ["_id"][];
  mentors: Instructor[] | Instructor["_id"][];

  media: {
    icon: string;
    content: string;
    title: string;
  }[];

  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];

  /** Hero highlight lines (public detail page). */
  headerList?: string[];

  audience: "college-students" | "professionals";

  featured: boolean;

  /** Optional time-window discount (same shape as course `discount`). */
  discount?: CourseDiscount | null;

  analytics?: InternshipAnalytics;

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: User["_id"];
}

/**
 * Admin GET response with populated relations (backend `InternshipResponse`).
 */
export interface InternshipResponse {
  _id?: string;
  title: string;
  description: string;
  thumbnail: string;

  certification: boolean;
  brochure: string;
  mode: "online" | "offline" | "hybrid";

  perks: {
    title: string;
    description: string;
    icon: string;
  }[];

  features: {
    title: string;
    description: string;
    icon: string;
  }[];

  whyJoin: {
    title: string;
    description: string;
    icon: string;
  }[];

  preRequisites: {
    icon: string;
    title: string;
  }[];

  whoCanJoin: {
    icon: string;
    title: string;
  }[];

  internshipJourney: {
    title: string;
    items: string[];
  }[];

  batches: InternshipBatches[];

  testimonials: Testimonial[];
  partnerColleges: PartnerCollege[];
  faqs: FAQ[];
  mentors: User[];

  media: {
    icon: string;
    content: string;
    title: string;
  }[];

  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];

  headerList?: string[];

  audience: "college-students" | "professionals";

  featured: boolean;

  discount?: CourseDiscount | null;

  analytics?: InternshipAnalytics;

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: User;
}
