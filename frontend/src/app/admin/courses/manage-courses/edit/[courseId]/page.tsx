"use client";
import Container from "@/app/admin/components/ui/Container";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BookOpen,
  Users,
} from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useParams, useRouter } from "next/navigation";
import {
  CourseFormProvider,
  useCourseFormContext,
} from "@/contexts/CourseFormContext";
import { cleanupStorageForCourse } from "@/lib/courseFormUtils";
import Screen1 from "../../components/shared/Screen1";
import Screen2 from "../../components/shared/Screen2";
import Screen3 from "../../components/shared/Screen3";
import Screen4 from "../../components/shared/Screen4";
import Screen5 from "../../components/shared/Screen5";
import Screen6 from "../../components/shared/Screen6";
import Screen7 from "../../components/shared/Screen7";
import Screen8 from "../../components/shared/Screen8";
import Screen9 from "../../components/shared/Screen9";
import Screen10 from "../../components/shared/Screen10";
import Screen11 from "../../components/shared/Screen11";
import Screen12 from "../../components/shared/Screen12";
import Screen13 from "../../components/shared/Screen13";
import StorageIndicator from "@/components/admin/courseForm/StorageIndicator";
import { toast } from "react-toastify";

const EditCoursePageContent = ({ courseId }: { courseId: string }) => {
  const router = useRouter();
  const {
    currentScreen,
    nextScreen,
    prevScreen,
    canGoNext,
    updateCourseMetadata,
    isUpdating,
    isCourseDataLoading,
    goToScreen,
  } = useCourseFormContext();

  const handleNext = async () => {
    if (currentScreen === 9) {
      // On Screen9, update the course metadata instead of navigating
      try {
        await updateCourseMetadata();
        // Clean up edit mode localStorage after successful update on Screen9
        cleanupStorageForCourse(courseId);
        // Navigation will be handled by updateCourseMetadata after successful update
      } catch (error) {
        console.error("Failed to update course metadata:", error);
        // Error handling is done in Screen9
      }
    } else if (currentScreen === 13) {
      // On Screen13, save changes and redirect to manage courses
      try {
        await updateCourseMetadata();
        // Clean up edit mode localStorage after successful update
        cleanupStorageForCourse(courseId);
        router.push("/admin/courses/manage-courses");
      } catch (error) {
        console.error("Failed to save course changes:", error);
        // Error handling is done in Screen13
      }
    } else {
      // For all other screens, use the validation-enabled nextScreen
      await nextScreen();
    }
  };

  const handlePrevious = () => {
    if (currentScreen === 1) {
      // Clean up edit mode localStorage when leaving edit page
      cleanupStorageForCourse(courseId);
      router.push("/admin/courses/manage-courses");
    } else {
      prevScreen();
    }
  };

  // Handle instant navigation to Basic Information (Screen 1)
  const handleNavigateToBasicInformation = async () => {
    try {
      // Save metadata before navigating
      await updateCourseMetadata();
      // Navigate after successful save (use setTimeout to ensure it runs after updateCourseMetadataHandler's nextScreen())
      // updateCourseMetadataHandler will show success toast
      setTimeout(() => goToScreen(1), 0);
    } catch (error) {
      // Error toast is already shown by updateCourseMetadataHandler
      // Don't navigate if save failed
      console.error("Failed to save metadata before navigation:", error);
    }
  };

  // Handle instant navigation to Modules (Screen 11)
  const handleNavigateToModules = async () => {
    try {
      // Save metadata before navigating
      await updateCourseMetadata();
      // Navigate after successful save (use setTimeout to ensure it runs after updateCourseMetadataHandler's nextScreen())
      // updateCourseMetadataHandler will show success toast
      setTimeout(() => goToScreen(11), 0);
    } catch (error) {
      // Error toast is already shown by updateCourseMetadataHandler
      // Don't navigate if save failed
      console.error("Failed to save metadata before navigation:", error);
    }
  };

  // Handle instant navigation to Instructors (Screen 13)
  const handleNavigateToInstructors = async () => {
    try {
      // Save metadata before navigating
      await updateCourseMetadata();
      // Navigate after successful save (use setTimeout to ensure it runs after updateCourseMetadataHandler's nextScreen())
      // updateCourseMetadataHandler will show success toast
      setTimeout(() => goToScreen(13), 0);
    } catch (error) {
      // Error toast is already shown by updateCourseMetadataHandler
      // Don't navigate if save failed
      console.error("Failed to save metadata before navigation:", error);
    }
  };

  return (
    <div className="flex w-full h-full flex-col px-8 relative">
      <div className="flex flex-col items-center gap-5 mb-4">
        <Container
          title="Edit Course"
          icon={BookOpenIcon}
          className="rounded-t-none shrink-0 h-fit"
        />
        {/* Instant Navigation Buttons */}
        <div className="flex items-center gap-5 w-full justify-center">
          <OrangeButton
            onClick={handleNavigateToBasicInformation}
            disabled={isCourseDataLoading || isUpdating || currentScreen === 1}
            className={`flex items-center gap-2 cursor-pointer ${
              currentScreen === 1 ? "opacity-60" : ""
            }`}
            glow={false}
          >
            <BookOpen className="w-4 h-4" />
            Basic Information
            {currentScreen === 1 && " (Current)"}
          </OrangeButton>
          <OrangeButton
            onClick={handleNavigateToModules}
            disabled={isCourseDataLoading || isUpdating || currentScreen === 11}
            className={`flex items-center gap-2 cursor-pointer ${
              currentScreen === 11 ? "opacity-60" : ""
            }`}
            glow={false}
          >
            <BookOpen className="w-4 h-4" />
            Modules
            {currentScreen === 11 && " (Current)"}
          </OrangeButton>
          <OrangeButton
            onClick={handleNavigateToInstructors}
            disabled={isCourseDataLoading || isUpdating || currentScreen === 12}
            className={`flex items-center gap-2 cursor-pointer ${
              currentScreen === 12 ? "opacity-60" : ""
            }`}
            glow={false}
          >
            <Users className="w-4 h-4" />
            Instructors
            {currentScreen === 12 && " (Current)"}
          </OrangeButton>
        </div>
      </div>
      <div className="flex-1 min-h-0 max-h-full">
        {isCourseDataLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            <p className="text-gray-600">Loading course data...</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
      <div className="flex justify-between items-center h-fit p-4">
        <WhiteButton
          className="flex gap-2 items-center"
          onClick={handlePrevious}
          disabled={isCourseDataLoading || isUpdating}
        >
          <ArrowLeftIcon className="size-4" />{" "}
          {currentScreen === 1 ? "Back to Courses" : "Previous"}
        </WhiteButton>
        <OrangeButton
          glow={false}
          className="flex gap-2 items-center"
          onClick={handleNext}
          disabled={isCourseDataLoading || !canGoNext || isUpdating}
        >
          {isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              Updating Course...
            </>
          ) : (
            <>
              {currentScreen === 9
                ? "Update Course Metadata"
                : currentScreen === 10
                  ? "Next Page"
                  : currentScreen === 11
                    ? "Review Course"
                    : currentScreen === 12
                      ? "Select Instructors"
                      : currentScreen === 13
                        ? "Save Changes"
                        : "Next"}
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </OrangeButton>
      </div>
      <StorageIndicator mode="edit" courseId={courseId} />
    </div>
  );
};

const EditCoursePage = () => {
  const { courseId } = useParams();

  return (
    <CourseFormProvider
      options={{
        mode: "edit",
        courseId: courseId as string,
        autoSave: true,
      }}
    >
      <EditCoursePageContent courseId={courseId as string} />
    </CourseFormProvider>
  );
};

export default EditCoursePage;
