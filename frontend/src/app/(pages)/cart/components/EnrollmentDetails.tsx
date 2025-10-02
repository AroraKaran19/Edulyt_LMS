import DropDown from "@/components/ui/dropdown/DropDown";
import { OrangeButton, WhiteButton } from "@/components/ui";
import React, { useState } from "react";
import { Course } from "@/types";

const EnrollmentDetails = ({
  course,
  planType,
}: {
  course: Course;
  planType: "elite" | "essential";
}) => {
  const [formData, setFormData] = useState({
    learningFormat: "Online",
    programmingLanguages: "",
    batchNumber: "",
  });

  const [errors, setErrors] = useState({
    learningFormat: "",
    programmingLanguages: "",
    batchNumber: "",
  });

  const programmingLanguageOptions = [
    "Python",
    "JavaScript",
    "Java",
    "C++",
    "C#",
    "PHP",
    "Ruby",
    "Go",
    "Swift",
    "Kotlin",
  ];

  const batchOptions = [
    "Batch 1 (Jan 2024)",
    "Batch 2 (Feb 2024)",
    "Batch 3 (Mar 2024)",
    "Batch 4 (Apr 2024)",
    "Batch 5 (May 2024)",
    "Batch 6 (Jun 2024)",
  ];

  const validateForm = () => {
    const newErrors = {
      learningFormat: "",
      programmingLanguages: "",
      batchNumber: "",
    };

    if (
      !formData.programmingLanguages ||
      formData.programmingLanguages === "-Select a type-"
    ) {
      newErrors.programmingLanguages = "Please select programming languages";
    }

    if (!formData.batchNumber || formData.batchNumber === "-Select a type-") {
      newErrors.batchNumber = "Please select a batch number";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleEnroll = () => {
    if (validateForm()) {
      // Handle enrollment logic here
      console.log("Enrollment data:", formData);
      alert("Enrollment successful!");
    }
  };

  const isFormValid =
    formData.programmingLanguages &&
    formData.programmingLanguages !== "-Select a type-" &&
    formData.batchNumber &&
    formData.batchNumber !== "-Select a type-";

  return (
    // <div className="mb-6">
    <div className="flex-6 bg-white rounded-3xl p-6">
      <h3 className="text-xl font-normal font-coolvetica text-[#2B1508] mb-2">
        Enrollment
      </h3>
      <p className="text-base text-[#2B1508] font-plus-jakarta font-normal mb-8">
        Select your enrollment preferences.
      </p>

      <div className="space-y-4">
        {/*Learning Format */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Learning Format
          </label>
          <DropDown
            name="learningFormat"
            options={["Online"]}
            defaultValue="Online"
            value={formData.learningFormat}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                learningFormat: e.target.value,
              }));
              if (errors.learningFormat) {
                setErrors((prev) => ({ ...prev, learningFormat: "" }));
              }
            }}
            required
            disabled
          />
          {errors.learningFormat && (
            <p className="text-xs text-red-600 font-plus-jakarta mt-1">
              {errors.learningFormat}
            </p>
          )}
        </div>

        {/* Programming Languages */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Programming Languages
          </label>
          <DropDown
            name="programmingLanguages"
            options={programmingLanguageOptions}
            defaultValue="-Select a type-"
            value={formData.programmingLanguages}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                programmingLanguages: e.target.value,
              }));
              if (errors.programmingLanguages) {
                setErrors((prev) => ({ ...prev, programmingLanguages: "" }));
              }
            }}
            required
          />
          {errors.programmingLanguages && (
            <p className="text-xs text-red-600 font-plus-jakarta mt-1">
              {errors.programmingLanguages}
            </p>
          )}
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Skills
          </label>
          <div className="flex flex-wrap gap-2">
            {course?.skills?.length > 0 ? (
              course.skills.map((skill, index) => {
                return (
                  <WhiteButton key={index}>
                    <span className="font-plus-jakarta font-medium text-base leading-[173%]">
                      {skill}
                    </span>
                  </WhiteButton>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">
                No skills available for this course
              </p>
            )}
          </div>
        </div>

        {/* Batch number */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Batch number
          </label>
          <DropDown
            name="batchNumber"
            options={batchOptions}
            defaultValue="-Select a type-"
            value={formData.batchNumber}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, batchNumber: e.target.value }));
              if (errors.batchNumber) {
                setErrors((prev) => ({ ...prev, batchNumber: "" }));
              }
            }}
            required
          />
          {errors.batchNumber && (
            <p className="text-xs text-red-600 font-plus-jakarta mt-1">
              {errors.batchNumber}
            </p>
          )}
        </div>

        <div className="w-full flex justify-between mt-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-plus-jakarta font-bold text-[#2B150899]">
              Total price
            </p>
            <p className="text-xl font-plus-jakarta font-bold text-[#000000]">
              {planType === "essential"
                ? `₹${course?.plans?.essential?.price}`
                : `₹${course?.plans?.elite?.price}`}
            </p>
          </div>
          <OrangeButton
            className="text-base font-bold py-0 px-12 font-plus-jakarta"
            glow
            disabled={!isFormValid}
            onClick={handleEnroll}
          >
            Enroll now!
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentDetails;
