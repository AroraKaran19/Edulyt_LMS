import { Course } from "@/types";
import type { Course as InternshipListingItem } from "@/constants/internshipData";

/** Maps static internship listing rows to app `Course` for `NewCourseCard`. */
export function internshipListingToCourse(item: InternshipListingItem): Course {
  return {
    _id: item.id,
    title: item.title,
    description: "",
    shortDescription: "",
    category: [],
    thumbnail: item.thumbnail,
    whatYouWillLearn: "",
    skills: [],
    highlights: [],
    careerPaths: [],
    skillLevel: "",
    whoShouldJoin: "",
    duration: "",
    instructor: [],
    plans: {
      essential: {
        title: "Essential",
        type: "essential",
        price: item.originalPrice,
        features: [],
        ...(item.discount > 0
          ? {
              discount: {
                discount: "percentage",
                value: item.discount,
                isActive: true,
              },
            }
          : {}),
      },
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "college-students",
    slug: "",
    language: "English",
    isFeatured: item.isBestSeller,
    analytics: {
      totalRatings: item.reviewCount,
      totalReviews: item.reviewCount,
      totalEnrollments: item.enrolledStudents,
      activeEnrollments: 0,
      completionRate: 0,
      averageRating: item.rating,
      averageCompletionTime: 0,
      dropoffPoints: [],
    },
  };
}
