import Container from "@/app/admin/components/ui/Container";
import CategoryInput from "@/components/ui/inputs/CategoryInput";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo } from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import ScreenNavigation from "./shared/ScreenNavigation";
import StepwiseNavigation from "./shared/StepwiseNavigation";
import AlertBanner from "@/components/ui/AlertBanner";
import { useScreen } from "../contexts/ScreenContext";
import { toast } from "react-toastify";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";

const Screen1 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const { uploadWithPresignedUrl, isUploading } = useUpload();

  // Debug current curriculum state
  React.useEffect(() => {
    console.log("📄 Current curriculum state:", {
      curriculum: state.course.curriculum,
      curriculumSource: state.course.curriculumSource,
      curriculumS3Key: state.course.curriculumS3Key,
      hasActions: {
        setCourseCurriculum: !!actions.setCourseCurriculum,
        setCourseCurriculumSource: !!actions.setCourseCurriculumSource,
        setCourseCurriculumS3Key: !!actions.setCourseCurriculumS3Key
      }
    });
  }, [state.course.curriculum, state.course.curriculumSource, state.course.curriculumS3Key]);

  // Generate folder names based on course title
  const courseTitle = state.course.title || "untitled-course";
  const curriculumFolder = `course/curriculum`;

  // Handle curriculum file upload
  const handleCurriculumUpload = async (
    file: File,
    folderName: string
  ): Promise<string> => {
    console.log("📄 Starting curriculum upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folderName
    });

    try {
      const result = await uploadWithPresignedUrl(file, folderName);
      
      console.log("📄 Curriculum upload result:", result);
      
      if (result.success && result.data) {
        console.log("✅ Curriculum upload successful:", result.data.url);
        console.log("🔧 Available actions:", Object.keys(actions));
        
        actions.setCourseCurriculum(result.data.url);
        
        if (actions.setCourseCurriculumSource) {
          actions.setCourseCurriculumSource("upload");
          console.log("✅ Set curriculum source: upload");
        } else {
          console.error("❌ setCourseCurriculumSource action not available");
        }
        
        if (actions.setCourseCurriculumS3Key) {
          actions.setCourseCurriculumS3Key(result.data.s3Key || "");
          console.log("✅ Set curriculum S3 key:", !!result.data.s3Key);
        } else {
          console.error("❌ setCourseCurriculumS3Key action not available");
        }
        
        toast.success("Curriculum document uploaded successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        return result.data.url;
      }
      
      console.error("❌ Curriculum upload failed:", result.error);
      const errorMsg = result.error || "Upload failed";
      toast.error(`Curriculum upload failed: ${errorMsg}`, {
        position: "top-right",
        autoClose: 5000,
      });
      throw new Error(errorMsg);
    } catch (error) {
      console.error("❌ Curriculum upload exception:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Curriculum upload error: ${errorMsg}`, {
        position: "top-right",
        autoClose: 5000,
      });
      throw error;
    }
  };

  // Handle curriculum file removal
  const handleCurriculumRemove = () => {
    console.log("📄 Removing curriculum");
    actions.setCourseCurriculum("");
    
    if (actions.setCourseCurriculumSource) {
      actions.setCourseCurriculumSource(undefined);
      console.log("✅ Cleared curriculum source");
    }
    
    if (actions.setCourseCurriculumS3Key) {
      actions.setCourseCurriculumS3Key("");
      console.log("✅ Cleared curriculum S3 key");
    }
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
      description="Please fill in the basic information of the course"
      className="rounded-b-none h-full w-full flex flex-col"
    >
      {/* Validation Feedback */}
      {validationErrors.length > 0 && (
        <div className="mb-4 space-y-2">
          {validationErrors.map((error, index) => (
            <AlertBanner key={index} message={error} type="error" />
          ))}
        </div>
      )}

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <div className="w-2/3">
          <Input
            label="Title"
            name="title"
            placeholder="Enter the title of the course"
            value={state.course.title || ""}
            onChange={(e) => actions.setCourseTitle(e.target.value)}
            className="w-full"
            minLength={5}
            required
          />
          <div className="mt-1 text-xs text-gray-500 flex justify-between">
            <span>Minimum 5 characters required</span>
            <span
              className={`${
                (state.course.title?.length || 0) < 5
                  ? "text-red-500"
                  : "text-green-600"
              }`}
            >
              {state.course.title?.length || 0}/5+
            </span>
          </div>
        </div>
        <CategoryInput
          label="Category"
          name="category"
          options={["Programming", "Design", "Business", "Marketing"]}
          value={state.course.category || "Select a category"}
          setChange={(value) => actions.setCourseCategory(value)}
          className="w-1/3"
          required
        />
      </FlexBox>
      <FlexBox className="w-full gap-8 flex-col md:flex-row">
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
        <Input
          label="Subcategory (Optional)"
          name="subCategory"
          placeholder="Enter the subcategory of the course"
          value={state.course.subcategory}
          onChange={(e) => actions.setCourseSubcategory(e.target.value)}
          required={false}
        />
      </FlexBox>
      <div className="w-full">
        <TextArea
          label="Description"
          name="description"
          placeholder="Enter the description of the course"
          value={state.course.description}
          onChange={(e) => actions.setCourseDescription(e.target.value)}
          className="w-full"
          rows={3}
          lockHeight
          required
        />
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>Minimum 25 characters required</span>
          <span
            className={`${
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
          placeholder="Enter the short description of the course"
          value={state.course.shortDescription}
          onChange={(e) => actions.setCourseShortDescription(e.target.value)}
          className="w-full"
          rows={2}
          lockHeight
          required
        />
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>Minimum 10 characters required</span>
          <span
            className={`${
              (state.course.shortDescription?.length || 0) < 10
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {state.course.shortDescription?.length || 0}/10+
          </span>
        </div>
      </div>
      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <Input
          label="Course Duration (3 months, 1 year, 2 years, etc.)"
          name="duration"
          placeholder="Enter the duration of the course"
          value={state.course.duration}
          onChange={(e) => actions.setCourseDuration(e.target.value)}
          className="w-full"
          required
        />
      </FlexBox>

      {/* Curriculum PDF Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Curriculum (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Upload a PDF document containing the course curriculum
        </p>
        <UploadMediaContainer
          title="Curriculum Document"
          description="Upload a PDF document containing the course curriculum"
          type="document"
          mediaUrl={state.course.curriculum || ""}
          mediaSource={state.course.curriculumSource}
          s3Key={state.course.curriculumS3Key}
          onFileUpload={handleCurriculumUpload}
          onFileRemove={handleCurriculumRemove}
          onUrlSubmit={(url) => {
            console.log("📄 Setting curriculum URL:", url);
            actions.setCourseCurriculum(url);
            
            if (actions.setCourseCurriculumSource) {
              actions.setCourseCurriculumSource("url");
              console.log("✅ Set curriculum source: url");
            }
            
            if (actions.setCourseCurriculumS3Key) {
              actions.setCourseCurriculumS3Key(""); // Clear S3 key for URLs
              console.log("✅ Cleared curriculum S3 key for URL");
            }
          }}
          acceptedFormats={[".pdf"]}
          maxSize={10}
          allowUrlInput={true}
          urlPlaceholder="Upload curriculum PDF or enter URL"
          folderName={curriculumFolder}
          isUploading={isUploading}
          usePresignedUrl={true}
          presignedUrlThreshold={5}
          onFileSelect={(file, folder) => {
            console.log("📄 File selected for curriculum:", {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              folder
            });
          }}
        />
      </div>
      <StepwiseNavigation
        currentStep={1}
        totalSteps={8}
        nextScreen="screen2"
        showPrevious={false}
        isNextDisabled={!isFormValid}
        setActiveScreen={setActiveScreen}
      />
    </Container>
  );
};

export default Screen1;
