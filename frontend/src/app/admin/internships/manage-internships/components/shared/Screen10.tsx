"use client";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import { useState, useEffect, useCallback } from "react";
import TextArea from "@/components/ui/inputs/TextArea";
import TagInput from "@/components/ui/inputs/TagInput";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import {
  Search,
  Globe,
  Tag,
  FileText,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useFormContext, Controller } from "react-hook-form";
import { useInternshipFormContext } from "@/contexts/InternshipFormContext";
import { useInternshipSlugCheck } from "@/hooks/useInternshipSlugCheck";
import { InternshipFormData } from "@/types/internshipForm";

const Screen10 = () => {
  const { control, setValue, watch } = useFormContext<InternshipFormData>();
  const { isEditMode } = useInternshipFormContext();

  const {
    checkSlugAvailability,
    validateSlugFormat,
    generateSlug,
    isChecking: isSlugChecking,
  } = useInternshipSlugCheck();

  const [isGenerating, setIsGenerating] = useState(false);

  const title = watch("title") || "";
  const description = watch("description") || "";
  const audience = watch("audience") || "college-students";
  const slug = watch("slug") || "";
  const metaTitle = watch("metaTitle") || "";
  const metaDescription = watch("metaDescription") || "";
  const keywords = watch("keywords") || [];

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [slugValidation, setSlugValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({
    isChecking: false,
    isAvailable: null,
    message: "",
  });

  const validateSlug = useCallback(
    async (slug: string) => {
      if (!slug || slug.trim().length === 0) {
        setSlugValidation({
          isChecking: false,
          isAvailable: null,
          message: "",
        });
        return;
      }

      const formatValidation = validateSlugFormat(slug);
      if (!formatValidation.valid) {
        setSlugValidation({
          isChecking: false,
          isAvailable: false,
          message: formatValidation.message,
        });
        return;
      }

      const result = await checkSlugAvailability(slug);
      if (result) {
        setSlugValidation({
          isChecking: false,
          isAvailable: result.available,
          message: result.message,
        });
      } else {
        setSlugValidation({
          isChecking: false,
          isAvailable: false,
          message: "Failed to check slug availability",
        });
      }
    },
    [checkSlugAvailability, validateSlugFormat]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (slug && !isEditMode) {
        validateSlug(slug);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [slug, validateSlug, isEditMode]);

  const handleAutoGenerate = async () => {
    setIsGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const slug = generateSlug(title || "internship");

      const cleanTitle = (title || "Internship")
        .replace(/\s*\(Copy\)\s*$/i, "")
        .trim();
      const metaTitle = `${cleanTitle} - Internship Program | Airkrit`;

      // Strip HTML tags from description
      const stripHtml = (html: string) => {
        if (!html) return "";
        return html
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/&amp;/gi, "&")
          .replace(/&lt;/gi, "<")
          .replace(/&gt;/gi, ">")
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'")
          .replace(/\s+/g, " ")
          .trim();
      };

      const cleanDescription = stripHtml(description || "");
      const baseDescription = cleanDescription || "Join our internship program";
      const fullDescription = `${baseDescription}. Perfect for ${
        audience === "college-students" ? "college students" : "professionals"
      }. Apply now and kickstart your career!`;

      const metaDescription =
        fullDescription.length > 160
          ? fullDescription.substring(0, 157) + "..."
          : fullDescription;

      const baseKeywords = [
        cleanTitle?.toLowerCase() || "internship",
        audience === "college-students"
          ? "college students"
          : "professionals",
        "internship",
        "career development",
        "practical training",
        "skill development",
        "certification",
        "professional growth",
      ].filter(Boolean);

      const allKeywords = [...baseKeywords].filter(Boolean).slice(0, 10);

      setValue("slug", slug, { shouldDirty: true, shouldTouch: true });
      setValue("metaTitle", metaTitle, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue("metaDescription", metaDescription, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue("keywords", allKeywords, {
        shouldDirty: true,
        shouldTouch: true,
      });

      if (!isEditMode) {
        await validateSlug(slug);
      }
    } catch (error) {
      console.error("Error generating SEO content:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isMounted) {
    return (
      <Container
        title="SEO Management (Screen 10)"
        description="Optimize your internship for search engines and discoverability"
        icon={Search}
        className="h-full w-full max-h-full overflow-y-auto flex flex-col"
        classNameBody="flex flex-col gap-6"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Loading SEO settings...
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="SEO Management (Screen 10)"
      description="Optimize your internship for search engines and discoverability"
      icon={Search}
      className="h-full w-full max-h-full overflow-y-auto flex flex-col"
      classNameBody="flex flex-col gap-6"
      style={{ scrollbarWidth: "thin" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            Generate SEO-optimized content based on your internship information
          </p>
        </div>
        <OrangeButton
          onClick={handleAutoGenerate}
          disabled={isGenerating || !title}
          className="flex items-center gap-2"
          glow={false}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Auto Generate
            </>
          )}
        </OrangeButton>
      </div>

      <div
        className="flex-1 overflow-y-auto space-y-6 pr-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* URL Slug Section */}
        <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">URL Slug</h3>
              <p className="text-sm text-gray-600">
                The URL-friendly version of your internship title
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Controller
                name="slug"
                control={control}
                rules={{ required: "URL slug is required" }}
                render={({ field }) => (
                  <Input
                    label="URL Slug"
                    name="slug"
                    placeholder="internship-url-slug"
                    value={field.value || ""}
                    onChange={field.onChange}
                    className={`w-full ${
                      !isEditMode && slugValidation.isAvailable === false
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : !isEditMode && slugValidation.isAvailable === true
                        ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                        : ""
                    }`}
                    required
                  />
                )}
              />
              {slug && slug.trim().length > 0 && !isEditMode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSlugChecking ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : slugValidation.isAvailable === true ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : slugValidation.isAvailable === false ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>

            {slug &&
              slug.trim().length > 0 &&
              !isEditMode &&
              slugValidation.message && (
                <div
                  className={`text-xs flex items-center gap-2 ${
                    slugValidation.isAvailable === true
                      ? "text-green-600"
                      : slugValidation.isAvailable === false
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {isSlugChecking ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : slugValidation.isAvailable === true ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : slugValidation.isAvailable === false ? (
                    <XCircle className="w-3 h-3" />
                  ) : null}
                  <span>{slugValidation.message}</span>
                </div>
              )}

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>URL: https://airkrit.com/internships/</span>
              <span
                className={`font-mono ${
                  slugValidation.isAvailable === true
                    ? "text-green-600"
                    : slugValidation.isAvailable === false
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {slug || "your-internship-slug"}
              </span>
            </div>
          </div>
        </div>

        {/* Meta Title Section */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Meta Title
              </h3>
              <p className="text-sm text-gray-600">
                The title that appears in search engine results
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Controller
              name="metaTitle"
              control={control}
              rules={{ required: "Meta title is required" }}
              render={({ field }) => (
                <Input
                  label="Meta Title"
                  name="metaTitle"
                  placeholder="Enter SEO-optimized title for search engines"
                  value={field.value || ""}
                  onChange={field.onChange}
                  className="w-full"
                  required
                />
              )}
            />
          </div>
        </div>

        {/* Meta Description Section */}
        <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Meta Description
              </h3>
              <p className="text-sm text-gray-600">
                Brief description that appears under your title in search
                results
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Controller
              name="metaDescription"
              control={control}
              rules={{ required: "Meta description is required" }}
              render={({ field }) => (
                <TextArea
                  label="Meta Description"
                  name="metaDescription"
                  placeholder="Write a compelling description that encourages clicks from search results"
                  value={field.value || ""}
                  onChange={field.onChange}
                  className="w-full"
                  rows={3}
                  lockHeight
                  required
                />
              )}
            />
          </div>
        </div>

        {/* Keywords Section */}
        <div className="bg-linear-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Keywords</h3>
              <p className="text-sm text-gray-600">
                Add relevant keywords that describe your internship and help
                with search visibility
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Controller
              name="keywords"
              control={control}
              rules={{ required: "At least one keyword is required" }}
              render={({ field }) => (
                <TagInput
                  label="Keywords"
                  placeholder="Add keywords (press Enter to add)"
                  tags={field.value || []}
                  onChange={(keywords) => {
                    const limitedKeywords = keywords.slice(0, 10);
                    field.onChange(limitedKeywords);
                  }}
                  className="w-full"
                  countLabel="keywords"
                  maxTags={10}
                  required
                />
              )}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Add 5-10 relevant keywords for better SEO performance</span>
              <span
                className={`font-medium ${
                  (keywords?.length || 0) > 10
                    ? "text-red-500"
                    : (keywords?.length || 0) >= 5
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {keywords?.length || 0}/10
              </span>
            </div>
          </div>
        </div>

        {/* SEO Preview Section */}
        <div className="bg-linear-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-500 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Search Engine Preview
              </h3>
              <p className="text-sm text-gray-600">
                How your internship will appear in search engine results
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="space-y-2">
              <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                {metaTitle || "Your internship title will appear here"}
              </div>
              <div className="text-green-600 text-sm">
                https://airkrit.com/internships/
                {slug || "your-internship-slug"}
              </div>
              <div className="text-gray-600 text-sm">
                {metaDescription ||
                  "Your meta description will appear here. This is what users see in search results."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Screen10;
