"use client";

import Container from "@/app/admin/components/ui/Container";
import { ArrowLeftIcon, ArrowRightIcon, BriefcaseIcon } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useParams, useRouter } from "next/navigation";
import {
  InternshipFormProvider,
  useInternshipFormContext,
} from "@/contexts/InternshipFormContext";
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

const clearInternshipEditStorage = (internshipId: string) => {
  localStorage.removeItem(`internship_form_data_${internshipId}`);
  localStorage.removeItem(`internship_form_draft_${internshipId}`);
};

const EditInternshipPageContent = ({
  internshipId,
}: {
  internshipId: string;
}) => {
  const router = useRouter();
  const {
    currentScreen,
    nextScreen,
    prevScreen,
    canGoNext,
    updateInternship,
    isUpdating,
    isInternshipDataLoading,
  } = useInternshipFormContext();

  const handleNext = async () => {
    if (currentScreen === 13) {
      try {
        await updateInternship();
        clearInternshipEditStorage(internshipId);
        router.push("/admin/internships/manage-internships");
      } catch (error) {
        console.error("Failed to update internship:", error);
      }
    } else {
      await nextScreen();
    }
  };

  const handlePrevious = () => {
    if (currentScreen === 1) {
      clearInternshipEditStorage(internshipId);
      router.push("/admin/internships/manage-internships");
    } else {
      prevScreen();
    }
  };

  return (
    <div className="flex w-full h-full flex-col px-8 relative">
      <div className="flex items-center justify-between mb-8">
        <Container
          title="Edit Internship"
          icon={BriefcaseIcon}
          className="rounded-t-none shrink-0 h-fit"
        />
      </div>
      <div className="flex-1 min-h-0 max-h-full">
        {isInternshipDataLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            <p className="text-gray-600">Loading internship...</p>
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
          glow={false}
          className="flex gap-2 items-center"
          onClick={handlePrevious}
          disabled={isInternshipDataLoading || isUpdating}
        >
          <ArrowLeftIcon className="size-4" />{" "}
          {currentScreen === 1 ? "Back to Internships" : "Previous"}
        </WhiteButton>
        <OrangeButton
          glow={false}
          className="flex gap-2 items-center"
          onClick={handleNext}
          disabled={isInternshipDataLoading || !canGoNext || isUpdating}
        >
          {isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              {currentScreen === 13 ? "Saving..." : "Updating..."}
            </>
          ) : (
            <>
              {currentScreen === 13 ? "Save & Exit" : "Next"}
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </OrangeButton>
      </div>
    </div>
  );
};

const EditInternshipPage = () => {
  const params = useParams();
  const internshipId = params?.internshipId;

  if (!internshipId || typeof internshipId !== "string") {
    return (
      <div className="flex w-full flex-col items-center justify-center min-h-[240px] gap-2 px-8">
        <p className="text-gray-700 font-medium">Invalid internship link</p>
        <p className="text-sm text-gray-500">
          Open an internship from Manage Internships and choose Edit.
        </p>
      </div>
    );
  }

  return (
    <InternshipFormProvider
      options={{
        mode: "edit",
        internshipId,
        autoSave: true,
      }}
    >
      <EditInternshipPageContent internshipId={internshipId} />
    </InternshipFormProvider>
  );
};

export default EditInternshipPage;
