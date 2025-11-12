import { Course } from "@/types";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import { AxiosError } from "axios";
import CoursePage from "./CoursePage";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";

// Fetch course data
async function fetchCourse(
  slug: string
): Promise<{ status: number; course: Course | null }> {
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

// Generate metadata for the course page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const { course } = await fetchCourse(slug);

  if (!course) {
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
      url: `https://airkrit.com/courses/${slug}`,
      type: "website",
      siteName: "Airkrit",
      images: [
        {
          url:
            course.thumbnail ||
            `https://airkrit.com/courses/${slug}/thumbnail.png`,
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
  const { status, course } = await fetchCourse(slug);

  const errorConfig = getErrorUIConfig({
    statusCode: status,
    errorType: "backend",
  });
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

  console.log(course);

  return <CoursePage course={course} />;
};

export default IndividualCoursePage;
