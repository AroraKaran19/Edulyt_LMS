import {
  Testimonial,
  User,
  FAQ,
  PartnerCollege,
  Instructor,
  CourseDiscount,
  Review,
  Discount,
} from ".";

/** Enrollment pricing for a single batch (embedded on `InternshipBatches`). */
export interface InternshipBatchPlan {
  price: number;
  discount?: Discount;
  isActive?: boolean;
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
    /** ISO string from API — used for “next batch starts” on listing cards. */
    internshipStartDate?: string;
  }[];
  discount?: CourseDiscount | null;
  plan?: { price?: number; discount?: Discount } | null;
}

export interface InternshipBatches {
  _id?: string;
  name: string;
  applicationLastDate: Date;
  internshipStartDate: Date;
  status: "active" | "inactive" | "completed";
  createdBy?: User["_id"];
  isActive: boolean;
  reviews?: Review["_id"][];
  analytics?: InternshipBatchAnalytics;
  plan?: InternshipBatchPlan | null;
  /** Single entrance exam template for this cohort (examType = "entrance"). */
  entranceExamTemplateId?: string | null;
  /** Entrance exam window (UTC), stored on the batch — not on the template. */
  entranceExamStartAt?: Date | string;
  entranceExamEndAt?: Date | string;
  /** Single certification exam template for this cohort (examType = "certification"). */
  certificationExamTemplateId?: string | null;
  /**
   * Reusable task template ids (`InternshipTask` collection) for this cohort.
   */
  taskTemplateIds?: string[];
}

export interface Internship {
  _id?: string;
  title: string;
  description: string;
  thumbnail: string;

  certification: boolean;
  /** Minimum internship success points before certification exam (0 = none). */
  certificationThreshold: number;
  brochure: string;
  jobDescription?: string;
  /** Learner WhatsApp group invite link (optional). */
  whatsappGroupLink?: string;
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

  /**
   * Documentation submission window (ISO strings, UTC). Required for each
   * internship — enrollments pass through `pending_documentation` until KYC is
   * submitted (admin sets opens/closes on Screen 1).
   */
  documentationStartAt?: string;
  documentationEndAt?: string;

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
  /** Minimum internship success points before certification exam (0 = none). */
  certificationThreshold: number;
  brochure: string;
  jobDescription?: string;
  /** Learner WhatsApp group invite link (optional). */
  whatsappGroupLink?: string;
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

  /** Documentation window (ISO strings, UTC). See {@link Internship.documentationStartAt}. */
  documentationStartAt?: string;
  documentationEndAt?: string;

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: User;
}

/** GET /internships/slug/:slug/enroll-preview — public enroll form payload. */
export interface InternshipEnrollPreviewEntranceExam {
  title: string;
  examStartAt: string | null;
  examEndAt: string | null;
  examResultAt: string | null;
}

export interface InternshipEnrollPreviewBatch {
  _id: string;
  name: string;
  applicationLastDate: string;
  internshipStartDate: string;
  status: string;
  isActive: boolean;
  entranceExam: InternshipEnrollPreviewEntranceExam | null;
  /** Present when the batch has an active purchasable plan (paid-seat path). */
  plan?: { listPrice: number; amount: number };
}

export interface InternshipEnrollPreview {
  internship: {
    _id: string;
    title: string;
    slug: string;
    whatsappGroupLink?: string;
  };
  batches: InternshipEnrollPreviewBatch[];
}
