import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import React from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import ScreenNavigation from "./shared/ScreenNavigation";
import { useScreen } from "../contexts/ScreenContext";

const Screen3 = () => {
  const { state, actions } = useCourseContext();
  const { uploadWithPresignedUrl, isUploading } = useUpload();
  const { setActiveScreen } = useScreen();

  // Generate folder names based on course title
  const courseTitle = state.course.title || "untitled-course";
  const thumbnailFolder = `courses/${courseTitle}/thumbnail`;
  const videoFolder = `courses/${courseTitle}/previewVideo`;

  // Handle file uploads
  const handleThumbnailUpload = async (
    file: File,
    folderName: string
  ): Promise<string> => {
    try {
      const result = await uploadWithPresignedUrl(file, folderName);
      if (result.success && result.data) {
        actions.setCourseThumbnail(result.data.url);
        actions.setCourseThumbnailSource("upload");
        actions.setCourseThumbnailS3Key(result.data.s3Key || "");
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Thumbnail upload failed:", error);
      throw error;
    }
  };

  const handleVideoUpload = async (
    file: File,
    folderName: string
  ): Promise<string> => {
    try {
      const result = await uploadWithPresignedUrl(file, folderName);
      if (result.success && result.data) {
        actions.setCoursePreviewVideoUrl(result.data.url);
        actions.setCoursePreviewVideoSource("upload");
        actions.setCoursePreviewVideoS3Key(result.data.s3Key || "");
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Video upload failed:", error);
      throw error;
    }
  };

  // Handle URL submissions
  const handleThumbnailUrlSubmit = (url: string) => {
    actions.setCourseThumbnail(url);
    actions.setCourseThumbnailSource("url");
    actions.setCourseThumbnailS3Key(""); // Clear S3 key for URLs
  };

  const handleVideoUrlSubmit = (url: string) => {
    actions.setCoursePreviewVideoUrl(url);
    actions.setCoursePreviewVideoSource("url");
    actions.setCoursePreviewVideoS3Key(""); // Clear S3 key for URLs
  };

  // Handle file removals
  const handleThumbnailRemove = () => {
    actions.setCourseThumbnail("");
    actions.setCourseThumbnailSource(undefined);
    actions.setCourseThumbnailS3Key("");
  };

  const handleVideoRemove = () => {
    actions.setCoursePreviewVideoUrl("");
    actions.setCoursePreviewVideoSource(undefined);
    actions.setCoursePreviewVideoS3Key("");
  };

  // Custom confirmation handler
  const handleUploadConfirmation = async (): Promise<boolean> => {
    // You can add custom logic here if needed
    // For now, just return true to proceed
    return true;
  };

  return (
    <Container
      title="Preview Video & Thumbnail"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <UploadMediaContainer
          title="Course Thumbnail"
          description={`Upload the thumbnail image for "${courseTitle}"`}
          type="image"
          mediaUrl={state.course.thumbnail}
          mediaSource={state.course.thumbnailSource}
          s3Key={state.course.thumbnailS3Key}
          maxSize={50}
          onFileUpload={handleThumbnailUpload}
          onFileRemove={handleThumbnailRemove}
          onUrlSubmit={handleThumbnailUrlSubmit}
          isUploading={isUploading}
          folderName={thumbnailFolder}
          showConfirmation={true}
          onConfirmUpload={handleUploadConfirmation}
          allowUrlInput={true}
          urlPlaceholder="Enter thumbnail URL..."
          required={true}
          usePresignedUrl={true}
          presignedUrlThreshold={10}
        />
      </FlexBox>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <UploadMediaContainer
          title="Course Preview Video"
          description={`Upload the preview video for "${courseTitle}"`}
          type="video"
          mediaUrl={state.course.previewVideoUrl}
          mediaSource={state.course.previewVideoSource}
          s3Key={state.course.previewVideoS3Key}
          maxSize={102400}
          onFileUpload={handleVideoUpload}
          onFileRemove={handleVideoRemove}
          onUrlSubmit={handleVideoUrlSubmit}
          isUploading={isUploading}
          folderName={videoFolder}
          showConfirmation={true}
          onConfirmUpload={handleUploadConfirmation}
          allowUrlInput={true}
          urlPlaceholder="Enter video URL..."
          required={false}
          usePresignedUrl={true}
          presignedUrlThreshold={100}
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
          onChange={(e) =>
            actions.setCourseScholarshipDescription(e.target.value)
          }
          className="w-full"
          rows={3}
          lockHeight
          required
        />
      )}

      <ScreenNavigation
        currentStep={3}
        previousScreen="screen2"
        nextScreen="screen4"
        setActiveScreen={setActiveScreen}
        isNextDisabled={
          !state.course.thumbnail ||
          (state.course.scholarship && !state.course.scholarshipDescription)
        }
      />
    </Container>
  );
};

export default Screen3;
