"use client";

import Container from "@/app/admin/components/ui/Container";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckSquareIcon,
  EyeIcon,
  SaveIcon,
} from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useParams, useRouter } from "next/navigation";
import {
  CourseInternshipFormProvider,
  useCourseInternshipFormContext,
} from "@/contexts/CourseInternshipFormContext";
import Screen1 from "../../components/shared/Screen1";
import Screen2 from "../../components/shared/Screen2";
import Screen3 from "../../components/shared/Screen3";

const LIST_ROUTE = "/admin/courses/course-internships/manage";

const QUICK_NAV_TABS = [
  { label: "Basic Information", screen: 1, icon: BookOpenIcon },
  { label: "Tasks & Documents", screen: 2, icon: CheckSquareIcon },
  { label: "Review", screen: 3, icon: EyeIcon },
];

const EditProgramPageContent = () => {
  const router = useRouter();
  const {
    currentScreen,
    totalScreens,
    nextScreen,
    prevScreen,
    goToScreen,
    canGoNext,
    save,
    isSaving,
    isLoading,
  } = useCourseInternshipFormContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  const handlePrevious = () => {
    if (currentScreen === 1) {
      router.push(LIST_ROUTE);
    } else {
      prevScreen();
    }
  };

  return (
    <div className="flex w-full flex-col px-8 relative pb-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <Container
          title="Edit Program"
          description={`Step ${currentScreen} of ${totalScreens}`}
          icon={BriefcaseIcon}
          className="rounded-t-none shrink-0 h-fit"
        />
        <OrangeButton
          glow={false}
          className="flex gap-2 items-center shrink-0"
          onClick={() => void save()}
          disabled={isSaving}
        >
          <SaveIcon className="size-4" />
          {isSaving ? "Saving…" : "Save changes"}
        </OrangeButton>
      </div>

      {/* Jump straight to a section — editing is rarely linear. */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_NAV_TABS.map((tab) => (
          <button
            key={tab.screen}
            type="button"
            onClick={() => goToScreen(tab.screen)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer ${
              currentScreen === tab.screen
                ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-full">
        {currentScreen === 1 && <Screen1 />}
        {currentScreen === 2 && <Screen2 />}
        {currentScreen === 3 && <Screen3 />}
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
          onClick={() =>
            currentScreen === totalScreens ? void save() : void nextScreen()
          }
          disabled={!canGoNext || isSaving}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              {currentScreen === totalScreens ? "Save changes" : "Next"}
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </OrangeButton>
      </div>
    </div>
  );
};

const EditProgramPage = () => {
  const params = useParams();
  return (
    <CourseInternshipFormProvider programId={String(params?.programId ?? "")}>
      <EditProgramPageContent />
    </CourseInternshipFormProvider>
  );
};

export default EditProgramPage;
