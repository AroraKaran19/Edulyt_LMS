import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo, useState, useEffect } from "react";
import { useCourseContext } from "../../../reducers";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";
import TagInput from "@/components/ui/inputs/TagInput";
import AlertBanner from "@/components/ui/AlertBanner";
import {
  Star,
  Award,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Testimonial } from "@/types/course";

const Screen5 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const [savedTestimonials, setSavedTestimonials] = useState<Set<number>>(
    new Set()
  );
  const [expandedTestimonials, setExpandedTestimonials] = useState<Set<number>>(
    new Set()
  );
  const [imageValidation, setImageValidation] = useState<Map<number, boolean>>(
    new Map()
  );

  // Helper function to check if testimonial is complete
  const isTestimonialComplete = (testimonial: Testimonial) => {
    return (
      testimonial.name?.trim() &&
      testimonial.comment?.trim() &&
      testimonial.currentRole?.trim() &&
      testimonial.currentCompany?.trim() &&
      testimonial.pastRole?.trim() &&
      testimonial.pastCompany?.trim() &&
      testimonial.linkedin?.trim() &&
      testimonial.profileImage?.trim()
    );
  };

  // Validation checks
  const validationErrors = useMemo(() => {
    const errors = [];
    
    // Check if at least one testimonial exists
    if (!state.course.testimonials || state.course.testimonials.length === 0) {
      errors.push("At least one testimonial is required");
      return errors; // Early return if no testimonials
    }

    // Check if at least one testimonial is complete
    const hasCompleteTestimonial = state.course.testimonials.some(testimonial => 
      isTestimonialComplete(testimonial)
    );
    
    if (!hasCompleteTestimonial) {
      errors.push("At least one complete testimonial is required (all fields must be filled)");
    }

    // Check for incomplete testimonials and provide specific feedback
    const incompleteTestimonials = state.course.testimonials.map((testimonial, index) => {
      const missingFields = [];
      if (!testimonial.name || testimonial.name.trim() === "") missingFields.push("name");
      if (!testimonial.comment || testimonial.comment.trim() === "") missingFields.push("comment");
      if (!testimonial.currentRole || testimonial.currentRole.trim() === "") missingFields.push("current role");
      if (!testimonial.currentCompany || testimonial.currentCompany.trim() === "") missingFields.push("current company");
      if (!testimonial.pastRole || testimonial.pastRole.trim() === "") missingFields.push("past role");
      if (!testimonial.pastCompany || testimonial.pastCompany.trim() === "") missingFields.push("past company");
      if (!testimonial.linkedin || testimonial.linkedin.trim() === "") missingFields.push("LinkedIn URL");
      if (!testimonial.profileImage || testimonial.profileImage.trim() === "") missingFields.push("profile image URL");
      
      return { index, missingFields };
    }).filter(item => item.missingFields.length > 0);

    if (incompleteTestimonials.length > 0) {
      incompleteTestimonials.forEach(item => {
        errors.push(`Testimonial ${item.index + 1}: Missing ${item.missingFields.join(", ")}`);
      });
    }

    return errors;
  }, [state.course.testimonials]);

  // Function to check if image URL is valid
  const checkImageUrl = async (url: string): Promise<boolean> => {
    if (!url || url.trim() === "") return false;

    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      return response.ok && (contentType?.startsWith("image/") || false);
    } catch (error) {
      return false;
    }
  };

  // Function to validate testimonial image
  const validateTestimonialImage = async (index: number, imageUrl: string) => {
    const isValid = await checkImageUrl(imageUrl);
    setImageValidation((prev) => {
      const newMap = new Map(prev);
      newMap.set(index, isValid);
      return newMap;
    });
  };

  // Effect to validate images when testimonials change
  useEffect(() => {
    const testimonials = state.course.testimonials || [];
    testimonials.forEach((testimonial, index) => {
      if (testimonial.profileImage) {
        validateTestimonialImage(index, testimonial.profileImage);
      }
    });
  }, [state.course.testimonials]);

  // Effect to initialize saved testimonials state when testimonials are loaded
  useEffect(() => {
    const testimonials = state.course.testimonials || [];
    const savedIndices = new Set<number>();

    testimonials.forEach((testimonial, index) => {
      // Consider a testimonial as saved if it has all required fields
      if (isTestimonialComplete(testimonial)) {
        savedIndices.add(index);
      }
    });

    setSavedTestimonials(savedIndices);
  }, [state.course.testimonials]);

  // Helper function to add a new testimonial
  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      name: "",
      comment: "",
      reviewableType: "Course",
      reviewableId: "",
      currentRole: "",
      currentCompany: "",
      linkedin: "",
      isActive: true,
      pastRole: "",
      pastCompany: "",
      verified: false,
      profileImage: "",
    };

    const currentTestimonials = state.course.testimonials || [];
    const newIndex = currentTestimonials.length;
    actions.updateCourseField("testimonials", [
      ...currentTestimonials,
      newTestimonial,
    ]);
    setExpandedTestimonials((prev) => new Set([...prev, newIndex]));
  };

  // Helper function to update a testimonial
  const updateTestimonial = (
    index: number,
    field: keyof Testimonial,
    value: any
  ) => {
    const currentTestimonials = state.course.testimonials || [];
    const updatedTestimonials = [...currentTestimonials];
    updatedTestimonials[index] = {
      ...updatedTestimonials[index],
      [field]: value,
    };
    actions.updateCourseField("testimonials", updatedTestimonials);

    // Validate image if profileImage is updated
    if (field === "profileImage") {
      validateTestimonialImage(index, value);
    }
  };

  // Helper function to remove a testimonial
  const removeTestimonial = (index: number) => {
    const currentTestimonials = state.course.testimonials || [];
    const updatedTestimonials = currentTestimonials.filter(
      (_, i) => i !== index
    );
    actions.updateCourseField("testimonials", updatedTestimonials);

    // Update saved and expanded states
    setSavedTestimonials((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setExpandedTestimonials((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    // Remove image validation
    setImageValidation((prev) => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  };

  // Helper function to save a testimonial
  const saveTestimonial = (index: number) => {
    const testimonial = state.course.testimonials?.[index];
    if (testimonial && isTestimonialComplete(testimonial)) {
      setSavedTestimonials((prev) => new Set([...prev, index]));
      setExpandedTestimonials((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // Helper function to toggle testimonial expansion
  const toggleTestimonialExpansion = (index: number) => {
    setExpandedTestimonials((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Helper function to render profile image or fallback
  const renderProfileImage = (testimonial: Testimonial, index: number) => {
    const isImageValid = imageValidation.get(index);

    if (testimonial.profileImage && isImageValid === true) {
      return (
        <img
          src={testimonial.profileImage}
          alt={testimonial.name}
          className="w-10 h-10 rounded-full object-cover"
          onError={() =>
            setImageValidation((prev) => new Map(prev.set(index, false)))
          }
        />
      );
    }

    // Fallback to name initial
    return (
      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-orange-600 font-medium text-sm">
          {testimonial.name?.charAt(0)?.toUpperCase() || "?"}
        </span>
      </div>
    );
  };

  return (
    <Container
      title="Reviews & Testimonials"
      description="Configure course metrics, testimonials, and additional features"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Validation Feedback */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="font-medium mb-2 text-orange-800">Please complete the following:</div>
          <ul className="list-disc list-inside space-y-1 text-orange-700">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Testimonials Section */}
      <div className={`bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 mb-6 border ${
        validationErrors.length > 0 ? 'border-orange-300 bg-orange-50' : 'border-orange-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Student Testimonials <span className="text-red-500">*</span>
              </h3>
              <p className={`text-sm ${validationErrors.length > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                {validationErrors.length > 0 
                  ? 'At least one complete testimonial is required' 
                  : 'Add authentic student testimonials to build trust'
                }
              </p>
            </div>
          </div>
          <OrangeButton
            onClick={addTestimonial}
            className="flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Add Testimonial
          </OrangeButton>
        </div>

        {/* Testimonials List */}
        <div className="space-y-4">
          {(state.course.testimonials || []).map((testimonial, index) => {
            const isSaved = savedTestimonials.has(index);
            const isExpanded = expandedTestimonials.has(index);
            const isComplete = isTestimonialComplete(testimonial);
            const isImageValid = imageValidation.get(index);

            return (
              <div
                key={index}
                className="bg-white rounded-lg border border-orange-200 overflow-hidden"
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => toggleTestimonialExpansion(index)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isComplete ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    ></div>
                    <h4 className="font-medium text-gray-800">
                      {testimonial.name || `Testimonial #${index + 1}`}
                    </h4>
                    {isSaved && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Saved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-orange-100">
                    <FlexBox className="flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Student Name"
                          placeholder="e.g., Rahul"
                          value={testimonial.name}
                          onChange={(e) =>
                            updateTestimonial(index, "name", e.target.value)
                          }
                          required
                        />
                      </div>

                      <TextArea
                        label="Testimonial Comment"
                        placeholder="What did this student say about the course?"
                        value={testimonial.comment}
                        onChange={(e) =>
                          updateTestimonial(index, "comment", e.target.value)
                        }
                        rows={3}
                        lockHeight
                        required
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Current Role"
                          placeholder="e.g., Software Engineer"
                          value={testimonial.currentRole}
                          onChange={(e) =>
                            updateTestimonial(
                              index,
                              "currentRole",
                              e.target.value
                            )
                          }
                          required
                        />
                        <Input
                          label="Current Company"
                          placeholder="e.g., Google"
                          value={testimonial.currentCompany}
                          onChange={(e) =>
                            updateTestimonial(
                              index,
                              "currentCompany",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Past Role (Before Course)"
                          placeholder="e.g., Student"
                          value={testimonial.pastRole}
                          onChange={(e) =>
                            updateTestimonial(index, "pastRole", e.target.value)
                          }
                          required
                        />
                        <Input
                          label="Past Company (Before Course)"
                          placeholder="e.g., University"
                          value={testimonial.pastCompany}
                          onChange={(e) =>
                            updateTestimonial(
                              index,
                              "pastCompany",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="LinkedIn Profile URL"
                          placeholder="https://linkedin.com/in/username"
                          value={testimonial.linkedin}
                          onChange={(e) =>
                            updateTestimonial(index, "linkedin", e.target.value)
                          }
                          required
                        />
                        <div className="flex flex-col gap-2">
                          <Input
                            label="Profile Image URL"
                            placeholder="https://example.com/image.jpg"
                            value={testimonial.profileImage}
                            onChange={(e) =>
                              updateTestimonial(
                                index,
                                "profileImage",
                                e.target.value
                              )
                            }
                            required
                          />
                          {testimonial.profileImage && (
                            <div className="flex items-center gap-2 text-xs">
                              {isImageValid === true && (
                                <span className="text-green-600 flex items-center gap-1">
                                  ✓ Image URL is valid
                                </span>
                              )}
                              {isImageValid === false && (
                                <span className="text-red-600 flex items-center gap-1">
                                  ✗ Invalid image URL - will use name initial
                                </span>
                              )}
                              {isImageValid === undefined && (
                                <span className="text-gray-500 flex items-center gap-1">
                                  ⏳ Validating image...
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={testimonial.isActive}
                            onChange={(e) =>
                              updateTestimonial(
                                index,
                                "isActive",
                                e.target.checked
                              )
                            }
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-orange-100">
                        <button
                          onClick={() => removeTestimonial(index)}
                          className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>

                        <div className="flex items-center gap-2">
                          <OrangeButton
                            onClick={() => saveTestimonial(index)}
                            disabled={!isComplete}
                            className="flex items-center gap-2 px-4 py-2"
                          >
                            <Save className="w-4 h-4" />
                            Save Testimonial
                          </OrangeButton>
                        </div>
                      </div>
                    </FlexBox>
                  </div>
                )}

                {/* Collapsed View */}
                {!isExpanded && isSaved && (
                  <div className="p-4 border-t border-orange-100">
                    <div className="flex items-start gap-3">
                      {renderProfileImage(testimonial, index)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-800">
                            {testimonial.name}
                          </h5>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">
                            {testimonial.currentRole}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">
                            {testimonial.currentCompany}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {testimonial.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(state.course.testimonials || []).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No testimonials added yet</p>
              <p className="text-sm">Click "Add Testimonial" to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Course Features Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500 rounded-lg">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Course Features
            </h3>
            <p className="text-sm text-gray-600">
              Add key features and benefits that highlight your course value
            </p>
          </div>
        </div>

        <TagInput
          label="Course Features (Optional)"
          placeholder="Add features (e.g., Lifetime Access, Certificate, 24/7 Support)"
          tags={state.course.features}
          onChange={(features) => actions.setCourseFeatures(features)}
          className="w-full"
          maxTags={15}
          required={false}
        />
      </div>

      <FlexBox className="w-full gap-4 mt-auto mb-4 justify-between">
        <OrangeButton
          className="w-max px-16"
          onClick={() => setActiveScreen("screen4")}
        >
          Previous
        </OrangeButton>

        <FlexBox className="gap-4 items-center">
          {/* Progress indicator */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
            <span>Step 5 of 8</span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: "62.5%" }}
              ></div>
            </div>
          </div>

          <OrangeButton
            className="w-max px-16"
            onClick={() => setActiveScreen("screen6")}
            disabled={validationErrors.length > 0}
          >
            Next Page
          </OrangeButton>
        </FlexBox>
      </FlexBox>
    </Container>
  );
};

export default Screen5;
