import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo } from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import TagInput from "@/components/ui/inputs/TagInput";
import ScreenNavigation from "./shared/ScreenNavigation";
import { Plus, Trash2, Star, Award } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";

const Screen4 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();

  const highlightsHaveErrors =
    state.course.highlights.length === 0 ||
    state.course.highlights.some(
      (h) => !h.title.trim() || !h.description.trim()
    );

  // Validation for form completion
  const isFormValid = useMemo(() => {
    return (
      state.course.highlights.length > 0 &&
      state.course.highlights.every(
        (h) => h.title.trim() && h.description.trim()
      ) &&
      (state.course.features?.length || 0) > 0
    );
  }, [state.course.highlights, state.course.features]);

  return (
    <Container
      title="Highlights & Features"
      description="Define key selling points and features that make your course stand out"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Course Highlights Section */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 mb-6 border border-orange-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Course Highlights</h3>
            <p className="text-sm text-gray-600">Add compelling highlights that showcase the value of your course</p>
          </div>
        </div>

        <div
          className={`w-full ${
            highlightsHaveErrors
              ? "border border-red-200 rounded-xl p-4 bg-red-50"
              : ""
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Highlights <span className="text-red-500">*</span>
              </label>
              <p
                className={`text-sm ${
                  highlightsHaveErrors ? "text-red-600" : "text-gray-500"
                }`}
              >
                {highlightsHaveErrors
                  ? "At least one complete highlight is required"
                  : "Add key highlights or selling points for your course"}
              </p>
            </div>
            <OrangeButton
              onClick={() => {
                const newHighlights = [
                  ...state.course.highlights,
                  { title: "", description: "" },
                ];
                actions.setCourseHighlights(newHighlights);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm"
              glow={false}
            >
              <Plus className="w-4 h-4" />
              Add Highlight
            </OrangeButton>
          </div>

          {state.course.highlights.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <Star className="w-full h-full" />
              </div>
              <p className="text-lg font-medium mb-2">No highlights added yet</p>
              <p className="text-sm">
                Click &quot;Add Highlight&quot; to showcase what makes your course special
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {state.course.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800">
                        Highlight {index + 1}
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        const newHighlights = state.course.highlights.filter(
                          (_, i) => i !== index
                        );
                        actions.setCourseHighlights(newHighlights);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Highlight Title"
                      placeholder="e.g., Industry-Relevant Projects"
                      value={highlight.title}
                      onChange={(e) => {
                        const newHighlights = state.course.highlights.map(
                          (h, i) =>
                            i === index ? { ...h, title: e.target.value } : h
                        );
                        actions.setCourseHighlights(newHighlights);
                      }}
                      className="w-full"
                      required
                    />

                    <TextArea
                      label="Highlight Description"
                      placeholder="e.g., Build real-world projects that you can showcase in your portfolio and impress potential employers"
                      value={highlight.description}
                      onChange={(e) => {
                        const newHighlights = state.course.highlights.map(
                          (h, i) =>
                            i === index
                              ? { ...h, description: e.target.value }
                              : h
                        );
                        actions.setCourseHighlights(newHighlights);
                      }}
                      className="w-full"
                      rows={3}
                      lockHeight
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Features Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500 rounded-lg">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Course Features</h3>
            <p className="text-sm text-gray-600">List the key features and benefits that come with your course</p>
          </div>
        </div>

        <TagInput
          label="Course Features"
          placeholder="Add features (e.g., Lifetime Access, Certificate of Completion, Mobile App Access, 24/7 Support)"
          tags={state.course.features}
          onChange={(features) => actions.setCourseFeatures(features)}
          className="w-full"
          countLabel="features"
          required
        />
      </div>

      <ScreenNavigation
        currentStep={4}
        previousScreen="screen3"
        nextScreen="screen5"
        setActiveScreen={setActiveScreen}
        isNextDisabled={!isFormValid}
      />
    </Container>
  );
};

export default Screen4;
