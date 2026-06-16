import { Suspense } from "react";
import Error from "@/components/ui/Error";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { Course } from "@/types";
import { AxiosError } from "axios";
import PreviewCourse from "./PreviewCourse";
import EnrollmentGuard from "@/components/EnrollmentGuard";

async function fetchCourse(slug: string): Promise<{
  status: number;
  course: Course | null;
}> {
  try {
    const response = await fetcher(`${ENDPOINTS.courses.bySlug}/${slug}`);
    return {
      status: response?.status || 500,
      course: response?.data?.data || null,
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { course } = await fetchCourse(slug);

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
      url: `https://airkrit.com/courses/${slug}/watch`,
      type: "website",
      siteName: "Airkrit",
      images: [
        {
          url:
            course.thumbnail ||
            `https://airkrit.com/courses/${slug}/watch/thumbnail.png`,
          alt: `${course.title} course image`,
        },
      ],
    },
  };
}

const IndividualModulePage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const { course } = await fetchCourse(slug);

  const errorConfig = getErrorUIConfig({
    statusCode: 404,
    errorType: "backend",
  });
  if (!course) {
    return (
      <Error
        icon={errorConfig.icon}
        iconColor={errorConfig.iconColor}
        title="Course Not Found"
        description="The course you are looking for does not exist."
        className="h-[calc(100dvh-100px)] w-full"
      />
    );
  }

  return (
    <EnrollmentGuard course={course}>
      <Suspense
        fallback={
          <div className="w-full min-h-[50vh] flex items-center justify-center text-gray-500 text-sm">
            Loading course…
          </div>
        }
      >
        <PreviewCourse course={course} />
      </Suspense>
    </EnrollmentGuard>
  );
};

export default IndividualModulePage;
