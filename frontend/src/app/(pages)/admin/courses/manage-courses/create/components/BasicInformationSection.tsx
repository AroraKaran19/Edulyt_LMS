"use client";
import React, { useState } from "react";
import { BookOpenIcon, X } from "lucide-react";
import FlexBox from "@/components/ui/FlexBox";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { CourseFormState, useCourseFormContext } from "../context/CourseFormContext";
import UploadComponent from "@/components/ui/UploadComponent";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string | undefined) => {
    const errors: Record<string, string> = { ...fieldErrors };
    
    switch (field) {
      case 'title':
        if (!value?.trim()) {
          errors.title = 'Course title is required';
        } else if (value.trim().length < 5) {
          errors.title = 'Title must be at least 5 characters long';
        } else {
          delete errors.title;
        }
        break;
        
      case 'description':
        if (!value?.trim()) {
          errors.description = 'Course description is required';
        } else if (value.trim().length < 50) {
          errors.description = 'Description must be at least 50 characters long';
        } else {
          delete errors.description;
        }
        break;
        
      case 'category':
        if (!value?.trim()) {
          errors.category = 'Category selection is required';
        } else {
          delete errors.category;
        }
        break;
        
      case 'skillLevel':
        if (!value?.trim()) {
          errors.skillLevel = 'Skill level selection is required';
        } else {
          delete errors.skillLevel;
        }
        break;
        
      case 'audience':
        if (!value?.trim()) {
          errors.audience = 'Target audience selection is required';
        } else {
          delete errors.audience;
        }
        break;
        
      case 'thumbnail':
        if (!value?.trim()) {
          errors.thumbnail = 'Course thumbnail is required';
        } else {
          delete errors.thumbnail;
        }
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleInputChange = (field: keyof CourseFormState, value: string) => {
    updateField(field as keyof CourseFormState, value);
    validateField(field, value);
    
    // Auto-generate slug when title changes
    if (field === 'title') {
      generateSlug(); 
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

  const removeTag = (index: number) => {
    removeFormTag(index);
  };

  // Validate on thumbnail change
  const handleThumbnailUpload = (url: string) => {
    updateField('thumbnail', url);
    updateField('uploadedThumbnail', url);
    validateField('thumbnail', url);
  };

  // Helper component for field validation display
  const FieldError = ({ field }: { field: string }) => {
    if (!fieldErrors[field]) return null;
    
    return (
      <div className="flex items-center gap-1 mt-1">
        <span className="w-1 h-1 bg-red-500 rounded-full" />
        <span className="text-xs text-red-600">{fieldErrors[field]}</span>
      </div>
    );
  };

  const getFieldClassName = (field: string, baseClassName: string) => {
    const hasError = fieldErrors[field];
    return `${baseClassName} ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'}`;
  };

  const handleVideoUpload = (url: string, fileName: string, duration?: number) => {
    updateField('previewVideoUrl', url);
    // Note: Course preview video duration is not stored in the main course data
    // Duration is mainly used for lesson content videos
    if (duration) {
      console.log(`📹 Preview video duration: ${duration} seconds`);
    }
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
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Course Thumbnail <span className="text-red-500">*</span>
          </label>
          <UploadComponent
            onUploadComplete={handleThumbnailUpload}
            acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
            uploadType="thumbnail"
            maxFileSize={50 * 1024 * 1024} // 50MB
            placeholder="Upload course thumbnail image"
            currentUrl={state.thumbnail}
          />
          <FieldError field="thumbnail" />
        </div>

        {/* Promotional Video Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Promotional Video
          </label>
          <UploadComponent
            onUploadComplete={handleVideoUpload}
            acceptedFileTypes={['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm']}
            uploadType="video"
            maxFileSize={50 * 1024 * 1024 * 1024} // 50GB
            placeholder="Upload course promotional video"
            currentUrl={state.previewVideoUrl}
          />
        </div>

        {/* Title */}
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
              className={getFieldClassName("title", "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none")}
            />
            <FieldError field="title" />
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
            className={getFieldClassName("description", "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none")}
          />
          <FieldError field="description" />
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Short Description
          </label>
          <textarea
            placeholder="Brief summary for course cards and previews..."
            value={state.shortDescription || ""}
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
            <FieldError field="category" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Subcategory
            </label>
            <input
              type="text"
              placeholder="Enter subcategory (optional)"
              value={state.subcategory || ""}
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
            <FieldError field="skillLevel" />
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
              <option value="" disabled>Select audience</option>
              {audiences.map((audience) => (
                <option key={audience} value={audience}>
                  {audience === "college-students"
                    ? "College Students"
                    : "Professionals"}
                </option>
              ))}
            </select>
            <FieldError field="audience" />
          </FlexBox>
        </FlexBox>

                 {/* Duration and Discount */}
         <FlexBox className="w-full flex-col lg:flex-row gap-4">
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
           
           <FlexBox className="w-full flex-col gap-2">
             <label className="text-sm font-medium text-gray-700">
               Course Discount (%)
             </label>
             <div className="relative">
               <input
                 type="number"
                 min="0"
                 max="100"
                 step="1"
                 placeholder="0"
                 value={state.discount?.value || ''}
                 onChange={(e) => {
                   const value = Number(e.target.value);
                   // Only set discount object if value is greater than 0 and valid
                   if (value > 0 && value <= 100) {
                     updateField("discount", {
                       discount: "percentage",
                       value: value,
                       isActive: true
                     });
                   } else {
                     // Explicitly set to undefined for 0 or invalid values
                     updateField("discount", undefined);
                   }
                 }}
                 className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
               />
               <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
             </div>
             <p className="text-xs text-gray-500">
               Enter 0 for no discount, or 1-100 for discount percentage
             </p>
             <p className="text-xs text-gray-500">
               This is fake discount for display purpose
             </p>
           </FlexBox>
         </FlexBox>

         {/* Course Flags */}
         <FlexBox className="w-full flex-col gap-4">
           <label className="text-sm font-medium text-gray-700">Course Settings</label>
           <FlexBox className="w-full flex-col lg:flex-row gap-4">
             {/* Featured Course */}
             <FlexBox className="w-full flex-col gap-3 p-4 border border-gray-200 rounded-lg">
               <FlexBox className="items-center gap-3">
                 <input
                   type="checkbox"
                   id="isFeatured"
                   checked={state.isFeatured}
                   onChange={(e) => updateField("isFeatured", e.target.checked)}
                   className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                 />
                 <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700 cursor-pointer">
                   Featured Course
                 </label>
               </FlexBox>
               <p className="text-xs text-gray-500">
                 Featured courses are highlighted on the homepage and get more visibility
               </p>
             </FlexBox>

             {/* Certified Course */}
             <FlexBox className="w-full flex-col gap-3 p-4 border border-gray-200 rounded-lg">
               <FlexBox className="items-center gap-3">
                 <input
                   type="checkbox"
                   id="isCertified"
                   checked={state.isCertified}
                   onChange={(e) => updateField("isCertified", e.target.checked)}
                   className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                 />
                 <label htmlFor="isCertified" className="text-sm font-medium text-gray-700 cursor-pointer">
                   Certified Course
                 </label>
               </FlexBox>
               <p className="text-xs text-gray-500">
                 Certified courses provide certificates upon completion
               </p>
             </FlexBox>
           </FlexBox>
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
          {state.tags && state.tags.length > 0 && (
            <FlexBox className="w-full flex-wrap gap-2 mt-2">
              {state.tags.map((tag, index) => (
                <FlexBox
                  key={index}
                  className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm gap-2 items-center select-none"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
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
