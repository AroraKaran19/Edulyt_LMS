import React from "react";
import { ChevronDown, ChevronUp, GripVertical, Video, HelpCircle, Trash2, Save } from "lucide-react";
import { Content, VideoContent, QuizContent } from "@/types/course";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

interface ContentCardProps {
  contentId: string;
  contentData: Content;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  onDeleteContent: (contentId: string) => void;
  onSaveContent: (contentId: string) => void;
  onRemoveContent: (contentId: string) => void;
  onVideoUpload: (contentId: string, file: File, folderName: string) => Promise<string>;
  onVideoUrlSubmit: (contentId: string, url: string) => void;
  onVideoRemove: (contentId: string) => void;
  onThumbnailUpload: (contentId: string, file: File, folderName: string) => Promise<string>;
  onThumbnailUrlSubmit: (contentId: string, url: string) => void;
  onThumbnailRemove: (contentId: string) => void;
  isUploading: boolean;
  isSaving?: boolean;
  saveError?: string | null;
  isComplete: (content: Content) => boolean;
  isSaved: (contentId: string) => boolean;
  courseTitle: string;
  moduleIndex: number;
  lessonIndex: number;
  contentIndex: number;
  index: number;
}

const ContentCard: React.FC<ContentCardProps> = ({
  contentId,
  contentData,
  isExpanded,
  onToggleExpansion,
  onUpdateContent,
  onSaveContent,
  onRemoveContent,
  onVideoUpload,
  onVideoUrlSubmit,
  onVideoRemove,
  onThumbnailUpload,
  onThumbnailUrlSubmit,
  onThumbnailRemove,
  isUploading,
  isSaving = false,
  saveError = null,
  isComplete,
  isSaved,
  courseTitle,
  moduleIndex,
  lessonIndex,
  contentIndex,
  index,
}) => {
  const isVideo = contentData.type === "video";
  const isQuiz = contentData.type === "quiz";

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Content Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-3 h-3 text-gray-400" />
            <div
              className={`w-3 h-3 rounded-full ${
                isComplete(contentData) ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></div>
            {isVideo ? (
              <Video className="w-4 h-4 text-blue-500" />
            ) : (
              <HelpCircle className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <span className="font-medium text-gray-800">
            {contentData.title || `${isVideo ? 'Video' : 'Quiz'} ${index + 1}`}
          </span>
          {isSaved(contentId) && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {isVideo ? 'Video' : 'Quiz'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          <div className="space-y-3">
            <Input
              label="Content Title"
              placeholder={`Enter ${isVideo ? 'video' : 'quiz'} title`}
              value={contentData.title}
              onChange={(e) => {
                onUpdateContent(contentId, { title: e.target.value });
              }}
              required
            />

            <TextArea
              label="Description"
              placeholder={`Describe this ${isVideo ? 'video' : 'quiz'} content`}
              value={contentData.description || ""}
              onChange={(e) => {
                onUpdateContent(contentId, { description: e.target.value });
              }}
              rows={2}
              lockHeight
            />

            {isVideo && (
              <div className="space-y-4">
                {/* Video Upload */}
                <UploadMediaContainer
                  title="Video File"
                  description="Upload a video file for this content (required)"
                  type="video"
                  mediaUrl={(contentData as VideoContent).sources[0]?.videoUrl || ""}
                  mediaSource={(contentData as any).videoSource}
                  s3Key={(contentData as any).videoS3Key}
                  maxSize={500} // 500MB for videos
                  acceptedFormats={[".mp4", ".mov", ".avi", ".mkv", ".webm"]}
                  onFileUpload={(file, folderName) =>
                    onVideoUpload(contentId, file, folderName)
                  }
                  onFileRemove={() => onVideoRemove(contentId)}
                  onUrlSubmit={(url) => onVideoUrlSubmit(contentId, url)}
                  isUploading={isUploading}
                  required={true}
                  allowUrlInput={true}
                  folderName={`courses/${courseTitle}/modules/module-${moduleIndex + 1}/lessons/lesson-${lessonIndex + 1}/content`}
                  uploadContext={`content-${contentIndex + 1}`}
                  usePresignedUrl={true}
                  presignedUrlThreshold={50} // Use presigned URL for files > 50MB
                  className="w-full"
                />

                {/* Thumbnail Upload */}
                <UploadMediaContainer
                  title="Video Thumbnail"
                  description="Upload a thumbnail image for this video (required)"
                  type="image"
                  mediaUrl={(contentData as VideoContent).thumbnailUrl || ""}
                  mediaSource={(contentData as any).thumbnailSource}
                  s3Key={(contentData as any).thumbnailS3Key}
                  maxSize={10} // 10MB for images
                  acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
                  onFileUpload={(file, folderName) =>
                    onThumbnailUpload(contentId, file, folderName)
                  }
                  onFileRemove={() => onThumbnailRemove(contentId)}
                  onUrlSubmit={(url) => onThumbnailUrlSubmit(contentId, url)}
                  isUploading={isUploading}
                  required={true}
                  allowUrlInput={true}
                  folderName={`courses/${courseTitle}/modules/module-${moduleIndex + 1}/lessons/lesson-${lessonIndex + 1}/thumbnails`}
                  uploadContext={`content-${contentIndex + 1}-thumbnail`}
                  usePresignedUrl={true}
                  presignedUrlThreshold={5} // Use presigned URL for files > 5MB
                  className="w-full"
                />
              </div>
            )}

            {isQuiz && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Quiz questions will be managed in a separate interface
                </div>
                <div className="flex gap-2">
                  <Input
                    label="Passing Score"
                    type="number"
                    placeholder="70"
                    value={(contentData as QuizContent).passingScore || 70}
                    onChange={(e) => {
                      onUpdateContent(contentId, {
                        passingScore: parseInt(e.target.value) || 70
                      });
                    }}
                    className="w-32"
                  />
                  <Input
                    label="Max Attempts"
                    type="number"
                    placeholder="3"
                    value={(contentData as QuizContent).maxAttempts || 3}
                    onChange={(e) => {
                      onUpdateContent(contentId, {
                        maxAttempts: parseInt(e.target.value) || 3
                      });
                    }}
                    className="w-32"
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete "${
                          contentData.title || "this content"
                        }"? This action cannot be undone.`
                      )
                    ) {
                      onRemoveContent(contentId);
                    }
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </>
                  )}
                </button>
              </div>

              <OrangeButton
                onClick={() => onSaveContent(contentId)}
                disabled={!isComplete(contentData) || isSaving}
                className="flex items-center gap-2 px-4 py-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {contentData._id?.startsWith("temp_") ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {contentData._id?.startsWith("temp_") ? "Save Content" : "Update Content"}
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCard;
