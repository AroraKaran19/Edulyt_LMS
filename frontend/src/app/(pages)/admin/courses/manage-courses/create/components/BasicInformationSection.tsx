"use client";
import React, { useState } from "react";
import { BookOpenIcon, Upload, X } from "lucide-react";
import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { CourseFormState, useCourseFormContext } from "../context/CourseFormContext";

const BasicInformationSection = () => {
  const {
    state,
    updateField,
    addTag: addFormTag,
    removeTag: removeFormTag,
    generateSlug,
  } = useCourseFormContext();

  const [newTag, setNewTag] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleInputChange = (field: keyof CourseFormState, value: string) => {
    updateField(field as keyof CourseFormState, value);
    // Auto-generate slug when title changes
    if (field === 'title') {
      generateSlug(value);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "custom") {
      setIsCustomCategory(true);
      updateField('category', '');
    } else {
      setIsCustomCategory(false);
      setCustomCategory("");
      updateField('category', value);
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customCategory.trim()) {
      updateField('category', customCategory.trim());
      setIsCustomCategory(false);
      setCustomCategory("");
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      addFormTag(newTag.trim());
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    removeFormTag(tagToRemove);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateField('uploadedThumbnail', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    updateField('uploadedThumbnail', null);
  };

  const skillLevels = ["Beginner", "Intermediate", "Advanced"];
  const audiences = ["college-students", "professionals"];
  const categories = ["Technology"];

  return (
    <Container
      id="basic-information"
      icon={BookOpenIcon}
      title="Basic Information"
      description="Manage the basic information of the course"
    >
      <div className="w-full space-y-6">
        {/* Thumbnail Upload */}
        <FlexBox className="w-full flex-col gap-2 items-center">
          <label className="text-sm font-medium text-gray-700">
            Course Thumbnail <span className="text-red-500">*</span>
          </label>
          <FlexBox className="w-full justify-center">
            <FlexBox
              className={cn(
                "border-2 rounded-lg transition-colors cursor-pointer relative items-center justify-center",
                                state.uploadedThumbnail 
                  ? "border-solid border-gray-300 p-2" 
                  : isDragOver 
                    ? "border-dashed border-orange-500 bg-orange-50 p-8 w-80" 
                    : "border-dashed border-gray-300 hover:border-orange-400 p-8 w-80"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileUpload(e.target.files[0])
                }
                className="opacity-0 outline-none absolute top-0 left-0 w-full h-full cursor-pointer z-10"
              />

              {state.uploadedThumbnail ? (
                <FlexBox className="relative flex-col items-center">
                  <FlexBox className="relative max-h-[200px] max-w-[320px]">
                    <Image
                      src={state.uploadedThumbnail}
                      alt="Course thumbnail preview"
                      width={320}
                      height={200}
                      className="max-h-[200px] max-w-[320px] w-auto h-auto rounded-lg"
                      loading="lazy"
                      quality={100}
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors z-20"
                    >
                      <X className="size-4" />
                    </button>
                  </FlexBox>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Click to change image
                  </p>
                </FlexBox>
              ) : (
                <FlexBox className="flex-col items-center gap-3 text-center pointer-events-none justify-center">
                  <Upload
                    className={cn(
                      "size-8",
                      isDragOver ? "text-orange-500" : "text-gray-400"
                    )}
                  />
                  <FlexBox className="flex-col gap-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isDragOver ? "text-orange-700" : "text-gray-700"
                      )}
                    >
                      {isDragOver
                        ? "Drop your image here"
                        : "Click to upload or drag & drop"}
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </FlexBox>
                </FlexBox>
              )}
            </FlexBox>
          </FlexBox>
        </FlexBox>

        {/* Title and Subtitle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter course title"
              value={state.title} 
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Subtitle
            </label>
            <input
              type="text"
              placeholder="Enter course subtitle"
              value={state.subtitle}
              onChange={(e) => handleInputChange("subtitle", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Course Description <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Provide a detailed description of the course..."
            value={state.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
          />
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Short Description
          </label>
          <textarea
            placeholder="Brief summary for course cards and previews..."
            value={state.shortDescription}
            onChange={(e) =>
              handleInputChange("shortDescription", e.target.value)
            }
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
          />
        </div>

        {/* Category and Subcategory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            {!isCustomCategory ? (
              <select
                value={state.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="custom">+ Create Custom Category</option>
              </select>
            ) : (
              <FlexBox className="w-full gap-2">
                <input
                  type="text"
                  placeholder="Enter custom category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleCustomCategorySubmit())
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={handleCustomCategorySubmit}
                  disabled={!customCategory.trim()}
                  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setCustomCategory("");
                  }}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </FlexBox>
            )}
            {state.category &&
              !isCustomCategory &&
              !categories.includes(state.category) && (
                <FlexBox className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm gap-2 items-center w-fit">
                  <span>Custom: {state.category}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateField('category', "") 
                    }
                    className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </FlexBox>
              )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Subcategory
            </label>
            <input
              type="text"
              placeholder="Enter subcategory (optional)"
              value={state.subcategory}
              onChange={(e) => handleInputChange("subcategory", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
          </div>
        </div>

        {/* Skill Level and Audience */}
        <FlexBox className="w-full flex-col lg:flex-row gap-4">
          <FlexBox className="w-full flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Skill Level <span className="text-red-500">*</span>
            </label>
            <select
              value={state.skillLevel}
              onChange={(e) => handleInputChange("skillLevel", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
            >
              <option value="">Select skill level</option>
              {skillLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </FlexBox>
          <FlexBox className="w-full flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Target Audience <span className="text-red-500">*</span>
            </label>
            <select
              value={state.audience}
              onChange={(e) => handleInputChange("audience", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
            >
              <option value="">Select audience</option>
              {audiences.map((audience) => (
                <option key={audience} value={audience}>
                  {audience === "college-students"
                    ? "College Students"
                    : "Professionals"}
                </option>
              ))}
            </select>
          </FlexBox>
        </FlexBox>

        {/* Duration */}
        <FlexBox className="w-full flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Course Duration
          </label>
          <input
            type="text"
            placeholder="e.g., 3 months, 6 weeks, 1 year"
            value={state.duration}
            onChange={(e) => handleInputChange("duration", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
          />
          <p className="text-xs text-gray-500">
            This is an estimated duration for display purposes
          </p>
        </FlexBox>

        {/* Tags */}
        <FlexBox className="w-full flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Tags</label>
          <FlexBox className="w-full gap-2">
            <input
              type="text"
              placeholder="Add a tag and press Enter"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTag())
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Add
            </button>
          </FlexBox>
          {state.tags.length > 0 && (
            <FlexBox className="w-full flex-wrap gap-2 mt-2">
              {state.tags.map((tag, index) => (
                <FlexBox
                  key={index}
                  className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm gap-2 items-center select-none"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="size-3 cursor-pointer" />
                  </button>
                </FlexBox>
              ))}
            </FlexBox>
          )}
        </FlexBox>
      </div>
    </Container>
  );
};

export default BasicInformationSection;
