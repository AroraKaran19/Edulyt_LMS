import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";
import TagInput from "@/components/ui/inputs/TagInput";

const Screen5 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();

  return (
    <Container
      title="Reviews & Testimonials"
      description="Add course testimonials and review information"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <Input
          label="Total Ratings Count"
          name="totalRatings"
          placeholder="Enter total number of ratings"
          value={state.course.totalRatings?.toString() || ""}
          onChange={(e) => actions.setCourseTotalRatings(Number(e.target.value))}
          className="w-full"
          required
        />
        <Input
          label="Enrolled Students Count"
          name="enrolledCount"
          placeholder="Enter number of enrolled students"
          value={state.course.enrolledCount?.toString() || ""}
          onChange={(e) => actions.setCourseEnrolledCount(Number(e.target.value))}
          className="w-full"
          required
        />
      </FlexBox>

      <TextArea
        label="Course Testimonials Title"
        name="courseTestimonialsTitle"
        placeholder="Enter title for course testimonials section"
        value={state.course.courseTestimonials?.[0]?.title || ""}
        onChange={(e) => {
          const testimonials = state.course.courseTestimonials || [];
          const updatedTestimonials = testimonials.length > 0 
            ? [{ ...testimonials[0], title: e.target.value }]
            : [{ title: e.target.value, description: "" }];
          actions.updateCourseField("courseTestimonials", updatedTestimonials);
        }}
        className="w-full"
        rows={2}
        lockHeight
        required
      />

      <TextArea
        label="Course Testimonials Description"
        name="courseTestimonialsDescription"
        placeholder="Enter description for course testimonials section"
        value={state.course.courseTestimonials?.[0]?.description || ""}
        onChange={(e) => {
          const testimonials = state.course.courseTestimonials || [];
          const updatedTestimonials = testimonials.length > 0 
            ? [{ ...testimonials[0], description: e.target.value }]
            : [{ title: "", description: e.target.value }];
          actions.updateCourseField("courseTestimonials", updatedTestimonials);
        }}
        className="w-full"
        rows={3}
        lockHeight
        required
      />

      <TagInput
        label="Course Features (Optional)"
        placeholder="Add course features (e.g., Lifetime Access, Certificate)"
        tags={state.course.features}
        onChange={(features) => actions.setCourseFeatures(features)}
        className="w-full"
        required={false}
      />

      <FlexBox className="w-full gap-4">
        <OrangeButton
          className="w-max px-8"
          onClick={() => setActiveScreen("screen4")}
        >
          Previous
        </OrangeButton>
        <OrangeButton
          className="mt-auto mb-4 w-max px-16 self-end"
          onClick={() => setActiveScreen("screen6")}
          disabled={
            !state.course.totalRatings ||
            !state.course.enrolledCount ||
            !state.course.courseTestimonials?.[0]?.title ||
            !state.course.courseTestimonials?.[0]?.description
          }
        >
          Next Page
        </OrangeButton>
      </FlexBox>
    </Container>
  );
};

export default Screen5; 