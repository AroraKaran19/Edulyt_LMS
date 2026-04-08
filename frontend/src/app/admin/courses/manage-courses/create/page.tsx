"use client";
import Container from "@/app/admin/components/ui/Container";
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useRouter } from "next/navigation";
import {
  CourseFormProvider,
  useCourseFormContext,
} from "@/contexts/CourseFormContext";
import Screen1 from "../components/shared/Screen1";
import Screen2 from "../components/shared/Screen2";
import Screen3 from "../components/shared/Screen3";
import Screen4 from "../components/shared/Screen4";
import Screen5 from "../components/shared/Screen5";
import Screen6 from "../components/shared/Screen6";
import Screen7 from "../components/shared/Screen7";
import Screen8 from "../components/shared/Screen8";
import Screen9 from "../components/shared/Screen9";
import Screen10 from "../components/shared/Screen10";
import Screen11 from "../components/shared/Screen11";
import Screen12 from "../components/shared/Screen12";
import Screen13 from "../components/shared/Screen13";
import StorageIndicator from "@/components/admin/courseForm/StorageIndicator";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

const CreateCoursePageContent = () => {
  const router = useRouter();
  const {
    currentScreen,
    nextScreen,
    prevScreen,
    canGoNext,
    createCourse,
    updateCourseMetadata,
    isCreating,
    isUpdating,
    isCourseCreated,
    getCreatedCourseId,
    clearCourseCreationStatus,
  } = useCourseFormContext();

  const handleNext = async () => {
    if (currentScreen === 9) {
      // On Screen9, create or update the course metadata based on creation status
      try {
        if (isCourseCreated()) {
          // Course already exists, update it using the stored course ID
          const courseId = getCreatedCourseId();
          if (courseId) {
            await updateCourseMetadata();
            // Navigation will be handled by updateCourseMetadata after successful update
          } else {
            throw new Error(
              "Course ID not found. Please try creating the course again."
            );
          }
        } else {
          // Course doesn't exist yet, create it
          await createCourse();
          // Navigation will be handled by createCourse after successful creation
        }
      } catch (error) {
        console.error("Failed to process course:", error);
        // Error handling is done in Screen9
      }
    } else if (currentScreen === 13) {
      // On Screen13, update course metadata with instructors and then finalize
      try {
        await updateCourseMetadata();
        // Only clear after successful update
        clearCourseCreationStatus();
        router.push("/admin/courses/manage-courses");
      } catch (error) {
        console.error("Failed to finalize course:", error);
        // Error handling is done in updateCourseMetadata
      }
    } else {
      // For all other screens, use the validation-enabled nextScreen
      await nextScreen();
    }
  };

  const handlePrevious = () => {
    if (currentScreen === 1) {
      // Clear course creation status when going back to courses dashboard
      clearCourseCreationStatus();
      router.push("/admin/courses/manage-courses");
    } else {
      prevScreen();
    }
  };

  return (
    <div className="flex w-full h-full flex-col px-8 relative">
      <div className="flex items-center justify-between mb-8">
        <Container
          title="Create Course"
          icon={BookOpenIcon}
          className="rounded-t-none shrink-0 h-fit"
        />
        {isCourseCreated() && (
          <WhiteButton
            onClick={() => {
              clearCourseCreationStatus();
              // Reset form to first screen
              window.location.reload();
            }}
            className="flex items-center gap-2 text-sm"
          >
            Start New Course
          </WhiteButton>
        )}
      </div>
      <div className="flex-1 min-h-0 max-h-full">
        {currentScreen === 1 && <Screen1 />}
        {currentScreen === 2 && <Screen2 />}
        {currentScreen === 3 && <Screen3 />}
        {currentScreen === 4 && <Screen4 />}
        {currentScreen === 5 && <Screen5 />}
        {currentScreen === 6 && <Screen6 />}
        {currentScreen === 7 && <Screen7 />}
        {currentScreen === 8 && <Screen8 />}
        {currentScreen === 9 && <Screen9 />}
        {currentScreen === 10 && <Screen10 />}
        {currentScreen === 11 && <Screen11 />}
        {currentScreen === 12 && <Screen12 />}
        {currentScreen === 13 && <Screen13 />}
      </div>
      <div className="flex justify-between items-center h-fit p-4">
        <WhiteButton
          glow={false}
          className="flex gap-2 items-center"
          onClick={handlePrevious}
          disabled={isCreating}
        >
          <ArrowLeftIcon className="size-4" />{" "}
          {currentScreen === 1 ? "Back to Courses" : "Previous"}
        </WhiteButton>
        <OrangeButton
          glow={false}
          className="flex gap-2 items-center"
          onClick={handleNext}
          disabled={!canGoNext || isCreating || isUpdating}
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              Creating Course...
            </>
          ) : isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              {currentScreen === 13 ? "Finalizing Course..." : "Updating..."}
            </>
          ) : (
            <>
              {currentScreen === 9
                ? isCourseCreated()
                  ? "Update Course Metadata"
                  : "Create Course Metadata"
                : currentScreen === 10
                ? "Next Page"
                : currentScreen === 11
                ? "Review Course"
                : currentScreen === 12
                ? "Select Instructors"
                : currentScreen === 13
                ? "Finalize Course"
                : "Next"}
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </OrangeButton>
      </div>
      <StorageIndicator mode="create" />
    </div>
  );
};

const CreateCoursePage = () => {
  return (
    <CourseFormProvider options={{ mode: "create", autoSave: true }}>
      <CreateCoursePageContent />
    </CourseFormProvider>
  );
};

export default CreateCoursePage;
