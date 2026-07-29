/**
 * Form model for the CourseInternship program builder.
 *
 * Mirrors the internship builder's shape (screen config + form data) at the
 * scale this entity actually needs: four screens rather than fourteen, because
 * a program has no batches, exams, mentors, colleges or media library.
 */
export interface CourseInternshipFormData {
  title: string;
  description: string;

  thumbnail: string;
  /** Local-only: whether the thumbnail came from an upload or a pasted URL. */
  thumbnailSource?: "upload" | "url";
  /** Local-only: S3 key, so replacing an upload can delete the old object. */
  thumbnailS3Key?: string;

  perks: string[];
  whatYouWillDo: string[];
  offerLetterDesignation: string;
  whatsappGroupLink: string;

  taskTemplateIds: string[];
  documentationRequired: boolean;
  documentationDueOffsetDays: number;

  isActive: boolean;
}

export const COURSE_INTERNSHIP_TOTAL_SCREENS = 4;

export interface CourseInternshipScreenConfig {
  id: number;
  title: string;
  description: string;
  /** Returns true when the screen's required fields are filled. */
  validation: (data: CourseInternshipFormData) => boolean;
}

export const COURSE_INTERNSHIP_SCREENS: Record<
  number,
  CourseInternshipScreenConfig
> = {
  1: {
    id: 1,
    title: "Basic Information",
    description: "What the learner sees on their dashboard",
    validation: (data) => !!data.title?.trim(),
  },
  2: {
    id: 2,
    title: "Programme Details",
    description: "Perks, work and the details printed on documents",
    validation: () => true,
  },
  3: {
    id: 3,
    title: "Tasks & Documents",
    description: "What the learner has to complete, and by when",
    validation: () => true,
  },
  4: {
    id: 4,
    title: "Review & Publish",
    description: "Check the programme before saving",
    validation: (data) => !!data.title?.trim(),
  },
};

export const getDefaultCourseInternshipFormData =
  (): CourseInternshipFormData => ({
    title: "",
    description: "",
    thumbnail: "",
    thumbnailSource: "url",
    thumbnailS3Key: "",
    perks: [],
    whatYouWillDo: [],
    offerLetterDesignation: "",
    whatsappGroupLink: "",
    taskTemplateIds: [],
    documentationRequired: true,
    documentationDueOffsetDays: 7,
    isActive: true,
  });
