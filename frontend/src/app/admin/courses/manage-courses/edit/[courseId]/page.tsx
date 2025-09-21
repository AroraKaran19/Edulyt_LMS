"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useCourses } from "@/hooks/useCourses";
import { useEditCourseContext } from "../../../reducers/course/providers/EditCourseReducerProvider";
import { sanitizeCourseForFrontend } from "../../../reducers/course/utils/sanitization";
import { draftUtils } from "../utils/draftUtils";
import EditCoursePage from "../page";

const EditCoursePageWithData = () => {
  const { courseId } = useParams();
  const { getCourseByIdAdmin } = useCourses();
  const { actions } = useEditCourseContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to access current actions without causing re-renders
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const loadCourseData = useCallback(async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Check if we have a draft for this course
      const hasDraft = draftUtils.hasDraft();
      const draftInfo = draftUtils.getDraftInfo();

      if (hasDraft && draftInfo && draftUtils.isDraftForCourse(courseId as string)) {
        // Load from draft
        const draft = draftUtils.getDraft();
        if (draft) {
          actionsRef.current.setCourse(draft);
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh data from server
      const result = await getCourseByIdAdmin(courseId as string);
      
      if (result.success && result.data) {
        // Transform course data for frontend
        const transformedCourse = sanitizeCourseForFrontend(result.data.course);
        actionsRef.current.setCourse(transformedCourse);
        
      // Save to draft
      draftUtils.saveDraft(transformedCourse);
      draftUtils.saveEditCourseId(courseId as string);
      } else {
        setError(result.error || "Failed to load course");
      }
    } catch (err) {
      console.error("Error loading course:", err);
      setError("Failed to load course data");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, getCourseByIdAdmin]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear success flag if it exists
      if (sessionStorage.getItem('course_edit_success') === 'true') {
        sessionStorage.removeItem('course_edit_success');
        draftUtils.clearAll();
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

  return <EditCoursePage />;
};

export default EditCoursePageWithData;
