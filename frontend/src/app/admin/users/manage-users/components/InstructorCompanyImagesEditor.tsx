"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

const MAX_IMAGES = 12;

type Slot = {
  id: string;
  url: string;
  s3Key?: string;
  mediaSource: "upload" | "url";
};

function newEmptySlot(): Slot {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    url: "",
    s3Key: undefined,
    mediaSource: "upload",
  };
}

function urlsFromSlots(slots: Slot[]): string[] {
  return slots.map((s) => s.url).filter(Boolean);
}

export type InstructorCompanyImagesEditorProps = {
  resetKey: string;
  defaultUrls: string[];
  onUrlsChange: (urls: string[]) => void;
  uploadContext?: string;
  disabled?: boolean;
};

const InstructorCompanyImagesEditor = ({
  resetKey,
  defaultUrls,
  onUrlsChange,
  uploadContext = "new-instructor",
  disabled = false,
}: InstructorCompanyImagesEditorProps) => {
  const { uploadFile, deleteFile } = useUpload();
  const [slots, setSlots] = useState<Slot[]>([]);
  const slotsRef = useRef<Slot[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    const urls = defaultUrls || [];
    const next =
      urls.length > 0
        ? urls.map((url) => ({
            id:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
            url,
            s3Key: undefined,
            mediaSource: "url" as const,
          }))
        : [];
    setSlots(next);
    slotsRef.current = next;
  }, [resetKey]);

  const commit = useCallback(
    (next: Slot[]) => {
      setSlots(next);
      slotsRef.current = next;
      onUrlsChange(urlsFromSlots(next));
    },
    [onUrlsChange],
  );

  const handleFileUpload = useCallback(
    async (index: number, file: File, folderName: string) => {
      const slot = slotsRef.current[index];
      if (!slot) return "";

      setUploadingIndex(index);
      try {
        if (slot.s3Key && slot.mediaSource === "upload") {
          await deleteFile(slot.s3Key);
        }

        const result = await uploadFile(file, folderName);
        if (!result.success || !result.data) {
          throw new Error(result.error || "Upload failed");
        }

        const { url, s3Key } = result.data;
        const prev = slotsRef.current;
        const next = [...prev];
        next[index] = {
          ...next[index],
          url,
          s3Key,
          mediaSource: "upload",
        };
        commit(next);
        toast.success("Image uploaded");
        return url;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
        throw e;
      } finally {
        setUploadingIndex(null);
      }
    },
    [uploadFile, deleteFile, commit],
  );

  const handleUrlSubmit = useCallback(
    async (index: number, url: string) => {
      const slot = slotsRef.current[index];
      if (!slot) return;

      if (slot.s3Key && slot.mediaSource === "upload") {
        try {
          await deleteFile(slot.s3Key);
        } catch {
          /* ignore */
        }
      }

      const prev = slotsRef.current;
      const next = [...prev];
      next[index] = {
        ...next[index],
        url,
        s3Key: undefined,
        mediaSource: "url",
      };
      commit(next);
      toast.success("Image URL added");
    },
    [deleteFile, commit],
  );

  const handleRemove = useCallback(
    async (index: number) => {
      const slot = slotsRef.current[index];
      if (!slot) return;

      if (slot.s3Key && slot.mediaSource === "upload") {
        const result = await deleteFile(slot.s3Key);
        if (!result.success) {
          toast.error(result.error || "Failed to delete file from storage");
          return;
        }
      }

      const next = slotsRef.current.filter((_, i) => i !== index);
      commit(next);
      toast.success("Image removed");
    },
    [deleteFile, commit],
  );

  const addSlot = () => {
    if (slotsRef.current.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images`);
      return;
    }
    commit([...slotsRef.current, newEmptySlot()]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
            Company images
          </h4>
          <p className="text-xs text-gray-500">
            Logos or photos of companies the instructor is associated with
            (optional, max {MAX_IMAGES}).
          </p>
        </div>
        <OrangeButton
          glow={false}
          type="button"
          onClick={addSlot}
          disabled={disabled || slots.length >= MAX_IMAGES}
        >
          <Plus className="w-4 h-4" />
          Add Image
        </OrangeButton>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
          No company images yet. Click &quot;Add image&quot; to upload or paste
          a URL.
        </p>
      ) : (
        <div className="space-y-6">
          {slots.map((slot, index) => (
            <div
              key={slot.id}
              className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
            >
              <p className="text-xs font-medium text-gray-600 mb-3">
                Image {index + 1}
              </p>
              <UploadMediaContainer
                type="image"
                title="Company / workplace image"
                description="Upload a logo or image (max 5MB), or paste an image URL"
                mediaUrl={slot.url}
                mediaSource={slot.mediaSource}
                s3Key={slot.s3Key}
                maxSize={5}
                folderName="company-images"
                uploadContext={uploadContext}
                allowUrlInput={true}
                isUploading={uploadingIndex === index}
                disabled={disabled}
                onFileUpload={(file, folderName) =>
                  handleFileUpload(index, file, folderName)
                }
                onUrlSubmit={(url) => handleUrlSubmit(index, url)}
                onFileRemove={() => handleRemove(index)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorCompanyImagesEditor;
