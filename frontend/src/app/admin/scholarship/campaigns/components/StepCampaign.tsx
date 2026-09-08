"use client";

import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";

type Props = {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  imageUrl: string;
  imageS3Key: string;
  onImageChange: (image: { url: string; s3Key: string }) => void;
  onImageRemove: () => void;
};

export default function StepCampaign({
  title,
  setTitle,
  description,
  setDescription,
  imageUrl,
  imageS3Key,
  onImageChange,
  onImageRemove,
}: Props) {
  const { uploadFile, deleteFile } = useUpload();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(
    async (file: File, folderName: string): Promise<string> => {
      setIsUploading(true);
      try {
        const response = await uploadFile(file, folderName);
        if (response.success && response.data) {
          onImageChange({
            url: response.data.url,
            s3Key: response.data.s3Key ?? "",
          });
          toast.success("Image uploaded");
          return response.data.url;
        }
        throw new Error(response.error || "Upload failed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile, onImageChange],
  );

  // Only the object this campaign owns is removed from the bucket. The
  // campaign's own field is cleared either way, so a failed delete leaves an
  // orphan rather than an image the admin cannot get rid of.
  const handleFileRemove = useCallback(async () => {
    if (imageS3Key) {
      try {
        await deleteFile(imageS3Key);
      } catch {
        // Deliberately swallowed. See above.
      }
    }
    onImageRemove();
  }, [imageS3Key, deleteFile, onImageRemove]);
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Campaign title"
        required
        placeholder="e.g. Diwali scholarship test"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <p className="text-xs text-gray-500 -mt-2">
        The public URL is derived from this and cannot be changed later.
      </p>

      <TextArea
        label="Public description"
        placeholder="Shown to candidates on the campaign page (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <p className="text-sm text-gray-700">
          Everyone who finishes the test gets the coupon. It works on any course,
          and each winner can redeem it once.
        </p>
      </div>

      <UploadMediaContainer
        title="Hero image (optional)"
        description="Shown above the headline on the campaign page. Leave empty to keep the current text-only hero."
        type="image"
        mediaUrl={imageUrl || undefined}
        mediaSource="upload"
        s3Key={imageS3Key || undefined}
        folderName="scholarship"
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        isUploading={isUploading}
        maxSize={5}
        acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
      />
      <p className="text-xs text-gray-500 -mt-2">
        Adding an image makes the headline smaller so both fit above the fold.
      </p>
    </div>
  );
}
