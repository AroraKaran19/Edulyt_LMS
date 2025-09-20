import { Course, FAQ, Testimonial } from "@/types";

/**
 * Type guard to check if testimonials are populated objects
 */
export const isTestimonialsPopulated = (
  testimonials: Testimonial[] | Testimonial["_id"][]
): testimonials is Testimonial[] => {
  return (
    testimonials.length > 0 &&
    typeof testimonials[0] === "object" &&
    "_id" in testimonials[0]
  );
};

/**
 * Type guard to check if FAQs are populated objects
 */
export const isFAQsPopulated = (faqs: FAQ[] | FAQ["_id"][]): faqs is FAQ[] => {
  return faqs.length > 0 && typeof faqs[0] === "object" && "_id" in faqs[0];
};

/**
 * Get testimonial IDs from either populated or non-populated testimonials
 */
export const getTestimonialIds = (
  testimonials: Testimonial[] | Testimonial["_id"][]
): Testimonial["_id"][] => {
  if (isTestimonialsPopulated(testimonials)) {
    return testimonials
      .map((testimonial) => testimonial._id)
      .filter((id) => id && id.trim() !== "");
  }
  return testimonials.filter((id) => id && id.trim() !== "");
};

/**
 * Get FAQ IDs from either populated or non-populated FAQs
 */
export const getFAQIds = (faqs: FAQ[] | FAQ["_id"][]): FAQ["_id"][] => {
  if (isFAQsPopulated(faqs)) {
    return faqs.map((faq) => faq._id).filter((id) => id && id.trim() !== "");
  }
  return faqs.filter((id) => id && id.trim() !== "");
};

/**
 * Check if a course has populated data
 */
export const isCoursePopulated = (course: Course): boolean => {
  return (
    isTestimonialsPopulated(course.testimonials) && isFAQsPopulated(course.faqs)
  );
};

/**
 * Extract only the metadata from a course (for saving)
 */
export const extractCourseMetadata = (course: Course) => {
  return {
    ...course,
    testimonials: getTestimonialIds(course.testimonials),
    faqs: getFAQIds(course.faqs),
    modules: [], // Always empty for metadata-only creation
    reviews: [], // Always empty for metadata-only creation
  };
};
