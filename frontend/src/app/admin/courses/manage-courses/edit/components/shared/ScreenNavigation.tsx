import { useRouter } from "next/navigation";
import React from "react";
import FlexBox from "@/components/ui/FlexBox";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

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

  // Calculate progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100;
  const router = useRouter();

  // Handle previous button click
  const handlePrevious = () => {
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
    <FlexBox
      className={`w-full gap-4 mt-auto mb-4 justify-between ${className}`}
    >
      {/* Previous Button */}
      {showPrevious ? (
        <OrangeButton
          className="w-max px-16 mx-2"
          onClick={handlePrevious}
          disabled={isPreviousDisabled || isLoading}
        >
          Previous
        </OrangeButton>
      ) : (
        <WhiteButton
          className="w-max px-16 mx-2"
          onClick={handleBack}
          disabled={isPreviousDisabled || isLoading}
        >
          Back to Courses
        </WhiteButton>
      )}

      <FlexBox className="gap-4 items-center">
        {/* Progress indicator */}
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
          <span>
            Step {currentStep} of {totalSteps}
          </span>
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Next Button */}
        {showNext && (
          <OrangeButton
            className="w-max px-16 flex items-center gap-2 mx-2"
            onClick={handleNext}
            disabled={isNextDisabled || isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {nextButtonIcon}
                {nextButtonText}
              </>
            )}
          </OrangeButton>
        )}
      </FlexBox>
    </FlexBox>
  );
};

export default ScreenNavigation;
