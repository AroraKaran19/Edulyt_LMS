"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  X,
  Save,
  Link as LinkIcon,
} from "lucide-react";
import {
  useAuthenticationMedia,
  AuthenticationMedia,
} from "@/hooks/useAuthenticationMedia";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import { toast } from "react-toastify";

const AuthenticationMediaPage = () => {
  const {
    getAllAuthenticationMedia,
    createAuthenticationMedia,
    updateAuthenticationMedia,
    deleteAuthenticationMedia,
    reorderAuthenticationMedia,
    isLoading,
  } = useAuthenticationMedia();

  const { uploadFile } = useUpload();

  const [mediaList, setMediaList] = useState<AuthenticationMedia[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<AuthenticationMedia | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [mediaSource, setMediaSource] = useState<"upload" | "url">("upload");
  const [s3Key, setS3Key] = useState<string | undefined>(undefined);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load media on mount
  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    const result = await getAllAuthenticationMedia(1, 100);
    if (result && result.media) {
      setMediaList(result.media);
    } else {
      setMediaList([]);
    }
  };

  // Handle file upload
  const handleFileUpload = useCallback(
    async (
      file: File,
      folderName: string,
      options?: { usePresignedUrl?: boolean; presignedUrlThresholdMb?: number }
    ): Promise<string> => {
      setIsUploading(true);
      try {
        const response = await uploadFile(file, folderName);
        if (response.success && response.data) {
          const uploadedUrl = response.data.url;
          setImageUrl(uploadedUrl);
          setS3Key(response.data.s3Key);
          setMediaSource("upload");
          toast.success("Image uploaded successfully");
          return uploadedUrl;
        }
        throw new Error(response.error || "Upload failed");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile]
  );

  // Handle URL submit
  const handleUrlSubmit = useCallback((url: string) => {
    setImageUrl(url);
    setMediaSource("url");
    setS3Key(undefined);
  }, []);

  // Handle file remove
  const handleFileRemove = useCallback(() => {
    setImageUrl("");
    setS3Key(undefined);
    setMediaSource("upload");
  }, []);

  // Open create modal
  const handleOpenCreateModal = () => {
    setEditingMedia(null);
    setImageUrl("");
    setLink("");
    setMediaSource("upload");
    setS3Key(undefined);
    setShowModal(true);
  };

  // Open edit modal
  const handleOpenEditModal = (media: AuthenticationMedia) => {
    setEditingMedia(media);
    setImageUrl(media.imageUrl);
    setLink(media.link || "");
    setMediaSource(media.imageUrl.startsWith("http") ? "url" : "upload");
    setS3Key(undefined);
    setShowModal(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!imageUrl) {
      toast.error("Please upload an image or provide an image URL");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        imageUrl,
        order: editingMedia ? editingMedia.order : mediaList?.length || 0,
        link: link.trim() || undefined,
      };

      if (editingMedia) {
        await updateAuthenticationMedia(editingMedia._id, data);
      } else {
        await createAuthenticationMedia(data);
      }

      setShowModal(false);
      await loadMedia();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (
      !confirm("Are you sure you want to delete this authentication media?")
    ) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteAuthenticationMedia(id);
      await loadMedia();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex || !mediaList) {
      setDraggedIndex(null);
      return;
    }

    const newList = [...mediaList];
    const draggedItem = newList[draggedIndex];

    // Remove dragged item from its original position
    newList.splice(draggedIndex, 1);

    // Insert at new position
    newList.splice(dropIndex, 0, draggedItem);

    // Update order values
    newList.forEach((item, idx) => {
      item.order = idx;
    });

    setMediaList(newList);
    setDraggedIndex(null);

    // Save new order
    const mediaIds = newList.map((item) => item._id);
    await reorderAuthenticationMedia(mediaIds);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Authentication Media
            </h1>
            <p className="text-gray-600 mt-1">
              Manage images displayed on authentication pages
            </p>
          </div>
          <OrangeButton
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Media
          </OrangeButton>
        </div>
      </div>

      {/* Media List */}
      {isLoading && (!mediaList || mediaList.length === 0) ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : !mediaList || mediaList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No authentication media found</p>
          <p className="text-gray-400 text-sm mt-2">
            Click "Add Media" to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaList.map((media, index) => (
            <div
              key={media._id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-move ${
                draggedIndex === index ? "opacity-50 scale-95" : ""
              } ${
                dragOverIndex === index
                  ? "border-orange-500 border-2 scale-105 shadow-lg"
                  : ""
              }`}
            >
              {/* Image */}
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={media.imageUrl}
                  alt={`Authentication media ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                />
                {/* Drag handle and order badge */}
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <div className="bg-black/70 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                    <GripVertical className="w-3 h-3" />
                    <span>#{index + 1}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {media.link && (
                  <div className="flex items-center gap-2 mb-3 text-sm text-blue-600">
                    <LinkIcon className="w-4 h-4" />
                    <a
                      href={media.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:underline"
                    >
                      {media.link}
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-4">
                  {/* Edit and Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(media);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(media._id);
                    }}
                    disabled={isDeleting === media._id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {isDeleting === media._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingMedia
                  ? "Edit Authentication Media"
                  : "Add Authentication Media"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Image Upload */}
              <UploadMediaContainer
                title="Image"
                description="Upload an image or provide an image URL"
                type="image"
                mediaUrl={imageUrl}
                mediaSource={mediaSource}
                s3Key={s3Key}
                folderName="authentication-media"
                onFileSelect={(file) => {
                  // File selected, will be uploaded automatically
                }}
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                onUrlSubmit={handleUrlSubmit}
                isUploading={isUploading}
                allowUrlInput
                maxSize={10}
                acceptedFormats={[".jpg", ".jpeg", ".png", ".webp", ".gif"]}
                required
              />

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link (Optional)
                </label>
                <Input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional link that will be opened when the image is clicked
                </p>
              </div>

              {/* Order Info */}
              {!editingMedia && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can drag and drop items in the
                    list to reorder them. New items will be added at the end.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <WhiteButton onClick={() => setShowModal(false)}>
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={handleSave}
                disabled={isSaving || !imageUrl}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingMedia ? "Update" : "Create"}
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

export default AuthenticationMediaPage;
