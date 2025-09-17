import Container from "@/app/admin/components/ui/Container";
import CategoryInputWithManagement from "@/components/ui/inputs/CategoryInputWithManagement";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo } from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import ScreenNavigation from "./shared/ScreenNavigation";
import AlertBanner from "@/components/ui/AlertBanner";
import { useScreen } from "../contexts/ScreenContext";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import { BookOpen, Settings, Upload } from "lucide-react";

const Screen1 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const { uploadWithPresignedUrl, isUploading } = useUpload();

  // Generate folder names based on course title
  const courseTitle = state.course.title || "untitled-course";
  const curriculumFolder = `courses/${courseTitle}/curriculum`;

  // Handle curriculum file upload
  const handleCurriculumUpload = async (
    file: File,
    folderName: string
  ): Promise<string> => {
    try {
      const result = await uploadWithPresignedUrl(file, folderName);
      if (result.success && result.data) {
        actions.setCourseCurriculum(result.data.url);
        actions.setCourseCurriculumSource("upload");
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Curriculum upload failed:", error);
      throw error;
    }
  };

  // Handle curriculum file removal
  const handleCurriculumRemove = () => {
    actions.setCourseCurriculum("");
    actions.setCourseCurriculumSource(undefined);
  };

  // Validation checks for minimum character requirements
  const validationErrors = useMemo(() => {
    const errors = [];

    // Check title minimum length
    if (
      state.course.title &&
      state.course.title.trim().length > 0 &&
      state.course.title.trim().length < 5
    ) {
      errors.push("Course title must be at least 5 characters long");
    }

    // Check description minimum length
    if (
      state.course.description &&
      state.course.description.trim().length > 0 &&
      state.course.description.trim().length < 25
    ) {
      errors.push("Course description must be at least 25 characters long");
    }

    // Check short description minimum length
    if (
      state.course.shortDescription &&
      state.course.shortDescription.trim().length > 0 &&
      state.course.shortDescription.trim().length < 10
    ) {
      errors.push("Short description must be at least 10 characters long");
    }

    return errors;
  }, [
    state.course.title,
    state.course.description,
    state.course.shortDescription,
  ]);

  // Check if all required fields are filled and meet minimum requirements
  const isFormValid = useMemo(() => {
    return (
      state.course.title &&
      state.course.title.trim().length >= 5 &&
      state.course.category &&
      state.course.audience &&
      state.course.description &&
      state.course.description.trim().length >= 25 &&
      state.course.shortDescription &&
      state.course.shortDescription.trim().length >= 10 &&
      state.course.duration
    );
  }, [
    state.course.title,
    state.course.category,
    state.course.audience,
    state.course.description,
    state.course.shortDescription,
    state.course.duration,
  ]);

  return (
    <Container
      title="Basic Information"
      description="Define the core details of your course"
      className="rounded-b-none h-full w-full flex flex-col"
    >
      {/* Validation Feedback */}
      {validationErrors.length > 0 && (
        <div className="mb-6 space-y-3">
          {validationErrors.map((error, index) => (
            <AlertBanner key={index} message={error} type="error" />
          ))}
        </div>
      )}

      {/* Course Settings */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Course Settings
            </h3>
            <p className="text-sm text-gray-600">
              Configure course visibility and features
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <CheckBoxContainer
              label="Course Active"
              checked={state.course.isActive}
              onChange={(checked: boolean) =>
                actions.setCourseIsActive(checked)
              }
              description="Enable this course for students"
            />
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <CheckBoxContainer
              label="Featured Course"
              checked={state.course.isFeatured}
              onChange={(checked: boolean) =>
                actions.setCourseIsFeatured(checked)
              }
              description="Display this course prominently"
            />
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <CheckBoxContainer
              label="Certified Course"
              checked={state.course.isCertified}
              onChange={(checked: boolean) =>
                actions.setCourseIsCertified(checked)
              }
              description="This course provides certification"
            />
          </div>
        </div>
      </div>

      {/* Basic Course Information */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 mb-6 border border-orange-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Course Details
            </h3>
            <p className="text-sm text-gray-600">
              Essential information about your course
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <FlexBox className="w-full gap-6 flex-col lg:flex-row">
            <div className="flex-2">
              <Input
                label="Course Title"
                name="title"
                placeholder="Enter the title of the course"
                value={state.course.title || ""}
                onChange={(e) => actions.setCourseTitle(e.target.value)}
                className="w-full"
                minLength={5}
                required
              />
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>Minimum 5 characters required</span>
                <span
                  className={`font-medium ${
                    (state.course.title?.length || 0) < 5
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {state.course.title?.length || 0}/5+
                </span>
              </div>
            </div>
            <div className="flex-1">
              <CategoryInputWithManagement
                label="Category"
                name="category"
                value={state.course.category || "Select a category"}
                setChange={(value) => actions.setCourseCategory(value)}
                className="w-full"
                required
              />
            </div>
          </FlexBox>

          <FlexBox className="w-full gap-6 flex-col lg:flex-row">
            <div className="flex-1">
              <DropDown
                label="Target Audience"
                name="targetAudience"
                options={["College Students", "Professionals"]}
                value={
                  state.course.audience === "college-students"
                    ? "College Students"
                    : state.course.audience === "professionals"
                    ? "Professionals"
                    : "Select a target audience"
                }
                onChange={(e) => {
                  const technicalValue =
                    e.target.value === "College Students"
                      ? "college-students"
                      : "professionals";
                  actions.setCourseAudience(technicalValue);
                }}
                required
              />
            </div>
            <div className="flex-1">
              <Input
                label="Course Duration"
                name="duration"
                placeholder="e.g., 3 months, 12 weeks, 6 hours"
                value={state.course.duration}
                onChange={(e) => actions.setCourseDuration(e.target.value)}
                className="w-full"
                required
              />
            </div>
          </FlexBox>

          <div className="w-full">
            <TextArea
              label="Course Description"
              name="description"
              placeholder="Provide a detailed description of what this course covers"
              value={state.course.description}
              onChange={(e) => actions.setCourseDescription(e.target.value)}
              className="w-full"
              rows={4}
              lockHeight
              required
            />
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Minimum 25 characters required</span>
              <span
                className={`font-medium ${
                  (state.course.description?.length || 0) < 25
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {state.course.description?.length || 0}/25+
              </span>
            </div>
          </div>

          <div className="w-full">
            <TextArea
              label="Short Description"
              name="shortDescription"
              placeholder="Brief summary for course previews and listings"
              value={state.course.shortDescription}
              onChange={(e) =>
                actions.setCourseShortDescription(e.target.value)
              }
              className="w-full"
              rows={2}
              lockHeight
              required
              maxLength={100}
            />
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>10-100 characters required</span>
              <span
                className={`font-medium ${
                  (state.course.shortDescription?.length || 0) < 10 ||
                  (state.course.shortDescription?.length || 0) > 100
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {state.course.shortDescription?.length || 0}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Upload */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Course Curriculum
            </h3>
            <p className="text-sm text-gray-600">
              Upload course syllabus or curriculum document (optional)
            </p>
          </div>
        </div>

        <UploadMediaContainer
          title="Curriculum Document"
          description="Upload a PDF document containing the course curriculum"
          type="document"
          mediaUrl={state.course.curriculum || ""}
          mediaSource={
            state.course.curriculum ? state.course.curriculumSource : undefined
          }
          onFileUpload={handleCurriculumUpload}
          onFileRemove={handleCurriculumRemove}
          onUrlSubmit={(url) => {
            actions.setCourseCurriculum(url);
            actions.setCourseCurriculumSource("url");
          }}
          acceptedFormats={[".pdf"]}
          maxSize={10}
          allowUrlInput={true}
          urlPlaceholder="Upload curriculum PDF or enter URL"
          folderName={curriculumFolder}
          isUploading={isUploading}
          usePresignedUrl={true}
          presignedUrlThreshold={5}
        />
      </div>

      <ScreenNavigation
        currentStep={1}
        nextScreen="screen2"
        showPrevious={false}
        isNextDisabled={!isFormValid}
        setActiveScreen={setActiveScreen}
      />
    </Container>
  );
};

export default Screen1;
