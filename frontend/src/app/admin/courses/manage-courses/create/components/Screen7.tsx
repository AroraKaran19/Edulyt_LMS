import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import React from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";

const Screen7 = () => {
  const { state, actions, clearDraft } = useCourseContext();
  const { setActiveScreen, clearScreenHistory } = useScreen();

  const handleSubmit = async () => {
    try {
      // Here you would typically submit the course data to your API
      console.log("Submitting course:", state.course);
      
      // Simulate API call (replace with your actual API call)
      // const response = await fetch('/api/courses', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(state.course)
      // });
      
      // Simulate successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear the draft data from localStorage after successful submission
      clearDraft();
      clearScreenHistory();
      
      console.log("Course created successfully! Draft cleared.");
      
      // You could redirect the user or show a success message here
      // For example: router.push('/admin/courses/manage-courses');
      
    } catch (error) {
      console.error("Failed to create course:", error);
      // Handle error (show error message, etc.)
    }
  };

  return (
    <Container
      title="Final Review & Submit"
      description="Review your course information before submitting"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> {state.course.title}</p>
            <p><strong>Category:</strong> {state.course.category}</p>
            <p><strong>Subcategory:</strong> {state.course.subcategory || "Not specified"}</p>
            <p><strong>Audience:</strong> {state.course.audience}</p>
            <p><strong>Duration:</strong> {state.course.duration}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Learning Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Skill Level:</strong> {state.course.skillLevel}</p>
            <p><strong>Language:</strong> {state.course.language}</p>
            <p><strong>Skills:</strong> {state.course.skills.join(", ")}</p>
            <p><strong>Career Paths:</strong> {state.course.careerPaths.join(", ")}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Content & Media</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Thumbnail:</strong> {state.course.thumbnail ? "Set" : "Not set"}</p>
            <p><strong>Preview Video:</strong> {state.course.previewVideoUrl ? "Set" : "Not set"}</p>
            <p><strong>Slug:</strong> {state.course.slug}</p>
            <p><strong>Featured:</strong> {state.course.isFeatured ? "Yes" : "No"}</p>
            <p><strong>Certified:</strong> {state.course.isCertified ? "Yes" : "No"}</p>
            <p><strong>Active:</strong> {state.course.isActive ? "Yes" : "No"}</p>
            <p><strong>Scholarship:</strong> {state.course.scholarship ? "Yes" : "No"}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Pricing Plans</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Essential Plan:</strong> ${state.course.plans?.essential?.price} ({state.course.plans?.essential?.billingPeriod})</p>
            <p><strong>Elite Plan:</strong> ${state.course.plans?.elite?.price} ({state.course.plans?.elite?.billingPeriod})</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Reviews & Metrics</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Total Ratings:</strong> {state.course.totalRatings}</p>
            <p><strong>Enrolled Students:</strong> {state.course.enrolledCount}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">SEO & FAQs</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Meta Title:</strong> {state.course.metaTitle}</p>
            <p><strong>Keywords:</strong> {state.course.keywords.join(", ")}</p>
            <p><strong>FAQs:</strong> {state.course.faqs.length} questions</p>
          </div>
        </div>
      </div>

      <FlexBox className="w-full gap-4">
        <OrangeButton
          className="w-max px-8"
          onClick={() => setActiveScreen("screen6")}
        >
          Previous
        </OrangeButton>
        <OrangeButton
          className="mt-auto mb-4 w-max px-16 self-end"
          onClick={handleSubmit}
        >
          Create Course
        </OrangeButton>
      </FlexBox>
    </Container>
  );
};

export default Screen7; 