"use client";

import { useState } from "react";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import { TextField } from "./fields";

interface ImageFieldProps {
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  onChange: (next: { imageSrc?: string; imageAlt?: string }) => void;
  folderName?: string;
  showAltText?: boolean;
}

/**
 * Wraps UploadMediaContainer for an image-only field with a paired alt-text input.
 * Persists the resulting public URL into `imageSrc`.
 */
export default function ImageField({
  title = "Image",
  description,
  imageSrc,
  imageAlt,
  onChange,
  folderName = "home-page",
  showAltText = true,
}: ImageFieldProps) {
  const { uploadFile, isUploading } = useUpload();
  const [mediaSource, setMediaSource] = useState<"upload" | "url" | undefined>(
    imageSrc ? "url" : undefined
  );

  const handleUpload = async (file: File, folder: string): Promise<string> => {
    const result = await uploadFile(file, folder);
    if (result.success && result.data?.url) {
      onChange({ imageSrc: result.data.url, imageAlt });
      setMediaSource("upload");
      return result.data.url;
    }
    throw new Error(result.error || "Upload failed");
  };

  const handleUrlSubmit = (url: string) => {
    onChange({ imageSrc: url, imageAlt });
    setMediaSource("url");
  };

  const handleRemove = () => {
    onChange({ imageSrc: undefined, imageAlt });
    setMediaSource(undefined);
  };

  return (
    <div className="flex flex-col gap-3">
      <UploadMediaContainer
        title={title}
        description={description}
        type="image"
        mediaUrl={imageSrc}
        mediaSource={mediaSource}
        folderName={folderName}
        allowUrlInput
        showConfirmation={false}
        isUploading={isUploading}
        onFileUpload={handleUpload}
        onUrlSubmit={handleUrlSubmit}
        onFileRemove={handleRemove}
      />
      {showAltText && (
        <TextField
          label="Alt text"
          value={imageAlt ?? ""}
          onChange={(v) => onChange({ imageSrc, imageAlt: v })}
          placeholder="Describe the image for accessibility"
        />
      )}
    </div>
  );
}
