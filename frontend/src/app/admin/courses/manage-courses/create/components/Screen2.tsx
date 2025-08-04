import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";
import TagInput from "@/components/ui/inputs/TagInput";

const Screen2 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();

  return (
    <Container
      title="Learning Information & Skills"
      description="Define what students will learn and the skills they'll acquire"
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

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <DropDown
          label="Skill Level"
          name="skillLevel"
          options={["Beginner", "Intermediate", "Advanced", "Expert"]}
          defaultValue={state.course.skillLevel || "Select skill level"}
          key={state.course.skillLevel || "skill-level-empty"}
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

      <FlexBox className="w-full gap-4 mt-auto mb-4 justify-between">
        <OrangeButton
          className="w-max px-16"
          onClick={() => setActiveScreen("screen1")}
        >
          Previous
        </OrangeButton>
        <OrangeButton
          className="w-max px-16"
          onClick={() => setActiveScreen("screen3")}
          disabled={
            !state.course.whatYouWillLearn ||
            state.course.skills.length === 0 ||
            state.course.careerPaths.length === 0 ||
            !state.course.skillLevel ||
            !state.course.language ||
            !state.course.whoShouldJoin
          }
        >
          Next Page
        </OrangeButton>
      </FlexBox>
    </Container>
  );
};

export default Screen2;
