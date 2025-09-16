import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Save, CheckCircle, Loader } from "lucide-react";
import { useCourseSteps } from "@/hooks/useCourseSteps";
import { useStepwise } from "../../contexts/StepwiseContext";
import { useCourseContext } from "../../../../reducers/course/providers/CourseReducerProvider";
import { toast } from "react-toastify";

interface StepwiseNavigationProps {
  currentStep: number;
  totalSteps: number;
  previousScreen?: string;
  nextScreen?: string;
  nextButtonText?: string;
  showPrevious?: boolean;
  isNextDisabled?: boolean;
  setActiveScreen: (screen: string) => void;
  onStepSave?: () => Promise<boolean>; // Optional custom save logic
}

const StepwiseNavigation: React.FC<StepwiseNavigationProps> = ({
  currentStep,
  totalSteps,
  previousScreen,
  nextScreen,
  nextButtonText = "Next",
  showPrevious = true,
  isNextDisabled = false,
  setActiveScreen,
  onStepSave,
}) => {
  const {
    saveBasicInfo,
    saveLearningObjectives,
    saveMedia,
    saveAudienceRequirements,
    savePricing,
    saveAdditionalContent,
    saveCourseContent,
    isLoading,
  } = useCourseSteps();

  const { courseId, setCourseId, markStepComplete, isStepComplete } = useStepwise();
  const { state } = useCourseContext();
  const [isSaving, setIsSaving] = useState(false);

  // Step-specific save functions
  const saveCurrentStep = async (): Promise<boolean> => {
    if (onStepSave) {
      return await onStepSave();
    }

    setIsSaving(true);
    
    try {
      const course = state.course;
      let result;

      switch (currentStep) {
        case 1:
          // Save basic information and get courseId
          result = await saveBasicInfo({
            title: course.title,
            description: course.description,
            shortDescription: course.shortDescription,
            category: course.category,
            subcategory: course.subcategory,
            audience: course.audience,
            language: course.language,
            duration: course.duration,
            curriculum: course.curriculum,
          });
          
          if (result.success && result.data?.courseId) {
            setCourseId(result.data.courseId);
            console.log("📊 Step 1 saved - Course created with ID:", result.data.courseId);
          }
          break;

        case 2:
          if (!courseId) {
            throw new Error("Course ID is required for step 2");
          }
          result = await saveLearningObjectives(courseId, {
            whatYouWillLearn: course.whatYouWillLearn,
            skills: course.skills,
            highlights: course.highlights,
            features: course.features,
          });
          break;

        case 3:
          if (!courseId) {
            throw new Error("Course ID is required for step 3");
          }
          result = await saveMedia(courseId, {
            thumbnail: course.thumbnail,
            previewVideoUrl: course.previewVideoUrl,
          });
          break;

        case 4:
          if (!courseId) {
            throw new Error("Course ID is required for step 4");
          }
          result = await saveAudienceRequirements(courseId, {
            skillLevel: course.skillLevel,
            whoShouldJoin: course.whoShouldJoin,
            prerequisites: course.prerequisites,
            careerPaths: course.careerPaths,
          });
          break;

        case 5:
          if (!courseId) {
            throw new Error("Course ID is required for step 5");
          }
          result = await savePricing(courseId, {
            plans: course.plans,
            discount: course.discount,
            scholarship: course.scholarship,
            scholarshipDescription: course.scholarshipDescription,
          });
          break;

        case 6:
          if (!courseId) {
            throw new Error("Course ID is required for step 6");
          }
          result = await saveAdditionalContent(courseId, {
            testimonials: course.testimonials,
            faqs: course.faqs,
            prerequisites: course.prerequisites,
          });
          break;

        case 7:
          if (!courseId) {
            throw new Error("Course ID is required for step 7");
          }
          result = await saveCourseContent(courseId, {
            modules: course.modules,
          });
          break;

        default:
          // For steps that don't need saving
          return true;
      }

      if (result?.success) {
        markStepComplete(currentStep);
        toast.success(`Step ${currentStep} saved successfully!`, {
          position: "top-right",
          autoClose: 2000,
        });
        return true;
      } else {
        toast.error(result?.error || `Failed to save step ${currentStep}`, {
          position: "top-right",
          autoClose: 5000,
        });
        return false;
      }
    } catch (error) {
      console.error(`Error saving step ${currentStep}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error saving step ${currentStep}: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (isNextDisabled) return;

    // Save current step before moving to next
    const saved = await saveCurrentStep();
    if (saved && nextScreen) {
      setActiveScreen(nextScreen);
    }
  };

  const handlePrevious = () => {
    if (previousScreen) {
      setActiveScreen(previousScreen);
    }
  };

  const handleSaveOnly = async () => {
    await saveCurrentStep();
  };

  const isCurrentStepComplete = isStepComplete(currentStep);

  return (
    <div className="flex items-center justify-between pt-8 border-t border-gray-200">
      {/* Progress indicator */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </span>
        {isCurrentStepComplete && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
      </div>

      {/* Progress bar */}
      <div className="flex-1 mx-8">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center space-x-3">
        {/* Save button */}
        <button
          onClick={handleSaveOnly}
          disabled={isSaving || isLoading}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors disabled:opacity-50"
        >
          {isSaving || isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save</span>
        </button>

        {/* Previous button */}
        {showPrevious && previousScreen && (
          <button
            onClick={handlePrevious}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
        )}

        {/* Next button */}
        {nextScreen && (
          <button
            onClick={handleNext}
            disabled={isNextDisabled || isSaving || isLoading}
            className="flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{nextButtonText}</span>
            {isSaving || isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default StepwiseNavigation;
