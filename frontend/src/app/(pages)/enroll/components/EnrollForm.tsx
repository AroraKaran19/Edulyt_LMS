"use client";

import React, { useState } from "react";
import Container from "@/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import DateSelector from "@/components/ui/inputs/DateSelector";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { UserCheck, Send } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const experienceOptions = [
  { value: "student-1", label: "College Student - 1st Year" },
  { value: "student-2", label: "College Student - 2nd Year" },
  { value: "student-3", label: "College Student - 3rd Year" },
  { value: "student-4", label: "College Student - 4th Year" },
  { value: "fresh-grad", label: "Fresh Graduate" },
  { value: "professional-tech", label: "Working Professional - Tech" },
  { value: "professional-non-tech", label: "Working Professional - Non-Tech" },
];

const graduationYears = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - 5 + i;
  return { value: year.toString(), label: year.toString() };
});

const EnrollForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: undefined as Date | undefined,
    gender: "",
    experience: "",
    university: "",
    degree: "",
    gradYear: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Enrollment data:", formData);
      setSubmitSuccess(true);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container
      icon={UserCheck}
      title="Enrollment Form"
      description="Please fill in your details to start your journey with us"
      className="bg-white shadow-xl rounded-3xl overflow-visible border border-gray-100"
      classNameBody="p-6 md:p-10 overflow-visible"
    >
      {submitSuccess ? (
        <div className="text-center py-10">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-8">Thank you for enrolling. Our team will contact you shortly.</p>
          <OrangeButton onClick={() => setSubmitSuccess(false)}>
            Back to Form
          </OrangeButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1 */}
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              setChange={(val) => handleInputChange("fullName", val)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              setChange={(val) => handleInputChange("email", val)}
              required
            />

            {/* Row 2 */}
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              setChange={(val) => handleInputChange("phone", val)}
              required
            />
            <DateSelector
              label="Date of Birth"
              value={formData.dob}
              onChange={(date) => handleInputChange("dob", date)}
              placeholder="Select your date of birth"
              required
            />

            {/* Row 3 */}
            <Select
              label="Gender"
              options={genderOptions}
              value={formData.gender}
              onChange={(val) => handleInputChange("gender", val)}
              placeholder="Select your gender"
              required
            />
            <Select
              label="Experience Level"
              options={experienceOptions}
              value={formData.experience}
              onChange={(val) => handleInputChange("experience", val)}
              placeholder="Select your experience level"
              required
            />

            {/* Row 4 */}
            <CollegeSelect
              label="University Name"
              value={formData.university}
              onChange={(val) => handleInputChange("university", val)}
              placeholder="Select your university name"
              required
            />
            <Input
              label="Degree / Major"
              placeholder="Enter your degree / major"
              value={formData.degree}
              setChange={(val) => handleInputChange("degree", val)}
              required
            />

            {/* Row 5 */}
            <Select
              label="Graduation Year"
              options={graduationYears}
              value={formData.gradYear}
              onChange={(val) => handleInputChange("gradYear", val)}
              placeholder="Select your graduation year"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6 flex justify-center">
            <OrangeButton
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto md:px-16 py-4 text-lg font-bold"
            >
              {isSubmitting ? "Processing..." : "Enroll Now"}
            </OrangeButton>
          </div>
        </form>
      )}
    </Container>
  );
};

export default EnrollForm;
