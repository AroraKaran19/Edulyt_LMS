"use client";
import React, { useState, useRef, useEffect } from "react";
import Container from "@/components/ui/Container";
import { Send, ChevronDown, ChevronUp } from "lucide-react";
import { BiChat } from "react-icons/bi";
import { cn } from "@/lib/utils";
import { Plus_Jakarta_Sans } from "next/font/google";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Internship, Student } from "@/types";
import useAuth from "@/hooks/useAuth";
import { toast } from "react-toastify";
import Image from "next/image";
import IndianFlagIcon from "../../../../../../public/icons/IndiaFlag";

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

const formTextInputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15";

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
        className,
      )}
    >
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-neutral-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Custom Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm outline-none transition-colors",
            "hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15",
            isOpen && "border-orange-500 ring-2 ring-orange-500/15",
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left",
              !value ? "text-neutral-400" : "text-neutral-900",
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
            className="absolute z-9999 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
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
                      "bg-orange-100 text-orange-700 font-medium",
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

const EnquirySection = ({ internship }: { internship: Internship }) => {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<EnquiryFormData>({
    name: isAuthenticated
      ? user?.firstName
        ? `${user?.firstName} ${user?.lastName}`
        : (user as any).name || ""
      : "",
    email: isAuthenticated ? user?.email || "" : "",
    phoneNumber: isAuthenticated ? user?.phone || "" : "",
    fatherOccupation: isAuthenticated
      ? (user as Student).fatherOccupation || ""
      : "",
    experience: isAuthenticated ? (user as Student).experienceLevel || "" : "",
    courseName: internship.title,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
      toast.success("Your enquiry has been sent. We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        fatherOccupation: "",
        experience: "",
        courseName: internship.title,
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

  return (
    <section
      id="enquiry"
      className="w-full bg-linear-to-b from-primary/2 via-primary/4 to-secondary/15"
    >
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 py-10 lg:py-18 px-6">
        <Container
          icon={BiChat}
          title="Need Professional Guidance?"
          description="Fill it and our expert will help you!"
          className="max-w-full mx-auto col-span-1 lg:col-span-3"
          classNameBody="overflow-visible"
        >
          <form
            onSubmit={handleSubmit}
            className={cn(
              plusJakartaSans.className,
              "grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-3",
            )}
          >
            {/* Success Message */}
            {submitSuccess && (
              <div className="col-span-full rounded-lg border border-green-200 bg-green-50 p-4">
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
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-neutral-900">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                className={formTextInputClass}
              />
            </div>

            {/* Email Field */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-neutral-900">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className={formTextInputClass}
              />
            </div>

            {/* Phone — single unified control (flag + number) */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-neutral-900">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div
                className={cn(
                  "flex w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-colors",
                  "hover:border-gray-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15",
                )}
              >
                <div
                  className="flex shrink-0 items-stretch border-r border-gray-200 bg-neutral-50"
                  aria-hidden
                >
                  <span className="flex items-center px-2.5">
                    <IndianFlagIcon className="h-5 w-5 shrink-0 rounded-[2px]" />
                  </span>
                </div>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  required
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Father's Occupation Field */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-neutral-900">
                Father&apos;s Occupation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="Enter your father's occupation"
                value={formData.fatherOccupation}
                onChange={(e) =>
                  handleInputChange("fatherOccupation", e.target.value)
                }
                required
                className={formTextInputClass}
              />
            </div>

            {/* Experience Dropdown */}
            <Select
              label="Experience Level"
              options={experienceOptions}
              value={formData.experience}
              onChange={(value) => handleInputChange("experience", value)}
              placeholder="Select your experience level"
              required
            />

            {/* Submit Button — spacer label aligns row with other fields */}
            <div className="flex min-w-0 flex-col justify-end">
              <span
                className="mb-1.5 hidden select-none text-sm font-medium text-transparent md:block"
                aria-hidden
              >
                .
              </span>
              <OrangeButton
                type="submit"
                glow={false}
                disabled={!isFormValid() || isSubmitting}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-none"
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
        <div className="w-full rounded-2xl col-span-1 lg:col-span-2">
          <Image
            src={internship.enquiryImage || "/internship/dummy.jpg"}
            alt="Enquiry Section Background"
            width={1000}
            height={1000}
            className="object-cover aspect-square max-h-[300px] select-none pointer-events-none rounded-2xl"
            draggable={false}
            loading="lazy"
            unoptimized
            quality={100}
          />
        </div>
      </div>
    </section>
  );
};

export default EnquirySection;
