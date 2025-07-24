"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import FlexBox from "@/components/ui/FlexBox";
import {
  CourseFormProvider,
  useCourseFormContext,
} from "../../create/context/CourseFormContext";
import BasicInformationSection from "../../create/components/BasicInformationSection";
import InstructorSection from "../../create/components/InstructorSection";
import ModulesSection from "../../create/components/ModulesSection";
import PricingSection from "../../create/components/PricingSection";
import FAQSection from "../../create/components/FAQSection";
import ReviewsSection from "../../create/components/ReviewsSection";
import SubmissionSection from "../../create/components/SubmissionSection";
import courseService from "@/services/courseService";
import { Course } from "@/types";
import LearningOutcomesSection from "../../create/components/LearningOutcomesSection";
import SEOSection from "../../create/components/SEOSection";

const EditCoursePage = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<Course | null>(null);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) {
        setError("Course ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await courseService.getCourseById(courseId);
        if (response.success && response.data) {
          setCourseData(response.data); // Backend returns course directly in data field
        } else {
          setError(response.message || "Failed to fetch course data");
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("An error occurred while fetching course data");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <FlexBox className="w-full h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-gray-600">Loading course data...</span>
        </div>
      </FlexBox>
    );
  }

  if (error || !courseData) {
    return (
      <FlexBox className="w-full h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Course
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </FlexBox>
    );
  }

  return (
    <CourseFormProvider storageKey={`course-edit-${courseId}`}>
      <EditCourseContent courseData={courseData} />
    </CourseFormProvider>
  );
};

// Separate component to have access to CourseFormContext
const EditCourseContent = ({
  courseData,
}: {
  courseData: Course;
}) => {
  const router = useRouter();
  const { loadCourseData } = useCourseFormContext();
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load course data into form when component mounts (only once)
  useEffect(() => {
    if (courseData && !isDataLoaded) {
      loadCourseData(courseData);
      setIsDataLoaded(true);
    }
  }, [courseData, loadCourseData, isDataLoaded]);

  return (
    <FlexBox className="w-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin/courses/manage-courses")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Courses</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Edit Course
                </h1>
                <p className="text-sm text-gray-600">{courseData.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Edit Mode
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <BasicInformationSection />
          <LearningOutcomesSection />
          <InstructorSection />
          <PricingSection />
          <ModulesSection />
          <FAQSection />
          <ReviewsSection />
          <SEOSection />
          <SubmissionSection />
        </div>
      </div>
    </FlexBox>
  );
};

export default EditCoursePage;
