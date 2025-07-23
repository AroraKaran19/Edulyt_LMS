'use client';
import FlexBox from "@/components/ui/FlexBox";
import React, { useState } from "react";
import BasicInformationSection from "./components/BasicInformationSection";
import LearningOutcomesSection from "./components/LearningOutcomesSection";
import InstructorSection from "./components/InstructorSection";
import SEOSection from "./components/SEOSection";
import PricingSection from "./components/PricingSection";
import ModulesSection from "./components/ModulesSection";
import FAQSection from "./components/FAQSection";
import ReviewsSection from "./components/ReviewsSection";
import SubmissionSection from "./components/SubmissionSection";
import UploadQueue, { QueuedUpload } from "@/components/ui/UploadQueue";
import { CourseFormProvider } from "./context/CourseFormContext";

const CreateCoursePage = () => {
  const [uploads, setUploads] = useState<QueuedUpload[]>([]);

  return (
    <CourseFormProvider>
      <FlexBox className="w-full flex-col gap-2 relative overflow-y-auto scroll-smooth">
        <FlexBox className="sticky top-0 flex-col gap-2 bg-white shadow-md rounded-b-lg p-6 z-10 mx-6">
          <h1 className="text-2xl font-bold">Create Course</h1>
          <p className="text-sm text-gray-500">
            Create a new course to add to your library.
          </p>
          
          {/* Upload Queue */}
          {uploads.length > 0 && (
            <div className="mt-4">
              <UploadQueue 
                uploads={uploads} 
                onUpdate={setUploads}
                maxConcurrent={3}
                autoStart={true}
              />
            </div>
          )}
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
          <SubmissionSection />
        </FlexBox>
      </FlexBox>
    </CourseFormProvider>
  );
};

export default CreateCoursePage;
