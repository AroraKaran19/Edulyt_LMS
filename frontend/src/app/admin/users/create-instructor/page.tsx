"use client";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import apiClient from "@/configs/apiConfig";
import Input from "@/components/ui/inputs/Input";
import DateSelector from "@/components/ui/inputs/DateSelector";
import {
  Plus,
  X,
  Eye,
  EyeOff,
  Briefcase,
  Save,
  Edit3,
  Check,
  Camera,
  User as UserIcon,
  Lock,
  MapPin,
  UserCircle,
  Sparkles,
} from "lucide-react";
import { User, Instructor } from "@/types/user";
import { useUpload } from "@/hooks/useUpload";

// Combine User and Instructor types with form-specific fields
type InstructorFormData = Omit<
  User,
  | "_id"
  | "status"
  | "permissions"
  | "refreshTokens"
  | "createdAt"
  | "updatedAt"
  | "accounts"
> &
  Omit<Instructor, "rating" | "totalStudents" | "reviews" | "ownedCourses"> & {
    confirmPassword: string;
  };

const CreateInstructorPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Profile image upload states
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [profileImageS3Key, setProfileImageS3Key] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { uploadFile, deleteFile, validateImageFile } = useUpload();

  const [formData, setFormData] = useState<Partial<InstructorFormData>>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    whatsappNumber: "",
    dob: undefined,
    userType: "instructor",
    provider: "credentials",
    profilePicture: "",
    address: {
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    },
    bio: "",
    currentPosition: "",
    currentCompany: "",
    linkedinUrl: "",
    previousExperience: [],
  });

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

  // Handle basic input changes
  const handleInputChange = (field: string, value: string | Date) => {
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

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle address changes
  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));

    // Clear error when user starts typing
    const errorKey = `address.${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Experience management states (for save/edit functionality)
  const [savedExperiences, setSavedExperiences] = useState<number[]>([]);

  // Handle profile image upload
  const handleImageUpload = async (file: File) => {
    // Validate image file
    const validation = validateImageFile(file, 5 * 1024 * 1024); // 5MB max
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image file");
      return;
    }

    setIsUploadingImage(true);

    try {
      // Delete old image if exists
      if (profileImageS3Key) {
        await deleteFile(profileImageS3Key);
      }

      // Upload new image
      const result = await uploadFile(file, "profile-images");

      if (result.success && result.data) {
        const { url, s3Key } = result.data;
        setProfileImageUrl(url);
        setProfileImageS3Key(s3Key);
        setFormData((prev) => ({
          ...prev,
          profilePicture: url,
        }));
        toast.success("Profile image uploaded successfully!");
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
    if (!profileImageUrl && !profileImageS3Key) return;

    try {
      // Delete from S3 if we have the key
      if (profileImageS3Key) {
        await deleteFile(profileImageS3Key);
      }

      setProfileImageUrl("");
      setProfileImageS3Key("");
      setFormData((prev) => ({
        ...prev,
        profilePicture: "",
      }));

      toast.success("Profile image removed successfully!");
    } catch (error: any) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image. Please try again.");
    }
  };

  // Handle experience changes
  const handleExperienceChange = (
    index: number,
    field: string,
    value: string | Date
  ) => {
    setFormData((prev) => {
      const experiences = prev.previousExperience || [];
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
        previousExperience: updatedExperiences,
      };
    });

    // Clear error when user starts typing/editing
    setErrors((prev) => {
      const errorKey = `previousExperience.${index}.${field}`;
      const durationErrorKey = `previousExperience.${index}.duration`;
      const unsavedErrorKey = `previousExperience.${index}.unsaved`;
      
      // Only update if there are errors to clear
      if (prev[errorKey] || prev[durationErrorKey] || prev[unsavedErrorKey]) {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        delete newErrors[durationErrorKey];
        delete newErrors[unsavedErrorKey];
        return newErrors;
      }
      return prev;
    });
  };

  // Add new experience
  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      previousExperience: [
        ...(prev.previousExperience || []),
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

  // Remove experience
  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      previousExperience:
        prev.previousExperience?.filter((_, i) => i !== index) || [],
    }));
    // Remove from saved experiences and adjust indices
    setSavedExperiences((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
  };

  // Save experience (for individual experience validation)
  const saveExperience = (index: number) => {
    const experience = formData.previousExperience?.[index];
    if (!experience) {
      toast.error("Experience data not found");
      return;
    }

    const validation = validateExperience(experience);
    if (!validation.isValid) {
      toast.error(
        `Please fix the following errors: ${validation.errors.join(", ")}`
      );
      return;
    }

    setSavedExperiences((prev) => [...prev, index]);
    toast.success(
      "Experience saved! It will be included when creating the instructor."
    );
  };

  // Edit experience (remove from saved state)
  const editExperience = (index: number) => {
    setSavedExperiences((prev) => prev.filter((i) => i !== index));
  };

  // Validation functions (matching backend schema)
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone || phone.trim() === "") return true; // Optional field
    // Must match backend schema: +91 followed by 10-12 digits
    const phoneRegex = /^\+91[0-9]{10,12}$/;
    return phoneRegex.test(phone);
  };

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url || url.trim() === "") return true; // Optional field
    // Must match backend schema validation
    const linkedinRegex =
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
  };

  const validatePassword = (password: string): boolean => {
    // Basic password validation - at least 6 characters
    return !!(password && password.length >= 6);
  };

  const validateName = (name: string): boolean => {
    // Name should be at least 2 characters and contain only letters, spaces, and common punctuation
    if (!name || name.trim().length < 2) return false;
    const nameRegex = /^[a-zA-Z\s\-\.\']+$/;
    return nameRegex.test(name.trim());
  };

  const validateExperience = (
    experience: any
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!experience.companyName || experience.companyName.trim().length < 2) {
      errors.push("Company name must be at least 2 characters");
    }

    if (!experience.position || experience.position.trim().length < 2) {
      errors.push("Position must be at least 2 characters");
    }

    if (!experience.duration?.from || !experience.duration?.to) {
      errors.push("Both start and end dates are required");
    } else if (
      new Date(experience.duration.from) >= new Date(experience.duration.to)
    ) {
      errors.push("End date must be after start date");
    }

    // Description is required in backend schema
    if (!experience.description || experience.description.trim().length === 0) {
      errors.push("Description is required");
    } else if (experience.description.trim().length < 10) {
      errors.push("Description must be at least 10 characters");
    }

    return { isValid: errors.length === 0, errors };
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validations (required and format)
    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required";
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName =
        "First name must be at least 2 characters and contain only letters, spaces, hyphens, dots, and apostrophes";
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName =
        "Last name must be at least 2 characters and contain only letters, spaces, hyphens, dots, and apostrophes";
    }

    // Email validation (required and format)
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation (required and strength)
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Phone validation (optional but if provided, must match schema format)
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone =
        "Phone number must be in format +91XXXXXXXXXX (10-12 digits after +91)";
    }

    if (formData.whatsappNumber && !validatePhone(formData.whatsappNumber)) {
      newErrors.whatsappNumber =
        "WhatsApp number must be in format +91XXXXXXXXXX (10-12 digits after +91)";
    }

    // LinkedIn URL validation (optional but if provided, must be valid)
    if (formData.linkedinUrl && !validateLinkedInUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl =
        "Please enter a valid LinkedIn profile URL (https://linkedin.com/in/username)";
    }

    // Date of birth validation (optional but if provided, must be reasonable)
    if (formData.dob) {
      const today = new Date();
      const birthDate = new Date(formData.dob);
      const age = today.getFullYear() - birthDate.getFullYear();

      if (birthDate > today) {
        newErrors.dob = "Date of birth cannot be in the future";
      } else if (age < 16) {
        newErrors.dob = "Instructor must be at least 16 years old";
      } else if (age > 100) {
        newErrors.dob = "Please enter a valid date of birth";
      }
    }

    // Bio validation (optional but if provided, should have reasonable length)
    if (formData.bio && formData.bio.trim().length > 0) {
      if (formData.bio.trim().length < 10) {
        newErrors.bio = "Bio must be at least 10 characters if provided";
      } else if (formData.bio.trim().length > 1000) {
        newErrors.bio = "Bio must not exceed 1000 characters";
      }
    }

    // Professional info validation (optional but reasonable length if provided)
    if (
      formData.currentPosition &&
      formData.currentPosition.trim().length > 0 &&
      formData.currentPosition.trim().length < 2
    ) {
      newErrors.currentPosition =
        "Current position must be at least 2 characters if provided";
    }

    if (
      formData.currentCompany &&
      formData.currentCompany.trim().length > 0 &&
      formData.currentCompany.trim().length < 2
    ) {
      newErrors.currentCompany =
        "Current company must be at least 2 characters if provided";
    }

    // Experience validation - only validate saved experiences
    if (formData.previousExperience && formData.previousExperience.length > 0) {
      formData.previousExperience.forEach((experience, index) => {
        // Only validate if it's a saved experience
        if (savedExperiences.includes(index)) {
          const validation = validateExperience(experience);
          if (!validation.isValid) {
            // Map validation errors to specific fields
            if (!experience.companyName || experience.companyName.trim().length < 2) {
              newErrors[`previousExperience.${index}.companyName`] = "Company name must be at least 2 characters";
            }
            if (!experience.position || experience.position.trim().length < 2) {
              newErrors[`previousExperience.${index}.position`] = "Position must be at least 2 characters";
            }
            if (!experience.duration?.from || !experience.duration?.to) {
              newErrors[`previousExperience.${index}.duration`] = "Both start and end dates are required";
            } else if (
              new Date(experience.duration.from) >= new Date(experience.duration.to)
            ) {
              newErrors[`previousExperience.${index}.duration`] = "End date must be after start date";
            }
            if (!experience.description || experience.description.trim().length === 0) {
              newErrors[`previousExperience.${index}.description`] = "Description is required";
            } else if (experience.description.trim().length < 10) {
              newErrors[`previousExperience.${index}.description`] = "Description must be at least 10 characters";
            }
          }
        } else {
          // If experience is not saved, add error
          newErrors[`previousExperience.${index}.unsaved`] = "Please save this experience before submitting";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out incomplete experiences - only include saved experiences
      // Backend schema requires: companyName, position, duration (from/to), description
      const validExperiences = (formData.previousExperience || [])
        .filter((exp, index) => {
          // Only include experiences that are saved
          if (!savedExperiences.includes(index)) {
            return false;
          }
          // Validate required fields
          return (
            exp.companyName?.trim() &&
            exp.position?.trim() &&
            exp.duration?.from &&
            exp.duration?.to &&
            exp.description?.trim()
          );
        })
        .map((exp) => ({
          companyName: exp.companyName.trim(),
          position: exp.position.trim(),
          description: exp.description.trim(),
          duration: {
            from: exp.duration.from instanceof Date 
              ? exp.duration.from.toISOString() 
              : new Date(exp.duration.from).toISOString(),
            to: exp.duration.to instanceof Date 
              ? exp.duration.to.toISOString() 
              : new Date(exp.duration.to).toISOString(),
          },
        }));

      // Prepare data for API
      const submitData: any = {
        ...formData,
        userType: "instructor",
        provider: "credentials",
        // Include profile picture if uploaded
        profilePicture: profileImageUrl || formData.profilePicture || undefined,
        // Convert dates to ISO strings
        dob: formData.dob ? (formData.dob instanceof Date ? formData.dob.toISOString() : new Date(formData.dob).toISOString()) : undefined,
        // Only send valid, complete experiences
        previousExperience: validExperiences.length > 0 ? validExperiences : undefined,
        // Keep confirmPassword - backend needs it for validation
      };

      // Remove empty address object if all fields are empty
      if (submitData.address && 
          (!submitData.address.address?.trim() && !submitData.address.city?.trim() && 
           !submitData.address.state?.trim() && !submitData.address.country?.trim() && 
           !submitData.address.pincode?.trim())) {
        delete submitData.address;
      }

      // Remove undefined/null fields (but keep empty strings for optional fields)
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined || submitData[key] === null) {
          delete submitData[key];
        }
      });

      const response = await apiClient.post("/auth/register", submitData);

      if (response.data) {
        toast.success("Instructor created successfully!");
        router.push("/admin/users/manage-users");
      }
    } catch (error: any) {
      console.error("Error creating instructor:", error);

      // Handle validation errors from backend
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           "Validation failed. Please check all fields.";
        
        // Check if it's a Mongoose validation error with field-specific errors
        if (error.response?.data?.error?.details?.validationErrors) {
          const validationErrors = error.response.data.error.details.validationErrors;
          const backendErrors: Record<string, string> = {};
          
          // Map backend validation errors to form fields
          Object.keys(validationErrors).forEach((field) => {
            const fieldErrors = validationErrors[field];
            if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
              // Map common field names
              const fieldMap: Record<string, string> = {
                'email': 'email',
                'password': 'password',
                'firstName': 'firstName',
                'lastName': 'lastName',
                'phone': 'phone',
                'whatsappNumber': 'whatsappNumber',
                'linkedinUrl': 'linkedinUrl',
                'bio': 'bio',
                'currentPosition': 'currentPosition',
                'currentCompany': 'currentCompany',
                'dob': 'dob',
              };
              
              const mappedField = fieldMap[field] || field;
              backendErrors[mappedField] = Array.isArray(fieldErrors) 
                ? fieldErrors[0] 
                : String(fieldErrors);
            }
          });
          
          // Set errors in form state
          if (Object.keys(backendErrors).length > 0) {
            setErrors(backendErrors);
            toast.error("Please fix the validation errors in the form");
          } else {
            const errorMessages = Object.values(validationErrors).flat();
            toast.error(`Validation errors: ${errorMessages.join(", ")}`);
          }
        } else {
          toast.error(errorMessage);
        }
      } else if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create instructor. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-linear-to-br from-gray-50 via-orange-50/30 to-gray-50">
      <div className="mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header with linear */}
          <div className="bg-linear-to-r from-orange-500 via-orange-600 to-orange-500 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserCircle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  Create New Instructor
                </h1>
                <p className="text-orange-50 text-sm">
                  Fill in the details to create a new instructor account
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Information */}
          <div className="bg-linear-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-orange-100 rounded-lg">
                <UserIcon className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Basic Information
              </h2>
            </div>
            
            {/* Profile Image Upload */}
            <div className="mb-8 flex flex-col items-center md:items-start">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Profile Picture <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative group">
                <div className="w-36 h-36 rounded-full overflow-hidden bg-linear-to-br from-orange-100 via-orange-200 to-orange-300 border-4 border-white shadow-xl ring-4 ring-orange-100 transition-all duration-300 group-hover:ring-orange-200 group-hover:scale-105">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-orange-100 to-orange-200">
                      <div className="text-5xl font-bold text-orange-500">
                        {formData.firstName?.[0]?.toUpperCase() ||
                          formData.email?.[0]?.toUpperCase() ||
                          "U"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hover Overlay */}
                <div
                  className="absolute inset-0 rounded-full bg-linear-to-br from-black/60 to-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                  onClick={() =>
                    document.getElementById("profile-image-input")?.click()
                  }
                >
                  <div className="text-white text-center transform group-hover:scale-110 transition-transform">
                    {isUploadingImage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                    ) : (
                      <Camera className="w-8 h-8 mx-auto mb-2 drop-shadow-lg" />
                    )}
                    <span className="text-sm font-semibold select-none drop-shadow-md">
                      {isUploadingImage ? "Uploading..." : "Update Image"}
                    </span>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </div>

              {/* Remove Image Button */}
              {profileImageUrl && (
                <button
                  type="button"
                  onClick={handleImageRemove}
                  disabled={isUploadingImage}
                  className="mt-4 px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed border border-red-100"
                >
                  Remove Image
                </button>
              )}

              <p className="mt-3 text-xs text-gray-500 text-center md:text-left max-w-xs">
                Recommended: Square image, max 5MB (JPG, PNG, WebP)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="First Name"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                error={errors.firstName}
                required
              />

              <Input
                label="Last Name"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                error={errors.lastName}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                error={errors.email}
                required
              />

              <div>
                <DateSelector
                  label="Date of Birth"
                  placeholder="Select date of birth"
                  value={formData.dob}
                  onChange={(date) =>
                    handleInputChange("dob", date || new Date())
                  }
                />
                {errors.dob && (
                  <p className="mt-1 text-sm text-red-500">{errors.dob}</p>
                )}
              </div>

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
                    if (!/[\d+]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
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
                    if (!/[\d+]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
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
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-linear-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Account Security
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  error={errors.password}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  error={errors.confirmPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-linear-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Address Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Input
                  label="Street Address"
                  placeholder="Enter street address"
                  value={formData.address?.address || ""}
                  onChange={(e) =>
                    handleAddressChange("address", e.target.value)
                  }
                  error={errors["address.address"]}
                />
              </div>

              <Input
                label="City"
                placeholder="Enter city"
                value={formData.address?.city || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                error={errors["address.city"]}
              />

              <Input
                label="State"
                placeholder="Enter state"
                value={formData.address?.state || ""}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                error={errors["address.state"]}
              />

              <Input
                label="Country"
                placeholder="Enter country"
                value={formData.address?.country || ""}
                onChange={(e) => handleAddressChange("country", e.target.value)}
                error={errors["address.country"]}
              />

              <Input
                label="Pin Code"
                placeholder="Enter pin code"
                value={formData.address?.pincode || ""}
                onChange={(e) => handleAddressChange("pincode", e.target.value)}
                error={errors["address.pincode"]}
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-linear-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Professional Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Current Position"
                placeholder="Enter current position"
                value={formData.currentPosition || ""}
                onChange={(e) =>
                  handleInputChange("currentPosition", e.target.value)
                }
                error={errors.currentPosition}
              />

              <Input
                label="Current Company"
                placeholder="Enter current company"
                value={formData.currentCompany || ""}
                onChange={(e) =>
                  handleInputChange("currentCompany", e.target.value)
                }
                error={errors.currentCompany}
              />

              <div className="md:col-span-2">
                <Input
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedinUrl || ""}
                  onChange={(e) =>
                    handleInputChange("linkedinUrl", e.target.value)
                  }
                  error={errors.linkedinUrl}
                />
                {!errors.linkedinUrl && formData.linkedinUrl && (
                  <p className="mt-1 text-xs text-gray-500">
                    Make sure your LinkedIn URL is public and accessible
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  placeholder="Write a brief bio about the instructor..."
                  value={formData.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md resize-none ${
                    errors.bio ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-500">{errors.bio}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.bio
                    ? `${formData.bio.length}/1000 characters`
                    : "0/1000 characters"}
                </p>
              </div>
            </div>
          </div>

          {/* Previous Experience */}
          <ExperienceSection
            formData={formData}
            handleExperienceChange={handleExperienceChange}
            addExperience={addExperience}
            removeExperience={removeExperience}
            saveExperience={saveExperience}
            editExperience={editExperience}
            savedExperiences={savedExperiences}
            errors={errors}
          />

          {/* Submit Button */}
          <div className="pt-8 mt-8 border-t-2 border-gray-200 bg-linear-to-r from-orange-50 to-transparent rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg mt-0.5">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">
                    Ready to create instructor account?
                  </p>
                  <p className="text-sm text-gray-600">
                    All required fields must be filled before creating the account.
                  </p>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-orange-500 via-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-base"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                )}
                {isSubmitting ? "Creating Instructor..." : "Create Instructor"}
              </button>
            </div>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Experience section component (adapted from profile page)
const ExperienceSection = ({
  formData,
  handleExperienceChange,
  addExperience,
  removeExperience,
  saveExperience,
  editExperience,
  savedExperiences,
  errors,
}: {
  formData: Partial<InstructorFormData>;
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
  errors: Record<string, string>;
}) => {
  const experiences = formData.previousExperience || [];

  return (
    <div className="bg-linear-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Previous Experience
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Add previous work experience for the instructor
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={addExperience}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No previous experience added yet.</p>
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
                className={`relative border-2 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md ${
                  isSaved
                    ? "border-green-300 bg-linear-to-br from-green-50 to-white p-5"
                    : "border-gray-200 bg-white p-6"
                }`}
              >
                {/* Delete button - top right */}
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
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
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-linear-to-r from-green-100 to-green-50 text-green-700 border border-green-200 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                        Saved
                      </div>
                    </div>

                    {experience.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                        {experience.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-green-200">
                      <div className="text-xs font-medium text-green-700 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        Experience ready for instructor creation
                      </div>
                      <button
                        type="button"
                        onClick={() => editExperience(index)}
                        className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Full editing view */
                  <>
                    {/* Status indicator */}
                    <div className="mb-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-linear-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200 shadow-sm">
                        <Edit3 className="w-3.5 h-3.5" />
                        Editing
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        error={
                          errors[`previousExperience.${index}.companyName`]
                        }
                        disabled={isSaved}
                      />

                      {/* Position */}
                      <Input
                        label="Position"
                        placeholder="Enter position"
                        value={experience.position || ""}
                        onChange={(e) =>
                          handleExperienceChange(
                            index,
                            "position",
                            e.target.value
                          )
                        }
                        error={errors[`previousExperience.${index}.position`]}
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
                        {errors[`previousExperience.${index}.duration`] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors[`previousExperience.${index}.duration`]}
                          </p>
                        )}
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
                          placeholder="Describe the role and responsibilities..."
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
                        {errors[`previousExperience.${index}.description`] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors[`previousExperience.${index}.description`]}
                          </p>
                        )}
                        {errors[`previousExperience.${index}.unsaved`] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors[`previousExperience.${index}.unsaved`]}
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
                        className="w-full px-5 py-3 bg-linear-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
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

export default CreateInstructorPage;
