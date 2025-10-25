"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrangeButton, WhiteButton, FullScreenLoader } from "@/components/ui";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  profileFormSchema,
  ProfileFormData,
  getDefaultValues,
} from "@/types/profileForm";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  User as UserIcon,
  GraduationCap,
  Users,
} from "lucide-react";

const ProfileSettingsPage = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"basic" | "role-specific">(
    "basic"
  );

  const user = session?.user as any; // Type assertion for session user
  const userType = user?.userType || "student";

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: getDefaultValues(user, userType),
    mode: "onChange",
  });

  // Field arrays for experience
  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control,
    name: "experience",
  });

  const {
    fields: previousExperienceFields,
    append: appendPreviousExperience,
    remove: removePreviousExperience,
  } = useFieldArray({
    control,
    name: "previousExperience",
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!session && isClient) {
      router.push("/auth/login");
    }
  }, [session, router, isClient]);

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      reset(getDefaultValues(user, userType));
    }
  }, [user, userType, reset]);

  // Fetch user profile data from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);

        // Import apiClient dynamically to avoid SSR issues
        const { default: apiClient } = await import("@/configs/apiConfig");

        const response = await apiClient.get("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (response.data.success) {
          const profileData = response.data.data.user;

          // Update the form with fetched profile data
          reset(
            getDefaultValues(profileData, profileData.userType || userType)
          );

          // Update session with fresh data if needed
          await update({
            ...session,
            user: {
              ...session.user,
              ...profileData,
            },
          });
        }
      } catch (error: any) {
        console.error("Failed to fetch user profile:", error);

        // Handle different types of errors
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          router.push("/auth/login");
        } else if (error.response?.status === 404) {
          toast.error("Profile not found. Please contact support.");
        } else if (error.code === "NETWORK_ERROR" || !error.response) {
          toast.error(
            "Network error. Please check your connection and try again."
          );
        } else {
          toast.error("Failed to load profile data. Please refresh the page.");
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    // Only fetch if we have a session and haven't loaded profile data yet
    if (session && isLoadingProfile) {
      fetchUserProfile();
    }
  }, [session, reset, userType, update, isLoadingProfile, router]);

  // Form submission handler using react-hook-form
  const onSubmit = async () => {
    try {
      // Here you would make an API call to update the user profile
      // For now, we'll just simulate the update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // toast.success("Profile updated successfully!");

      // Clear the first-time flag after profile completion
      if (user?.isFirstTime) {
        // Update session to clear isFirstTime flag
        await update({
          ...session,
          user: {
            ...session?.user,
            isFirstTime: false,
          },
        });
      }

      // Update the session with new data
      await update();

      // Redirect to dashboard after successful profile update
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error("Profile update error:", error);
    }
  };

  const getRoleIcon = () => {
    switch (userType) {
      case "instructor":
        return <GraduationCap className="w-5 h-5" />;
      case "student":
        return <UserIcon className="w-5 h-5" />;
      case "collaborator":
        return <Users className="w-5 h-5" />;
      default:
        return <UserIcon className="w-5 h-5" />;
    }
  };

  const getRoleTitle = () => {
    switch (userType) {
      case "instructor":
        return "Instructor Profile";
      case "student":
        return "Student Profile";
      case "collaborator":
        return "Collaborator Profile";
      default:
        return "User Profile";
    }
  };

  if (!isClient || isLoadingProfile) {
    return (
      <FullScreenLoader
        text={
          isLoadingProfile ? "Loading profile data..." : "Loading profile..."
        }
        size="lg"
        variant="spinner"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" suppressHydrationWarning>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              {getRoleIcon()}
              <h1 className="text-2xl font-bold text-gray-900">
                {getRoleTitle()}
              </h1>
            </div>
          </div>
          <p className="text-gray-600">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("basic")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "basic"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setActiveTab("role-specific")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "role-specific"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {userType === "instructor"
                  ? "Professional Details"
                  : userType === "student"
                  ? "Academic Details"
                  : "Collaboration Details"}
              </button>
            </nav>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {activeTab === "basic" && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="First Name"
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
                      <div suppressHydrationWarning>
                        <Input
                          label="Email"
                          type="email"
                          {...register("email")}
                          required
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div suppressHydrationWarning>
                      <Input
                        label="Phone Number"
                        {...register("phone")}
                        placeholder="10 digit phone number"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div suppressHydrationWarning>
                      <Input
                        label="WhatsApp Number"
                        {...register("whatsappNumber")}
                        placeholder="10 digit WhatsApp number"
                      />
                      {errors.whatsappNumber && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.whatsappNumber.message}
                        </p>
                      )}
                    </div>
                    <Input
                      label="Profile Picture URL"
                      {...register("profilePicture")}
                      placeholder="https://example.com/image.jpg"
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <Controller
                        name="dob"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            selected={field.value}
                            onChange={field.onChange}
                            placeholderText="Select date of birth"
                            maxDate={new Date()}
                            dateFormat="MM/dd/yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Input
                        label="Address"
                        {...register("address.address")}
                        placeholder="Street address, apartment, suite, etc."
                      />
                    </div>
                    <Input label="City" {...register("address.city")} />
                    <Input label="State" {...register("address.state")} />
                    <Input label="Country" {...register("address.country")} />
                    <Input label="Pincode" {...register("address.pincode")} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "role-specific" && (
              <div className="space-y-6">
                {userType === "student" && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Academic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="College/University Name"
                        {...register("collegeName")}
                      />
                      <div>
                        <Input
                          label="Passing Year"
                          type="number"
                          {...register("passingYear", { valueAsNumber: true })}
                          min={1900}
                          max={new Date().getFullYear() + 10}
                        />
                        {errors.passingYear && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.passingYear.message}
                          </p>
                        )}
                      </div>
                      <Input
                        label="Area of Interest"
                        {...register("areaOfInterest")}
                        placeholder="e.g., Computer Science, Data Science"
                      />
                      <Input
                        label="Current Position"
                        {...register("studentCurrentPosition")}
                        placeholder="e.g., Software Developer, Student"
                      />
                      <Input
                        label="Current Company"
                        {...register("studentCurrentCompany")}
                        placeholder="e.g., Google, Microsoft, or University Name"
                      />
                      <Input
                        label="Domain"
                        {...register("domain")}
                        placeholder="e.g., Technology, Healthcare, Finance"
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="Portfolio URL"
                          {...register("portfolio")}
                          placeholder="https://yourportfolio.com"
                        />
                        {errors.portfolio && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.portfolio.message}
                          </p>
                        )}
                      </div>

                      {/* Student Experience */}
                      <div className="md:col-span-2">
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          Work Experience
                        </h4>
                        <div className="space-y-4">
                          {experienceFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                  label="Company Name"
                                  {...register(
                                    `experience.${index}.companyName`
                                  )}
                                />
                                <Input
                                  label="Position"
                                  {...register(`experience.${index}.position`)}
                                />
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                  </label>
                                  <Controller
                                    name={`experience.${index}.duration.from`}
                                    control={control}
                                    render={({ field }) => (
                                      <DatePicker
                                        selected={field.value}
                                        onChange={field.onChange}
                                        placeholderText="Select start date"
                                        maxDate={new Date()}
                                        dateFormat="MM/dd/yyyy"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        showYearDropdown
                                        showMonthDropdown
                                        dropdownMode="select"
                                      />
                                    )}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                  </label>
                                  <Controller
                                    name={`experience.${index}.duration.to`}
                                    control={control}
                                    render={({ field }) => (
                                      <DatePicker
                                        selected={field.value}
                                        onChange={field.onChange}
                                        placeholderText="Select end date"
                                        maxDate={new Date()}
                                        minDate={watch(
                                          `experience.${index}.duration.from`
                                        )}
                                        dateFormat="MM/dd/yyyy"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        showYearDropdown
                                        showMonthDropdown
                                        dropdownMode="select"
                                      />
                                    )}
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <TextArea
                                    label="Description"
                                    {...register(
                                      `experience.${index}.description`
                                    )}
                                    rows={3}
                                    placeholder="Describe your role and responsibilities..."
                                  />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => removeExperience(index)}
                                    className="mt-3 text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove Experience
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              appendExperience({
                                companyName: "",
                                position: "",
                                duration: {
                                  from: new Date(),
                                  to: new Date(),
                                },
                                description: "",
                              })
                            }
                            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
                          >
                            + Add Work Experience
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {userType === "instructor" && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Professional Information
                    </h3>
                    <div className="space-y-6">
                      <TextArea
                        label="Bio"
                        {...register("bio")}
                        placeholder="Tell us about yourself, your experience, and expertise..."
                        rows={4}
                        maxLength={500}
                        showWordCount
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Current Position"
                          {...register("instructorCurrentPosition")}
                          placeholder="e.g., Senior Software Engineer"
                        />
                        <Input
                          label="Current Company"
                          {...register("instructorCurrentCompany")}
                          placeholder="e.g., Google, Microsoft"
                        />
                        <div className="md:col-span-2">
                          <Input
                            label="LinkedIn Profile URL"
                            {...register("linkedinUrl")}
                            placeholder="https://linkedin.com/in/yourprofile"
                          />
                          {errors.linkedinUrl && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.linkedinUrl.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Previous Experience */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          Previous Experience
                        </h4>
                        <div className="space-y-4">
                          {previousExperienceFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                  label="Company Name"
                                  {...register(
                                    `previousExperience.${index}.companyName`
                                  )}
                                />
                                <Input
                                  label="Position"
                                  {...register(
                                    `previousExperience.${index}.position`
                                  )}
                                />
                                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Start Date
                                    </label>
                                    <Controller
                                      name={`previousExperience.${index}.duration.from`}
                                      control={control}
                                      render={({ field }) => (
                                        <DatePicker
                                          selected={field.value}
                                          onChange={field.onChange}
                                          placeholderText="Select start date"
                                          maxDate={new Date()}
                                          dateFormat="MM/dd/yyyy"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                          showYearDropdown
                                          showMonthDropdown
                                          dropdownMode="select"
                                        />
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      End Date
                                    </label>
                                    <Controller
                                      name={`previousExperience.${index}.duration.to`}
                                      control={control}
                                      render={({ field }) => (
                                        <DatePicker
                                          selected={field.value}
                                          onChange={field.onChange}
                                          placeholderText="Select end date"
                                          maxDate={new Date()}
                                          minDate={watch(
                                            `previousExperience.${index}.duration.from`
                                          )}
                                          dateFormat="MM/dd/yyyy"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                          showYearDropdown
                                          showMonthDropdown
                                          dropdownMode="select"
                                        />
                                      )}
                                    />
                                  </div>
                                </div>
                                <div className="md:col-span-2">
                                  <TextArea
                                    label="Description"
                                    {...register(
                                      `previousExperience.${index}.description`
                                    )}
                                    rows={3}
                                    placeholder="Describe your role and achievements..."
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removePreviousExperience(index)}
                                className="mt-3 text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove Experience
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              appendPreviousExperience({
                                companyName: "",
                                position: "",
                                duration: {
                                  from: new Date(),
                                  to: new Date(),
                                },
                                description: "",
                              })
                            }
                            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
                          >
                            + Add Previous Experience
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 mt-8">
              <WhiteButton onClick={() => router.back()} className="px-6 py-3">
                Cancel
              </WhiteButton>
              <OrangeButton
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </OrangeButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
