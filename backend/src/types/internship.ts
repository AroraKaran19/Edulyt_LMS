import type { Brand } from "../constants/brands";
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

/** Per-batch enrollment pricing (embedded on each batch). */
export interface InternshipBatchPlan {
  price: number;
  discount?: import(".").Discount;
  isActive?: boolean;
}

export interface InternshipBatchAnalytics {
  totalRatings: number;
  totalReviews: number;
  totalEnrollments: number;
  averageRating: number;
}

export type InternshipAnalytics = InternshipBatchAnalytics;

/** One batch row as returned on public list/carousel (pricing + cohort start). */
export interface InternshipPublicListingBatch {
  _id?: string;
  isActive?: boolean;
  plan?: { price?: number } | null;
  /** ISO string from API (next-cohort copy on cards). */
  internshipStartDate?: string;
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
  /** `false` = still listed, but closed for new registrations. */
  isActive?: boolean;
}

export interface InternshipBatches {
  _id?: string;
  name: string;
  applicationLastDate: Date;
  internshipStartDate: Date;
  status: "active" | "inactive" | "completed";
  createdBy: User["_id"];
  isActive: boolean;
  reviews?: Review["_id"][];
  analytics?: InternshipBatchAnalytics;
  /** Pricing and features for this batch (learners see this when enrolling in the batch). */
  plan?: InternshipBatchPlan | null;
  /** Single entrance exam template for this cohort (examType = "entrance"). */
  entranceExamTemplateId?: string | null;
  /**
   * Entrance exam wall-clock window for this cohort (UTC). Set alongside
   * `entranceExamTemplateId`; evaluated on the server only.
   */
  entranceExamStartAt?: Date;
  entranceExamEndAt?: Date;
  /** Single certification exam template for this cohort (examType = "certification"). */
  certificationExamTemplateId?: string | null;
  /**
   * Reusable task template ids (`InternshipTask` collection) for this cohort.
   */
  taskTemplateIds?: string[];
  /**
   * Documentation submission window (UTC, displayed as IST in admin UI).
   * Required for every batch. Merit or paid enrollees enter
   * `pending_documentation` until Aadhar + photo are submitted, then reach
   * `enrolled`. Submissions after `documentationEndAt` are flagged as late
   * but still accepted.
   */
  documentationStartAt?: Date;
  documentationEndAt?: Date;
}

export interface Internship {
  brand?: Brand;
  _id?: string;
  title: string;
  description: string;
  thumbnail: string;
  /** Optional image beside the enquiry form on the detail page. */
  enquiryImage?: string;

  certification: boolean;
  /** Minimum internship success points before certification exam (0 = none). */
  certificationThreshold: number;
  brochure: string;
  jobDescription?: string;
  /** Learner WhatsApp group invite link (optional). */
  whatsappGroupLink?: string;
  /**
   * Role / designation to print on the generated offer letter
   * (e.g. "Data Analytics Intern"). Required on create/update.
   */
  offerLetterDesignation: string;
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
  /** Optional image beside the enquiry form on the detail page. */
  enquiryImage?: string;

  certification: boolean;
  /** Minimum internship success points before certification exam (0 = none). */
  certificationThreshold: number;
  brochure: string;
  jobDescription?: string;
  /** Learner WhatsApp group invite link (optional). */
  whatsappGroupLink?: string;
  /**
   * Role / designation to print on the generated offer letter
   * (e.g. "Data Analytics Intern"). Required on create/update.
   */
  offerLetterDesignation: string;
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
