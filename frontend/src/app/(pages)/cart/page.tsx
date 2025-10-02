import React from "react";
import CourseEnrollCart from "./components/CourseEnrollCart";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { Course } from "@/types";
import { AxiosError } from "axios";
import { Error } from "@/components/ui";
import { AlertCircle } from "lucide-react";

async function fetchCourse(
  courseSlug: string
): Promise<{ status: number; course: Course | null }> {
  try {
    const response = await fetcher(`${ENDPOINTS.courses.slug}/${courseSlug}`);
    return {
      status: response?.status,
      course: response?.data || null,
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

interface CartPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const CartPage = async ({ searchParams }: CartPageProps) => {
  const resolvedSearchParams = (await searchParams);
  const courseSlug = resolvedSearchParams.course as string;
  const planType = resolvedSearchParams.planType as
    | "elite"
    | "essential"
    | undefined;

  if (!courseSlug) {
    return (
      <Error
        icon={AlertCircle}
        title="Course Not Found"
        description="The course you're looking for doesn't exist or has been removed."
        className="h-[calc(100dvh-100px)] w-full"
      />
    );
  }

  const { course } = await fetchCourse(courseSlug);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Course Not Found
          </h1>
          <p className="text-gray-600">
            The course you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CourseEnrollCart course={course} planType={planType || "essential"} />
  );
};

export default CartPage;
