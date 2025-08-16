import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { Course } from "@/types";
import { AxiosError } from "axios";
import React from "react";

// Fetch course data
async function fetchCourse(
    courseId: string
  ): Promise<{ status: number; course: Course | null }> {
    try {
      const response = await fetcher(`${ENDPOINTS.courses.slug}/${courseId}`);
      return {
        status: response?.status,
        course: response?.data?.course || null,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          status: error.response?.status || 500,
          course: null,
        };
      }
      return { status: 500, course: null };
    }
  }

export async function generateMetadata({
    params,
  }: {
    params: Promise<{ courseId: string }>;
  }) {
    const courseId = (await params).courseId;
    const { course } = await fetchCourse(courseId);
  
    if (!course) {
      return {
        title: "Not Found | Edulyt",
        description: "The requested course could not be found.",
      };
    }
  
    return {
      title: course.metaTitle || `${course.title} | Edulyt`,
      description:
        course.metaDescription ||
        `Learn ${course.title} with Edulyt's comprehensive course.`,
      keywords: [
        "course",
        "edulyt",
        "learn",
        "education",
        ...(course.keywords || []),
      ],
      openGraph: {
        title: course.metaTitle || `${course.title} | Edulyt`,
        description:
          course.metaDescription || `Learn ${course.title} with Edulyt.`,
        url: `https://edulyt.com/courses/${courseId}`,
        type: "website",
        siteName: "Edulyt",
        images: [
          {
            url:
              course.thumbnail ||
              `https://edulyt.com/courses/${courseId}/thumbnail.png`,
            alt: `${course.title} course image`,
          },
        ],
      },
    };
  }

const IndividualCoursePageLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return children;
};

export default IndividualCoursePageLayout;
