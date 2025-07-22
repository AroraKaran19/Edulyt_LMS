"use client";
import React, { useState } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { Search, Plus, X, Globe } from "lucide-react";
import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";
import { useCourseFormContext } from "../context/CourseFormContext";

const SEOSection = () => {
  const {
    state,
    updateField,
    addToArray,
    removeFromArray,
  } = useCourseFormContext();

  const [newKeyword, setNewKeyword] = useState("");

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !state.keywords.includes(newKeyword.trim())) {
      addToArray('keywords', newKeyword.trim());
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    const index = state.keywords.indexOf(keyword);
    if (index > -1) {
      removeFromArray('keywords', index);
    }
  };

  const generateSlugFromTitle = () => {
    // Generate slug from title
    if (state.title) {
      const slug = state.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      updateField('slug', slug);
    }
  };

  const generateMetaTitleFromTitle = () => {
    // Generate meta title from title
    if (state.title) {
      updateField('metaTitle', `${state.title} - Online Course | Edulyt India`);
    }
  };

  const generateMetaDescriptionFromShort = () => {
    // Generate meta description from short description if available, otherwise from description
    if (state.shortDescription) {
      updateField('metaDescription', state.shortDescription);
    } else if (state.description) {
      const shortDesc = state.description.substring(0, 155) + (state.description.length > 155 ? '...' : '');
      updateField('metaDescription', shortDesc);
    }
  };

  return (
    <Container
      id="seo-settings"
      icon={Search}
      title="SEO Settings"
      description="Optimize your course for search engines"
    >
      <div className="w-full space-y-6">
        {/* URL Slug */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            URL Slug <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="course-url-slug"
                value={state.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
              />
              <button
                type="button"
                onClick={generateSlugFromTitle}
                disabled={!state.title}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Generate from Title
              </button>
            </div>
            {state.slug && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="size-4" />
                <span>URL: www.edulyt.com/courses/{state.slug}</span>
              </div>
            )}
            <p className="text-xs text-gray-500">
              URL-friendly version of the course title. Use lowercase letters, numbers, and hyphens only.
            </p>
          </div>
        </div>

        {/* Meta Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Meta Title
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Course Title - Online Course | Edulyt India"
                value={state.metaTitle}
                onChange={(e) => updateField('metaTitle', e.target.value)}
                maxLength={60}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
              />
              <button
                type="button"
                onClick={generateMetaTitleFromTitle}
                disabled={!state.title}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Generate
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Appears in search results and browser tabs</span>
              <span className={cn(
                state.metaTitle.length > 60 ? "text-red-500" : "text-gray-500"
              )}>
                {state.metaTitle.length}/60 characters
              </span>
            </div>
          </div>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Meta Description
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <textarea
                placeholder="Brief description of the course that appears in search results..."
                value={state.metaDescription}
                onChange={(e) => updateField('metaDescription', e.target.value)}
                maxLength={160}
                rows={3}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
              />
              <button
                type="button"
                onClick={generateMetaDescriptionFromShort}
                disabled={!state.shortDescription && !state.description}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm h-fit"
              >
                Generate
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Appears in search results below the title</span>
              <span className={cn(
                state.metaDescription.length > 160 ? "text-red-500" : "text-gray-500"
              )}>
                {state.metaDescription.length}/160 characters
              </span>
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            SEO Keywords
          </label>
          <FlexBox className="w-full gap-2">
            <input
              type="text"
              placeholder="Add a keyword (e.g., react, javascript, frontend)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddKeyword())
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <Plus className="size-4" />
            </button>
          </FlexBox>
          {state.keywords.length > 0 && (
            <FlexBox className="w-full flex-wrap gap-2 mt-2">
              {state.keywords.map((keyword, index) => (
                <FlexBox
                  key={index}
                  className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm gap-2 items-center select-none"
                >
                  <span>{keyword}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="size-3 cursor-pointer" />
                  </button>
                </FlexBox>
              ))}
            </FlexBox>
          )}
          <p className="text-xs text-gray-500">
            Add relevant keywords that people might search for to find this course
          </p>
        </div>

        {/* SEO Preview */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Search Preview</h3>
          <div className="bg-white p-4 rounded-lg border">
            <div className="space-y-2">
              <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                {state.metaTitle || state.title || 'Course Title - Online Course | Edulyt India'}
              </div>
              <div className="text-green-700 text-sm">
                www.edulyt.com/courses/{state.slug || 'course-slug'}
              </div>
              <div className="text-gray-600 text-sm">
                {state.metaDescription || state.shortDescription || 'Course description will appear here...'}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            This is how your course might appear in Google search results
          </p>
        </div>
      </div>
    </Container>
  );
};

export default SEOSection; 