import React from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import { FlexBox } from "@/components/ui";
import { useCourseFormContext } from "@/contexts/CourseFormContext";

const Screen10 = () => {
  const { isEditMode } = useCourseFormContext();

  return (
    <FlexBox className="w-full h-full flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="w-20 h-20 text-green-500" />
        <h1 className="text-3xl font-bold text-text-primary">
          {isEditMode
            ? "Course Successfully Updated!"
            : "Course Successfully Created!"}
        </h1>
        <p className="text-lg text-text-secondary max-w-md">
          {isEditMode
            ? "Your course has been updated and is now ready for students to enroll. You can continue managing it from here."
            : "Your course has been created and is now ready for students to enroll. You can manage it from the courses dashboard."}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 text-sm text-text-secondary">
        <p>What's next?</p>
        <div className="flex items-center gap-2">
          <span>
            {isEditMode
              ? "Continue adding course modules and lessons"
              : "Add course modules and lessons"}
          </span>
          <ArrowRight className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span>
            {isEditMode
              ? "Update course content and videos"
              : "Set up course content and videos"}
          </span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </FlexBox>
  );
};

export default Screen10;
