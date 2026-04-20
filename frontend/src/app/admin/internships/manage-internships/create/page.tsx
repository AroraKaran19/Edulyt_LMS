"use client";
import Container from "@/app/admin/components/ui/Container";
import { ArrowLeftIcon, ArrowRightIcon, BriefcaseIcon } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useRouter } from "next/navigation";
import {
  InternshipFormProvider,
  useInternshipFormContext,
} from "@/contexts/InternshipFormContext";
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
import Screen14 from "../components/shared/Screen14";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

const CreateInternshipPageContent = () => {
  const router = useRouter();
  const {
    currentScreen,
    nextScreen,
    prevScreen,
    canGoNext,
    createInternship,
    updateInternshipMetadata,
    isCreating,
    isUpdating,
    isInternshipCreated,
    getCreatedInternshipId,
    clearInternshipCreationStatus,
  } = useInternshipFormContext();

  const handleNext = async () => {
    if (currentScreen === 14) {
      // On Screen 14 (Summary), create or update internship
      try {
        if (isInternshipCreated()) {
          // Internship already exists, update it using the stored internship ID
          const internshipId = getCreatedInternshipId();
          if (internshipId) {
            await updateInternshipMetadata();
            // Navigation will be handled by updateInternshipMetadata after successful update
          } else {
            throw new Error(
              "Internship ID not found. Please try creating the internship again.",
            );
          }
        } else {
          // Internship doesn't exist yet, create it
          await createInternship();
          // Navigation will be handled by createInternship after successful creation
        }
      } catch (error) {
        console.error("Failed to process internship:", error);
        // Error handling is in the hook / toasts
      }
    } else {
      // For all other screens, use the validation-enabled nextScreen
      await nextScreen();
    }
  };

  const handlePrevious = () => {
    if (currentScreen === 1) {
      // Clear internship creation status when going back to internships dashboard
      clearInternshipCreationStatus();
      router.push("/admin/internships/manage-internships");
    } else {
      prevScreen();
    }
  };

  return (
    <div className="flex w-full h-full flex-col px-8 relative">
      <div className="flex items-center justify-between mb-8">
        <Container
          title="Create Internship"
          icon={BriefcaseIcon}
          className="rounded-t-none shrink-0 h-fit"
        />
        {isInternshipCreated() && (
          <WhiteButton
            onClick={() => {
              clearInternshipCreationStatus();
              // Reset form to first screen
              window.location.reload();
            }}
            className="flex items-center gap-2 text-sm"
          >
            Start New Internship
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
        {currentScreen === 14 && <Screen14 />}
      </div>
      <div className="flex justify-between items-center h-fit p-4">
        <WhiteButton
          glow={false}
          className="flex gap-2 items-center"
          onClick={handlePrevious}
          disabled={isCreating}
        >
          <ArrowLeftIcon className="size-4" />{" "}
          {currentScreen === 1 ? "Back to Internships" : "Previous"}
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
              Creating Internship...
            </>
          ) : isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              Updating...
            </>
          ) : (
            <>
              {currentScreen === 14
                ? isInternshipCreated()
                  ? "Update Internship"
                  : "Create Internship"
                : "Next"}
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </OrangeButton>
      </div>
    </div>
  );
};

const CreateInternshipPage = () => {
  return (
    <InternshipFormProvider options={{ mode: "create", autoSave: true }}>
      <CreateInternshipPageContent />
    </InternshipFormProvider>
  );
};

export default CreateInternshipPage;
