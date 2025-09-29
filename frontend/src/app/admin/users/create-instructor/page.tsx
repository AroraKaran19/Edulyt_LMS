"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import { useInstructorAuth } from "@/hooks/useInstructorAuth";
import {
  instructorRegistrationSchema,
  InstructorRegistrationFormData,
} from "@/types/instructorForm";
import { Plus_Jakarta_Sans } from "next/font/google";
import { UserPlus, ArrowLeft } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const CreateInstructorPage = () => {
  const router = useRouter();
  const { uploadFile } = useUpload();
  const { registerInstructor } = useInstructorAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [experienceInput, setExperienceInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InstructorRegistrationFormData>({
    resolver: zodResolver(instructorRegistrationSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      whatsappNumber: "",
      password: "",
      confirmPassword: "",
      profilePicture: "",
      bio: "",
      currentPosition: "",
      currentCompany: "",
      previousExperience: [],
      address: {
        address: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },
      linkedinUrl: "",
    },
  });

  const watchedPreviousExperience = watch("previousExperience") || [];

  const handleAddExperience = () => {
    if (experienceInput.trim()) {
      const currentExperience = watchedPreviousExperience;
      setValue("previousExperience", [
        ...currentExperience,
        experienceInput.trim(),
      ]);
      setExperienceInput("");
    }
  };

  const handleRemoveExperience = (index: number) => {
    const currentExperience = watchedPreviousExperience;
    setValue(
      "previousExperience",
      currentExperience.filter((_, i) => i !== index)
    );
  };

  const handleProfilePictureUpload = async (file: File, folderName: string) => {
    setIsUploading(true);
    try {
      const response = await uploadFile(file, folderName);
      if (response.success && response.data) {
        const url = response.data.url;
        setProfilePictureUrl(url);
        setValue("profilePicture", url);
        toast.success("Profile picture uploaded successfully");
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (error) {
      toast.error("Failed to upload profile picture");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfilePictureRemove = () => {
    setProfilePictureUrl("");
    setValue("profilePicture", "");
  };

  const onSubmit = async (data: InstructorRegistrationFormData) => {
    try {
      const result = await registerInstructor(data);

      if (result.success) {
        toast.success("Instructor created successfully!");
        router.push("/admin/users");
      } else {
        toast.error(result.message || "Failed to create instructor");
      }
    } catch (error) {
      console.error("Error creating instructor:", error);
      toast.error("Failed to create instructor");
    }
  };

  return (
    <div
      className={`min-h-screen w-full bg-gray-50 ${plusJakartaSans.className} flex flex-col z-10`}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 w-full sticky top-0 z-10 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <UserPlus className="w-8 h-8 text-orange-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Create Instructor
              </h1>
            </div>
            <WhiteButton
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </WhiteButton>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Form */}
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSubmit(onSubmit as any)}
              className="space-y-8"
            >
              {/* Basic Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="First Name"
                      placeholder="Enter first name"
                      {...register("firstName")}
                      required
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Last Name"
                      placeholder="Enter last name"
                      {...register("lastName")}
                      required
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="Enter email address"
                      {...register("email")}
                      required
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Phone Number"
                      placeholder="Enter phone number"
                      {...register("phone")}
                      required
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="WhatsApp Number"
                      placeholder="Enter WhatsApp number"
                      {...register("whatsappNumber")}
                    />
                    {errors.whatsappNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.whatsappNumber.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Picture */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Profile Picture
                </h2>
                <UploadMediaContainer
                  title="Upload Profile Picture"
                  description="Upload a professional profile picture for the instructor"
                  type="image"
                  mediaUrl={profilePictureUrl}
                  mediaSource="upload"
                  folderName="instructor-profiles"
                  onFileSelect={handleProfilePictureUpload}
                  onFileRemove={handleProfilePictureRemove}
                  isUploading={isUploading}
                  maxSize={5}
                  acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
                />
              </div>

              {/* Professional Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Professional Information
                </h2>
                <div className="space-y-6">
                  <div>
                    <TextArea
                      label="Bio"
                      placeholder="Tell us about the instructor's background and expertise"
                      {...register("bio")}
                      required
                      rows={4}
                      maxLength={500}
                      showWordCount
                    />
                    {errors.bio && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Current Position"
                        placeholder="e.g., Senior Software Engineer"
                        {...register("currentPosition")}
                        required
                      />
                      {errors.currentPosition && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.currentPosition.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        label="Current Company"
                        placeholder="e.g., Google, Microsoft"
                        {...register("currentCompany")}
                        required
                      />
                      {errors.currentCompany && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.currentCompany.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Previous Experience */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Previous Experience
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add previous experience"
                      value={experienceInput}
                      setChange={setExperienceInput}
                      className="flex-1"
                    />
                    <OrangeButton
                      type="button"
                      onClick={handleAddExperience}
                      disabled={!experienceInput.trim()}
                      variant="small"
                    >
                      Add
                    </OrangeButton>
                  </div>
                  {watchedPreviousExperience.length > 0 && (
                    <div className="space-y-2">
                      {watchedPreviousExperience.map((exp, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">{exp}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Address"
                      placeholder="Enter address"
                      {...register("address.address")}
                    />
                    {errors.address?.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address.address.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="City"
                      placeholder="Enter city"
                      {...register("address.city")}
                    />
                    {errors.address?.city && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="State"
                      placeholder="Enter state"
                      {...register("address.state")}
                    />
                    {errors.address?.state && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address.state.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Pincode"
                      placeholder="Enter pincode"
                      {...register("address.pincode")}
                    />
                    {errors.address?.pincode && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address.pincode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* LinkedIn Profile */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  LinkedIn Profile
                </h2>
                <div className="max-w-md">
                  <Input
                    label="LinkedIn URL"
                    placeholder="https://linkedin.com/in/username"
                    {...register("linkedinUrl")}
                  />
                  {errors.linkedinUrl && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.linkedinUrl.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Security */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Account Security
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Enter password"
                      {...register("password")}
                      required
                      minLength={6}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Confirm password"
                      {...register("confirmPassword")}
                      required
                      minLength={6}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pb-8">
                <WhiteButton
                  onClick={() => router.back()}
                  className="px-6 py-3"
                >
                  Cancel
                </WhiteButton>
                <OrangeButton
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3"
                >
                  {isSubmitting ? "Creating..." : "Create Instructor"}
                </OrangeButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInstructorPage;
