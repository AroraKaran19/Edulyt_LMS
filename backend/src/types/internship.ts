import {
  Testimonial,
  PartnerCollege,
  User,
  FAQ,
  Instructor,
  CourseDiscount,
  Review,
  Discount,
} from ".";
import type { PlanFeatures } from "./course";

/** Per-batch enrollment pricing (embedded on each batch). */
export interface InternshipBatchPlan {
  title: string;
  price: number;
  features: PlanFeatures[];
  discount?: import(".").Discount;
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

/** One batch row as returned on public list/carousel (pricing slice only). */
export interface InternshipPublicListingBatch {
  _id?: string;
  isActive?: boolean;
  plan?: { price?: number } | null;
}

/**
 * GET /internships and /featured — minimal fields for cards (not full internship detail).
 */
export interface InternshipPublicListing {
  _id?: string;
  title: string;
  slug: string;
  thumbnail: string;
  analytics?: InternshipAnalytics;
  mentors?: (Instructor | Instructor["_id"])[];
  batches: InternshipPublicListingBatch[];
  discount?: CourseDiscount | null;
  /** Legacy root plan on old documents. */
  plan?: { price?: number; discount?: Discount } | null;
}

export interface InternshipBatches {
  _id?: string;
  name: string;
  applicationLastDate: Date;
  examDate: Date;
  internshipStartDate: Date;
  status: "active" | "inactive" | "completed";
  createdBy: User["_id"];
  isActive: boolean;
  reviews?: Review["_id"][];
  analytics?: InternshipBatchAnalytics;
  /** Pricing and features for this batch (learners see this when enrolling in the batch). */
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

  /** Embedded batch subdocuments (not a separate collection). */
  batches: InternshipBatches[];

  testimonials: Testimonial["_id"][];

  partnerColleges: PartnerCollege["_id"][];

  faqs: FAQ["_id"][];

  mentors: Instructor["_id"][];

  media: {
    icon: string;
    content: string;
    title: string;
  }[];

  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];

  /** Short bullet lines shown on the public internship hero (e.g. with checkmarks). */
  headerList?: string[];

  audience: "college-students" | "professionals";

  featured: boolean;

  discount?: CourseDiscount | null;

  analytics?: InternshipAnalytics;

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: User["_id"];
}

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

  /** Embedded batch subdocuments (not a separate collection). */
  batches: InternshipBatches[];

  testimonials: Testimonial[];

  partnerColleges: PartnerCollege[];

  faqs: FAQ[];

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

  headerList?: string[];

  audience: "college-students" | "professionals";

  featured: boolean;

  discount?: CourseDiscount | null;

  analytics?: InternshipAnalytics;

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: User;
}

/** Paginated public list payload (slim internship rows). */
export interface ListPublicInternshipsResult {
  internships: InternshipPublicListing[];
  total: number;
  page: number;
  totalPages: number;
}
