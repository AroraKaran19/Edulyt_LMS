import { Course } from "@/types";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import { AxiosError } from "axios";
import CoursePage from "./CoursePage";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { redirect } from "next/navigation";
import { movedCourseUrl } from "@/lib/edulytRedirect";

// Fetch course data
async function fetchCourse(
  slug: string
): Promise<{ status: number; course: Course | null; movedTo?: string }> {
  try {
    const response = await fetcher(`${ENDPOINTS.courses.bySlug}/${slug}`);
    return {
      status: response?.status || 500,
      course: response?.data?.data || null,
      // `fetcher` returns error bodies instead of throwing.
      movedTo: response?.data?.error?.meta?.movedTo,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        status: error.response?.status || 500,
        course: null,
        movedTo: error.response?.data?.error?.meta?.movedTo,
      };
    }
    return { status: 500, course: null };
  }
}

/**
 * A course is only safe to render on the public page once its content step is
 * complete. Draft courses created in the admin wizard but never finished are
 * missing these required arrays, which would crash the overview components —
 * treat them as not-found instead.
 */
function isPublicViewableCourse(course: Course | null): course is Course {
  return (
    !!course &&
    Array.isArray(course.skills) &&
    Array.isArray(course.highlights) &&
    Array.isArray(course.careerPaths)
  );
}

// Generate metadata for the course page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const { course, movedTo } = await fetchCourse(slug);
  if (movedTo === "edulyt") {
    redirect(movedCourseUrl(slug));
  }

  if (!isPublicViewableCourse(course)) {
    return {
      title: "Not Found | Airkrit",
      description: "The requested course could not be found.",
    };
  }

  return {
    title: course.metaTitle || `${course.title} | Airkrit`,
    description:
      course.metaDescription ||
      `Learn ${course.title} with Airkrit's comprehensive course.`,
    keywords: [
      "course",
      "airkrit",
      "learn",
      "education",
      ...(course.keywords || []),
      ...(course.tags || []),
    ],
    openGraph: {
      title: course.metaTitle || `${course.title} | Airkrit`,
      description:
        course.metaDescription || `Learn ${course.title} with Airkrit.`,
      url: `https://airkrit.com/programs/${slug}`,
      type: "website",
      siteName: "Airkrit",
      images: [
        {
          url:
            course.thumbnail ||
            `https://airkrit.com/programs/${slug}/thumbnail.png`,
          alt: `${course.title} course image`,
        },
      ],
    },
  };
}

const IndividualCoursePage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const { status, course, movedTo } = await fetchCourse(slug);
  // Temporary, not permanent: slugs are unique per brand, so Airkrit may
  // publish its own course on this URL later, and a cached 301 would keep
  // sending visitors to Edulyt long after it does.
  if (movedTo === "edulyt") {
    redirect(movedCourseUrl(slug));
  }

  const errorConfig = getErrorUIConfig({
    statusCode: status,
    errorType: "backend",
  });
  if (status === 404 || !isPublicViewableCourse(course)) {
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

  return <CoursePage course={course} />;
};

export default IndividualCoursePage;
