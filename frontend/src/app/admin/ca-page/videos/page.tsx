"use client";

import { useState } from "react";
import { useSectionState } from "../CaSettingsContext";
import {
  ItemListField,
  SectionHeader,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import type { CaVideo } from "@/types/ca-page-settings";

// The public page renders `<video src>` directly, so only a link that ends in
// a browser-playable file extension can work; YouTube/Vimeo/embed pages
// cannot. `UploadMediaContainer`'s own "video" URL check is permissive (it
// accepts those embed links), so this field re-validates before saving.
const DIRECT_VIDEO_URL = /^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i;
const VIDEO_FORMATS = [".mp4", ".webm"];

function VideoField({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const { uploadFile, isUploading } = useUpload();
  const [source, setSource] = useState<"upload" | "url" | undefined>(url ? "url" : undefined);
  const [error, setError] = useState("");

  const handleUpload = async (file: File, folder: string): Promise<string> => {
    const result = await uploadFile(file, folder);
    if (result.success && result.data?.url) {
      setError("");
      setSource("upload");
      onChange(result.data.url);
      return result.data.url;
    }
    throw new Error(result.error || "Upload failed");
  };

  return (
    <UploadMediaContainer
      title="Video"
      description="Upload a video, or paste a direct .mp4 or .webm link. Links to YouTube or other video pages will not play here."
      type="video"
      acceptedFormats={VIDEO_FORMATS}
      mediaUrl={url}
      mediaSource={source}
      folderName="ca-page/videos"
      allowUrlInput
      showConfirmation={false}
      isUploading={isUploading}
      error={error}
      onFileUpload={handleUpload}
      onUrlSubmit={(next) => {
        if (!DIRECT_VIDEO_URL.test(next)) {
          setError("Use a direct .mp4 or .webm link, not a YouTube or embed link.");
          return;
        }
        setError("");
        setSource("url");
        onChange(next);
      }}
      onFileRemove={() => {
        setError("");
        setSource(undefined);
        onChange("");
      }}
    />
  );
}

export default function VideosSectionPage() {
  const { state, setState } = useSectionState("videos", (s) => ({
    items: s?.videos?.items ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Videos"
        description="Intern videos. The section hides on the public page when the list is empty."
      />

      <ItemListField<CaVideo>
        label="Videos"
        items={state.items}
        onChange={(items) => setState((p) => ({ ...p, items }))}
        newItem={() => ({ url: "", role: "", college: "", duration: "" })}
        addLabel="Add video"
        itemTitle={(item, i) => item.role || `Video ${i + 1}`}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <VideoField url={item.url} onChange={(url) => update({ ...item, url })} />
            <TextField
              label="Role"
              value={item.role}
              onChange={(v) => update({ ...item, role: v })}
              placeholder="Marketing intern"
            />
            <TextField
              label="College"
              value={item.college}
              onChange={(v) => update({ ...item, college: v })}
            />
            <TextField
              label="Duration"
              value={item.duration}
              onChange={(v) => update({ ...item, duration: v })}
              placeholder="0:48"
            />
          </div>
        )}
      />
    </div>
  );
}
