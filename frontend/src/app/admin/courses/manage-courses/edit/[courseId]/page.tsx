"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCourses } from "@/hooks/useCourses";
import { useEditScreen } from "../contexts/EditScreenContext";
import { useEditCourseContext } from "../../../reducers/course/providers/EditCourseReducerProvider";
import { sanitizeCourseForFrontend } from "../../../reducers/course/utils/sanitization";
import { editDraftUtils } from "../utils/editDraftUtils";

// Import edit screens
import Screen1 from "../components/Screen1"; 
import FlexBox from "@/components/ui/FlexBox";
import Container from "@/app/admin/components/ui/Container";
import { BookOpenIcon } from "lucide-react";
import Screen2 from "../components/Screen2";
import Screen3 from "../components/Screen3";
import Screen4 from "../components/Screen4";
import Screen5 from "../components/Screen5";
import Screen6 from "../components/Screen6";
import Screen7 from "../components/Screen7";
import Screen8 from "../components/Screen8";

const EditCoursePage = () => {
  const { courseId } = useParams();
  const { getCourseByIdAdmin } = useCourses();
  const { setActiveScreen, activeScreen } = useEditScreen();
  const { actions } = useEditCourseContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Check if we have a draft for this course
        const hasDraft = editDraftUtils.hasDraft();
        const draftInfo = editDraftUtils.getDraftInfo();

        if (hasDraft && draftInfo && editDraftUtils.isDraftForCourse(courseId as string)) {
          // Load from draft
          const draft = editDraftUtils.getDraft();
          if (draft) {
            actions.setCourse(draft);
            const savedScreen = editDraftUtils.getSavedScreen();
            if (savedScreen) {
              setActiveScreen(savedScreen);
            }
            setIsLoading(false);
            return;
          }
        }

        // Fetch fresh data from server
        const result = await getCourseByIdAdmin(courseId as string);
        
        if (result.success && result.data) {
          // Transform course data for frontend
          const transformedCourse = sanitizeCourseForFrontend(result.data.course);
          actions.setCourse(transformedCourse);
          
          // Save to draft
          editDraftUtils.saveDraft(transformedCourse);
          editDraftUtils.saveEditCourseId(courseId as string);
          
          // Set initial screen
          setActiveScreen("screen1");
        } else {
          setError(result.error || "Failed to load course");
        }
      } catch (err) {
        console.error("Error loading course:", err);
        setError("Failed to load course data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, getCourseByIdAdmin, setActiveScreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear success flag if it exists
      if (sessionStorage.getItem('course_edit_success') === 'true') {
        sessionStorage.removeItem('course_edit_success');
        editDraftUtils.clearAll();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <FlexBox className="w-full h-full flex-col gap-8 px-8 relative">
      <Container
        title="Edit Course"
        icon={BookOpenIcon}
        className="rounded-t-none flex-shrink-0"
      />
      <FlexBox className="w-full flex-1 min-h-0 flex-col">
        {activeScreen === "screen1" && <Screen1 />}
        {activeScreen === "screen2" && <Screen2 />}
        {activeScreen === "screen3" && <Screen3 />}
        {activeScreen === "screen4" && <Screen4 />}
        {activeScreen === "screen5" && <Screen5 />}
        {activeScreen === "screen6" && <Screen6 />}
        {activeScreen === "screen7" && <Screen7 />}
        {activeScreen === "screen8" && <Screen8 />}
      </FlexBox>
    </FlexBox>
  );
};

export default EditCoursePage;
