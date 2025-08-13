import Container from "@/app/admin/components/ui/Container";
import CategoryInput from "@/components/ui/inputs/CategoryInput";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo } from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import ScreenNavigation from "./shared/ScreenNavigation";
import AlertBanner from "@/components/ui/AlertBanner";
import { useScreen } from "../contexts/ScreenContext";

const Screen1 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();

  // Validation checks for minimum character requirements
  const validationErrors = useMemo(() => {
    const errors = [];

    // Check title minimum length
    if (
      state.course.title &&
      state.course.title.trim().length > 0 &&
      state.course.title.trim().length < 5
    ) {
      errors.push("Course title must be at least 5 characters long");
    }

    // Check description minimum length
    if (
      state.course.description &&
      state.course.description.trim().length > 0 &&
      state.course.description.trim().length < 25
    ) {
      errors.push("Course description must be at least 25 characters long");
    }

    // Check short description minimum length
    if (
      state.course.shortDescription &&
      state.course.shortDescription.trim().length > 0 &&
      state.course.shortDescription.trim().length < 10
    ) {
      errors.push("Short description must be at least 10 characters long");
    }

    return errors;
  }, [
    state.course.title,
    state.course.description,
    state.course.shortDescription,
  ]);

  // Check if all required fields are filled and meet minimum requirements
  const isFormValid = useMemo(() => {
    return (
      state.course.title &&
      state.course.title.trim().length >= 5 &&
      state.course.category &&
      state.course.audience &&
      state.course.description &&
      state.course.description.trim().length >= 25 &&
      state.course.shortDescription &&
      state.course.shortDescription.trim().length >= 10 &&
      state.course.duration
    );
  }, [
    state.course.title,
    state.course.category,
    state.course.audience,
    state.course.description,
    state.course.shortDescription,
    state.course.duration,
  ]);

  return (
    <Container
      title="Basic Information"
      description="Please fill in the basic information of the course"
      className="rounded-b-none h-full w-full flex flex-col"
    >
      {/* Validation Feedback */}
      {validationErrors.length > 0 && (
        <div className="mb-4 space-y-2">
          {validationErrors.map((error, index) => (
            <AlertBanner key={index} message={error} type="error" />
          ))}
        </div>
      )}

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <div className="w-2/3">
          <Input
            label="Title"
            name="title"
            placeholder="Enter the title of the course"
            value={state.course.title || ""}
            onChange={(e) => actions.setCourseTitle(e.target.value)}
            className="w-full"
            minLength={5}
            required
          />
          <div className="mt-1 text-xs text-gray-500 flex justify-between">
            <span>Minimum 5 characters required</span>
            <span
              className={`${
                (state.course.title?.length || 0) < 5
                  ? "text-red-500"
                  : "text-green-600"
              }`}
            >
              {state.course.title?.length || 0}/5+
            </span>
          </div>
        </div>
        <CategoryInput
          label="Category"
          name="category"
          options={["Programming", "Design", "Business", "Marketing"]}
          value={state.course.category || "Select a category"}
          setChange={(value) => actions.setCourseCategory(value)}
          className="w-1/3"
          required
        />
      </FlexBox>
      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <DropDown
          label="Target Audience"
          name="targetAudience"
          options={["College Students", "Professionals"]}
          value={
            state.course.audience === "college-students"
              ? "College Students"
              : state.course.audience === "professionals"
              ? "Professionals"
              : "Select a target audience"
          }
          onChange={(e) => {
            const technicalValue =
              e.target.value === "College Students"
                ? "college-students"
                : "professionals";
            actions.setCourseAudience(technicalValue);
          }}
          required
        />
        <Input
          label="Subcategory (Optional)"
          name="subCategory"
          placeholder="Enter the subcategory of the course"
          value={state.course.subcategory}
          onChange={(e) => actions.setCourseSubcategory(e.target.value)}
          required={false}
        />
      </FlexBox>
      <div className="w-full">
        <TextArea
          label="Description"
          name="description"
          placeholder="Enter the description of the course"
          value={state.course.description}
          onChange={(e) => actions.setCourseDescription(e.target.value)}
          className="w-full"
          rows={3}
          lockHeight
          required
        />
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>Minimum 25 characters required</span>
          <span
            className={`${
              (state.course.description?.length || 0) < 25
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {state.course.description?.length || 0}/25+
          </span>
        </div>
      </div>

      <div className="w-full">
        <TextArea
          label="Short Description"
          name="shortDescription"
          placeholder="Enter the short description of the course"
          value={state.course.shortDescription}
          onChange={(e) => actions.setCourseShortDescription(e.target.value)}
          className="w-full"
          rows={2}
          lockHeight
          required
        />
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>Minimum 10 characters required</span>
          <span
            className={`${
              (state.course.shortDescription?.length || 0) < 10
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {state.course.shortDescription?.length || 0}/10+
          </span>
        </div>
      </div>
      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <Input
          label="Course Duration (3 months, 1 year, 2 years, etc.)"
          name="duration"
          placeholder="Enter the duration of the course"
          value={state.course.duration}
          onChange={(e) => actions.setCourseDuration(e.target.value)}
          className="w-full"
          required
        />
      </FlexBox>
      <ScreenNavigation
        currentStep={1}
        nextScreen="screen2"
        showPrevious={false}
        isNextDisabled={!isFormValid}
        setActiveScreen={setActiveScreen}
      />
    </Container>
  );
};

export default Screen1;
