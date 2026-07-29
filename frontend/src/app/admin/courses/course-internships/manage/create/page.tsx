"use client";

import Container from "@/app/admin/components/ui/Container";
import { ArrowLeftIcon, ArrowRightIcon, BriefcaseIcon } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useRouter } from "next/navigation";
import {
  CourseInternshipFormProvider,
  useCourseInternshipFormContext,
} from "@/contexts/CourseInternshipFormContext";
import Screen1 from "../components/shared/Screen1";
import Screen2 from "../components/shared/Screen2";
import Screen3 from "../components/shared/Screen3";
import Screen4 from "../components/shared/Screen4";

const LIST_ROUTE = "/admin/courses/course-internships/manage";

const CreateProgramPageContent = () => {
  const router = useRouter();
  const {
    currentScreen,
    totalScreens,
    nextScreen,
    prevScreen,
    canGoNext,
    save,
    isSaving,
  } = useCourseInternshipFormContext();

  const handleNext = async () => {
    if (currentScreen === totalScreens) {
      await save();
      return;
    }
    await nextScreen();
  };

  const handlePrevious = () => {
    if (currentScreen === 1) {
      router.push(LIST_ROUTE);
    } else {
      prevScreen();
    }
  };

  return (
    <div className="flex w-full flex-col px-8 relative pb-8">
      <div className="flex items-center justify-between mb-8">
        <Container
          title="Create Program"
          description={`Step ${currentScreen} of ${totalScreens}`}
          icon={BriefcaseIcon}
          className="rounded-t-none shrink-0 h-fit"
        />
      </div>

      <div className="w-full">
        {currentScreen === 1 && <Screen1 />}
        {currentScreen === 2 && <Screen2 />}
        {currentScreen === 3 && <Screen3 />}
        {currentScreen === 4 && <Screen4 />}
      </div>

      <div className="flex justify-between items-center h-fit p-4">
        <WhiteButton
          glow={false}
          className="flex gap-2 items-center"
          onClick={handlePrevious}
          disabled={isSaving}
        >
          <ArrowLeftIcon className="size-4" />
          {currentScreen === 1 ? "Back to Programs" : "Previous"}
        </WhiteButton>

        <OrangeButton
          glow={false}
          className="flex gap-2 items-center"
          onClick={handleNext}
          disabled={!canGoNext || isSaving}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
              Creating Program...
            </>
          ) : (
            <>
              {currentScreen === totalScreens ? "Create Program" : "Next"}
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </OrangeButton>
      </div>
    </div>
  );
};

const CreateProgramPage = () => (
  <CourseInternshipFormProvider>
    <CreateProgramPageContent />
  </CourseInternshipFormProvider>
);

export default CreateProgramPage;
