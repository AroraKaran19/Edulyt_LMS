import Error from "@/components/ui/Error";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { Course } from "@/types";
import { AxiosError } from "axios";
import React from "react";
import PreviewCourse from "./PreviewCourse";

async function fetchCourse(
  courseSlug: string,
): Promise<{
  status: number;
  course: Course | null;
}> {
  try {
    const response = await fetcher(`${ENDPOINTS.courses.slug}/${courseSlug}`);
    return {
      status: response?.status,
      course: response?.data?.course || null
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
  const { courseId } = await params;
  const { course } = await fetchCourse(courseId);

  if (!course) {
    return {
      title: "Module Not Found | Airkrit",
      description: "The module you are looking for does not exist.",
    };
  }

  return {
    title: `Course: ${course.title} | Airkrit`,
    description: course.metaDescription || `Learn ${course.title}`,
    keywords: [
      "course",
      "airkrit",
      "learn",
      "education",
      ...(course.keywords || []),
    ],
    openGraph: {
      title: course.metaTitle || `${course.title} | Airkrit`,
      description:
        course.metaDescription || `Learn ${course.title} with Airkrit.`,
      url: `https://airkrit.com/courses/${courseId}/watch`,
      type: "website",
      siteName: "Airkrit",
      images: [
        {
          url:
            course.thumbnail ||
            `https://airkrit.com/courses/${courseId}/watch/thumbnail.png`,
          alt: `${course.title} course image`,
        },
      ],
    },
  };
}

const IndividualModulePage = async ({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) => {
  const { courseId } = await params;
  const { course } = await fetchCourse(courseId);

  const errorConfig = getErrorUIConfig({
    statusCode: 404,
    errorType: "backend",
  });
  if (!course) {
    return (
      <Error
        icon={errorConfig.icon}
        iconColor={errorConfig.iconColor}
        title="Module Not Found"
        description="The module you are looking for does not exist."
        className="h-[calc(100dvh-100px)] w-full"
      />
    );
  }

  return <PreviewCourse course={course} />;
};

export default IndividualModulePage;
