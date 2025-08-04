import Container from "@/app/admin/components/ui/Container";
import CategoryInput from "@/components/ui/inputs/CategoryInput";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import PercentageInput from "@/components/ui/inputs/PercentageInput";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";

const Screen1 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();

  return (
    <Container
      title="Basic Information"
      description="Please fill in the basic information of the course"
      className="rounded-b-none h-full w-full flex flex-col"
    >
      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <Input
          label="Title"
          name="title"
          placeholder="Enter the title of the course"
          value={state.course.title}
          onChange={(e) => actions.setCourseTitle(e.target.value)}
          className="w-2/3"
          required
        />
        <CategoryInput
          label="Category"
          name="category"
          options={["Programming", "Design", "Business", "Marketing"]}
          defaultValue={state.course.category || "Select a category"}
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
          defaultValue={state.course.audience.split("-").join(" ") || "Select a target audience"}
          onChange={(e) =>
            actions.setCourseAudience(
              e.target.value as "college-students" | "professionals"
            )
          }
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
        <PercentageInput
          label="Show Discount (Optional)"
          placeholder="Enter the show discount of the course"
          value={state.course.discount?.value?.toString() || ""}
          onChange={(e) => {
            if (e.target.value === "" || e.target.value === "0") {
              // Clear the discount if empty or zero
              actions.setCourseDiscount(undefined);
            } else {
              actions.setCourseDiscount({
                value: Number(e.target.value),
                discount: "percentage",
              });
            }
          }}
          className="w-full"
          required={false}
        />
      </FlexBox>
      <OrangeButton
        className="mt-auto mb-4 w-max px-16 self-end"
        onClick={() => setActiveScreen("screen2")}
        disabled={
          !state.course.title ||
          !state.course.category ||
          !state.course.audience ||
          !state.course.description ||
          !state.course.shortDescription ||
          !state.course.duration
        }
      >
        Next Page
      </OrangeButton>
    </Container>
  );
};

export default Screen1;
