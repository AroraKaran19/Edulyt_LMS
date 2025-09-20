import React, { useState } from "react";
import {
  Video,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Content, VideoContent, QuizContent, Quiz } from "@/types/course";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import DropDown from "@/components/ui/dropdown/DropDown";
import { useUpload } from "@/hooks/useUpload";

interface ContentCardProps {
  contentId: string;
  contentData: Content;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  onDeleteContent?: (contentId: string) => void;
  index: number;
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
}

const ContentCard: React.FC<ContentCardProps> = ({
  contentId,
  contentData,
  isExpanded,
  onToggleExpansion,
  onUpdateContent,
  onDeleteContent,
  index,
  courseTitle = "untitled",
  moduleIndex = 0,
  lessonIndex = 0,
}) => {
  const [isEditing, setIsEditing] = useState(!contentData.title);
  const content = contentData;

  const getContentConfig = () => {
    if (content.type === "video") {
      return {
        icon: Video,
        label: "Video Lesson",
        bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
        borderColor: "border-blue-200",
        iconColor: "text-blue-600",
        badgeColor: "bg-blue-100 text-blue-700",
      };
    } else {
      return {
        icon: HelpCircle,
        label: "Knowledge Quiz",
        bgColor: "bg-gradient-to-r from-emerald-50 to-green-50",
        borderColor: "border-emerald-200",
        iconColor: "text-emerald-600",
        badgeColor: "bg-emerald-100 text-emerald-700",
      };
    }
  };

  const isContentComplete = () => {
    if (!content.title || content.title.trim() === "") return false;
    if (content.type === "video") {
      const videoContent = content as VideoContent;
      // For video content: title, video URL, and thumbnail are all required
      return !!(
        videoContent.sources?.[0]?.videoUrl &&
        videoContent.sources[0].videoUrl.trim() !== "" &&
        videoContent.thumbnailUrl &&
        videoContent.thumbnailUrl.trim() !== ""
      );
    } else {
      const quizContent = content as QuizContent;
      return !!(quizContent.passingScore && quizContent.maxAttempts);
    }
  };

  const getContentDuration = () => {
    if (content.type === "video") {
      const videoContent = content as VideoContent;
      const duration = videoContent.duration || 0;
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return null;
  };

  const config = getContentConfig();
  const {
    icon: Icon,
    label,
    bgColor,
    borderColor,
    iconColor,
    badgeColor,
  } = config;
  const isComplete = isContentComplete();
  const duration = getContentDuration();

  return (
    <div
      className={`${bgColor} rounded-xl border-2 ${borderColor} overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/40 transition-colors"
          onClick={onToggleExpansion}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {index + 1}
              </span>
              <div className={`p-2 rounded-lg ${badgeColor}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-800">
                  {content.title || `Untitled ${content.type}`}
                </h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}
                >
                  {label}
                </span>
              </div>
              {content.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {content.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicators */}
            <div className="flex items-center gap-2">
              {duration && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {duration}
                </div>
              )}
              {isComplete ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
            </div>

            {/* Expand/collapse button */}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 bg-white space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                {isEditing ? "Preview" : "Edit"}
              </button>
            </div>

            {onDeleteContent && (
              <button
                onClick={() => onDeleteContent(contentId)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>

          {/* Content preview or edit form */}
          {isEditing ? (
            <ContentEditForm
              content={content}
              contentId={contentId}
              onUpdateContent={onUpdateContent}
              courseTitle={courseTitle}
              moduleIndex={moduleIndex}
              lessonIndex={lessonIndex}
              index={index}
            />
          ) : (
            <ContentPreview content={content} />
          )}
        </div>
      )}
    </div>
  );
};

// Content Edit Form Component
interface ContentEditFormProps {
  content: Content;
  contentId: string;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
  index?: number;
}

const ContentEditForm: React.FC<ContentEditFormProps> = ({
  content,
  contentId,
  onUpdateContent,
  courseTitle,
  moduleIndex,
  lessonIndex,
  index,
}) => {
  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content Title
          </label>
          <input
            type="text"
            value={content.title}
            onChange={(e) =>
              onUpdateContent(contentId, { title: e.target.value })
            }
            placeholder={`e.g., ${
              content.type === "video"
                ? "Introduction Video"
                : "Knowledge Check Quiz"
            }`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={content.description || ""}
            onChange={(e) =>
              onUpdateContent(contentId, { description: e.target.value })
            }
            placeholder="Describe this content item"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Type-specific fields */}
      {content.type === "video" ? (
        <VideoContentForm
          content={content}
          contentId={contentId}
          onUpdateContent={onUpdateContent}
          courseTitle={courseTitle}
          moduleIndex={moduleIndex}
          lessonIndex={lessonIndex}
          index={index}
        />
      ) : (
        <QuizContentForm
          content={content}
          contentId={contentId}
          onUpdateContent={onUpdateContent}
        />
      )}
    </div>
  );
};

// Content Preview Component
interface ContentPreviewProps {
  content: Content;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({ content }) => {
  return (
    <div className="space-y-3">
      {content.description && (
        <p className="text-sm text-gray-600">{content.description}</p>
      )}

      {content.type === "video" ? (
        <VideoContentPreview content={content as VideoContent} />
      ) : (
        <QuizContentPreview content={content as QuizContent} />
      )}
    </div>
  );
};

// Video Content Form
interface VideoContentFormProps {
  content: Content;
  contentId: string;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
  index?: number;
}

const VideoContentForm: React.FC<VideoContentFormProps> = ({
  content,
  contentId,
  onUpdateContent,
  courseTitle,
  moduleIndex,
  lessonIndex,
  index,
}) => {
  const videoContent = content as VideoContent;
  const { uploadWithPresignedUrl, isUploading, getVideoDuration } = useUpload();
  const [isExtractingDuration, setIsExtractingDuration] = useState(false);
  const [durationExtractionMessage, setDurationExtractionMessage] =
    useState<string>("");

  // Handle video upload with duration extraction
  const handleVideoUpload = async (
    file: File,
    folderName: string
  ): Promise<string> => {
    try {
      // Start duration extraction
      setIsExtractingDuration(true);
      setDurationExtractionMessage("Extracting video duration...");

      // Extract duration from the uploaded file
      const duration = await getVideoDuration(file);

      // Upload the file
      const result = await uploadWithPresignedUrl(file, folderName);

      if (result.success && result.data) {
        // Update content with URL, duration, and source tracking
        onUpdateContent(contentId, {
          ...videoContent,
          sources: [
            {
              quality: "1080p",
              videoUrl: result.data.url,
              videoSource: "upload",
              videoS3Key: result.data.s3Key || "",
            },
          ],
          duration: duration,
        } as VideoContent);

        // Show success message
        if (duration > 0) {
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const formattedDuration = `${minutes}:${seconds
            .toString()
            .padStart(2, "0")}`;
          setDurationExtractionMessage(
            `Duration auto-filled: ${formattedDuration}`
          );

          // Clear success message after 3 seconds
          setTimeout(() => {
            setDurationExtractionMessage("");
            setIsExtractingDuration(false);
          }, 3000);
        } else {
          setDurationExtractionMessage("");
          setIsExtractingDuration(false);
        }

        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Video upload failed:", error);
      setDurationExtractionMessage("");
      setIsExtractingDuration(false);
      throw error;
    }
  };

  // Handle video URL input
  const handleVideoUrlSubmit = (url: string) => {
    onUpdateContent(contentId, {
      ...videoContent,
      sources: [
        {
          quality: "1080p",
          videoUrl: url,
          videoSource: "url",
          videoS3Key: "",
        },
      ],
    } as VideoContent);
  };

  // Handle video removal
  const handleVideoRemove = () => {
    onUpdateContent(contentId, {
      ...videoContent,
      sources: [
        {
          quality: "1080p",
          videoUrl: "",
          videoSource: undefined,
          videoS3Key: "",
        },
      ],
    } as VideoContent);
  };

  return (
    <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium text-blue-900 flex items-center gap-2">
        <Video className="w-4 h-4" />
        Video Settings
      </h4>

      <div className="grid grid-cols-1 gap-3">
        <UploadMediaContainer
          title="Video Content"
          description="Upload your lesson video or provide a video URL (required)"
          type="video"
          mediaUrl={videoContent.sources[0]?.videoUrl}
          mediaSource={videoContent.sources[0]?.videoSource}
          s3Key={videoContent.sources[0]?.videoS3Key}
          maxSize={102400} // 100GB
          onFileUpload={handleVideoUpload}
          onFileRemove={handleVideoRemove}
          onUrlSubmit={handleVideoUrlSubmit}
          isUploading={isUploading || isExtractingDuration}
          allowUrlInput={true}
          urlPlaceholder="Enter video URL (YouTube, Vimeo, or direct link)"
          folderName={`courses/${courseTitle}/modules/module-${
            (moduleIndex || 0) + 1
          }/lessons/lesson-${(index || 0) + 1}/content`}
          uploadContext={`video-${(index || 0) + 1}`}
          showConfirmation={true}
          required={true}
          className="w-full"
          usePresignedUrl={true}
          presignedUrlThreshold={100}
        />

        <UploadMediaContainer
          title="Video Thumbnail"
          description="Upload a thumbnail image for this video (required)"
          type="image"
          mediaUrl={videoContent.thumbnailUrl}
          mediaSource={videoContent.thumbnailUrl ? "upload" : undefined}
          maxSize={100} // 10MB for images
          onFileUpload={async (file: File, folderName: string) => {
            try {
              const result = await uploadWithPresignedUrl(file, folderName);
              if (result.success && result.data) {
                onUpdateContent(contentId, {
                  ...videoContent,
                  thumbnailUrl: result.data.url,
                } as VideoContent);
                return result.data.url;
              }
              throw new Error(result.error || "Upload failed");
            } catch (error) {
              console.error("Thumbnail upload failed:", error);
              throw error;
            }
          }}
          onFileRemove={() => {
            onUpdateContent(contentId, {
              ...videoContent,
              thumbnailUrl: "",
            });
          }}
          onUrlSubmit={(url) => {
            onUpdateContent(contentId, {
              ...videoContent,
              thumbnailUrl: url,
            });
          }}
          isUploading={isUploading}
          allowUrlInput={true}
          urlPlaceholder="Enter thumbnail URL"
          folderName={`courses/${courseTitle}/modules/module-${
            (moduleIndex || 0) + 1
          }/lessons/lesson-${(lessonIndex || 0) + 1}/content`}
          uploadContext={`thumbnail-${(index || 0) + 1}`}
          showConfirmation={true}
          required={true}
          className="w-full"
          usePresignedUrl={true}
          presignedUrlThreshold={10}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (seconds)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={videoContent.duration?.toString() || ""}
              onChange={(e) => {
                onUpdateContent(contentId, {
                  ...videoContent,
                  duration: parseInt(e.target.value) || 0,
                });
              }}
              placeholder="300"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isExtractingDuration}
            />
            {isExtractingDuration && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Duration extraction feedback */}
          {isExtractingDuration && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {durationExtractionMessage}
            </p>
          )}
          {durationExtractionMessage && !isExtractingDuration && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {durationExtractionMessage}
            </p>
          )}
          {!isExtractingDuration && !durationExtractionMessage && (
            <p className="text-xs text-gray-500 mt-1">
              Duration will be auto-filled when you upload a video file
            </p>
          )}
        </div>

        <DropDown
          label="Video Quality"
          options={["1080p (Full HD)", "720p (HD)", "480p (SD)", "360p (Low)"]}
          value={
            videoContent.sources?.[0]?.quality
              ? `${videoContent.sources[0].quality} (${
                  videoContent.sources[0].quality === "1080p"
                    ? "Full HD"
                    : videoContent.sources[0].quality === "720p"
                    ? "HD"
                    : videoContent.sources[0].quality === "480p"
                    ? "SD"
                    : "Low"
                })`
              : "1080p (Full HD)"
          }
          onChange={(e) => {
            const valueToQuality = {
              "1080p (Full HD)": "1080p",
              "720p (HD)": "720p",
              "480p (SD)": "480p",
              "360p (Low)": "360p",
            } as const;

            const newQuality =
              valueToQuality[e.target.value as keyof typeof valueToQuality] ||
              "1080p";
            const currentSource = videoContent.sources?.[0] || {
              quality: "1080p",
              videoUrl: "",
            };

            onUpdateContent(contentId, {
              ...videoContent,
              sources: [
                {
                  ...currentSource,
                  quality: newQuality,
                },
              ],
            });
          }}
          className="w-full"
        />
      </div>
    </div>
  );
};

// Quiz Content Form
interface QuizContentFormProps {
  content: Content;
  contentId: string;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
}

const QuizContentForm: React.FC<QuizContentFormProps> = ({
  content,
  contentId,
  onUpdateContent,
}) => {
  const quizContent = content as QuizContent;

  return (
    <div className="space-y-3 p-4 bg-emerald-50 rounded-lg">
      <h4 className="font-medium text-emerald-900 flex items-center gap-2">
        <HelpCircle className="w-4 h-4" />
        Quiz Settings
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passing Score (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={quizContent.passingScore?.toString() || ""}
            onChange={(e) => {
              onUpdateContent(contentId, {
                ...quizContent,
                passingScore: parseInt(e.target.value) || 70,
              });
            }}
            placeholder="70"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Attempts
          </label>
          <input
            type="number"
            min="1"
            value={quizContent.maxAttempts?.toString() || ""}
            onChange={(e) => {
              onUpdateContent(contentId, {
                ...quizContent,
                maxAttempts: parseInt(e.target.value) || 3,
              });
            }}
            placeholder="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="text-xs text-emerald-700 bg-emerald-100 p-3 rounded-lg">
        <FileText className="w-4 h-4 inline mr-1" />
        Quiz questions can be added after creating the course structure
      </div>
    </div>
  );
};

// Video Content Preview
interface VideoContentPreviewProps {
  content: VideoContent;
}

const VideoContentPreview: React.FC<VideoContentPreviewProps> = ({
  content,
}) => {
  return (
    <div className="p-3 bg-blue-50 rounded-lg">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="font-medium text-blue-900">Video URL:</span>
          <p className="text-blue-700 truncate">
            {content.sources[0]?.videoUrl || "Not set"}
          </p>
        </div>
        <div>
          <span className="font-medium text-blue-900">Duration:</span>
          <p className="text-blue-700">
            {content.duration
              ? `${Math.floor(content.duration / 60)}:${(content.duration % 60)
                  .toString()
                  .padStart(2, "0")}`
              : "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
};

// Quiz Content Preview
interface QuizContentPreviewProps {
  content: Quiz;
}

const QuizContentPreview: React.FC<QuizContentPreviewProps> = ({ content }) => {
  return (
    <div className="p-3 bg-emerald-50 rounded-lg">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="font-medium text-emerald-900">Passing Score:</span>
          <p className="text-emerald-700">{content.passingScore || 70}%</p>
        </div>
        <div>
          <span className="font-medium text-emerald-900">Max Attempts:</span>
          <p className="text-emerald-700">{content.maxAttempts || 3}</p>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
