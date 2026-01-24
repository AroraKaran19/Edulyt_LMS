import MentorPage from "./components/MentorPage";
import { API_BASE_URL } from "@/constants/endpoints";
import { notFound } from "next/navigation";
import { Course, Instructor } from "@/types";
import { fetcher } from "@/lib/utils";

async function fetchInstructorProfile(slug: string): Promise<{
  status: number;
  instructor: Instructor | null;
  stats: { totalCourses?: number; totalStudents?: number } | null;
}> {
  try {
    if (!API_BASE_URL) {
      return { status: 500, instructor: null, stats: null };
    }

    const encoded = encodeURIComponent(slug);
    const response = await fetcher(`/public/instructors/${encoded}`);

    if (!response?.status || response.status >= 400) {
      return {
        status: response?.status || 500,
        instructor: null,
        stats: null,
      };
    }

    const json = response?.data as {
      data?: {
        instructor?: Instructor;
        stats?: { totalCourses?: number; totalStudents?: number };
      };
    } | null;

    return {
      status: response.status,
      instructor: json?.data?.instructor || null,
      stats: json?.data?.stats || null,
    };
  } catch {
    return { status: 500, instructor: null, stats: null };
  }
}

async function fetchInstructorCoursesPage(
  slug: string,
  page: number,
  limit: number
): Promise<{ status: number; courses: Course[]; total?: number; totalPages?: number }> {
  try {
    if (!API_BASE_URL) {
      return { status: 500, courses: [] };
    }

    const encoded = encodeURIComponent(slug);
    const response = await fetcher(
      `/public/instructors/${encoded}/courses?page=${page}&limit=${limit}`
    );

    if (!response?.status || response.status >= 400) {
      return { status: response?.status || 500, courses: [] };
    }

    const json = response?.data as {
      data?: { courses?: Partial<Course>[]; total?: number; totalPages?: number };
    } | null;

    return {
      status: response.status,
      courses: ((json?.data?.courses ?? []) as Course[]) || [],
      total: json?.data?.total,
      totalPages: json?.data?.totalPages,
    };
  } catch {
    return { status: 500, courses: [] };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const { instructor, stats } = await fetchInstructorProfile(slug);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://airkrit.com";

  if (!instructor) {
    return {
      title: "Not Found | Airkrit",
      description: "The requested instructor could not be found.",
    };
  }

  const name = [instructor.firstName, instructor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Instructor";

  const role = instructor.currentCompany
    ? `${instructor.currentPosition || "Instructor"} @ ${instructor.currentCompany}`
    : instructor.currentPosition || instructor.field || "Instructor";

  const description =
    instructor.bio ||
    `Learn from ${name}${role ? ` (${role})` : ""} on Airkrit.`;

  const imageUrl = instructor.profilePicture || `${siteUrl}/logo.svg`;

  return {
    title: `${name} | Airkrit`,
    description,
    keywords: [
      "instructor",
      "mentor",
      "airkrit",
      name,
      role,
      ...(instructor.field ? [instructor.field] : []),
      ...(typeof stats?.totalCourses === "number" ? [`${stats.totalCourses} courses`] : []),
    ].filter(Boolean),
    alternates: {
      canonical: `${siteUrl}/instructor/${slug}`,
    },
    openGraph: {
      title: `${name} | Airkrit`,
      description,
      url: `${siteUrl}/instructor/${slug}`,
      type: "profile",
      siteName: "Airkrit",
      images: [
        {
          url: imageUrl,
          alt: `${name} profile image`,
        },
      ],
    },
  };
}

const InstructorIndividualPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  if (!API_BASE_URL) {
    return notFound();
  }

  const [{ instructor, stats }, coursesPage] = await Promise.all([
    fetchInstructorProfile(slug),
    fetchInstructorCoursesPage(slug, 1, 4),
  ]);

  const initialCourses = coursesPage.courses;
  const totalCourses =
    typeof stats?.totalCourses === "number"
      ? stats.totalCourses
      : typeof coursesPage.total === "number"
        ? coursesPage.total
        : initialCourses.length;
  const totalStudents =
    typeof stats?.totalStudents === "number" ? stats.totalStudents : 0;

  if (!instructor) {
    return notFound();
  }

  return (
    <MentorPage
      slug={slug}
      instructor={instructor}
      initialCourses={initialCourses}
      totalCourses={totalCourses}
      totalStudents={totalStudents}
    />
  );
};

export default InstructorIndividualPage;
