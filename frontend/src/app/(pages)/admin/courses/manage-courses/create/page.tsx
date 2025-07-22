import FlexBox from "@/components/ui/FlexBox";
import React from "react";
import BasicInformationSection from "./components/BasicInformationSection";
import LearningOutcomesSection from "./components/LearningOutcomesSection";
import InstructorSection from "./components/InstructorSection";
import SEOSection from "./components/SEOSection";
import PricingSection from "./components/PricingSection";
import ModulesSection from "./components/ModulesSection";
import FAQSection from "./components/FAQSection";
import ReviewsSection from "./components/ReviewsSection";
import { CourseFormProvider } from "./context/CourseFormContext";

const CreateCoursePage = () => {
  return (
    <CourseFormProvider>
      <FlexBox className="w-full flex-col gap-2 relative overflow-y-auto scroll-smooth">
        <FlexBox className="sticky top-0 flex-col gap-2 bg-white shadow-md rounded-b-lg p-6 z-10 mx-6">
          <h1 className="text-2xl font-bold">Create Course</h1>
          <p className="text-sm text-gray-500">
            Create a new course to add to your library.
          </p>
        </FlexBox>
        <FlexBox className="w-full flex-col gap-6 p-8">
          <BasicInformationSection />
          <LearningOutcomesSection />
          <InstructorSection />
          <PricingSection />
          <ModulesSection />
          <FAQSection />
          <ReviewsSection />
          <SEOSection />
        </FlexBox>
      </FlexBox>
    </CourseFormProvider>
  );
};

export default CreateCoursePage;
