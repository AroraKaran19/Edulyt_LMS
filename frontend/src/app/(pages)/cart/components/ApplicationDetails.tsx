"use client";
import { OrangeButton } from "@/components/ui";
import Image from "next/image";
import React, { useState } from "react";

interface ApplicationDetailsProps {
  onNext: () => void;
}

const ApplicationDetails = ({ onNext }: ApplicationDetailsProps) => {
  const [formData, setFormData] = useState<{ [key: string]: string }>({
    fullName: "",
    email: "",
    phone: "",
    collegeName: "",
    degreeName: "",
    fatherOccupation: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (field === "phone") {
        value = value.replace(/\D/g, "").slice(0, 10);
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = () => {
    const nextErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim())
      nextErrors.fullName = "Full name is required.";
    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (formData.phone.length !== 10)
      nextErrors.phone = "Phone number must be 10 digits.";
    if (!formData.collegeName.trim())
      nextErrors.collegeName = "College name is required.";
    if (!formData.degreeName.trim())
      nextErrors.degreeName = "Degree name is required.";
    if (!formData.fatherOccupation.trim())
      nextErrors.fatherOccupation = "Father occupation is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="flex-6 bg-white rounded-3xl p-6">
      {/* Enter Your Details Section */}
      <div className="mb-6">
        <h3 className="text-xl font-normal font-coolvetica text-[#2B1508] mb-2">
          Enter Your Details
        </h3>
        <p className="text-base text-[#2B1508] font-plus-jakarta font-normal mb-8">
          To enroll you have to enter your details
        </p>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your name here"
              value={formData.fullName}
              onChange={handleChange("fullName")}
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email here"
              value={formData.email}
              onChange={handleChange("email")}
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Phone Number
            </label>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center border border-[#00000026] rounded-xl py-2 px-4">
                <Image
                  src="/india-flag.svg"
                  alt="India"
                  width={30}
                  height={30}
                />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={formData.phone}
                onChange={handleChange("phone")}
                placeholder="Enter your number here"
                className="flex-1 px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-invalid={!!errors.phone}
              />
            </div>
            {errors.phone && (
              <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      <hr className="bg-[#00000029] my-6 border-0 h-0.5" />

      {/* Enter Your Education Details Section */}
      <div className="mb-6">
        <h3 className="text-xl font-normal font-coolvetica text-[#2B1508] mb-2">
          Enter Your Education Details
        </h3>
        <p className="text-base text-[#2B1508] font-plus-jakarta font-normal mb-8">
          To enroll you have to enter your details
        </p>

        <div className="space-y-4">
          {/* College Name */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              College Name
            </label>
            <input
              type="text"
              placeholder="Enter your college name here"
              value={formData.collegeName}
              onChange={handleChange("collegeName")}
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-invalid={!!errors.collegeName}
            />
            {errors.collegeName && (
              <p className="text-red-600 text-xs mt-1">{errors.collegeName}</p>
            )}
          </div>

          {/* Degree Name */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Degree Name
            </label>
            <input
              type="email"
              placeholder="Enter your degree name here"
              value={formData.degreeName}
              onChange={handleChange("degreeName")}
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-invalid={!!errors.degreeName}
            />
            {errors.degreeName && (
              <p className="text-red-600 text-xs mt-1">{errors.degreeName}</p>
            )}
          </div>

          {/* Father Occupation */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Father Occupation
            </label>
            <input
              type="email"
              placeholder="Enter your father occupation here"
              value={formData.fatherOccupation}
              onChange={handleChange("fatherOccupation")}
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-invalid={!!errors.fatherOccupation}
            />
            {errors.fatherOccupation && (
              <p className="text-red-600 text-xs mt-1">
                {errors.fatherOccupation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Enroll Now Button */}
      <OrangeButton
        className="w-full text-base font-bold py-3 px-6 font-plus-jakarta"
        glow
        onClick={handleSubmit}
      >
        Enroll now!
      </OrangeButton>
    </div>
  );
};

export default ApplicationDetails;
