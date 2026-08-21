"use client";

import { useState } from "react";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";

export interface MediaValue {
  src?: string;
  source?: "upload" | "url";
  s3Key?: string;
}

/**
 * One slot that takes either an upload or a pasted URL.
 *
 * Unlike the home page's `ImageField` this keeps `source` and `s3Key`, so the
 * widget reopens on the tab last used and removing an upload can delete the
 * object instead of orphaning it in the bucket.
 */
export default function MediaField({
  title,
  description,
  type = "image",
  value,
  onChange,
  folderName = "enquiry-page",
}: {
  title?: string;
  description?: string;
  type?: "image" | "document";
  value: MediaValue;
  onChange: (next: MediaValue) => void;
  folderName?: string;
}) {
  const { uploadFile, isUploading } = useUpload();
  const [source, setSource] = useState<"upload" | "url" | undefined>(
    value.source ?? (value.src ? "url" : undefined),
  );

  const handleUpload = async (file: File, folder: string): Promise<string> => {
    const result = await uploadFile(file, folder);
    if (result.success && result.data?.url) {
      onChange({
        src: result.data.url,
        source: "upload",
        s3Key: result.data.s3Key,
      });
      setSource("upload");
      return result.data.url;
    }
    throw new Error(result.error || "Upload failed");
  };

  return (
    <UploadMediaContainer
      title={title}
      description={description}
      type={type}
      mediaUrl={value.src}
      mediaSource={source}
      s3Key={value.s3Key}
      folderName={folderName}
      allowUrlInput
      showConfirmation={false}
      isUploading={isUploading}
      onFileUpload={handleUpload}
      onUrlSubmit={(url) => {
        onChange({ src: url, source: "url", s3Key: undefined });
        setSource("url");
      }}
      onFileRemove={() => {
        onChange({ src: undefined, source: undefined, s3Key: undefined });
        setSource(undefined);
      }}
    />
  );
}
