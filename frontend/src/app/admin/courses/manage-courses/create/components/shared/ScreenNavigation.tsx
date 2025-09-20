import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScreenNavigationProps {
  currentStep: number;
  totalSteps?: number;
  previousScreen?: string;
  nextScreen?: string;
  nextButtonText?: string;
  nextButtonIcon?: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  isNextDisabled?: boolean;
  isPreviousDisabled?: boolean;
  showPrevious?: boolean;
  showNext?: boolean;
  isLoading?: boolean;
  className?: string;
  setActiveScreen: (screen: string) => void;
}

const ScreenNavigation: React.FC<ScreenNavigationProps> = ({
  currentStep,
  totalSteps = 8,
  previousScreen,
  nextScreen,
  nextButtonText = "Next Page",
  nextButtonIcon,
  onNext,
  onPrevious,
  isNextDisabled = false,
  isPreviousDisabled = false,
  showPrevious = true,
  showNext = true,
  isLoading = false,
  className = "",
  setActiveScreen,
}) => {
  const [isCourseCreated, setIsCourseCreated] = useState(false);

  // Check if course metadata has been created
  useEffect(() => {
    const checkCourseCreated = () => {
      const courseId = localStorage.getItem("current_course_id");
      setIsCourseCreated(!!courseId);
    };

    checkCourseCreated();

    // Listen for storage changes (in case course is created in another tab)
    window.addEventListener("storage", checkCourseCreated);

    return () => {
      window.removeEventListener("storage", checkCourseCreated);
    };
  }, []);

  // Calculate progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100;
  const router = useRouter();

  // Handle previous button click
  const handlePrevious = () => {
    // Don't allow going back if course metadata has been created
    if (isCourseCreated) {
      return;
    }

    if (onPrevious) {
      onPrevious();
    } else if (previousScreen) {
      setActiveScreen(previousScreen);
    }
  };

  // Handle back button click - different behavior for create vs edit
  const handleBack = () => {
    // For create mode, go back to courses list
    // For edit mode, also go back to courses list
    router.push("/admin/courses/manage-courses");
  };

  // Handle next button click
  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (nextScreen) {
      setActiveScreen(nextScreen);
    }
  };

  return (
    <div
      className={`border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:px-8 ${className}`}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:items-center sm:justify-between">
        {/* Previous Button */}
        <div className="order-2 sm:order-1">
          {showPrevious ? (
            <button
              onClick={handlePrevious}
              disabled={isPreviousDisabled || isLoading || isCourseCreated}
              title={
                isCourseCreated
                  ? "Cannot go back after course metadata is created"
                  : ""
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          ) : (
            <button
              onClick={handleBack}
              disabled={isPreviousDisabled || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Courses
            </button>
          )}
        </div>

        {/* Mobile Progress indicator */}
        <div className="flex sm:hidden items-center justify-center gap-3 order-1 py-2">
          <span className="text-sm text-gray-600 font-medium">
            Step {currentStep} of {totalSteps}
          </span>
          <div className="flex-1 max-w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Next Button */}
        <div className="order-3">
          {showNext && (
            <button
              onClick={handleNext}
              disabled={isNextDisabled || isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {nextButtonText}
                  {nextButtonIcon || <ChevronRight className="w-4 h-4" />}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenNavigation;
