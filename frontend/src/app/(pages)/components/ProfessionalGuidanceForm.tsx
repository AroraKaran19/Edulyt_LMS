"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MessageSquare, Send } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";

const ProfessionalGuidanceForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    fatherOccupation: "",
    experienceLevel: "",
  });

  const experienceOptions = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-8 lg:mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Professional Guidance Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#F77124] p-3 rounded-xl">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Need Professional Guidance?
            </h2>
            <p className="text-gray-600 text-sm">
              Fill and our expert will help you!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              setChange={(value) => handleInputChange("fullName", value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              setChange={(value) => handleInputChange("email", value)}
              required
            />
          </div>
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enetr your phone number"
            value={formData.phone}
            setChange={(value) => handleInputChange("phone", value)}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Father's Occupation"
              placeholder="Enter your Father's occup"
              value={formData.fatherOccupation}
              setChange={(value) =>
                handleInputChange("fatherOccupation", value)
              }
            />
            <Select
              label="Experience Level"
              placeholder="Select your exp level"
              options={experienceOptions}
              value={formData.experienceLevel}
              onChange={(value) => handleInputChange("experienceLevel", value)}
            />
          </div>
          <OrangeButton
            type="submit"
            className="w-full py-4 text-lg font-semibold mt-6"
          >
            <Send className="w-5 h-5 mr-2 inline" />
            Sumbit Enquiry
          </OrangeButton>
        </form>
        </div>

        {/* Professional Image */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative h-full min-h-[400px]">
            <Image
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80"
              alt="Professional guidance"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalGuidanceForm;

