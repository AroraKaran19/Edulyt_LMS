"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FileText, Loader2, Save } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { useUpload } from "@/hooks/useUpload";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Container from "@/app/admin/components/ui/Container";

type DocState = {
  url: string;
  s3Key: string;
  source: "upload" | "url";
};

const EMPTY_DOC: DocState = { url: "", s3Key: "", source: "upload" };

/** A single T&C document slot: upload a PDF or paste a URL. */
function TermsUploader({
  label,
  description,
  folderName,
  value,
  onChange,
}: {
  label: string;
  description: string;
  folderName: string;
  value: DocState;
  onChange: (next: DocState) => void;
}) {
  const { uploadFile, deleteFile } = useUpload();
  const [isUploading, setIsUploading] = useState(false);

  // Best-effort cleanup of a previously uploaded object when it's replaced.
  const cleanupPrevious = useCallback(async () => {
    if (value.source === "upload" && value.s3Key) {
      try {
        await deleteFile(value.s3Key);
      } catch (e) {
        console.error("Failed to delete previous T&C document:", e);
      }
    }
  }, [value.source, value.s3Key, deleteFile]);

  const handleFileUpload = useCallback(
    async (file: File, folder: string): Promise<string> => {
      setIsUploading(true);
      try {
        const res = await uploadFile(file, folder);
        if (res.success && res.data) {
          await cleanupPrevious();
          onChange({
            url: res.data.url,
            s3Key: res.data.s3Key,
            source: "upload",
          });
          toast.success("Document uploaded");
          return res.data.url;
        }
        throw new Error(res.error || "Upload failed");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        toast.error(msg);
        throw e;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile, cleanupPrevious, onChange],
  );

  const handleUrlSubmit = useCallback(
    async (url: string) => {
      await cleanupPrevious();
      onChange({ url, s3Key: "", source: "url" });
    },
    [cleanupPrevious, onChange],
  );

  const handleRemove = useCallback(() => {
    onChange({ ...EMPTY_DOC });
  }, [onChange]);

  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4">
      <UploadMediaContainer
        title={label}
        description={description}
        type="document"
        mediaUrl={value.url}
        mediaSource={value.source}
        s3Key={value.s3Key || undefined}
        folderName={folderName}
        onFileUpload={handleFileUpload}
        onUrlSubmit={handleUrlSubmit}
        onFileRemove={handleRemove}
        isUploading={isUploading}
        allowUrlInput
        maxSize={25}
        acceptedFormats={[".pdf"]}
        urlPlaceholder="https://example.com/terms.pdf"
      />
    </div>
  );
}

export default function AdminTermsAndConditionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<DocState>(EMPTY_DOC);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.admin.legalSettings);
      const d = res.data?.data ?? {};
      setCourse({
        url: String(d.courseTermsUrl ?? ""),
        s3Key: String(d.courseTermsS3Key ?? ""),
        source: d.courseTermsS3Key ? "upload" : "url",
      });
    } catch {
      toast.error("Could not load Terms & Conditions settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch(ENDPOINTS.admin.legalSettings, {
        courseTermsUrl: course.url,
        courseTermsS3Key: course.s3Key,
      });
      toast.success("Terms & Conditions saved");
      void load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center gap-2 text-stone-500 p-6">
        <Loader2 className="h-6 w-6 animate-spin shrink-0" />
        <span>Loading Terms & Conditions…</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-stone-50/90 p-4 sm:p-6 lg:p-8 space-y-6">
      <Container
        icon={FileText}
        title="Terms & Conditions"
        description="Upload the Terms & Conditions document (PDF) shown to learners at course checkout. Replacing it updates the document everywhere immediately after saving."
        className="w-full h-fit border-stone-200 shadow-sm"
        classNameBody="flex flex-col gap-6"
      >
        <TermsUploader
          label="Course Terms & Conditions"
          description="Shown at course checkout. Upload a PDF or paste a direct link."
          folderName="legal-documents/course-terms"
          value={course}
          onChange={setCourse}
        />

        <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 pt-2 border-t border-stone-100">
          <OrangeButton
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            glow={false}
            className="w-full sm:w-auto min-w-[140px]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Save className="h-4 w-4 shrink-0" />
            )}
            Save
          </OrangeButton>
        </div>
      </Container>
    </div>
  );
}
