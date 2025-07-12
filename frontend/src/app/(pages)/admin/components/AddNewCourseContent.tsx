import React from 'react';
import OrangeButton from "@/components/ui/OrangeButton";
import WhiteButton from "@/components/ui/WhiteButton";
import BasicInformationSection from "./BasicInformationSection";
import CourseDetailsSection from "./CourseDetailsSection";
import MediaSection from "./MediaSection";
import PricingPlansSection from "./PricingPlansSection";
import LearningOutcomesSection from "./LearningOutcomesSection";
import CourseFeaturesSection from "./CourseFeaturesSection";
import SeoSettingsSection from "./SeoSettingsSection";
import CourseModulesSection from "./CourseModulesSection";
import SettingsSection from "./SettingsSection";

const AddNewCourseContent: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 border-b border-gray-200 bg-white" style={{ height: '84px' }}>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Add New Course
          </h2>
          <p className="text-gray-600">
            Create and publish a new course for your students
          </p>
        </div>
        <div className="flex gap-3">
          <WhiteButton className="text-sm font-medium">
            Save as Draft
          </WhiteButton>
          <OrangeButton className="text-sm font-semibold">
            Publish Course
          </OrangeButton>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <form className="space-y-8">
            {/* Basic Information */}
            <BasicInformationSection />

            {/* Course Details */}
            <CourseDetailsSection />

            {/* Media */}
            <MediaSection />

            {/* Pricing Plans */}
            <PricingPlansSection />

            {/* Learning Outcomes */}
            <LearningOutcomesSection />

            {/* Course Features */}
            <CourseFeaturesSection />

            {/* SEO Settings */}
            <SeoSettingsSection />

            {/* Course Modules */}
            <div id="course-modules">
              <CourseModulesSection />
            </div>

            {/* Settings */}
            <SettingsSection />
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNewCourseContent; 