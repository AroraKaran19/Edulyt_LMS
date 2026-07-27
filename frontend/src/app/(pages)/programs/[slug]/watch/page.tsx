import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { Course } from "@/types";
import { AxiosError } from "axios";
import PreviewCourse from "./PreviewCourse";
import EnrollmentGuard from "@/components/EnrollmentGuard";

/**
 * The API has historically answered "no such course" with `200 []`, which is
 * truthy — a plain `|| null` let the empty array through as a course and the
 * page then crashed on `course.title`. Require an actual object with an id.
 */
function asCourse(payload: unknown): Course | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  return "_id" in payload ? (payload as Course) : null;
}

async function fetchCourse(slug: string): Promise<{
  status: number;
  course: Course | null;
}> {
  try {
    const response = await fetcher(`${ENDPOINTS.courses.bySlug}/${slug}`);
    return {
      status: response?.status || 500,
      course: asCourse(response?.data?.data),
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
      title: "Course Not Found | Airkrit",
      description: "The course you are looking for does not exist.",
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
      url: `https://airkrit.com/programs/${slug}/watch`,
      type: "website",
      siteName: "Airkrit",
      images: [
        {
          url:
            course.thumbnail ||
            `https://airkrit.com/programs/${slug}/watch/thumbnail.png`,
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

  // Missing, unpublished or disabled all land here. `notFound()` renders the
  // app's not-found page with a real 404 status, rather than a 200 that merely
  // looks like an error page.
  if (!course) notFound();

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
