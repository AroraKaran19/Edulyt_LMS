"use client";
import apiClient from "@/configs/apiConfig";
import { useEffect, useState } from "react";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import DateSelector from "@/components/ui/inputs/DateSelector";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import { useUpload } from "@/hooks/useUpload";
import {
  Camera,
  ChevronLeftIcon,
  Plus,
  X,
  Briefcase,
  Save,
  Edit3,
  Check,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Student, Instructor, Collaborator } from "@/types/user";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import ImageComponent from "@/components/ui/ImageComponent";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

type ExtendedUser = User &
  Partial<Student> &
  Partial<Instructor> &
  Partial<Collaborator>;

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState<Partial<ExtendedUser>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedExperiences, setSavedExperiences] = useState<number[]>([]);
  const [existingExperiences, setExistingExperiences] = useState<number[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Profile image upload states
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [profileImageS3Key, setProfileImageS3Key] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isExternalImage, setIsExternalImage] = useState(false);

  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { uploadFile, deleteFile, validateImageFile } = useUpload();

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get("/users/me");
      if (response.data?.data) {
        // The actual user data is nested inside response.data.data
        const userData = response.data.data;

        // Initialize form data with user data, ensuring all fields are properly set
        setFormData({
          ...userData,
          // Ensure address object exists
          address: userData.address || {
            address: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
          },
          // Convert date string back to Date object for DateSelector
          dob: userData.dob ? new Date(userData.dob) : undefined,
          // Ensure experience array exists and convert date strings to Date objects
          experience:
            userData.experience?.map((exp: any) => ({
              ...exp,
              duration: {
                from: exp.duration?.from
                  ? new Date(exp.duration.from)
                  : new Date(),
                to: exp.duration?.to ? new Date(exp.duration.to) : new Date(),
              },
            })) || [],
        });

        // Mark existing experiences as saved by default
        if (userData.experience && userData.experience.length > 0) {
          const existingExperienceIndices = userData.experience.map(
            (_: any, index: number) => index
          );
          setSavedExperiences(existingExperienceIndices);
          setExistingExperiences(existingExperienceIndices);
        }

        // Set profile image if available
        if (userData.profilePicture) {
          setProfileImageUrl(userData.profilePicture);

          // Check if image is from S3 or external (Google/LinkedIn)
          const imageUrl = userData.profilePicture;
          const isS3Url =
            imageUrl.includes(".s3.") || imageUrl.includes("s3.amazonaws.com");

          if (isS3Url) {
            // Extract S3 key from URL
            try {
              const url = new URL(imageUrl);
              const pathParts = url.pathname.split("/").filter((p) => p);
              if (pathParts.length >= 2) {
                // Remove bucket name if it's the first part, then get folder/filename
                const key = pathParts.slice(1).join("/");
                setProfileImageS3Key(key);
              } else if (pathParts.length === 1) {
                setProfileImageS3Key(pathParts[0]);
              } else {
                // Try to extract from string pattern
                const match = imageUrl.match(/profile-images\/[^?]+/);
                if (match) {
                  setProfileImageS3Key(match[0]);
                }
              }
            } catch {
              // If URL parsing fails, try to extract from string
              const match = imageUrl.match(/profile-images\/[^?]+/);
              if (match) {
                setProfileImageS3Key(match[0]);
              }
            }
            setIsExternalImage(false);
          } else {
            // External image (Google/LinkedIn) - don't allow changes
            setIsExternalImage(true);
            setProfileImageS3Key("");
          }
        } else {
          setIsExternalImage(false);
          setProfileImageS3Key("");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle phone number input filtering
  const handlePhoneInput = (field: string, inputValue: string) => {
    // Only allow digits and + symbol
    const filteredValue = inputValue.replace(/[^\d+]/g, "");

    let formattedValue = "";

    if (filteredValue.length === 0) {
      formattedValue = "";
    } else if (filteredValue.startsWith("+91")) {
      // Extract digits after +91
      const digits = filteredValue.slice(3).replace(/\D/g, "");
      // Limit to 12 digits after +91
      formattedValue = "+91" + digits.slice(0, 12);
    } else if (filteredValue.startsWith("+")) {
      // Handle cases like +9, +919, etc.
      const afterPlus = filteredValue.slice(1);
      if (afterPlus.startsWith("91")) {
        const digits = afterPlus.slice(2).replace(/\D/g, "");
        formattedValue = "+91" + digits.slice(0, 12);
      } else if (afterPlus.startsWith("9")) {
        // User typed +9, assume they want +91
        const digits = afterPlus.slice(1).replace(/\D/g, "");
        formattedValue = "+91" + digits.slice(0, 12);
      } else {
        formattedValue = "+91";
      }
    } else {
      // No + at start, add +91 prefix
      const digits = filteredValue.replace(/\D/g, "");
      formattedValue = "+91" + digits.slice(0, 12);
    }

    return formattedValue;
  };

  const handleInputChange = (
    field: string,
    value: string | number | Date | undefined
  ) => {
    // Handle phone number input restrictions
    if (
      (field === "phone" || field === "whatsappNumber") &&
      typeof value === "string"
    ) {
      value = handlePhoneInput(field, value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));

    // Clear error for address field
    const addressField = `address.${field}`;
    if (errors[addressField]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[addressField];
        return newErrors;
      });
    }
  };

  const handleExperienceChange = (
    index: number,
    field: string,
    value: string | Date
  ) => {
    setFormData((prev) => {
      const experiences = prev.experience || [];
      const updatedExperiences = [...experiences];

      if (field === "from" || field === "to") {
        updatedExperiences[index] = {
          ...updatedExperiences[index],
          duration: {
            ...updatedExperiences[index]?.duration,
            [field]: value as Date,
          },
        };
      } else {
        updatedExperiences[index] = {
          ...updatedExperiences[index],
          [field]: value as string,
        };
      }

      return {
        ...prev,
        experience: updatedExperiences,
      };
    });
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          companyName: "",
          position: "",
          duration: {
            from: new Date(),
            to: new Date(),
          },
          description: "",
        },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience?.filter((_, i) => i !== index) || [],
    }));
    // Remove from saved experiences and adjust indices
    setSavedExperiences((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
    // Also remove from existing experiences and adjust indices
    setExistingExperiences((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
  };

  const saveExperience = (index: number) => {
    const experience = formData.experience?.[index];
    if (!experience?.companyName || !experience?.position) {
      toast.error("Please fill in company name and position before saving");
      return;
    }
    setSavedExperiences((prev) => [...prev, index]);
    toast.success(
      "Experience saved! It will be included when you save your profile."
    );
  };

  const editExperience = (index: number) => {
    setSavedExperiences((prev) => prev.filter((i) => i !== index));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters long";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setUpdatingPassword(true);

    try {
      const response = await apiClient.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data) {
        toast.success("Password updated successfully!");
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
      }
    } catch (error: any) {
      console.error("Error updating password:", error);

      if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update password. Please try again.");
      }

      // Handle specific password errors
      if (error.response?.status === 400) {
        if (error.response.data.message?.includes("current password")) {
          setPasswordErrors({
            currentPassword: "Current password is incorrect",
          });
        }
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  // Handle profile image upload
  const handleImageUpload = async (file: File) => {
    // Don't allow upload if current image is from external source (Google/LinkedIn)
    if (isExternalImage) {
      toast.error(
        "Cannot change profile picture. Your account is connected to Google or LinkedIn."
      );
      return;
    }

    // Validate image file
    const validation = validateImageFile(file, 5 * 1024 * 1024); // 5MB max
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image file");
      return;
    }

    setIsUploadingImage(true);

    try {
      // Delete old image from S3 if exists and is S3 image
      if (profileImageS3Key && !isExternalImage) {
        await deleteFile(profileImageS3Key);
      }

      // Upload new image
      const result = await uploadFile(file, "profile-images");

      if (result.success && result.data) {
        setProfileImageUrl(result.data.url);
        setProfileImageS3Key(result.data.s3Key);
        setIsExternalImage(false); // New image is from S3

        // Update user profile with new image
        const updateData = {
          profilePicture: result.data.url,
        };

        await apiClient.put("/users/me", updateData);

        // Update session with new profile picture
        if (updateSession) {
          await updateSession({
            profilePicture: result.data.url,
          });
        }

        toast.success("Profile image updated successfully!");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle image removal
  const handleImageRemove = async () => {
    // Don't allow removal if image is from external source (Google/LinkedIn)
    if (isExternalImage) {
      toast.error(
        "Cannot remove profile picture. Your account is connected to Google or LinkedIn."
      );
      return;
    }

    // Only allow removal if we have an S3 key
    if (!profileImageS3Key) {
      toast.error("Cannot remove image. No S3 key found.");
      return;
    }

    setIsUploadingImage(true);

    try {
      // Delete from S3
      const deleteResult = await deleteFile(profileImageS3Key);

      if (!deleteResult.success) {
        toast.error(
          deleteResult.error || "Failed to delete image from storage"
        );
        return;
      }

      // Update user profile to remove image
      const updateData = {
        profilePicture: "",
      };

      await apiClient.put("/users/me", updateData);

      // Update session to remove profile picture
      if (updateSession) {
        await updateSession({
          profilePicture: "",
        });
      }

      setProfileImageUrl("");
      setProfileImageS3Key("");
      setIsExternalImage(false);
      toast.success("Profile image removed successfully!");
    } catch (error: any) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    const linkedinRegex =
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
  };

  const validatePortfolioUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(url);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // WhatsApp validation
    if (formData.whatsappNumber && !validatePhone(formData.whatsappNumber)) {
      newErrors.whatsappNumber = "Please enter a valid WhatsApp number";
    }

    // User type specific validations
    if (formData.userType === "instructor") {
      if (formData.linkedinUrl && !validateLinkedInUrl(formData.linkedinUrl)) {
        newErrors.linkedinUrl =
          "Please enter a valid LinkedIn URL (https://linkedin.com/in/your-profile)";
      }
    }

    if (formData.userType === "student") {
      if (formData.portfolio && !validatePortfolioUrl(formData.portfolio)) {
        newErrors.portfolio = "Please enter a valid portfolio URL";
      }

      if (formData.passingYear) {
        const currentYear = new Date().getFullYear();
        if (
          formData.passingYear < 1900 ||
          formData.passingYear > currentYear + 10
        ) {
          newErrors.passingYear = `Passing year must be between 1900 and ${
            currentYear + 10
          }`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    setUpdating(true);

    try {
      // Prepare data for API
      const updateData = { ...formData };

      // Convert date to ISO string if it exists
      if (updateData.dob && updateData.dob instanceof Date) {
        updateData.dob = updateData.dob.toISOString() as any;
      }

      // Convert experience dates to ISO strings
      if (updateData.experience) {
        updateData.experience = updateData.experience.map((exp) => ({
          ...exp,
          duration: {
            from:
              exp.duration?.from instanceof Date
                ? exp.duration.from.toISOString()
                : exp.duration?.from,
            to:
              exp.duration?.to instanceof Date
                ? exp.duration.to.toISOString()
                : exp.duration?.to,
          },
        })) as any;
      }

      const response = await apiClient.put("/users/me", updateData);

      if (response.data?.data) {
        // The actual user data is nested inside response.data.data
        const updatedUserData = response.data.data;

        // Update form data with the response, ensuring proper data structure
        setFormData({
          ...updatedUserData,
          // Ensure address object exists
          address: updatedUserData.address || {
            address: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
          },
          // Convert date string back to Date object for DateSelector
          dob: updatedUserData.dob ? new Date(updatedUserData.dob) : undefined,
          // Ensure experience array exists and convert date strings to Date objects
          experience:
            updatedUserData.experience?.map((exp: any) => ({
              ...exp,
              duration: {
                from: exp.duration?.from
                  ? new Date(exp.duration.from)
                  : new Date(),
                to: exp.duration?.to ? new Date(exp.duration.to) : new Date(),
              },
            })) || [],
        });

        // Mark all experiences as saved after successful update
        if (
          updatedUserData.experience &&
          updatedUserData.experience.length > 0
        ) {
          const allExperienceIndices = updatedUserData.experience.map(
            (_: any, index: number) => index
          );
          setSavedExperiences(allExperienceIndices);
          setExistingExperiences(allExperienceIndices);
        }

        // Update session with new user data
        if (updateSession) {
          await updateSession({
            firstName: updatedUserData.firstName,
            lastName: updatedUserData.lastName,
            email: updatedUserData.email,
            phone: updatedUserData.phone,
            profilePicture: updatedUserData.profilePicture,
            userType: updatedUserData.userType,
          });
        }

        toast.success("Profile updated successfully!");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);

      if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update profile. Please try again.");
      }

      // Handle validation errors from backend
      if (
        error.response?.status === 400 &&
        error.response?.data?.error?.details?.validationErrors
      ) {
        const backendErrors: Record<string, string> = {};
        const validationErrors =
          error.response.data.error.details.validationErrors;

        Object.keys(validationErrors).forEach((field) => {
          backendErrors[field] = validationErrors[field].message;
        });

        setErrors(backendErrors);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <div className="flex justify-center lg:justify-start items-center gap-5">
          <div
            className="absolute lg:static left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <ChevronLeftIcon className="size-4" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        </div>
        <p className="text-gray-600 text-center lg:text-left">
          Manage your account information and preferences
        </p>
      </div>

      <div className="lg:max-w-[90%] w-full mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(auto,250px)_1fr] gap-8">
          {/* Left Side - Profile Image */}
          <div className="w-full flex flex-col items-center">
            <div className="relative group">
              <div className="w-48 h-48 rounded-full overflow-hidden bg-linear-to-br from-orange-100 to-orange-200 border-4 border-white shadow-lg">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-6xl font-bold text-orange-500">
                      {formData.firstName?.[0]?.toUpperCase() ||
                        formData.email?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                  </div>
                )}
              </div>

              {/* Hover Overlay */}
              {!isExternalImage && (
                <div
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                  onClick={() => {
                    if (!isExternalImage && !isUploadingImage) {
                      document.getElementById("profile-image-input")?.click();
                    }
                  }}
                >
                  <div className="text-white text-center">
                    {isUploadingImage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    ) : (
                      <Camera className="w-8 h-8 mx-auto mb-2" />
                    )}
                    <span className="text-sm font-medium select-none">
                      {isUploadingImage ? "Uploading..." : "Update Image"}
                    </span>
                  </div>
                </div>
              )}
              {isExternalImage && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-white text-center px-4">
                    <Lock className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-xs font-medium select-none">
                      Image from connected account
                    </span>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && !isExternalImage) {
                    handleImageUpload(file);
                  }
                }}
                className="hidden"
                disabled={isUploadingImage || isExternalImage}
              />
            </div>

            {/* Remove Image Button - Only show for S3 images */}
            {profileImageUrl && !isExternalImage && (
              <button
                onClick={handleImageRemove}
                disabled={isUploadingImage}
                className="mt-3 px-3 py-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingImage ? "Removing..." : "Remove Image"}
              </button>
            )}
            {/* Info message for external images */}
            {profileImageUrl && isExternalImage && (
              <div className="mt-3 px-3 py-2 text-xs text-gray-600 bg-gray-50 rounded-full text-center">
                Profile picture from connected account (Google/LinkedIn)
              </div>
            )}

            <div className="mt-6 w-full">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                {formData.firstName && formData.lastName
                  ? `${formData.firstName} ${formData.lastName}`
                  : formData.email}
              </h2>
              <p className="text-sm text-gray-500 capitalize mt-1 text-center">
                {formData.userType?.replace("-", " ")}
              </p>
              {formData.userType === "instructor" && (
                <div className="mt-2 flex items-center justify-center gap-4 text-sm text-gray-600">
                  <span>⭐ {formData.rating || 0}/5</span>
                  <span>👥 {formData.totalStudents || 0} students</span>
                </div>
              )}
              {formData.userType === "collaborator" && (
                <div className="mt-2 flex items-center justify-center gap-4 text-sm text-gray-600">
                  <span>🔗 {formData.totalReferrals || 0} referrals</span>
                  <span>💰 ₹{formData.totalEarnings || 0}</span>
                </div>
              )}
            </div>

            <div
              className={`mt-6 w-full flex flex-col gap-4 text-sm font-semibold ${plusJakartaSans.className}`}
            >
              {formData.provider === "credentials" && (
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full bg-[#FF4500] flex gap-2 items-center justify-center px-6 py-3 text-white rounded-2xl shadow-[inset_0_-2px_4px_0_rgba(0,0,0,0.3)] cursor-pointer hover:bg-[#E03E00] transition-colors"
                >
                  <Lock className="size-4 stroke-3" />
                  <span>Change Password</span>
                </button>
              )}
              {formData.provider !== "linkedin" &&
                formData.accounts &&
                !formData.accounts?.linkedin && (
                  <button className="w-full bg-[#006699] flex gap-2 items-center justify-center px-6 py-3 text-white rounded-2xl shadow-[inset_0_-2px_2px_0_rgba(0,0,0,0.2)] cursor-pointer">
                    <ImageComponent
                      src="/linkedin-icon.svg"
                      alt="LinkedIn"
                      width={20}
                      height={20}
                      className="size-4"
                    />
                    <span>Link LinkedIn</span>
                  </button>
                )}
              {formData.provider !== "google" &&
                (!formData.accounts || !formData.accounts?.google) && (
                  <WhiteButton className="w-full flex gap-2 items-center justify-center">
                    <ImageComponent
                      src="/google-icon.svg"
                      alt="LinkedIn"
                      width={20}
                      height={20}
                      className="size-4"
                    />
                    <span>Link Google</span>
                  </WhiteButton>
                )}
            </div>
          </div>

          {/* Right Side - Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Enter your first name"
                  value={formData.firstName || ""}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  error={errors.firstName}
                />
                <Input
                  label="Last Name"
                  placeholder="Enter your last name"
                  value={formData.lastName || ""}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  error={errors.lastName}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled
                  className="opacity-75 select-none!"
                  error={errors.email}
                />
                <div>
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+91XXXXXXXXXX"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    error={errors.phone}
                    maxLength={15}
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      // Only allow digits and + symbol
                      if (
                        !/[\d+]/.test(e.key) &&
                        ![
                          "Backspace",
                          "Delete",
                          "Tab",
                          "Escape",
                          "Enter",
                          "ArrowLeft",
                          "ArrowRight",
                          "ArrowUp",
                          "ArrowDown",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {!errors.phone && (
                    <p className="mt-1 text-xs text-gray-500">
                      Format: +91 followed by 10-12 digits (e.g., +919876543210)
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    label="WhatsApp Number"
                    type="tel"
                    placeholder="+91XXXXXXXXXX"
                    value={formData.whatsappNumber || ""}
                    onChange={(e) =>
                      handleInputChange("whatsappNumber", e.target.value)
                    }
                    error={errors.whatsappNumber}
                    maxLength={15}
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      // Only allow digits and + symbol
                      if (
                        !/[\d+]/.test(e.key) &&
                        ![
                          "Backspace",
                          "Delete",
                          "Tab",
                          "Escape",
                          "Enter",
                          "ArrowLeft",
                          "ArrowRight",
                          "ArrowUp",
                          "ArrowDown",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {!errors.whatsappNumber && (
                    <p className="mt-1 text-xs text-gray-500">
                      Format: +91 followed by 10-12 digits (e.g., +919876543210)
                    </p>
                  )}
                </div>
                <DateSelector
                  label="Date of Birth"
                  placeholder="Select your date of birth"
                  value={formData.dob ? new Date(formData.dob) : undefined}
                  onChange={(date) => handleInputChange("dob", date)}
                  maxDate={new Date()} // Can't select future dates
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    placeholder="Enter your full address"
                    value={formData.address?.address || ""}
                    onChange={(e) =>
                      handleAddressChange("address", e.target.value)
                    }
                  />
                </div>
                <Input
                  label="City"
                  placeholder="Enter your city"
                  value={formData.address?.city || ""}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="Enter your state"
                  value={formData.address?.state || ""}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                />
                <Input
                  label="Country"
                  placeholder="Enter your country"
                  value={formData.address?.country || ""}
                  onChange={(e) =>
                    handleAddressChange("country", e.target.value)
                  }
                />
                <Input
                  label="Pincode"
                  placeholder="Enter your pincode"
                  value={formData.address?.pincode || ""}
                  onChange={(e) =>
                    handleAddressChange("pincode", e.target.value)
                  }
                />
              </div>
            </div>

            {/* User Type Specific Fields */}
            {formData.userType === "student" && (
              <StudentFields
                formData={formData}
                handleInputChange={handleInputChange}
                errors={errors}
              />
            )}

            {formData.userType === "instructor" && (
              <InstructorFields
                formData={formData}
                handleInputChange={handleInputChange}
                errors={errors}
              />
            )}

            {formData.userType === "collaborator" && (
              <CollaboratorFields formData={formData} />
            )}

            {/* Experience Section - Show for students and instructors */}
            {(formData.userType === "student" ||
              formData.userType === "instructor") && (
              <ExperienceSection
                formData={formData}
                handleExperienceChange={handleExperienceChange}
                addExperience={addExperience}
                removeExperience={removeExperience}
                saveExperience={saveExperience}
                editExperience={editExperience}
                savedExperiences={savedExperiences}
                existingExperiences={existingExperiences}
                errors={errors}
              />
            )}

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Ready to save your profile?</p>
                  <p className="text-xs text-gray-500">
                    This will save all your information including personal
                    details, address, and work experience.
                  </p>
                </div>
                <OrangeButton
                  type="submit"
                  glow={false}
                  disabled={updating}
                  className="w-full sm:w-auto px-8 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {updating ? "Saving All Changes..." : "Save All Changes"}
                </OrangeButton>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setPasswordErrors({});
        }}
        title="Change Password"
        className="max-w-md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  handlePasswordChange("currentPassword", e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  togglePasswordVisibility("current");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  handlePasswordChange("newPassword", e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  togglePasswordVisibility("new");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-500">
                {passwordErrors.newPassword}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  handlePasswordChange("confirmPassword", e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  togglePasswordVisibility("confirm");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full px-4 py-3 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updatingPassword && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {updatingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Student specific fields component
const StudentFields = ({
  formData,
  handleInputChange,
  errors,
}: {
  formData: Partial<ExtendedUser>;
  handleInputChange: (field: string, value: string | number) => void;
  errors: Record<string, string>;
}) => {
  const experienceLevels = [
    {
      value: "College Student - 1st Year",
      label: "College Student - 1st Year",
    },
    {
      value: "College Student - 2nd Year",
      label: "College Student - 2nd Year",
    },
    {
      value: "College Student - 3rd Year",
      label: "College Student - 3rd Year",
    },
    {
      value: "College Student - 4th Year",
      label: "College Student - 4th Year",
    },
    {
      value: "Working Professional - Tech Domain",
      label: "Working Professional - Tech Domain",
    },
    {
      value: "Working Professional - Non Tech Domain",
      label: "Working Professional - Non Tech Domain",
    },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => ({
    value: (currentYear - 10 + i).toString(),
    label: (currentYear - 10 + i).toString(),
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        Academic & Professional Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CollegeSelect
          label="College Name"
          required
          placeholder="Search and select your college"
          value={formData.collegeName || ""}
          onChange={(value) => handleInputChange("collegeName", value)}
          error={errors.collegeName}
        />
        <Input
          label="Degree Name"
          placeholder="Enter your degree"
          value={formData.degreeName || ""}
          onChange={(e) => handleInputChange("degreeName", e.target.value)}
        />
        <div>
          <Select
            label="Passing Year"
            placeholder="Select passing year"
            options={years}
            value={formData.passingYear?.toString() || ""}
            onChange={(value) =>
              handleInputChange("passingYear", parseInt(value))
            }
          />
          {errors.passingYear && (
            <p className="mt-1 text-sm text-red-500">{errors.passingYear}</p>
          )}
        </div>
        <Select
          label="Experience Level"
          placeholder="Select your experience level"
          options={experienceLevels}
          value={formData.experienceLevel || ""}
          onChange={(value) => handleInputChange("experienceLevel", value)}
        />
        <Input
          label="Father's Occupation"
          placeholder="Enter father's occupation"
          value={formData.fatherOccupation || ""}
          onChange={(e) =>
            handleInputChange("fatherOccupation", e.target.value)
          }
        />
        <Input
          label="Area of Interest"
          placeholder="Enter your area of interest"
          value={formData.areaOfInterest || ""}
          onChange={(e) => handleInputChange("areaOfInterest", e.target.value)}
        />
        <Input
          label="Current Position"
          placeholder="Enter your current position"
          value={formData.currentPosition || ""}
          onChange={(e) => handleInputChange("currentPosition", e.target.value)}
        />
        <Input
          label="Current Company"
          placeholder="Enter your current company"
          value={formData.currentCompany || ""}
          onChange={(e) => handleInputChange("currentCompany", e.target.value)}
        />
        <Input
          label="Domain"
          placeholder="Enter your domain/field"
          value={formData.domain || ""}
          onChange={(e) => handleInputChange("domain", e.target.value)}
        />
        <Input
          label="Portfolio URL"
          placeholder="Enter your portfolio URL"
          value={formData.portfolio || ""}
          onChange={(e) => handleInputChange("portfolio", e.target.value)}
          error={errors.portfolio}
        />
      </div>
    </div>
  );
};

// Instructor specific fields component
const InstructorFields = ({
  formData,
  handleInputChange,
  errors,
}: {
  formData: Partial<ExtendedUser>;
  handleInputChange: (field: string, value: string | number) => void;
  errors: Record<string, string>;
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        Professional Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-black mb-2">
            Bio
          </label>
          <textarea
            placeholder="Tell us about yourself..."
            value={formData.bio || ""}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            rows={4}
            className="w-full px-4 py-3.5 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md resize-none"
          />
        </div>
        <Input
          label="Current Position"
          placeholder="Enter your current position"
          value={formData.currentPosition || ""}
          onChange={(e) => handleInputChange("currentPosition", e.target.value)}
        />
        <Input
          label="Current Company"
          placeholder="Enter your current company"
          value={formData.currentCompany || ""}
          onChange={(e) => handleInputChange("currentCompany", e.target.value)}
        />
        <div className="md:col-span-2">
          <Input
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/your-profile"
            value={formData.linkedinUrl || ""}
            onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
            error={errors.linkedinUrl}
          />
        </div>
      </div>
    </div>
  );
};

// Collaborator specific fields component
const CollaboratorFields = ({
  formData,
}: {
  formData: Partial<ExtendedUser>;
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        Collaboration Statistics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Referrals Card */}
        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">
                Total Referrals
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {formData.totalReferrals || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🔗</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            People you've referred to the platform
          </p>
        </div>

        {/* Total Earnings Card */}
        <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">
                Total Earnings
              </p>
              <p className="text-3xl font-bold text-green-900">
                ₹{formData.totalEarnings || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">
            Commission earned from referrals
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="md:col-span-2 bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <h4 className="text-lg font-semibold text-purple-900 mb-4">
            Performance Overview
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-900">
                {formData.totalReferrals || 0}
              </p>
              <p className="text-xs text-purple-600">Referrals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-900">
                {formData.totalReferrals
                  ? Math.round(
                      (formData.totalEarnings || 0) / formData.totalReferrals
                    )
                  : 0}
              </p>
              <p className="text-xs text-purple-600">Avg. per Referral</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-900">
                {formData.totalReferrals && formData.totalReferrals > 0
                  ? "85%"
                  : "0%"}
              </p>
              <p className="text-xs text-purple-600">Success Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-900">
                {formData.totalReferrals
                  ? Math.min(5, Math.floor(formData.totalReferrals / 10) + 1)
                  : 1}
              </p>
              <p className="text-xs text-purple-600">Level</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-sm">💡</span>
          </div>
          <div>
            <h5 className="font-semibold text-orange-900 mb-1">
              Collaboration Tips
            </h5>
            <p className="text-sm text-orange-700">
              Share your referral link with friends and colleagues to earn more
              commissions. The more successful referrals you make, the higher
              your collaboration level becomes!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Experience section component
const ExperienceSection = ({
  formData,
  handleExperienceChange,
  addExperience,
  removeExperience,
  saveExperience,
  editExperience,
  savedExperiences,
  existingExperiences,
  errors,
}: {
  formData: Partial<ExtendedUser>;
  handleExperienceChange: (
    index: number,
    field: string,
    value: string | Date
  ) => void;
  addExperience: () => void;
  removeExperience: (index: number) => void;
  saveExperience: (index: number) => void;
  editExperience: (index: number) => void;
  savedExperiences: number[];
  existingExperiences: number[];
  errors: Record<string, string>;
}) => {
  const experiences = formData.experience || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-500" />
            Work Experience
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Save each experience individually, then use "Save All Changes" to
            update your profile
          </p>
        </div>
        <button
          type="button"
          onClick={addExperience}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No work experience added yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Add Experience" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {experiences.map((experience, index) => {
            const isSaved = savedExperiences.includes(index);

            return (
              <div
                key={index}
                className={`relative border rounded-xl transition-all duration-300 ${
                  isSaved
                    ? "border-green-200 bg-green-50 p-4"
                    : "border-gray-200 bg-gray-50 p-6"
                }`}
              >
                {/* Delete button - top right */}
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete experience"
                >
                  <X className="w-4 h-4" />
                </button>

                {isSaved ? (
                  /* Compact saved view */
                  <div className="pr-8">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {experience.position || "Position"}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {experience.companyName || "Company"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {experience.duration?.from && experience.duration?.to
                            ? `${new Date(
                                experience.duration.from
                              ).toLocaleDateString()} - ${new Date(
                                experience.duration.to
                              ).toLocaleDateString()}`
                            : "Duration not specified"}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Check className="w-3 h-3" />
                        Saved
                      </div>
                    </div>

                    {experience.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                        {experience.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-green-200">
                      <div className="text-xs text-green-600">
                        {!existingExperiences.includes(index) &&
                          "Save Experience to save changes"}
                      </div>
                      <button
                        type="button"
                        onClick={() => editExperience(index)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Full editing view */
                  <>
                    {/* Status indicator */}
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <Edit3 className="w-3 h-3" />
                        Editing
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Company Name */}
                      <Input
                        label="Company Name"
                        placeholder="Enter company name"
                        value={experience.companyName || ""}
                        onChange={(e) =>
                          handleExperienceChange(
                            index,
                            "companyName",
                            e.target.value
                          )
                        }
                        error={errors[`experience.${index}.companyName`]}
                        disabled={isSaved}
                      />

                      {/* Position */}
                      <Input
                        label="Position"
                        placeholder="Enter your position"
                        value={experience.position || ""}
                        onChange={(e) =>
                          handleExperienceChange(
                            index,
                            "position",
                            e.target.value
                          )
                        }
                        error={errors[`experience.${index}.position`]}
                        disabled={isSaved}
                      />

                      {/* Duration From */}
                      <div
                        className={
                          isSaved ? "pointer-events-none opacity-60" : ""
                        }
                      >
                        <DateSelector
                          label="Start Date"
                          placeholder="Select start date"
                          value={
                            experience.duration?.from
                              ? new Date(experience.duration.from)
                              : undefined
                          }
                          onChange={(date) =>
                            handleExperienceChange(
                              index,
                              "from",
                              date || new Date()
                            )
                          }
                        />
                      </div>

                      {/* Duration To */}
                      <div
                        className={
                          isSaved ? "pointer-events-none opacity-60" : ""
                        }
                      >
                        <DateSelector
                          label="End Date"
                          placeholder="Select end date"
                          value={
                            experience.duration?.to
                              ? new Date(experience.duration.to)
                              : undefined
                          }
                          onChange={(date) =>
                            handleExperienceChange(
                              index,
                              "to",
                              date || new Date()
                            )
                          }
                        />
                      </div>

                      {/* Description */}
                      <div className="md:col-span-2">
                        <label className="font-medium text-black mb-2 block">
                          Job Description
                        </label>
                        <textarea
                          placeholder="Describe your role and responsibilities..."
                          value={experience.description || ""}
                          onChange={(e) =>
                            handleExperienceChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows={3}
                          disabled={isSaved}
                          className={`w-full px-4 py-3.5 border border-gray-300 rounded-xl resize-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md text-sm ${
                            isSaved
                              ? "bg-gray-100 cursor-not-allowed opacity-60"
                              : "bg-white hover:border-orange-400"
                          }`}
                        />
                        {errors[`experience.${index}.description`] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors[`experience.${index}.description`]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons at bottom */}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Fill all fields and save
                      </div>

                      <button
                        type="button"
                        onClick={() => saveExperience(index)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Experience
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
