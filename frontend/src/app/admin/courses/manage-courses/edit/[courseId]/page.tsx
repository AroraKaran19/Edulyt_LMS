"use client";
import React from "react";
import Container from "@/app/admin/components/ui/Container";
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon } from "lucide-react";
import { FlexBox, WhiteButton } from "@/components/ui";
import { useParams, useRouter } from "next/navigation";
import { CourseFormProvider, useCourseFormContext } from "@/contexts/CourseFormContext";
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
import StorageIndicator from "@/components/courseForm/StorageIndicator";

const EditCoursePageContent = ({ courseId }: { courseId: string }) => {
  const router = useRouter();
  const { currentScreen, nextScreen, prevScreen, canGoNext, updateCourseMetadata, isUpdating } = useCourseFormContext();

  const handleNext = async () => {
    if (currentScreen === 9) {
      // On Screen9, update the course metadata instead of navigating
      try {
        await updateCourseMetadata();
        // Navigation will be handled by updateCourseMetadata after successful update
      } catch (error) {
        console.error("Failed to update course metadata:", error);
        // Error handling is done in Screen9
      }
    } else if (currentScreen === 10) {
      // On Screen10, navigate to Screen11 for modules and content
      nextScreen();
    } else {
      nextScreen();
    }
  };

  const handlePrevious = () => {
    if (currentScreen === 1) {
      router.push("/admin/courses/manage-courses");
    } else {
      prevScreen();
    }
  };

  return (
    <FlexBox className="w-full h-full flex-col px-8 relative">
      <Container
        title="Edit Course"
        icon={BookOpenIcon}
        className="rounded-t-none flex-shrink-0 h-fit mb-8"
      />
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
      </div>
      <div className="flex justify-between items-center h-fit p-4">
        <WhiteButton
          className="flex gap-2 items-center"
          onClick={handlePrevious}
          disabled={isUpdating}
        >
          <ArrowLeftIcon className="size-4" /> {currentScreen === 1 ? "Back to Courses" : "Previous"}
        </WhiteButton>
        <WhiteButton 
          className="flex gap-2 items-center" 
          onClick={handleNext}
          disabled={!canGoNext || isUpdating}
        >
          {isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              Updating Course...
            </>
          ) : (
            <>
              {currentScreen === 9 ? "Update Course Metadata" : currentScreen === 10 ? "Next Page" : "Next"} 
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </WhiteButton>
      </div>
      <StorageIndicator mode="edit" courseId={courseId} />
    </FlexBox>
  );
};

const EditCoursePage = () => {
  const { courseId } = useParams();

  return (
    <CourseFormProvider 
      options={{ 
        mode: 'edit', 
        courseId: courseId as string, 
        autoSave: true 
      }}
    >
      <EditCoursePageContent courseId={courseId as string} />
    </CourseFormProvider>
  );
};

export default EditCoursePage;
