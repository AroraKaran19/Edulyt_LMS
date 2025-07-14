import React from "react";
import CoursePage from "./CoursePage";
import { fetcher } from "@/lib/utils";
import { ENDPOINTS } from "@/constants/endpoints";
import { Course } from "@/types";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import { AxiosError } from "axios";

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

// Generate metadata for the course page
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

const IndividualCoursePage = async ({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) => {
  const { courseId } = await params;
  const { status, course } = await fetchCourse(courseId);

  const errorConfig = getErrorUIConfig({ statusCode: status, errorType: "backend" });
  if (status === 404 || !course) {
    return (
      <Error
        icon={errorConfig.icon}
        iconColor={errorConfig.iconColor}
        title="Course Not Found"
        description="The course you're looking for doesn't exist or has been removed."
        className="h-[calc(100dvh-100px)] w-full"
      />
    );
  }
  if (status >= 400) {
    return (
      <Error
        icon={errorConfig.icon}
        iconColor={errorConfig.iconColor}
        title={errorConfig.title}
        description={errorConfig.description}
        className="min-h-[calc(100dvh-100px)] w-full"
      />
    );
  }
  return (
    <CoursePage course={course} />
  );
};

export default IndividualCoursePage;
