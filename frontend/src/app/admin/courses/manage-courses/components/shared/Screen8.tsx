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
import { useCourseFormContext } from "@/contexts/CourseFormContext";
import { getTextFromHtml } from "@/lib/courseFormUtils";
import { useSlugCheck } from "@/hooks/useSlugCheck";
import { useCategory } from "@/hooks/useCategory";

const Screen8 = () => {
  // Form context
  const { control, setValue, watch } = useFormContext();
  const { isEditMode } = useCourseFormContext();

  // Slug check hook
  const {
    checkSlugAvailability,
    validateSlugFormat,
    generateSlug,
    isChecking: isSlugChecking,
  } = useSlugCheck();

  // Category hook to fetch category details
  const { getCategoryById } = useCategory();

  const [isGenerating, setIsGenerating] = useState(false);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  // Watch form values
  const title = watch("title") || "";
  const description = watch("description") || "";
  const shortDescription = watch("shortDescription") || "";
  const category = watch("category") || "";
  const audience = watch("audience") || "college-students";
  const skills = watch("skills") || [];
  const tags = watch("tags") || [];
  const slug = watch("slug") || "";
  const metaTitle = watch("metaTitle") || "";
  const metaDescription = watch("metaDescription") || "";
  const keywords = watch("keywords") || [];

  // Client-side mounting
  const [isMounted, setIsMounted] = useState(false);

  // Client-side mounting effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch category names when category IDs change
  useEffect(() => {
    const fetchCategoryNames = async () => {
      if (Array.isArray(category) && category.length > 0) {
        try {
          const names = await Promise.all(
            category.map(async (catId: string) => {
              const categoryData = await getCategoryById(catId);
              return categoryData?.name || catId;
            })
          );
          setCategoryNames(names);
        } catch (error) {
          console.error("Error fetching category names:", error);
          setCategoryNames([]);
        }
      } else {
        setCategoryNames([]);
      }
    };

    fetchCategoryNames();
  }, [category, getCategoryById]);

  // Slug validation state
  const [slugValidation, setSlugValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({
    isChecking: false,
    isAvailable: null,
    message: "",
  });

  // Debounced slug validation
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

      // Use the hook's validation function
      const formatValidation = validateSlugFormat(slug);
      if (!formatValidation.valid) {
        setSlugValidation({
          isChecking: false,
          isAvailable: false,
          message: formatValidation.message,
        });
        return;
      }

      // Use the hook's availability check
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

  // Debounce slug validation (skip in edit mode)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (slug && !isEditMode) {
        validateSlug(slug);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [slug, validateSlug, isEditMode]);

  // Auto-generate SEO content
  const handleAutoGenerate = async () => {
    setIsGenerating(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate slug from course title using hook
      const slug = generateSlug(title || "course");

      // Use the fetched category names
      const categoryStr = categoryNames.length > 0 
        ? categoryNames.join(", ") 
        : "Online Learning";
      
      // Remove "(Copy)" from title if present for cleaner meta title
      const cleanTitle = (title || "Course").replace(/\s*\(Copy\)\s*$/i, "").trim();
      const metaTitle = `${cleanTitle} - ${categoryStr} | Airkrit`;

      // Generate meta description based on course details (strip HTML and limit to 160 chars)
      const getPlainText = (html: string) => getTextFromHtml(html || "");
      const shortDescText = getPlainText(shortDescription || "");
      const descText = getPlainText(description || "");

      const baseDescription = shortDescText || descText || "Learn";
      // Use the first fetched category name for description
      const categoryLower = (categoryNames[0] || "course").toLowerCase();
      const fullDescription = `${baseDescription} in this comprehensive ${categoryLower}. Perfect for ${
        audience === "college-students" ? "college students" : "professionals"
      }. Enroll now and advance your career!`;

      // Truncate to 160 characters for optimal SEO
      const metaDescription =
        fullDescription.length > 160
          ? fullDescription.substring(0, 157) + "..."
          : fullDescription;

      // Generate keywords based on course content (max 10)
      // Use the fetched category names for keywords
      const categoryKeywords = categoryNames.map(name => name.toLowerCase());
      const baseKeywords = [
        ...categoryKeywords,
        cleanTitle?.toLowerCase() || "learning",
        audience === "college-students" ? "college students" : "professionals",
        "online learning",
        "education",
        "skills",
        "certification",
        "career development",
      ].filter(Boolean);

      // Add skills as keywords if available
      const skillKeywords = skills?.slice(0, 3) || [];

      // Combine and limit to 10 keywords
      const allKeywords = [...baseKeywords, ...skillKeywords]
        .filter(Boolean)
        .slice(0, 10);

      // Update the form state
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

      // Validate the generated slug (only in create mode)
      if (!isEditMode) {
        await validateSlug(slug);
      }

      // Merge keywords into tags, deduped and capped at the TagInput limit
      // (10). Without the slice, repeated generates / pre-existing tags can
      // blow past the cap because setValue bypasses TagInput's input guard.
      const mergedTags = [
        ...new Set([...(tags || []), ...allKeywords]),
      ].slice(0, 10);
      setValue("tags", mergedTags, { shouldDirty: true, shouldTouch: true });
    } catch (error) {
      console.error("Error generating SEO content:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading during SSR
  if (!isMounted) {
    return (
      <Container
        title="SEO Management (Screen 8)"
        description="Optimize your course for search engines and discoverability"
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
      title="SEO Management (Screen 8)"
      description="Optimize your course for search engines and discoverability"
      icon={Search}
      className="h-full w-full max-h-full overflow-y-auto flex flex-col"
      classNameBody="flex flex-col gap-6"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Auto Generate Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            Generate SEO-optimized content based on your course information
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

      {/* SEO Content */}
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
                The URL-friendly version of your course title (used in the
                course URL)
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
                    placeholder="course-url-slug"
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
              {/* Validation Icon */}
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

            {/* Validation Message */}
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
              <span>URL: https://airkrit.com/programs/</span>
              <span
                className={`font-mono ${
                  slugValidation.isAvailable === true
                    ? "text-green-600"
                    : slugValidation.isAvailable === false
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {slug || "your-course-slug"}
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
                Add relevant keywords that describe your course content and help
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
                    // Limit to 10 keywords
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
                How your course will appear in search engine results
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="space-y-2">
              <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                {metaTitle || "Your course title will appear here"}
              </div>
              <div className="text-green-600 text-sm">
                https://airkrit.com/programs/
                {slug || "your-course-slug"}
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

export default Screen8;
