"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { User, MapPin, Briefcase, GraduationCap } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Input from "@/components/ui/inputs/Input";
import apiClient from "@/configs/apiConfig";

interface ProfileData {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  dob?: string;
  profilePicture?: string;
  address?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  // Student specific fields
  collegeName?: string;
  passingYear?: number;
  areaOfInterest?: string;
  studentCurrentPosition?: string;
  studentCurrentCompany?: string;
  domain?: string;
  portfolio?: string;
  // Instructor specific fields
  bio?: string;
  instructorCurrentPosition?: string;
  instructorCurrentCompany?: string;
  linkedinUrl?: string;
}

const ProfilePage = () => {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileData, setProfileData] = useState<ProfileData>({
    email: "",
  });

  const user = session?.user as any;

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
    if (!phone || phone.trim() === "") return { isValid: true };
    
    // Remove ALL non-digit characters except + at the beginning
    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    
    // Check if it starts with +91
    if (!cleanedPhone.startsWith('+91')) {
      return { isValid: false, error: "Phone number must start with +91" };
    }
    
    // Check if it has 10-12 digits after +91
    const digitsAfterCountryCode = cleanedPhone.slice(3); // Remove +91
    
    if (digitsAfterCountryCode.length < 10 || digitsAfterCountryCode.length > 12) {
      return { isValid: false, error: `Phone number must have 10-12 digits after +91 (currently has ${digitsAfterCountryCode.length})` };
    }
    
    // Check if all characters after +91 are digits
    if (!/^[0-9]{10,12}$/.test(digitsAfterCountryCode)) {
      return { isValid: false, error: "Phone number must contain only digits after +91" };
    }
    
    return { isValid: true };
  };

  const validateURL = (url: string): boolean => {
    if (!url) return true; // Allow empty URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateLinkedInURL = (url: string): boolean => {
    if (!url) return true; // Allow empty URLs
    // Match backend validation exactly
    return /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(url);
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters except + at the beginning
    const cleanedValue = value.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +91, add it
    if (!cleanedValue.startsWith('+91')) {
      const digitsOnly = cleanedValue.replace(/[^\d]/g, '');
      const limitedDigits = digitsOnly.slice(0, 12); // Allow up to 12 digits
      return `+91${limitedDigits}`;
    }
    
    // If it starts with +91, keep it and limit to 12 digits after +91
    const digitsAfterCountryCode = cleanedValue.slice(3); // Remove +91
    const limitedDigits = digitsAfterCountryCode.slice(0, 12); // Allow up to 12 digits
    
    return `+91${limitedDigits}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (profileData.email && !validateEmail(profileData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone number validation
    if (profileData.phone) {
      const phoneValidation = validatePhoneNumber(profileData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error || "Phone number must be +91 followed by 10 digits";
      }
    }

    // WhatsApp number validation
    if (profileData.whatsappNumber) {
      const whatsappValidation = validatePhoneNumber(profileData.whatsappNumber);
      if (!whatsappValidation.isValid) {
        newErrors.whatsappNumber = whatsappValidation.error || "WhatsApp number must be +91 followed by 10 digits";
      }
    }

    // Portfolio URL validation
    if (profileData.portfolio && !validateURL(profileData.portfolio)) {
      newErrors.portfolio = "Please enter a valid URL";
    }

    // LinkedIn URL validation
    if (
      profileData.linkedinUrl &&
      !validateLinkedInURL(profileData.linkedinUrl)
    ) {
      newErrors.linkedinUrl = "Please enter a valid LinkedIn profile URL";
    }

    // Passing year validation
    if (profileData.passingYear) {
      const currentYear = new Date().getFullYear();
      if (
        profileData.passingYear < 1900 ||
        profileData.passingYear > currentYear + 10
      ) {
        newErrors.passingYear = `Passing year must be between 1900 and ${
          currentYear + 10
        }`;
      }
    }

    // Date of birth validation
    if (profileData.dob) {
      const dob = new Date(profileData.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      if (dob > today) {
        newErrors.dob = "Date of birth cannot be in the future";
      } else if (age < 13) {
        newErrors.dob = "You must be at least 13 years old";
      } else if (age > 120) {
        newErrors.dob = "Please enter a valid date of birth";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch user profile data from API
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setFetchingProfile(false);
        return;
      }

      try {
        setFetchingProfile(true);
        const response = await apiClient.get("/users/profile");
        
        if (response.data.success) {
          const userData = response.data.data;
          setProfileData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            whatsappNumber: userData.whatsappNumber || "",
            dob: userData.dob ? new Date(userData.dob).toISOString().split("T")[0] : "",
            profilePicture: userData.profilePicture || "",
            address: userData.address || {},
            collegeName: userData.collegeName || "",
            passingYear: userData.passingYear || "",
            areaOfInterest: userData.areaOfInterest || "",
            studentCurrentPosition: userData.currentPosition || "",
            studentCurrentCompany: userData.currentCompany || "",
            domain: userData.domain || "",
            portfolio: userData.portfolio || "",
            bio: userData.bio || "",
            instructorCurrentPosition: userData.currentPosition || "",
            instructorCurrentCompany: userData.currentCompany || "",
            linkedinUrl: userData.linkedinUrl || "",
          });
        }
      } catch (error: any) {
        console.error("Failed to fetch profile data:", error);
        toast.error("Failed to load profile data");
        // Fallback to session data if API fails
        if (user) {
          setProfileData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            whatsappNumber: user.whatsappNumber || "",
            dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
            profilePicture: user.profilePicture || "",
            address: user.address || {},
            collegeName: user.collegeName || "",
            passingYear: user.passingYear || "",
            areaOfInterest: user.areaOfInterest || "",
            studentCurrentPosition: user.currentPosition || "",
            studentCurrentCompany: user.currentCompany || "",
            domain: user.domain || "",
            portfolio: user.portfolio || "",
            bio: user.bio || "",
            instructorCurrentPosition: user.currentPosition || "",
            instructorCurrentCompany: user.currentCompany || "",
            linkedinUrl: user.linkedinUrl || "",
          });
        }
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Format phone numbers using the new logic
    let processedValue = value;
    if ((field === "phone" || field === "whatsappNumber") && value) {
      processedValue = formatPhoneNumber(value);
    }

    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setProfileData((prev) => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof ProfileData] as any) || {}),
          [child]: processedValue,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [field]: processedValue,
      }));
    }

    // Real-time validation for specific fields
    if (field === "phone" && processedValue) {
      const phoneValidation = validatePhoneNumber(processedValue);
      if (!phoneValidation.isValid) {
        setErrors((prev) => ({
          ...prev,
          phone: phoneValidation.error || "Phone number must be +91 followed by 10-12 digits",
        }));
      }
    } else if (field === "whatsappNumber" && processedValue) {
      const whatsappValidation = validatePhoneNumber(processedValue);
      if (!whatsappValidation.isValid) {
        setErrors((prev) => ({
          ...prev,
          whatsappNumber: whatsappValidation.error || "WhatsApp number must be +91 followed by 10-12 digits",
        }));
      }
    } else if (field === "portfolio" && processedValue) {
      if (!validateURL(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          portfolio: "Please enter a valid URL",
        }));
      }
    } else if (field === "linkedinUrl" && processedValue) {
      if (!validateLinkedInURL(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          linkedinUrl: "Please enter a valid LinkedIn profile URL",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      setLoading(true);

      // Prepare data for backend - convert string dates to Date objects
      const submitData = {
        ...profileData,
        dob: profileData.dob ? new Date(profileData.dob) : undefined,
      };

      const response = await apiClient.put("/users/profile", submitData);

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        // Update the session with fresh data from API response
        await update({
          ...session,
          user: {
            ...user,
            ...response.data.data,
          },
        });
        // Also update local state with the fresh data
        setProfileData(prev => ({
          ...prev,
          ...response.data.data,
          dob: response.data.data.dob ? new Date(response.data.data.dob).toISOString().split("T")[0] : prev.dob,
        }));
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || "Failed to update profile";
      toast.error(errorMessage);
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserTypeSpecificFields = () => {
    switch (user?.userType) {
      case "student":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="College Name"
                type="text"
                value={profileData.collegeName || ""}
                onChange={(e) =>
                  handleInputChange("collegeName", e.target.value)
                }
                placeholder="Enter your college name"
              />
              <div>
                <Input
                  label="Passing Year"
                  type="number"
                  value={profileData.passingYear || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "passingYear",
                      parseInt(e.target.value) || ""
                    )
                  }
                  placeholder="e.g., 2024"
                  min="1900"
                  max={new Date().getFullYear() + 10}
                  className={errors.passingYear ? "border-red-500" : ""}
                />
                {errors.passingYear && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.passingYear}
                  </p>
                )}
              </div>
              <Input
                label="Area of Interest"
                type="text"
                value={profileData.areaOfInterest || ""}
                onChange={(e) =>
                  handleInputChange("areaOfInterest", e.target.value)
                }
                placeholder="e.g., Software Development"
              />
              <Input
                label="Domain"
                type="text"
                value={profileData.domain || ""}
                onChange={(e) => handleInputChange("domain", e.target.value)}
                placeholder="e.g., Technology"
              />
              <Input
                label="Current Position"
                type="text"
                value={profileData.studentCurrentPosition || ""}
                onChange={(e) =>
                  handleInputChange("studentCurrentPosition", e.target.value)
                }
                placeholder="e.g., Software Engineer"
              />
              <Input
                label="Current Company"
                type="text"
                value={profileData.studentCurrentCompany || ""}
                onChange={(e) =>
                  handleInputChange("studentCurrentCompany", e.target.value)
                }
                placeholder="e.g., Tech Corp"
              />
              <div>
                <Input
                  label="Portfolio URL"
                  type="url"
                  value={profileData.portfolio || ""}
                  onChange={(e) =>
                    handleInputChange("portfolio", e.target.value)
                  }
                  placeholder="https://yourportfolio.com"
                  className={errors.portfolio ? "border-red-500" : ""}
                />
                {errors.portfolio && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.portfolio}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "instructor":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Instructor Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={4}
                  value={profileData.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <Input
                label="Current Position"
                type="text"
                value={profileData.instructorCurrentPosition || ""}
                onChange={(e) =>
                  handleInputChange("instructorCurrentPosition", e.target.value)
                }
                placeholder="e.g., Senior Developer"
              />
              <Input
                label="Current Company"
                type="text"
                value={profileData.instructorCurrentCompany || ""}
                onChange={(e) =>
                  handleInputChange("instructorCurrentCompany", e.target.value)
                }
                placeholder="e.g., Tech Corp"
              />
              <div>
                <Input
                  label="LinkedIn URL"
                  type="url"
                  value={profileData.linkedinUrl || ""}
                  onChange={(e) =>
                    handleInputChange("linkedinUrl", e.target.value)
                  }
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={errors.linkedinUrl ? "border-red-500" : ""}
                />
                {errors.linkedinUrl && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.linkedinUrl}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user || fetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">
            Please wait while we load your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-8">
            <div className="flex items-center gap-3 mb-8">
              <User className="w-8 h-8 text-orange-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Profile Settings
                </h1>
                <p className="text-gray-600">
                  Manage your account information and preferences
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    type="text"
                    value={profileData.firstName || ""}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter your first name"
                  />
                  <Input
                    label="Last Name"
                    type="text"
                    value={profileData.lastName || ""}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter your last name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                    disabled
                    className="bg-gray-50"
                  />
                  <div>
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={
                        profileData.phone
                          ? formatPhoneNumber(profileData.phone)
                          : ""
                      }
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="+91 98765 43210"
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="WhatsApp Number"
                      type="tel"
                      value={
                        profileData.whatsappNumber
                          ? formatPhoneNumber(profileData.whatsappNumber)
                          : ""
                      }
                      onChange={(e) =>
                        handleInputChange("whatsappNumber", e.target.value)
                      }
                      placeholder="+91 98765 43210"
                      className={errors.whatsappNumber ? "border-red-500" : ""}
                    />
                    {errors.whatsappNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.whatsappNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={profileData.dob || ""}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className={errors.dob ? "border-red-500" : ""}
                    />
                    {errors.dob && (
                      <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      type="text"
                      value={profileData.address?.address || ""}
                      onChange={(e) =>
                        handleInputChange("address.address", e.target.value)
                      }
                      placeholder="Enter your address"
                    />
                  </div>
                  <Input
                    label="City"
                    type="text"
                    value={profileData.address?.city || ""}
                    onChange={(e) =>
                      handleInputChange("address.city", e.target.value)
                    }
                    placeholder="Enter your city"
                  />
                  <Input
                    label="State"
                    type="text"
                    value={profileData.address?.state || ""}
                    onChange={(e) =>
                      handleInputChange("address.state", e.target.value)
                    }
                    placeholder="Enter your state"
                  />
                  <Input
                    label="Country"
                    type="text"
                    value={profileData.address?.country || ""}
                    onChange={(e) =>
                      handleInputChange("address.country", e.target.value)
                    }
                    placeholder="Enter your country"
                  />
                  <Input
                    label="Pincode"
                    type="text"
                    value={profileData.address?.pincode || ""}
                    onChange={(e) =>
                      handleInputChange("address.pincode", e.target.value)
                    }
                    placeholder="Enter your pincode"
                  />
                </div>
              </div>

              {/* User Type Specific Fields */}
              {renderUserTypeSpecificFields()}

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <OrangeButton
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </OrangeButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
