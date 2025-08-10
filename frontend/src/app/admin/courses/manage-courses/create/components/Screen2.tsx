import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import TagInput from "@/components/ui/inputs/TagInput";
import ScreenNavigation from "./shared/ScreenNavigation";
import { useScreen } from "../contexts/ScreenContext";
import { Plus, Trash2, Edit3 } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

const Screen2 = () => {
  const { state, actions } = useCourseContext();

  // Helper function to check if highlights are valid
  const areHighlightsValid = () => {
    return state.course.highlights.length > 0 && 
           state.course.highlights.every(h => h.title.trim() && h.description.trim());
  };

  const highlightsHaveErrors = state.course.highlights.length === 0 || 
                              state.course.highlights.some(h => !h.title.trim() || !h.description.trim());

  return (
    <Container
      title="UI related information"
      description="These are required to fill the UI of the course" 
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      <TextArea
        label="What You Will Learn"
        name="whatYouWillLearn"
        placeholder="Describe what students will learn from this course"
        value={state.course.whatYouWillLearn}
        onChange={(e) => actions.setCourseWhatYouWillLearn(e.target.value)}
        className="w-full"
        rows={4}
        lockHeight
        required
      />
      
      <TagInput
        label="Skills Students Will Acquire"
        placeholder="Add skills (e.g., JavaScript, React, Node.js)"
        tags={state.course.skills}
        onChange={(skills) => actions.setCourseSkills(skills)}
        className="w-full"
        required
      />

      <TagInput
        label="Career Paths"
        placeholder="Add career paths (e.g., Frontend Developer, Full Stack Developer)"
        tags={state.course.careerPaths}
        onChange={(careerPaths) => actions.setCourseCareerPaths(careerPaths)}
        className="w-full"
        required
      />

      <TagInput
        label="Course Tags"
        placeholder="Add general tags (e.g., Web Development, Programming, Tutorial)"
        tags={state.course.tags}
        onChange={(tags) => actions.setCourseTags(tags)}
        className="w-full"
        required={false}
      />

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <DropDown
          label="Skill Level"
          name="skillLevel"
          options={["Beginner", "Intermediate", "Advanced", "Expert"]}
          value={state.course.skillLevel || "Select skill level"}
          onChange={(e) => actions.setCourseSkillLevel(e.target.value)}
          required
        />
        <Input
          label="Language"
          name="language"
          placeholder="Course language (e.g., English, Spanish)"
          value={state.course.language}
          onChange={(e) => actions.setCourseLanguage(e.target.value)}
          className="w-full"
          required
        />
      </FlexBox>

      <TextArea
        label="Who Should Join This Course"
        name="whoShouldJoin"
        placeholder="Describe who should take this course (e.g., Beginners with no programming experience, Professionals looking to upskill)"
        value={state.course.whoShouldJoin}
        onChange={(e) => actions.setCourseWhoShouldJoin(e.target.value)}
        className="w-full"
        rows={3}
        lockHeight
        required
      />

      {/* Course Highlights Section */}
      <div className={`w-full ${highlightsHaveErrors ? 'border border-red-200 rounded-lg p-4 bg-red-50' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Highlights <span className="text-red-500">*</span>
            </label>
            <p className={`text-sm ${highlightsHaveErrors ? 'text-red-500' : 'text-gray-500'}`}>
              {highlightsHaveErrors 
                ? 'At least one complete highlight is required' 
                : 'Add key highlights or selling points for your course'
              }
            </p>
          </div>
          <OrangeButton
            onClick={() => {
              const newHighlights = [...state.course.highlights, { title: "", description: "" }];
              actions.setCourseHighlights(newHighlights);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Highlight
          </OrangeButton>
        </div>

        {state.course.highlights.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
              <Plus className="w-full h-full" />
            </div>
            <p className="text-sm">No highlights added yet</p>
            <p className="text-xs">Click "Add Highlight" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {state.course.highlights.map((highlight, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Highlight {index + 1}</h4>
                  <button
                    onClick={() => {
                      const newHighlights = state.course.highlights.filter((_, i) => i !== index);
                      actions.setCourseHighlights(newHighlights);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <Input
                    label="Title"
                    placeholder="e.g., Industry-Relevant Projects"
                    value={highlight.title}
                    onChange={(e) => {
                      const newHighlights = state.course.highlights.map((h, i) =>
                        i === index ? { ...h, title: e.target.value } : h
                      );
                      actions.setCourseHighlights(newHighlights);
                    }}
                    className="w-full"
                    required
                  />
                  
                  <TextArea
                    label="Description"
                    placeholder="e.g., Build real-world projects that you can showcase in your portfolio"
                    value={highlight.description}
                    onChange={(e) => {
                      const newHighlights = state.course.highlights.map((h, i) =>
                        i === index ? { ...h, description: e.target.value } : h
                      );
                      actions.setCourseHighlights(newHighlights);
                    }}
                    className="w-full"
                    rows={2}
                    lockHeight
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScreenNavigation
        currentStep={2}
        previousScreen="screen1"
        nextScreen="screen3"

        isNextDisabled={
          !state.course.whatYouWillLearn ||
          state.course.skills.length === 0 ||
          state.course.careerPaths.length === 0 ||
          !state.course.skillLevel ||
          !state.course.language ||
          !state.course.whoShouldJoin ||
          state.course.highlights.length === 0 ||
          state.course.highlights.some(h => !h.title.trim() || !h.description.trim())
        }
      />
    </Container>
  );
};

export default Screen2;
