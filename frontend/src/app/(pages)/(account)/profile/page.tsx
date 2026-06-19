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
import useAuth from "@/hooks/useAuth";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { User, Student, Instructor, Collaborator } from "@/types/user";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import ImageComponent from "@/components/ui/ImageComponent";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  validatePassword,
  getPasswordRequirementsText,
} from "@/lib/passwordValidation";
import {
  DEGREE_OPTIONS,
  EXPERIENCE_LEVELS,
} from "@/lib/constants/profileOptions";

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
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
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

  // Email change states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    currentPassword: "",
    newEmail: "",
  });
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false);
  const [unlinkingLinkedIn, setUnlinkingLinkedIn] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [showUnlinkConfirmModal, setShowUnlinkConfirmModal] = useState(false);
  const [accountToUnlink, setAccountToUnlink] = useState<
    "google" | "linkedin" | null
  >(null);
  const [initialPasswordData, setInitialPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [initialPasswordErrors, setInitialPasswordErrors] = useState<
    Record<string, string>
  >({});
  const [showInitialPasswords, setShowInitialPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [settingPassword, setSettingPassword] = useState(false);

  // Profile image upload states
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [profileImageS3Key, setProfileImageS3Key] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isExternalImage, setIsExternalImage] = useState(false);

  // WhatsApp same as phone checkbox
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(false);

  const router = useRouter();
  const { user: viewer } = useAuth();
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
          // Ensure accounts object exists
          accounts: userData.accounts || {
            google: undefined,
            linkedin: undefined,
            github: undefined,
            instagram: undefined,
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

        // Check if WhatsApp number is same as phone number
        if (
          userData.phone &&
          userData.whatsappNumber &&
          userData.phone === userData.whatsappNumber
        ) {
          setWhatsappSameAsPhone(true);
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
            // External image (Google/LinkedIn) - only prevent changes if account is still linked
            const isAccountLinked = Boolean(
              (formData.provider === "google" && formData.accounts?.google) ||
                (formData.provider === "linkedin" &&
                  formData.accounts?.linkedin) ||
                formData.accounts?.google ||
                formData.accounts?.linkedin
            );

            setIsExternalImage(isAccountLinked);
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

    // If phone number changes and checkbox is checked, update WhatsApp number
    if (field === "phone" && whatsappSameAsPhone && typeof value === "string") {
      setFormData((prev) => ({
        ...prev,
        whatsappNumber: value,
      }));
    }

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle checkbox change for "WhatsApp same as phone"
  const handleWhatsappSameAsPhone = (checked: boolean) => {
    setWhatsappSameAsPhone(checked);
    if (checked) {
      // Copy phone number to WhatsApp number
      setFormData((prev) => ({
        ...prev,
        whatsappNumber: prev.phone || "",
      }));
    }
  };

  const handleAccountsChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [field]: value,
      },
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
    } else {
      // Validate new password against rules
      const passwordValidationErrors = validatePassword(
        passwordData.newPassword
      );
      if (Object.keys(passwordValidationErrors).length > 0) {
        // Combine all password validation errors into one message
        const errorMessages = Object.values(passwordValidationErrors).filter(
          Boolean
        );
        newErrors.newPassword = errorMessages.join(". ");
      }
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

  const toggleSetPasswordVisibility = (field: string) => {
    setShowInitialPasswords((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const handleSetPasswordChange = (field: string, value: string) => {
    setInitialPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (initialPasswordErrors[field]) {
      setInitialPasswordErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateSetPasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!initialPasswordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else {
      // Validate new password against rules
      const passwordValidationErrors = validatePassword(
        initialPasswordData.newPassword
      );
      if (Object.keys(passwordValidationErrors).length > 0) {
        // Combine all password validation errors into one message
        const errorMessages = Object.values(passwordValidationErrors).filter(
          Boolean
        );
        newErrors.newPassword = errorMessages.join(". ");
      }
    }

    if (!initialPasswordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (
      initialPasswordData.newPassword !== initialPasswordData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setInitialPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSetPasswordForm()) {
      return;
    }

    setSettingPassword(true);

    try {
      const response = await apiClient.put("/users/set-password", {
        newPassword: initialPasswordData.newPassword,
      });

      if (response.data) {
        toast.success(
          "Password set successfully! You can now sign in with email/password."
        );
        setInitialPasswordData({
          newPassword: "",
          confirmPassword: "",
        });
        setInitialPasswordErrors({});

        // If we were in the process of unlinking, proceed with that now
        if (accountToUnlink) {
          // Small delay to show success message before proceeding
          setTimeout(() => {
            setShowSetPasswordModal(false);
            proceedWithUnlink();
          }, 500);
        } else {
          setShowSetPasswordModal(false);
        }
      }
    } catch (error: any) {
      console.error("Error setting password:", error);

      if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to set password. Please try again.");
      }
    } finally {
      setSettingPassword(false);
    }
  };

  const handleEmailChange = (field: string, value: string) => {
    setEmailData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (emailErrors[field]) {
      setEmailErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateEmailForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!emailData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!emailData.newEmail) {
      newErrors.newEmail = "New email is required";
    } else if (!validateEmail(emailData.newEmail)) {
      newErrors.newEmail = "Please enter a valid email address";
    } else if (
      emailData.newEmail.toLowerCase() === formData.email?.toLowerCase()
    ) {
      newErrors.newEmail = "New email must be different from current email";
    }

    setEmailErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmailForm()) {
      return;
    }

    setUpdatingEmail(true);

    try {
      const response = await apiClient.put("/users/change-email", {
        currentPassword: emailData.currentPassword,
        newEmail: emailData.newEmail,
      });

      if (response.data) {
        toast.success(
          "Email updated successfully! Please check your new email for verification."
        );
        setShowEmailModal(false);
        setEmailData({
          currentPassword: "",
          newEmail: "",
        });
        setEmailErrors({});

        // Update form data and session
        setFormData((prev) => ({
          ...prev,
          email: emailData.newEmail,
        }));

        // Refresh profile to get updated data
        await fetchProfile();
        await updateSession();
      }
    } catch (error: any) {
      console.error("Error updating email:", error);

      if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
        if (error.response.data.error.message.includes("password")) {
          setEmailErrors({
            currentPassword: "Current password is incorrect",
          });
        } else if (
          error.response.data.error.message.includes("already in use")
        ) {
          setEmailErrors({
            newEmail: "Email already in use by another account",
          });
        }
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update email. Please try again.");
      }
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUnlinkGoogle = () => {
    setAccountToUnlink("google");
    setShowUnlinkConfirmModal(true);
  };

  const handleUnlinkLinkedIn = () => {
    setAccountToUnlink("linkedin");
    setShowUnlinkConfirmModal(true);
  };

  const confirmUnlink = () => {
    if (!accountToUnlink) return;

    // If user's provider is the account they're trying to unlink, they need to set a password first
    if (formData.provider === accountToUnlink) {
      // Close confirmation modal and show set password modal
      setShowUnlinkConfirmModal(false);
      setShowSetPasswordModal(true);
    } else {
      // User already has credentials provider, proceed with unlinking
      proceedWithUnlink();
    }
  };

  const proceedWithUnlink = async () => {
    if (!accountToUnlink) return;

    if (accountToUnlink === "google") {
      setUnlinkingGoogle(true);
    } else {
      setUnlinkingLinkedIn(true);
    }

    setShowUnlinkConfirmModal(false);

    try {
      const endpoint =
        accountToUnlink === "google"
          ? "/users/unlink-google"
          : "/users/unlink-linkedin";
      const response = await apiClient.delete(endpoint);

      if (response.data) {
        // Update form data to remove account and change provider if needed
        setFormData((prev) => ({
          ...prev,
          provider:
            prev.provider === accountToUnlink ? "credentials" : prev.provider,
          accounts: {
            ...prev.accounts,
            [accountToUnlink]: undefined,
          },
        }));

        // Clear profile image if it was from external source (Google/LinkedIn)
        if (
          profileImageUrl &&
          !profileImageUrl.includes(".s3.") &&
          !profileImageUrl.includes("s3.amazonaws.com")
        ) {
          setProfileImageUrl("");
          setProfileImageS3Key("");
          setIsExternalImage(false);
        }

        // Update form data to remove profile picture if it was external
        setFormData((prev) => ({
          ...prev,
          profilePicture:
            prev.profilePicture &&
            !prev.profilePicture.includes(".s3.") &&
            !prev.profilePicture.includes("s3.amazonaws.com")
              ? undefined
              : prev.profilePicture,
        }));

        // Refresh profile to get updated data
        await fetchProfile();
        await updateSession();

        toast.success(
          `${
            accountToUnlink === "google" ? "Google" : "LinkedIn"
          } account unlinked successfully! You can now change your email and profile picture.`
        );
      }
    } catch (error: any) {
      console.error(`Error unlinking ${accountToUnlink} account:`, error);

      if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(
          `Failed to unlink ${
            accountToUnlink === "google" ? "Google" : "LinkedIn"
          } account. Please try again.`
        );
      }
    } finally {
      if (accountToUnlink === "google") {
        setUnlinkingGoogle(false);
      } else {
        setUnlinkingLinkedIn(false);
      }
      setAccountToUnlink(null);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (file: File) => {
    // Don't allow upload if current image is from external source AND account is still linked
    const isAccountLinked =
      (formData.provider === "google" && formData.accounts?.google) ||
      (formData.provider === "linkedin" && formData.accounts?.linkedin) ||
      formData.accounts?.google ||
      formData.accounts?.linkedin;

    if (isExternalImage && isAccountLinked) {
      toast.error(
        "Cannot change profile picture. Your account is connected to Google or LinkedIn. Please unlink the account first."
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

  const validateInstagramUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    const instagramRegex =
      /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/[a-zA-Z0-9_.]+\/?$/;
    return instagramRegex.test(url);
  };

  const validatePortfolioUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(url);
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (): number => {
    let completedFields = 0;
    let totalFields = 0;

    // Basic Information (5 fields)
    totalFields += 5;
    if (formData.firstName) completedFields++;
    if (formData.lastName) completedFields++;
    if (formData.email) completedFields++;
    if (formData.phone) completedFields++;
    if (formData.dob) completedFields++;

    // Profile Picture (1 field)
    totalFields += 1;
    if (formData.profilePicture) completedFields++;

    // Address (5 fields)
    totalFields += 5;
    if (formData.address?.address) completedFields++;
    if (formData.address?.city) completedFields++;
    if (formData.address?.state) completedFields++;
    if (formData.address?.country) completedFields++;
    if (formData.address?.pincode) completedFields++;

    // User type specific fields
    if (formData.userType === "student") {
      // Student specific fields (6 fields)
      // Note: Current Position, Current Company, Domain, and Work experience are NOT counted
      // They are only shown for Working Professionals and are optional
      totalFields += 6;
      if (formData.collegeName) completedFields++;
      if (formData.degreeName) completedFields++;
      if (formData.passingYear) completedFields++;
      if (formData.experienceLevel) completedFields++;
      if (formData.areaOfInterest) completedFields++;
      if (formData.portfolio) completedFields++;
    } else if (formData.userType === "instructor") {
      // Instructor specific fields (4 fields)
      totalFields += 4;
      if (formData.bio) completedFields++;
      if (formData.currentPosition) completedFields++;
      if (formData.currentCompany) completedFields++;
      if (formData.linkedinUrl) completedFields++;
    }

    // Social profiles (optional but counted) - 2 fields
    totalFields += 2;
    if (formData.accounts?.instagram) completedFields++;
    if (formData.accounts?.github) completedFields++;

    if (totalFields === 0) return 0;
    return Math.round((completedFields / totalFields) * 100);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // First name validation (mandatory)
    if (!formData.firstName || formData.firstName.trim() === "") {
      newErrors.firstName = "First name is required";
    }

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

      if (
        formData.accounts?.instagram &&
        !validateInstagramUrl(formData.accounts.instagram)
      ) {
        newErrors.instagram =
          "Please enter a valid Instagram URL (https://instagram.com/username)";
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

        // Update session with new user data (including firstName)
        if (updateSession) {
          await updateSession({
            firstName: updatedUserData.firstName || formData.firstName,
            lastName: updatedUserData.lastName || formData.lastName,
            email: updatedUserData.email || formData.email,
            phone: updatedUserData.phone || formData.phone,
            profilePicture:
              updatedUserData.profilePicture || formData.profilePicture,
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
      {/* Header Section */}
      <div className="bg-linear-to-r from-orange-50 to-white rounded-xl p-6 border border-orange-100 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                viewer
                  ? router.push(getPostLoginRedirectPath(viewer, undefined))
                  : router.push("/")
              }
              className="p-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-orange-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md group"
              title="Back"
            >
              <ChevronLeftIcon className="size-5 text-gray-700 group-hover:text-orange-600 transition-colors" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Profile Settings
              </h1>
              <p className="text-sm text-gray-600">
                Manage your account information and preferences
              </p>
            </div>
          </div>

          {/* Profile Completion Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Profile Completion
              </span>
              <span className="text-sm font-semibold text-orange-600">
                {calculateProfileCompletion()}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-linear-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${calculateProfileCompletion()}%` }}
              />
            </div>
            {calculateProfileCompletion() < 100 && (
              <p className="text-xs text-gray-500 mt-1.5">
                Complete your profile
              </p>
            )}
            {calculateProfileCompletion() === 100 && (
              <p className="text-xs text-green-600 mt-1.5 font-medium">
                ✓ Profile complete!
              </p>
            )}
          </div>
        </div>
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
              {(() => {
                const isAccountLinked = Boolean(
                  (formData.provider === "google" &&
                    formData.accounts?.google) ||
                    (formData.provider === "linkedin" &&
                      formData.accounts?.linkedin) ||
                    formData.accounts?.google ||
                    formData.accounts?.linkedin
                );
                const shouldBlockChanges = isExternalImage && isAccountLinked;

                return (
                  <>
                    {!shouldBlockChanges && (
                      <div
                        className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        onClick={() => {
                          if (!shouldBlockChanges && !isUploadingImage) {
                            document
                              .getElementById("profile-image-input")
                              ?.click();
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
                    {shouldBlockChanges && (
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="text-white text-center px-4">
                          <Lock className="w-6 h-6 mx-auto mb-2" />
                          <span className="text-xs font-medium select-none">
                            Image from connected account
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Hidden file input */}
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  const isAccountLinked = Boolean(
                    (formData.provider === "google" &&
                      formData.accounts?.google) ||
                      (formData.provider === "linkedin" &&
                        formData.accounts?.linkedin) ||
                      formData.accounts?.google ||
                      formData.accounts?.linkedin
                  );
                  const shouldBlockChanges = isExternalImage && isAccountLinked;

                  if (file && !shouldBlockChanges) {
                    handleImageUpload(file);
                  }
                }}
                className="hidden"
                disabled={
                  isUploadingImage ||
                  (isExternalImage &&
                    Boolean(
                      (formData.provider === "google" &&
                        formData.accounts?.google) ||
                        (formData.provider === "linkedin" &&
                          formData.accounts?.linkedin) ||
                        formData.accounts?.google ||
                        formData.accounts?.linkedin
                    ))
                }
              />
            </div>

            {/* Remove Image Button - Show for S3 images or unlinked accounts */}
            {profileImageUrl &&
              (() => {
                const isAccountLinked = Boolean(
                  (formData.provider === "google" &&
                    formData.accounts?.google) ||
                    (formData.provider === "linkedin" &&
                      formData.accounts?.linkedin) ||
                    formData.accounts?.google ||
                    formData.accounts?.linkedin
                );
                return !isExternalImage || !isAccountLinked;
              })() && (
                <button
                  onClick={handleImageRemove}
                  disabled={isUploadingImage}
                  className="cursor-pointer mt-3 px-3 py-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImage ? "Removing..." : "Remove Image"}
                </button>
              )}
            {/* Info message for external images - only show if account is still linked */}
            {profileImageUrl &&
              isExternalImage &&
              (() => {
                const isAccountLinked = Boolean(
                  (formData.provider === "google" &&
                    formData.accounts?.google) ||
                    (formData.provider === "linkedin" &&
                      formData.accounts?.linkedin) ||
                    formData.accounts?.google ||
                    formData.accounts?.linkedin
                );
                return isAccountLinked;
              })() && (
                <div className="mt-3 px-3 py-2 text-xs text-gray-600 bg-gray-50 rounded-full text-center">
                  Profile picture from connected account{" "}
                  {formData.provider === "google" && "(Google)"}
                  {formData.provider === "linkedin" && "(LinkedIn)"}
                  {formData.provider !== "google" &&
                    formData.provider !== "linkedin" &&
                    (formData.accounts?.google ||
                      formData.accounts?.linkedin) &&
                    "(Google/LinkedIn)"}
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
                  <button
                    onClick={() => setShowComingSoonModal(true)}
                    className="w-full bg-[#006699] flex gap-2 items-center justify-center px-6 py-3 text-white rounded-2xl shadow-[inset_0_-2px_2px_0_rgba(0,0,0,0.2)] cursor-pointer hover:bg-[#005588] transition-colors"
                  >
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
                  <WhiteButton
                    onClick={() => setShowComingSoonModal(true)}
                    className="w-full flex gap-2 items-center justify-center"
                  >
                    <ImageComponent
                      src="/google-icon.svg"
                      alt="Google"
                      width={20}
                      height={20}
                      className="size-4"
                    />
                    <span>Link Google</span>
                  </WhiteButton>
                )}
              {formData.accounts?.google && (
                <button
                  onClick={handleUnlinkGoogle}
                  disabled={unlinkingGoogle}
                  className="w-full bg-yellow-600 flex gap-2 items-center justify-center px-6 py-3 text-white rounded-2xl shadow-[inset_0_-2px_4px_0_rgba(0,0,0,0.3)] cursor-pointer hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unlinkingGoogle ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Unlinking...</span>
                    </>
                  ) : (
                    <>
                      <ImageComponent
                        src="/google-icon.svg"
                        alt="Google"
                        width={20}
                        height={20}
                        className="size-4"
                      />
                      <span>Unlink Google</span>
                    </>
                  )}
                </button>
              )}
              {formData.accounts?.linkedin && (
                <button
                  onClick={handleUnlinkLinkedIn}
                  disabled={unlinkingLinkedIn}
                  className="w-full bg-red-600 flex gap-2 items-center justify-center px-6 py-3 text-white rounded-2xl shadow-[inset_0_-2px_4px_0_rgba(0,0,0,0.3)] cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unlinkingLinkedIn ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Unlinking...</span>
                    </>
                  ) : (
                    <>
                      <ImageComponent
                        src="/linkedin-icon.svg"
                        alt="LinkedIn"
                        width={20}
                        height={20}
                        className="size-4"
                      />
                      <span>Unlink LinkedIn</span>
                    </>
                  )}
                </button>
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
                  required
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                    {formData.provider === "google" && (
                      <span className="ml-2 text-xs text-gray-500">
                        (Linked to Google)
                      </span>
                    )}
                    {formData.provider === "linkedin" && (
                      <span className="ml-2 text-xs text-gray-500">
                        (Linked to LinkedIn)
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      disabled
                      className="opacity-75 select-none! flex-1"
                      error={errors.email}
                    />
                    {formData.provider !== "google" &&
                      formData.provider !== "linkedin" && (
                        <button
                          type="button"
                          onClick={() => setShowEmailModal(true)}
                          className="px-4 py-3 bg-orange-600 cursor-pointer text-white font-medium rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                          title="Change email"
                        >
                          <Edit3 className="w-4 h-4" />
                          Change
                        </button>
                      )}
                    {(formData.provider === "google" ||
                      formData.provider === "linkedin") && (
                      <span className="px-4 py-3 text-sm text-gray-500 italic">
                        Unlink{" "}
                        {formData.provider === "google" ? "Google" : "LinkedIn"}{" "}
                        to change email
                      </span>
                    )}
                  </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-black">
                      WhatsApp Number
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappSameAsPhone}
                        onChange={(e) =>
                          handleWhatsappSameAsPhone(e.target.checked)
                        }
                        className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <span className="text-xs text-gray-600">
                        Same as phone number
                      </span>
                    </label>
                  </div>
                  <Input
                    type="tel"
                    placeholder="+91XXXXXXXXXX"
                    value={formData.whatsappNumber || ""}
                    onChange={(e) =>
                      handleInputChange("whatsappNumber", e.target.value)
                    }
                    error={errors.whatsappNumber}
                    maxLength={15}
                    disabled={whatsappSameAsPhone}
                    className={
                      whatsappSameAsPhone ? "opacity-60 cursor-not-allowed" : ""
                    }
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
                handleAccountsChange={handleAccountsChange}
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

            {/* Experience Section - Show for instructors, or students who are Working Professionals */}
            {((formData.userType === "student" &&
              (formData.experienceLevel ===
                "Working Professional - Tech Domain" ||
                formData.experienceLevel ===
                  "Working Professional - Non Tech Domain")) ||
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
              {getPasswordRequirementsText()}
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

      {/* Email Change Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setEmailData({
            currentPassword: "",
            newEmail: "",
          });
          setEmailErrors({});
        }}
        title="Change Email"
        className="max-w-md"
      >
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showEmailPassword ? "text" : "password"}
                value={emailData.currentPassword}
                onChange={(e) =>
                  handleEmailChange("currentPassword", e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowEmailPassword(!showEmailPassword);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showEmailPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {emailErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">
                {emailErrors.currentPassword}
              </p>
            )}
          </div>

          {/* New Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Email
            </label>
            <input
              type="email"
              value={emailData.newEmail}
              onChange={(e) => handleEmailChange("newEmail", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
              placeholder="Enter your new email address"
            />
            {emailErrors.newEmail && (
              <p className="mt-1 text-sm text-red-500">
                {emailErrors.newEmail}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              A verification email will be sent to your new email address.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={updatingEmail}
              className="w-full px-4 py-3 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updatingEmail && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {updatingEmail ? "Updating Email..." : "Update Email"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Unlink Account Confirmation Modal */}
      <Modal
        isOpen={showUnlinkConfirmModal}
        onClose={() => {
          setShowUnlinkConfirmModal(false);
          setAccountToUnlink(null);
        }}
        className="max-w-md"
      >
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-8">
          <div className="mb-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Unlink {accountToUnlink === "google" ? "Google" : "LinkedIn"}{" "}
              Account?
            </h2>
            <p className="text-gray-600 text-sm">
              Are you sure you want to unlink your{" "}
              {accountToUnlink === "google" ? "Google" : "LinkedIn"} account?
              You will need to use email/password to sign in.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowUnlinkConfirmModal(false);
                setAccountToUnlink(null);
              }}
              className="flex-1 px-4 py-3 bg-gray-100 cursor-pointer text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmUnlink}
              disabled={unlinkingGoogle || unlinkingLinkedIn}
              className="flex-1 px-4 py-3 bg-yellow-600 cursor-pointer text-white font-medium rounded-xl hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {(unlinkingGoogle || unlinkingLinkedIn) && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              {unlinkingGoogle || unlinkingLinkedIn ? "Unlinking..." : "Unlink"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Set Password Modal */}
      <Modal
        isOpen={showSetPasswordModal}
        onClose={() => {
          if (!accountToUnlink) {
            // Only allow closing if not in the process of unlinking
            setShowSetPasswordModal(false);
            setInitialPasswordData({
              newPassword: "",
              confirmPassword: "",
            });
            setInitialPasswordErrors({});
          }
        }}
        title={
          accountToUnlink ? "Set Password to Unlink Account" : "Set Password"
        }
        className="max-w-md"
      >
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="text-sm text-orange-800">
            <strong>Important:</strong>{" "}
            {accountToUnlink
              ? `Before unlinking your ${
                  accountToUnlink === "google" ? "Google" : "LinkedIn"
                } account, you need to set a password. You'll need this to sign in with your email and password.`
              : "Please set a password for your account. You'll need this to sign in with your email and password."}
          </p>
        </div>
        <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showInitialPasswords.new ? "text" : "password"}
                value={initialPasswordData.newPassword}
                onChange={(e) =>
                  handleSetPasswordChange("newPassword", e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleSetPasswordVisibility("new");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showInitialPasswords.new ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {initialPasswordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-500">
                {initialPasswordErrors.newPassword}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {getPasswordRequirementsText()}
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showInitialPasswords.confirm ? "text" : "password"}
                value={initialPasswordData.confirmPassword}
                onChange={(e) =>
                  handleSetPasswordChange("confirmPassword", e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleSetPasswordVisibility("confirm");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showInitialPasswords.confirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {initialPasswordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">
                {initialPasswordErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={settingPassword}
              className="w-full px-4 py-3 bg-orange-600 cursor-pointer text-white font-medium rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {settingPassword && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {settingPassword ? "Setting Password..." : "Set Password"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Coming Soon Modal */}
      <Modal
        isOpen={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
      >
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-linear-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Feature Coming Soon
            </h2>
            <p className="text-gray-600 text-sm">
              We're working hard to bring you this feature. Stay tuned for
              updates!
            </p>
          </div>
          <OrangeButton
            onClick={() => setShowComingSoonModal(false)}
            className="w-full py-3 font-medium"
          >
            Got it
          </OrangeButton>
        </div>
      </Modal>
    </div>
  );
};

// Student specific fields component
const StudentFields = ({
  formData,
  handleInputChange,
  handleAccountsChange,
  errors,
}: {
  formData: Partial<ExtendedUser>;
  handleInputChange: (field: string, value: string | number) => void;
  handleAccountsChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}) => {
  const experienceLevels = EXPERIENCE_LEVELS;

  // Degree dropdown selection. "Other" reveals a free-text field; a stored
  // value that isn't a preset opens as "Other" with the text prefilled
  // (mirrors the checkout flow).
  const [selectedDegree, setSelectedDegree] = useState<string>(() => {
    const degree = formData.degreeName || "";
    if (!degree) return "";
    return DEGREE_OPTIONS.some((o) => o.value === degree) ? degree : "Other";
  });

  useEffect(() => {
    const degree = formData.degreeName || "";
    if (!degree) {
      setSelectedDegree("");
      return;
    }
    setSelectedDegree(
      DEGREE_OPTIONS.some((o) => o.value === degree) ? degree : "Other",
    );
  }, [formData.degreeName]);

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
          label="University / College Name"
          required
          placeholder="Search and select your university / college"
          value={formData.collegeName || ""}
          onChange={(value) => {
            handleInputChange("collegeName", value);
            // Custom-text entries clear the canonical link so we don't
            // ship a stale ID alongside a free-form name.
            handleInputChange("college", "");
          }}
          onSelect={(c) => {
            handleInputChange("collegeName", c.display);
            handleInputChange("college", c._id);
          }}
          error={errors.collegeName}
        />
        <div className="flex flex-col gap-2">
          <Select
            label="Course / Degree Name"
            placeholder="Select your course / degree"
            options={DEGREE_OPTIONS}
            searchable
            searchPlaceholder="Search degrees..."
            value={selectedDegree}
            onChange={(value) => {
              setSelectedDegree(value);
              // Preset value flows to degreeName; "Other" clears it so the
              // free-text field below becomes the source.
              handleInputChange("degreeName", value !== "Other" ? value : "");
            }}
          />
          {selectedDegree === "Other" && (
            <Input
              label="Specify Course / Degree"
              placeholder="Enter your course / degree name"
              value={formData.degreeName || ""}
              onChange={(e) => handleInputChange("degreeName", e.target.value)}
            />
          )}
        </div>
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
        {/* Show working professional fields only when experience level is Working Professional */}
        {(formData.experienceLevel === "Working Professional - Tech Domain" ||
          formData.experienceLevel ===
            "Working Professional - Non Tech Domain") && (
          <>
            <Input
              label="Current Position"
              placeholder="Enter your current position"
              value={formData.currentPosition || ""}
              onChange={(e) =>
                handleInputChange("currentPosition", e.target.value)
              }
            />
            <Input
              label="Current Company"
              placeholder="Enter your current company"
              value={formData.currentCompany || ""}
              onChange={(e) =>
                handleInputChange("currentCompany", e.target.value)
              }
            />
            <Input
              label="Domain"
              placeholder="Enter your domain/field"
              value={formData.domain || ""}
              onChange={(e) => handleInputChange("domain", e.target.value)}
            />
          </>
        )}
        <Input
          label="Portfolio URL"
          placeholder="Enter your portfolio URL"
          value={formData.portfolio || ""}
          onChange={(e) => handleInputChange("portfolio", e.target.value)}
          error={errors.portfolio}
        />
        <div className="md:col-span-2">
          <div className="w-full flex flex-col">
            <label className="font-medium text-black mb-2 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                  fill="currentColor"
                />
              </svg>
              Instagram URL
            </label>
            <Input
              placeholder="https://instagram.com/your-username"
              value={formData.accounts?.instagram || ""}
              onChange={(e) =>
                handleAccountsChange("instagram", e.target.value)
              }
              error={errors.instagram}
            />
          </div>
        </div>
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
        <Input
          label="Field"
          placeholder="e.g., AI Python"
          value={formData.field || ""}
          onChange={(e) => handleInputChange("field", e.target.value)}
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
          className="flex items-center cursor-pointer gap-2 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
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
                              ).toLocaleDateString("en-IN", {
                                timeZone: "Asia/Kolkata",
                              })} - ${new Date(
                                experience.duration.to
                              ).toLocaleDateString("en-IN", {
                                timeZone: "Asia/Kolkata",
                              })}`
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
