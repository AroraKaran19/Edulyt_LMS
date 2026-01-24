import MentorPage from "./components/MentorPage";
import { API_BASE_URL } from "@/constants/endpoints";
import { notFound } from "next/navigation";
import { Course, Instructor } from "@/types";

const InstructorIndividualPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  if (!API_BASE_URL) {
    return notFound();
  }

  const encoded = encodeURIComponent(slug);
  const [profileRes, coursesRes] = await Promise.all([
    fetch(`${API_BASE_URL}/public/instructors/${encoded}`, { cache: "no-store" }),
    fetch(`${API_BASE_URL}/public/instructors/${encoded}/courses?page=1&limit=4`, {
      cache: "no-store",
    }),
  ]);

  if (!profileRes.ok) return notFound();
  if (!coursesRes.ok) return notFound();

  const profileJson = (await profileRes.json()) as {
    data?: {
      instructor?: Instructor;
      stats?: { totalCourses?: number; totalStudents?: number };
    };
  };

  const coursesJson = (await coursesRes.json()) as {
    data?: { courses?: Partial<Course>[]; total?: number; page?: number; totalPages?: number };
  };

  const instructor = profileJson?.data?.instructor;
  const initialCourses = (coursesJson?.data?.courses ?? []) as Course[];
  const totalCourses =
    typeof profileJson?.data?.stats?.totalCourses === "number"
      ? profileJson.data.stats.totalCourses
      : typeof coursesJson?.data?.total === "number"
        ? coursesJson.data.total
        : initialCourses.length;
  const totalStudents =
    typeof profileJson?.data?.stats?.totalStudents === "number"
      ? profileJson.data.stats.totalStudents
      : 0;

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
