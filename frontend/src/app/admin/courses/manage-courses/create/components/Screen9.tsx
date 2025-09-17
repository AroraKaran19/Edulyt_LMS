import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo, useState } from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import TagInput from "@/components/ui/inputs/TagInput";
import ScreenNavigation from "./shared/ScreenNavigation";
import { useScreen } from "../contexts/ScreenContext";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Search, Zap, Globe, Tag, FileText, Sparkles } from "lucide-react";

const Screen9 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-generate SEO content
  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate slug from course title
      const generateSlug = (title: string) => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .trim();
      };
      
      const slug = generateSlug(state.course.title || "course");
      
      // Generate meta title based on course title and category
      const metaTitle = `${state.course.title || "Course"} - ${state.course.category || "Online Learning"} | Airkrit`;
      
      // Generate meta description based on course details
      const metaDescription = `${state.course.shortDescription || state.course.description || "Learn"} in this comprehensive ${state.course.category?.toLowerCase() || "course"}. Perfect for ${state.course.audience === "college-students" ? "college students" : "professionals"}. Enroll now and advance your career!`;
      
      // Generate keywords based on course content (max 10)
      const baseKeywords = [
        state.course.category?.toLowerCase() || "course",
        state.course.title?.toLowerCase() || "learning",
        state.course.audience === "college-students" ? "college students" : "professionals",
        "online learning",
        "education",
        "skills",
        "certification",
        "career development"
      ].filter(Boolean);
      
      // Add skills as keywords if available
      const skillKeywords = state.course.skills?.slice(0, 3) || [];
      
      // Combine and limit to 10 keywords
      const allKeywords = [...baseKeywords, ...skillKeywords]
        .filter(Boolean)
        .slice(0, 10);

      // Update the course state
      actions.setCourseSlug(slug);
      actions.setCourseMetaTitle(metaTitle);
      actions.setCourseMetaDescription(metaDescription);
      actions.setCourseKeywords(allKeywords);
      
      // Also add keywords as tags
      if (state.course.tags && state.course.tags.length > 0) {
        const existingTags = state.course.tags || [];
        const newTags = [...new Set([...existingTags, ...allKeywords])];
        actions.setCourseTags(newTags);
      } else {
        actions.setCourseTags(allKeywords);
      }
      
    } catch (error) {
      console.error("Error generating SEO content:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Validation for form completion
  const isFormValid = useMemo(() => {
    return (
      state.course.slug &&
      state.course.slug.trim().length > 0 &&
      state.course.metaTitle &&
      state.course.metaTitle.trim().length > 0 &&
      state.course.metaDescription &&
      state.course.metaDescription.trim().length > 0 &&
      state.course.keywords &&
      state.course.keywords.length > 0
    );
  }, [
    state.course.slug,
    state.course.metaTitle,
    state.course.metaDescription,
    state.course.keywords,
  ]);

  // Character count validation
  const validationErrors = useMemo(() => {
    const errors = [];

    // Check meta title length
    if (state.course.metaTitle && state.course.metaTitle.length > 60) {
      errors.push("Meta title should be 60 characters or less for optimal SEO");
    }

    // Check meta description length
    if (state.course.metaDescription && state.course.metaDescription.length > 160) {
      errors.push("Meta description should be 160 characters or less for optimal SEO");
    }

    return errors;
  }, [state.course.metaTitle, state.course.metaDescription]);

  return (
    <Container
      title="SEO Management"
      description="Optimize your course for search engines and discoverability"
      icon={Search}
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
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
          disabled={isGenerating || !state.course.title}
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

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 space-y-3">
          {validationErrors.map((error, index) => (
            <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h4 className="text-yellow-800 font-semibold">SEO Warning</h4>
                  <p className="text-yellow-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SEO Content */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2" style={{ scrollbarWidth: "thin" }}>
        {/* URL Slug Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">URL Slug</h3>
              <p className="text-sm text-gray-600">
                The URL-friendly version of your course title (used in the course URL)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="URL Slug"
              name="slug"
              placeholder="course-url-slug"
              value={state.course.slug || ""}
              onChange={(e) => actions.setCourseSlug(e.target.value)}
              className="w-full"
              required
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>URL: https://airkrit.com/courses/</span>
              <span className="font-mono text-green-600">
                {state.course.slug || "your-course-slug"}
              </span>
            </div>
          </div>
        </div>

        {/* Meta Title Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Meta Title</h3>
              <p className="text-sm text-gray-600">
                The title that appears in search engine results (recommended: 50-60 characters)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Meta Title"
              name="metaTitle"
              placeholder="Enter SEO-optimized title for search engines"
              value={state.course.metaTitle || ""}
              onChange={(e) => actions.setCourseMetaTitle(e.target.value)}
              className="w-full"
              required
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Recommended: 50-60 characters</span>
              <span
                className={`font-medium ${
                  (state.course.metaTitle?.length || 0) > 60
                    ? "text-red-500"
                    : (state.course.metaTitle?.length || 0) >= 50
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {state.course.metaTitle?.length || 0}/60
              </span>
            </div>
          </div>
        </div>

        {/* Meta Description Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Meta Description</h3>
              <p className="text-sm text-gray-600">
                Brief description that appears under your title in search results (recommended: 150-160 characters)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <TextArea
              label="Meta Description"
              name="metaDescription"
              placeholder="Write a compelling description that encourages clicks from search results"
              value={state.course.metaDescription || ""}
              onChange={(e) => actions.setCourseMetaDescription(e.target.value)}
              className="w-full"
              rows={3}
              lockHeight
              required
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Recommended: 150-160 characters</span>
              <span
                className={`font-medium ${
                  (state.course.metaDescription?.length || 0) > 160
                    ? "text-red-500"
                    : (state.course.metaDescription?.length || 0) >= 150
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {state.course.metaDescription?.length || 0}/160
              </span>
            </div>
          </div>
        </div>

        {/* Keywords Section */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Keywords</h3>
              <p className="text-sm text-gray-600">
                Add relevant keywords that describe your course content and help with search visibility
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <TagInput
              label="Keywords"
              placeholder="Add keywords (press Enter to add)"
              tags={state.course.keywords || []}
              setTags={(keywords) => {
                // Limit to 10 keywords
                const limitedKeywords = keywords.slice(0, 10);
                actions.setCourseKeywords(limitedKeywords);
              }}
              className="w-full"
              countLabel="keywords"
              maxTags={10}
              required
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Add 5-10 relevant keywords for better SEO performance</span>
              <span
                className={`font-medium ${
                  (state.course.keywords?.length || 0) > 10
                    ? "text-red-500"
                    : (state.course.keywords?.length || 0) >= 5
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {state.course.keywords?.length || 0}/10
              </span>
            </div>
          </div>
        </div>

        {/* SEO Preview Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-500 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Search Engine Preview</h3>
              <p className="text-sm text-gray-600">
                How your course will appear in search engine results
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="space-y-2">
              <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                {state.course.metaTitle || "Your course title will appear here"}
              </div>
              <div className="text-green-600 text-sm">
                https://airkrit.com/courses/{state.course.slug || 'your-course-slug'}
              </div>
              <div className="text-gray-600 text-sm">
                {state.course.metaDescription || "Your meta description will appear here. This is what users see in search results."}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScreenNavigation
        currentStep={9}
        previousScreen="screen7"
        nextScreen="screen11"
        setActiveScreen={setActiveScreen}
        isNextDisabled={!isFormValid}
      />
    </Container>
  );
};

export default Screen9;
