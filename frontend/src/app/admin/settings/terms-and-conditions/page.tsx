"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FileText, Loader2, Save } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { BRANDS, BRAND_LABEL, type Brand } from "@/constants/brands";
import { useUpload } from "@/hooks/useUpload";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Container from "@/app/admin/components/ui/Container";

type DocState = {
  url: string;
  s3Key: string;
  source: "upload" | "url";
};

type BrandLegalSettings = {
  courseTermsUrl?: string;
  courseTermsS3Key?: string;
};

const EMPTY_DOC: DocState = { url: "", s3Key: "", source: "upload" };

const toDocState = (settings?: BrandLegalSettings): DocState => ({
  url: String(settings?.courseTermsUrl ?? ""),
  s3Key: String(settings?.courseTermsS3Key ?? ""),
  source: settings?.courseTermsS3Key ? "upload" : "url",
});

const docsFrom = (
  data?: Partial<Record<Brand, BrandLegalSettings>>,
): Record<Brand, DocState> =>
  Object.fromEntries(
    BRANDS.map((brand) => [brand, toDocState(data?.[brand])]),
  ) as Record<Brand, DocState>;

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
  const [savingBrand, setSavingBrand] = useState<Brand | null>(null);
  const [docs, setDocs] = useState<Record<Brand, DocState>>(() => docsFrom());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.admin.legalSettings);
      setDocs(docsFrom(res.data?.data));
    } catch {
      toast.error("Could not load Terms & Conditions settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (brand: Brand) => {
    setSavingBrand(brand);
    try {
      const res = await apiClient.patch(ENDPOINTS.admin.legalSettings, {
        brand,
        courseTermsUrl: docs[brand].url,
        courseTermsS3Key: docs[brand].s3Key,
      });
      // Only this brand: reloading both would drop unsaved changes on the other card.
      setDocs((prev) => ({ ...prev, [brand]: toDocState(res.data?.data) }));
      toast.success(`${BRAND_LABEL[brand]} Terms & Conditions saved`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Save failed";
      toast.error(msg);
    } finally {
      setSavingBrand(null);
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
      {BRANDS.map((brand) => (
        <Container
          key={brand}
          icon={FileText}
          title={`${BRAND_LABEL[brand]} Terms & Conditions`}
          description={`The Terms & Conditions document (PDF) shown to learners at course checkout on ${BRAND_LABEL[brand]}. Replacing it updates that site immediately after saving.`}
          className="w-full h-fit border-stone-200 shadow-sm"
          classNameBody="flex flex-col gap-6"
        >
          <TermsUploader
            label="Course Terms & Conditions"
            description="Upload a PDF or paste a direct link. With no document, checkout skips the Terms & Conditions step."
            folderName={`legal-documents/course-terms/${brand}`}
            value={docs[brand]}
            onChange={(next) => setDocs((prev) => ({ ...prev, [brand]: next }))}
          />

          <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 pt-2 border-t border-stone-100">
            <OrangeButton
              type="button"
              onClick={() => void handleSave(brand)}
              disabled={savingBrand !== null}
              glow={false}
              className="w-full sm:w-auto min-w-[140px]"
            >
              {savingBrand === brand ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Save className="h-4 w-4 shrink-0" />
              )}
              Save
            </OrangeButton>
          </div>
        </Container>
      ))}
    </div>
  );
}
