"use client";
import React from "react";
import Container from "@/app/admin/components/ui/Container";
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon } from "lucide-react";
import { FlexBox, WhiteButton } from "@/components/ui";
import { useRouter } from "next/navigation";
import { CourseFormProvider, useCourseFormContext } from "@/contexts/CourseFormContext";
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
import StorageIndicator from "@/components/courseForm/StorageIndicator";

const CreateCoursePageContent = () => {
  const router = useRouter();
  const { currentScreen, nextScreen, prevScreen, canGoNext, createCourse, isCreating } = useCourseFormContext();

  const handleNext = async () => {
    if (currentScreen === 9) {
      // On Screen9, create the course metadata instead of navigating
      try {
        await createCourse();
        // Navigation will be handled by createCourse after successful creation
      } catch (error) {
        console.error("Failed to create course:", error);
        // Error handling is done in Screen9
      }
    } else {
      // For all other screens, use the validation-enabled nextScreen
      await nextScreen();
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
        title="Create Course"
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
        {currentScreen === 12 && <Screen12 />}
      </div>
      <div className="flex justify-between items-center h-fit p-4">
        <WhiteButton
          className="flex gap-2 items-center"
          onClick={handlePrevious}
          disabled={isCreating}
        >
          <ArrowLeftIcon className="size-4" /> {currentScreen === 1 ? "Back to Courses" : "Previous"}
        </WhiteButton>
        <WhiteButton 
          className="flex gap-2 items-center" 
          onClick={handleNext}
          disabled={!canGoNext || isCreating}
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              Creating Course...
            </>
          ) : (
            <>
              {currentScreen === 9 ? "Create Course Metadata" : currentScreen === 10 ? "Next Page" : currentScreen === 11 ? "Review Course" : "Next"} 
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </WhiteButton>
      </div>
      <StorageIndicator mode="create" />
    </FlexBox>
  );
};

const CreateCoursePage = () => {
  return (
    <CourseFormProvider options={{ mode: 'create', autoSave: true }}>
      <CreateCoursePageContent />
    </CourseFormProvider>
  );
};

export default CreateCoursePage;
