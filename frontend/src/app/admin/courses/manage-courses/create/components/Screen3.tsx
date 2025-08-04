import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { generateCourseFolderName } from "@/utils/folderUtils";
import { useUpload } from "@/hooks/useUpload";

const Screen3 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const { uploadFile } = useUpload();

  // Generate folder names based on course title
  const courseTitle = state.course.title || "untitled-course";
  const thumbnailFolder = generateCourseFolderName(courseTitle, "thumbnails");
  const videoFolder = generateCourseFolderName(courseTitle, "videos");

  // Handle file uploads
  const handleThumbnailUpload = async (file: File, folderName: string): Promise<string> => {
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        actions.setCourseThumbnail(result.data.url);
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Thumbnail upload failed:", error);
      throw error;
    }
  };

  const handleVideoUpload = async (file: File, folderName: string): Promise<string> => {
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        actions.setCoursePreviewVideoUrl(result.data.url);
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Video upload failed:", error);
      throw error;
    }
  };

  // Custom confirmation handler
  const handleUploadConfirmation = async (file: File, folderName: string): Promise<boolean> => {
    // You can add custom logic here if needed
    // For now, just return true to proceed
    return true;
  };

  return (
    <Container
      title="Content & Media"
      description="Add course media and content information"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <UploadMediaContainer
          title="Course Thumbnail"
          description={`Upload the thumbnail image for "${courseTitle}"`}
          type="image"
          mediaUrl={state.course.thumbnail}
          maxSize={5}
          onFileUpload={handleThumbnailUpload}
          onFileRemove={() => actions.setCourseThumbnail("")}
          folderName={thumbnailFolder}
          showConfirmation={true}
          onConfirmUpload={handleUploadConfirmation}
          allowUrlInput={true}
          urlPlaceholder="Enter thumbnail URL..."
          required={true}
        />
      </FlexBox>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <UploadMediaContainer
          title="Course Preview Video"
          description={`Upload the preview video for "${courseTitle}"`}
          type="video"
          mediaUrl={state.course.previewVideoUrl}
          maxSize={100}
          onFileUpload={handleVideoUpload}
          onFileRemove={() => actions.setCoursePreviewVideoUrl("")}
          folderName={videoFolder}
          showConfirmation={true}
          onConfirmUpload={handleUploadConfirmation}
          allowUrlInput={true}
          urlPlaceholder="Enter video URL..."
          required={false}
        />
      </FlexBox>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <CheckBoxContainer
          label="Featured Course"
          checked={state.course.isFeatured}
          onChange={(checked) => actions.setCourseIsFeatured(checked)}
          className="w-full"
        />
        <CheckBoxContainer
          label="Certified Course"
          checked={state.course.isCertified}
          onChange={(checked) => actions.setCourseIsCertified(checked)}
          className="w-full"
        />
      </FlexBox>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <CheckBoxContainer
          label="Active Course"
          checked={state.course.isActive}
          onChange={(checked) => actions.setCourseIsActive(checked)}
          className="w-full"
        />
        <CheckBoxContainer
          label="Scholarship Available"
          checked={state.course.scholarship}
          onChange={(checked) => actions.setCourseScholarship(checked)}
          className="w-full"
        />
      </FlexBox>

      {state.course.scholarship && (
        <TextArea
          label="Scholarship Description"
          name="scholarshipDescription"
          placeholder="Describe the scholarship program"
          value={state.course.scholarshipDescription}
          onChange={(e) => actions.setCourseScholarshipDescription(e.target.value)}
          className="w-full"
          rows={3}
          lockHeight
          required
        />
      )}

      <FlexBox className="w-full gap-4 mt-auto mb-4 justify-between">
        <OrangeButton
          className="w-max px-16"
          onClick={() => setActiveScreen("screen2")}
        >
          Previous
        </OrangeButton>
        <OrangeButton
          className="w-max px-16"
          onClick={() => setActiveScreen("screen4")}
          disabled={
            !state.course.thumbnail ||
            (state.course.scholarship && !state.course.scholarshipDescription)
          }
        >
          Next Page
        </OrangeButton>
      </FlexBox>
    </Container>
  );
};

export default Screen3; 