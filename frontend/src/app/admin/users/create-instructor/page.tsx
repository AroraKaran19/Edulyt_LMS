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
import { UserPlus, ArrowLeft, RefreshCw, Eye, EyeOff } from "lucide-react";
import PasswordStrengthIndicator from "@/components/ui/PasswordStrengthIndicator";
import { generateSecurePassword } from "@/utils/passwordValidation";

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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<InstructorRegistrationFormData>({
    resolver: zodResolver(instructorRegistrationSchema) as any,
    mode: "onChange", // Enable real-time validation
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
  const watchedPassword = watch("password") || "";

  // Generate secure password
  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setValue("password", newPassword);
    setValue("confirmPassword", newPassword);
    toast.success("Secure password generated!");
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

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
        // Handle specific upload errors
        if (response.message?.includes('File size too large')) {
          toast.error("File size is too large. Please select a smaller image.");
        } else if (response.message?.includes('Invalid file type')) {
          toast.error("Invalid file type. Please select a valid image file.");
        } else {
          toast.error(response.message || "Failed to upload profile picture");
        }
        throw new Error(response.message || "Upload failed");
      }
    } catch (error) {
      // Only show error toast if it's not already shown above
      if (!error || !(error as Error).message?.includes('File size') && !(error as Error).message?.includes('Invalid file type')) {
        toast.error("Failed to upload profile picture. Please try again.");
      }
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
    setSubmitAttempted(true);
    
    try {
      const result = await registerInstructor(data);

      if (result.success) {
        toast.success("Instructor created successfully!");
        // Redirect to users page after a short delay to show success message
        setTimeout(() => {
          router.push("/admin/users");
        }, 1500);
      } else {
        // Handle specific error types with appropriate messages
        switch (result.error) {
          case 'VALIDATION_ERROR':
            toast.error(result.message || "Please check all required fields and try again");
            break;
          case 'DUPLICATE_EMAIL':
            toast.error(result.message || "An instructor with this email already exists");
            // Focus on email field
            const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
            if (emailInput) {
              emailInput.focus();
              emailInput.select();
            }
            break;
          case 'UNAUTHORIZED':
            toast.error(result.message || "You are not authorized to create instructors");
            // Redirect to login or admin dashboard
            setTimeout(() => {
              router.push("/admin");
            }, 2000);
            break;
          case 'NETWORK_ERROR':
            toast.error(result.message || "Network error. Please check your connection and try again");
            break;
          case 'SERVER_ERROR':
            toast.error(result.message || "Server error occurred. Please try again later");
            break;
          default:
            toast.error(result.message || "Failed to create instructor. Please try again");
        }
      }
    } catch (error) {
      console.error("Error creating instructor:", error);
      toast.error("An unexpected error occurred. Please try again");
    }
  };

  return (
    <div
      className={`min-h-screen w-full bg-gray-50 ${plusJakartaSans.className} flex flex-col z-10 relative`}
    >
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Instructor</h3>
            <p className="text-gray-600 text-sm">Please wait while we create the instructor account...</p>
          </div>
        </div>
      )}
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
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      {...register("phone")}
                      required
                      pattern="[0-9]{10}"
                      title="Please enter a 10-digit phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Enter 10 digits (e.g., 9876543210) or +91 followed by 10 digits
                    </p>
                  </div>
                  <div>
                    <Input
                      label="WhatsApp Number"
                      type="tel"
                      placeholder="Enter WhatsApp number (optional)"
                      {...register("whatsappNumber")}
                      pattern="[0-9]{10}"
                      title="Please enter a 10-digit WhatsApp number"
                    />
                    {errors.whatsappNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.whatsappNumber.message}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Optional: Enter 10 digits (e.g., 9876543210) or +91 followed by 10 digits
                    </p>
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
                  <p className="text-gray-500 text-xs mt-1">
                    Optional: Enter a valid LinkedIn profile URL
                  </p>
                </div>
              </div>

              {/* Account Security */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Account Security
                  </h2>
                  <WhiteButton
                    type="button"
                    onClick={handleGeneratePassword}
                    className="flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate Password
                  </WhiteButton>
                </div>
                
                <div className="space-y-6">
                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        {...register("password")}
                        required
                        className="pr-20"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password.message}
                      </p>
                    )}
                    <PasswordStrengthIndicator password={watchedPassword} />
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        {...register("confirmPassword")}
                        required
                        className="pr-10"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Validation Summary */}
              {submitAttempted && Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h3 className="text-red-800 font-semibold text-sm mb-2">
                        Please fix the following errors:
                      </h3>
                      <ul className="text-red-700 text-sm space-y-1">
                        {Object.entries(errors).slice(0, 3).map(([field, error]) => (
                          <li key={field} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                            <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').toLowerCase()}: {error?.message}</span>
                          </li>
                        ))}
                        {Object.keys(errors).length > 3 && (
                          <li className="text-red-600 text-xs">
                            ... and {Object.keys(errors).length - 3} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pb-8">
                <WhiteButton
                  onClick={() => router.back()}
                  className="px-6 py-3"
                  disabled={isSubmitting}
                >
                  Cancel
                </WhiteButton>
                <OrangeButton
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    "Create Instructor"
                  )}
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
