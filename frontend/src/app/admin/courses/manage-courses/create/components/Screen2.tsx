import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import React, { useMemo } from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import TagInput from "@/components/ui/inputs/TagInput";
import ScreenNavigation from "./shared/ScreenNavigation";
import { useScreen } from "../contexts/ScreenContext";
import { Target, BookOpen, Users } from "lucide-react";

const Screen2 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();

  // Validation for form completion
  const isFormValid = useMemo(() => {
    return (
      state.course.whatYouWillLearn &&
      state.course.skills.length > 0 &&
      state.course.careerPaths.length > 0 &&
      state.course.skillLevel &&
      state.course.whoShouldJoin &&
      state.course.language
    );
  }, [
    state.course.whatYouWillLearn,
    state.course.skills,
    state.course.careerPaths,
    state.course.skillLevel,
    state.course.whoShouldJoin,
    state.course.language,
  ]);

  return (
    <Container
      title="Learning Information"
      description="Define what students will learn and course requirements"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Learning Outcomes Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Learning Outcomes</h3>
            <p className="text-sm text-gray-600">Define what students will achieve after completing this course</p>
          </div>
        </div>

        <div className="space-y-6">
          <TextArea
            label="What You Will Learn"
            name="whatYouWillLearn"
            placeholder="Describe what students will learn from this course in detail"
            value={state.course.whatYouWillLearn}
            onChange={(e) => actions.setCourseWhatYouWillLearn(e.target.value)}
            className="w-full"
            rows={4}
            lockHeight
            required
          />

          <TagInput
            label="Skills Students Will Acquire"
            placeholder="Add skills (e.g., JavaScript, React, Node.js, Problem Solving)"
            tags={state.course.skills}
            onChange={(skills) => actions.setCourseSkills(skills)}
            className="w-full"
            countLabel="skills"
            required
          />

          <TagInput
            label="Career Paths"
            placeholder="Add career opportunities (e.g., Frontend Developer, Full Stack Developer, Software Engineer)"
            tags={state.course.careerPaths}
            onChange={(careerPaths) => actions.setCourseCareerPaths(careerPaths)}
            className="w-full"
            countLabel="career paths"
            required
          />
        </div>
      </div>

      {/* Course Details Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Course Details</h3>
            <p className="text-sm text-gray-600">Configure skill level and language preferences</p>
          </div>
        </div>

        <FlexBox className="w-full gap-6 flex-col lg:flex-row mb-6">
          <div className="flex-1">
            <DropDown
              label="Skill Level"
              name="skillLevel"
              options={["Beginner", "Intermediate", "Advanced", "Expert"]}
              value={state.course.skillLevel || "Select skill level"}
              onChange={(e) => actions.setCourseSkillLevel(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <DropDown
              label="Language"
              name="language"
              options={[
                "English",
                "Spanish",
                "French",
                "German",
                "Portuguese",
                "Italian",
                "Russian",
                "Chinese",
                "Japanese",
                "Korean",
                "Hindi",
                "Arabic",
              ]}
              value={
                state.course.language === "en"
                  ? "English"
                  : state.course.language === "es"
                  ? "Spanish"
                  : state.course.language === "fr"
                  ? "French"
                  : state.course.language === "de"
                  ? "German"
                  : state.course.language === "pt"
                  ? "Portuguese"
                  : state.course.language === "it"
                  ? "Italian"
                  : state.course.language === "ru"
                  ? "Russian"
                  : state.course.language === "zh"
                  ? "Chinese"
                  : state.course.language === "ja"
                  ? "Japanese"
                  : state.course.language === "ko"
                  ? "Korean"
                  : state.course.language === "hi"
                  ? "Hindi"
                  : state.course.language === "ar"
                  ? "Arabic"
                  : state.course.language || "Select language"
              }
              onChange={(e) => {
                const languageMap: { [key: string]: string } = {
                  English: "en",
                  Spanish: "es",
                  French: "fr",
                  German: "de",
                  Portuguese: "pt",
                  Italian: "it",
                  Russian: "ru",
                  Chinese: "zh",
                  Japanese: "ja",
                  Korean: "ko",
                  Hindi: "hi",
                  Arabic: "ar",
                };
                const languageCode = languageMap[e.target.value] || "en";
                actions.setCourseLanguage(languageCode);
              }}
              required
            />
          </div>
        </FlexBox>

        <TextArea
          label="Who Should Join This Course"
          name="whoShouldJoin"
          placeholder="Describe the ideal student for this course (e.g., Beginners with no programming experience, Professionals looking to upskill)"
          value={state.course.whoShouldJoin}
          onChange={(e) => actions.setCourseWhoShouldJoin(e.target.value)}
          className="w-full"
          rows={3}
          lockHeight
          required
        />
      </div>

      {/* Additional Information Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Additional Information</h3>
            <p className="text-sm text-gray-600">Optional course requirements and tags</p>
          </div>
        </div>

        <div className="space-y-6">
          <TagInput
            label="Prerequisites (Optional)"
            placeholder="Add prerequisites (e.g., Basic HTML knowledge, Programming fundamentals)"
            tags={state.course.prerequisites}
            onChange={(prerequisites) =>
              actions.setCoursePrerequisites(prerequisites)
            }
            className="w-full"
            countLabel="prerequisites"
            required={false}
          />

          <TagInput
            label="Course Tags (Optional)"
            placeholder="Add relevant tags (e.g., Web Development, Programming, Tutorial, Certification)"
            tags={state.course.tags}
            onChange={(tags) => actions.setCourseTags(tags)}
            className="w-full"
            countLabel="course tags"
            required={false}
          />
        </div>
      </div>

      <ScreenNavigation
        currentStep={2}
        previousScreen="screen1"
        nextScreen="screen3"
        setActiveScreen={setActiveScreen}
        isNextDisabled={!isFormValid}
      />
    </Container>
  );
};

export default Screen2;
