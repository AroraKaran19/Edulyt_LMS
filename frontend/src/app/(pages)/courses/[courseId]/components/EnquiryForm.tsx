"use client";
import React, { useState, useRef, useEffect } from "react";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import { MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Plus_Jakarta_Sans } from "next/font/google";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Course } from "@/types";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface EnquiryFormData {
  name: string;
  email: string;
  phoneNumber: string;
  fatherOccupation: string;
  experience: string;
  courseName: string;
}

const experienceOptions = [
  "College Student - 1st Year",
  "College Student - 2nd Year",
  "College Student - 3rd Year",
  "College Student - 4th Year",
  "Working Professional - Tech Domain",
  "Working Professional - Non Tech Domain",
];

// Styled Select Component matching CategoryInput design
const Select = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  className,
}: {
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const selectedValue = value || placeholder || "Select an option";

  return (
    <div
      className={cn(
        plusJakartaSans.className,
        "text-sm relative",
        "w-full",
        className
      )}
    >
      {label && (
        <label className="font-medium text-black mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Custom Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-2 py-2 text-left bg-white border border-gray-300 rounded-xl",
            "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
            "hover:border-orange-400 hover:shadow-sm",
            "transition-all duration-200 ease-in-out outline-none",
            "flex items-center justify-between",
            "shadow-sm hover:shadow-md",
            isOpen && "border-orange-500 ring-2 ring-orange-500/20"
          )}
        >
          <span
            className={cn(
              "text-xs overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left",
              !value ? "text-gray-500" : "text-black"
            )}
          >
            {selectedValue}
          </span>
          <div className="flex items-center">
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400 transition-transform duration-200" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200" />
            )}
          </div>
        </button>

        {/* Dropdown Options - Positioned absolutely with fixed height and scrollbar */}
        {isOpen && (
          <div
            className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
            style={{
              animation: "fadeIn 0.2s ease-out",
              top: "100%",
              left: 0,
            }}
          >
            <div className="py-1">
              {options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-orange-50",
                    "transition-colors duration-150 ease-in-out",
                    "focus:bg-orange-50 focus:outline-none",
                    value === option &&
                      "bg-orange-100 text-orange-700 font-medium"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden native select for form compatibility */}
      <select
        className="sr-only"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {placeholder || "Select an option"}
        </option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

const EnquiryForm = ({ course }: { course: Course }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState<EnquiryFormData>({
    name: "",
    email: "",
    phoneNumber: "",
    fatherOccupation: "",
    experience: "",
    courseName: course.title,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleInputChange = (field: keyof EnquiryFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would typically send the data to your backend
      console.log("Enquiry form submitted:", formData);

      setSubmitSuccess(true);
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        fatherOccupation: "",
        experience: "",
        courseName: course.title,
      });

      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.phoneNumber.trim() !== "" &&
      formData.fatherOccupation.trim() !== "" &&
      formData.experience !== ""
    );
  };

  return isMounted ? (
    <Container
      icon={MessageSquare}
      title="Course Enquiry Form"
      description={`Enquire about: ${course.title}`}
      className="max-w-full mx-auto"
      classNameBody="overflow-visible"
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 col-span-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Send className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">
                  Enquiry Submitted Successfully!
                </h4>
                <p className="text-sm text-green-600">
                  We&apos;ll get back to you soon with more details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Name Field */}
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          setChange={(value) => handleInputChange("name", value)}
          required
          variant="small"
        />

        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          setChange={(value) => handleInputChange("email", value)}
          required
          variant="small"
        />

        {/* Phone Number Field */}
        <Input
          label="Phone Number"
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phoneNumber}
          setChange={(value) => handleInputChange("phoneNumber", value)}
          required
          variant="small"
        />

        {/* Father's Occupation Field */}
        <Input
          label="Father's Occupation"
          placeholder="Enter your father's occupation"
          value={formData.fatherOccupation}
          setChange={(value) => handleInputChange("fatherOccupation", value)}
          required
          variant="small"
        />

        {/* Experience Dropdown */}
        <Select
          label="Experience Level"
          options={experienceOptions}
          value={formData.experience}
          onChange={(value) => handleInputChange("experience", value)}
          placeholder="Select your experience level"
          required
        />

        {/* Submit Button */}
        <div className="pt-2 md:!pt-6 xl:pt-2">
          <OrangeButton
            disabled={!isFormValid() || isSubmitting}
            className="w-full xl:mt-4 flex items-center justify-center gap-2"
            variant="small"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Enquiry
              </>
            )}
          </OrangeButton>
        </div>
      </form>
    </Container>
  ) : null;
};

export default EnquiryForm;
