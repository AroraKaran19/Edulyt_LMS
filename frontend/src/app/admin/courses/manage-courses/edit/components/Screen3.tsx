import Container from "@/app/admin/components/ui/Container";
import React from "react";
import { useEditCourseContext } from "../../../reducers/course/providers/EditCourseReducerProvider";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import ScreenNavigation from "./shared/ScreenNavigation";
import { useScreen } from "../contexts/ScreenContext";
import { Image, Video } from "lucide-react";

const Screen3 = () => {
  const { state, actions } = useEditCourseContext();
  const { uploadWithPresignedUrl, isUploading } = useUpload();
  const { setActiveScreen } = useScreen();

  // Generate folder names based on course title
  const courseTitle = state.course.title || "untitled-course";
  const thumbnailFolder = `courses/${courseTitle}/thumbnail`;
  const videoFolder = `courses/${courseTitle}/previewVideo`;

  // Handle thumbnail uploads
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
      title="Course Media"
      description="Upload visual content to showcase your course"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Course Thumbnail Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Course Thumbnail</h3>
            <p className="text-sm text-gray-600">Upload an attractive thumbnail image for your course</p>
          </div>
        </div>

        <UploadMediaContainer
          title="Course Thumbnail"
          description={`Upload the thumbnail image for "${courseTitle}"`}
          type="image"
          mediaUrl={state.course.thumbnail}
          mediaSource={state.course.thumbnailSource}
          s3Key={state.course.thumbnailS3Key}
          maxSize={10}
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
          presignedUrlThreshold={5}
        />
      </div>

      {/* Preview Video Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Preview Video</h3>
            <p className="text-sm text-gray-600">Upload a preview video to give students a taste of your course content (optional)</p>
          </div>
        </div>

        <UploadMediaContainer
          title="Course Preview Video"
          description={`Upload a preview video for "${courseTitle}"`}
          type="video"
          mediaUrl={state.course.previewVideoUrl}
          mediaSource={state.course.previewVideoSource}
          s3Key={state.course.previewVideoS3Key}
          maxSize={100000} // 100MB
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
          presignedUrlThreshold={50}
        />
      </div>

      <ScreenNavigation
        currentStep={3}
        previousScreen="screen2"
        nextScreen="screen4"
        setActiveScreen={setActiveScreen}
        isNextDisabled={!state.course.thumbnail} // Only thumbnail is required
      />
    </Container>
  );
};

export default Screen3;
