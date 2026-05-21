import { UseFormReturn } from "react-hook-form";
import type {
  Internship,
  CourseDiscount,
  InternshipAnalytics,
  InternshipBatchAnalytics,
} from ".";
import type { InternshipBatchPlan } from "./internship";

/** Partner colleges - array of IDs referencing PartnerCollege documents */
export type PartnerCollegesField = string[];

/** Default per-batch plan (Screen 2 — each batch has its own). */
export function createDefaultInternshipBatchPlan(): InternshipBatchPlan {
  return {
    price: 0,
    isActive: true,
  };
}

/** Same defaults as course metadata discount (time window per day). */
export function createDefaultInternshipDiscount(): CourseDiscount {
  return {
    isActive: false,
    discount: "percentage",
    value: 0,
    startTime: "00:00",
    endTime: "23:00",
  };
}

export function createDefaultInternshipAnalytics(): InternshipAnalytics {
  return {
    totalRatings: 0,
    totalReviews: 0,
    totalEnrollments: 0,
    averageRating: 0,
  };
}

/** Batch row in the form (date fields as YYYY-MM-DD strings for inputs). Embedded on internship at save. */
export interface InternshipBatchFormValue {
  /** Present when editing an existing embedded batch (Mongo subdocument id). */
  _id?: string;
  name: string;
  applicationLastDate: string;
  internshipStartDate: string;
  status: "active" | "inactive" | "completed";
  isActive: boolean;
  /** Review ids; usually updated by backend, not the wizard. */
  reviews?: string[];
  analytics?: InternshipBatchAnalytics;
  plan: InternshipBatchPlan;
  /** Single entrance exam template for this cohort (examType = "entrance"). */
  entranceExamTemplateId?: string | null;
  /** ISO UTC — entrance window start (set with batch in admin; evaluated on server). */
  entranceExamStartAt?: string;
  entranceExamEndAt?: string;
  /** Single certification exam template for this cohort (examType = "certification"). */
  certificationExamTemplateId?: string | null;
  /** Reusable task template ids for this cohort (see `Internship` / `InternshipTask`). */
  taskTemplateIds?: string[];
  /**
   * Documentation submission window (ISO UTC strings; rendered as IST in UI).
   * Required per batch — learners enter `pending_documentation` after selection
   * until they submit Aadhar + photo.
   */
  documentationStartAt?: string;
  documentationEndAt?: string;
}

// Form data structure aligned with Internship schema
export interface InternshipFormData {
  // Basic Info (Screen 1)
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  thumbnailSource?: "upload" | "url";
  thumbnailS3Key?: string;
  audience: "college-students" | "professionals";
  mode: "online" | "offline" | "hybrid";
  certification: boolean;
  /** Minimum internship success points before learner may take certification exam (admin-configured). */
  certificationThreshold: number;
  /** Marketing: show in featured internships API / carousel. */
  featured: boolean;

  /** Hero highlight lines (Screen 1) — shown on public internship header. */
  headerList: string[];

  /** Document-level discount (Screen 3) — same shape as course `discount`. */
  discount: CourseDiscount;

  /** Roll-up metrics (typically server-maintained). */
  analytics: InternshipAnalytics;

  // Batches (Screen 2) — embedded on internship; each batch has a name and schedule
  batches: InternshipBatchFormValue[];

  // Perks (Screen 4)
  perks: {
    title: string;
    description: string;
    icon: string;
  }[];

  // Features (Screen 5)
  features: {
    title: string;
    description: string;
    icon: string;
  }[];

  // Why Join (Screen 6)
  whyJoin: {
    title: string;
    description: string;
    icon: string;
  }[];

  // Pre-requisites (Screen 7)
  preRequisites: {
    icon: string;
    title: string;
  }[];

  // Who Can Join (Screen 8)
  whoCanJoin: {
    icon: string;
    title: string;
  }[];

  // Internship Journey (Screen 9)
  internshipJourney: {
    title: string;
    items: string[];
  }[];

  // Media (Screen 8) — `content` is stored URL; upload metadata is form-only for S3 cleanup
  media: {
    icon: string;
    content: string;
    title: string;
    contentSource?: "upload" | "url";
    contentS3Key?: string;
  }[];

  // Resources (Screen 11)
  brochure: string;
  brochureSource?: "upload" | "url";
  brochureS3Key?: string;

  // Job Description document
  jobDescription: string;
  jobDescriptionSource?: "upload" | "url";
  jobDescriptionS3Key?: string;

  /** WhatsApp community / cohort group invite URL (optional). */
  whatsappGroupLink: string;

  /**
   * Role / designation printed on the generated offer letter
   * (e.g. "Data Analytics Intern"). Required.
   */
  offerLetterDesignation: string;

  // Testimonials (Screen 12)
  testimonials: string[];

  // FAQs (Screen 13)
  faqs: string[];

  // Mentors (to be added later after creation)
  mentors: string[];

  /** Partner colleges - array of IDs referencing PartnerCollege documents */
  partnerColleges: string[];

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];

  // Status
  isActive: boolean;

  // Internal form state
  currentScreen: number;
  completedScreens: number[];
  isEditMode: boolean;
  internshipId?: string;
}

export interface UseInternshipFormOptions {
  mode?: "create" | "edit";
  internshipId?: string;
  initialData?: Partial<InternshipFormData>;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export interface UseInternshipFormReturn {
  // Form methods from react-hook-form
  register: UseFormReturn<InternshipFormData>["register"];
  control: UseFormReturn<InternshipFormData>["control"];
  handleSubmit: UseFormReturn<InternshipFormData>["handleSubmit"];
  watch: UseFormReturn<InternshipFormData>["watch"];
  setValue: UseFormReturn<InternshipFormData>["setValue"];
  getValues: UseFormReturn<InternshipFormData>["getValues"];
  formState: UseFormReturn<InternshipFormData>["formState"];
  reset: UseFormReturn<InternshipFormData>["reset"];
  trigger: UseFormReturn<InternshipFormData>["trigger"];

  // Custom form state
  currentScreen: number;
  completedScreens: number[];
  isEditMode: boolean;
  internshipId?: string;

  // Navigation
  nextScreen: () => Promise<void>;
  prevScreen: () => void;
  goToScreen: (screen: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;

  // Validation
  isScreenCompleted: (screen: number) => boolean;
  validateCurrentScreen: () => Promise<boolean>;
  getScreenErrors: (screen: number) => string[];

  // Actions
  createInternship: () => Promise<void>;
  updateInternship: () => Promise<void>;
  updateInternshipMetadata: () => Promise<void>;
  deleteInternship: () => Promise<void>;
  saveDraft: () => void;
  loadDraft: () => void;
  clearDraft: () => void;

  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  isInternshipDataLoading: boolean;

  // Error states
  createError: string;
  updateError: string;
  deleteError: string;
  validationErrors: Record<string, string[]>;

  // Additional utilities
  generateSlug: (title: string) => string;
  generateMetaTitle: (title: string, audience: string) => string;
  generateMetaDescription: (description: string) => string;
  generateKeywords: (title: string, audience: string) => string[];

  // Internship creation status
  isInternshipCreated: () => boolean;
  getCreatedInternshipId: () => string | null;
  clearInternshipCreationStatus: () => void;
}
