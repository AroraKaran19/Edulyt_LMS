"use client";
import { useState, useCallback, useEffect } from "react";
import { X, Plus, Briefcase, Check, Edit3, Save } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import DateSelector from "@/components/ui/inputs/DateSelector";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import InstructorCompanyImagesEditor from "./InstructorCompanyImagesEditor";
import PartnerAnalyticsToggles from "./PartnerAnalyticsToggles";
import { User, Instructor, Student } from "@/types/user";
import { useUpload } from "@/hooks/useUpload";
import { toast } from "react-toastify";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  formData: Partial<User & Instructor & Student>;
  /** Resets company image editor when opening edit for a user */
  companyImagesResetKey?: string;
  onClose: () => void;
  onUpdate: (data: Partial<User & Instructor & Student>) => Promise<void>;
  isUpdating: boolean;
  onFormDataChange: (
    data:
      | Partial<User & Instructor & Student>
      | ((prev: Partial<User & Instructor & Student>) => Partial<User & Instructor & Student>)
  ) => void;
}

/**
 * Pick a "Name, Location" label for the partner's linked college so the
 * CollegeSelect chip has something to render before the admin picks a new
 * one. Tolerates three shapes the parent might hand us:
 *   - populated object `{ name, location }` from `getUserById`
 *   - raw ObjectId string (admin opened the modal from a list view that
 *     bypassed the populate path)
 *   - an in-flight `partnerCollegeDisplay` we stashed after the last pick
 */
function resolvePartnerCollegeDisplay(
  formData: Partial<User & Instructor & Student> & {
    partnerCollege?: unknown;
    partnerCollegeDisplay?: string;
  },
): string {
  if (formData.partnerCollegeDisplay) return formData.partnerCollegeDisplay;
  const pc = formData.partnerCollege;
  if (pc && typeof pc === "object") {
    const obj = pc as { name?: string; location?: string };
    if (obj.name) {
      return obj.location ? `${obj.name}, ${obj.location}` : obj.name;
    }
  }
  return "";
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  formData,
  companyImagesResetKey = "",
  onClose,
  onUpdate,
  isUpdating,
  onFormDataChange,
}) => {
  const { uploadFile, deleteFile } = useUpload();
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [profileImageS3Key, setProfileImageS3Key] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [mediaSource, setMediaSource] = useState<"upload" | "url">("upload");
  const [savedExperiences, setSavedExperiences] = useState<number[]>([]);

  // Initialize saved experiences when modal opens with existing instructor data
  useEffect(() => {
    const isInstructor =
      String(user?.userType || "").toLowerCase() === "instructor" ||
      Array.isArray((formData as any)?.previousExperience);
    if (isOpen && isInstructor) {
      const exp = (formData as any).previousExperience || [];
      setSavedExperiences(exp.map((_: any, i: number) => i));
    }
  }, [isOpen, user?._id, user?.userType]);

  // Initialize profile image when user changes
  useEffect(() => {
    if (user?.profilePicture) {
      setProfileImageUrl(user.profilePicture);
      // Check if it's a URL (external or S3)
      if (user.profilePicture.startsWith("http")) {
        // Check if it's an S3 URL
        if (user.profilePicture.includes(".s3.") || user.profilePicture.includes("s3.amazonaws.com")) {
          setMediaSource("upload");
          // Extract S3 key from S3 URL
          // Format: https://bucket-name.s3.region.amazonaws.com/folder/filename
          // or: https://s3.amazonaws.com/bucket-name/folder/filename
          try {
            const url = new URL(user.profilePicture);
            const pathParts = url.pathname.split("/").filter(p => p);
            if (pathParts.length >= 2) {
              // Remove bucket name if it's the first part, then get folder/filename
              const key = pathParts.slice(1).join("/");
              setProfileImageS3Key(key);
            } else if (pathParts.length === 1) {
              setProfileImageS3Key(pathParts[0]);
            }
          } catch {
            // If URL parsing fails, try to extract from string
            const match = user.profilePicture.match(/profile-images\/[^?]+/);
            if (match) {
              setProfileImageS3Key(match[0]);
            } else {
              setProfileImageS3Key("");
            }
          }
        } else {
          // External URL
          setMediaSource("url");
          setProfileImageS3Key("");
        }
      } else {
        // Not a URL, treat as S3 key
        setMediaSource("upload");
        setProfileImageS3Key(user.profilePicture);
      }
    } else {
      setProfileImageUrl("");
      setProfileImageS3Key("");
      setMediaSource("upload");
    }
  }, [user]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (
      file: File,
      folderName: string,
      options?: { usePresignedUrl?: boolean; presignedUrlThresholdMb?: number }
    ): Promise<string> => {
      setIsUploadingImage(true);
      try {
        // Delete old image if exists
        if (profileImageS3Key && mediaSource === "upload") {
          await deleteFile(profileImageS3Key);
        }

        // Upload new image
        const result = await uploadFile(file, folderName);
        if (result.success && result.data) {
          const { url, s3Key } = result.data;
          setProfileImageUrl(url);
          setProfileImageS3Key(s3Key);
          setMediaSource("upload");
          
          // Update form data with new profile picture
          onFormDataChange({
            ...formData,
            profilePicture: url,
          });

          toast.success("Profile image uploaded successfully!");
          return url;
        }
        throw new Error(result.error || "Upload failed");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsUploadingImage(false);
      }
    },
    [uploadFile, deleteFile, profileImageS3Key, mediaSource, formData, onFormDataChange]
  );

  // Handle URL submit
  const handleUrlSubmit = useCallback(
    async (url: string) => {
      // If there's an existing uploaded file, delete it from S3
      if (profileImageS3Key && mediaSource === "upload") {
        try {
          await deleteFile(profileImageS3Key);
        } catch (error) {
          console.error("Failed to delete old profile image from S3:", error);
        }
      }
      
      setProfileImageUrl(url);
      setMediaSource("url");
      setProfileImageS3Key("");
      
      // Update form data with new profile picture URL
      onFormDataChange({
        ...formData,
        profilePicture: url,
      });

      toast.success("Profile image URL added successfully!");
    },
    [formData, onFormDataChange, profileImageS3Key, mediaSource, deleteFile]
  );

  // Handle file remove
  const handleFileRemove = useCallback(async () => {
    setIsUploadingImage(true);
    try {
      // Delete from S3 if it was uploaded
      if (profileImageS3Key && mediaSource === "upload") {
        const result = await deleteFile(profileImageS3Key);
        if (!result.success) {
          toast.error(result.error || "Failed to delete image from storage");
        }
      }

      // Clear state
      setProfileImageUrl("");
      setProfileImageS3Key("");
      setMediaSource("upload");

      // Update form data
      onFormDataChange({
        ...formData,
        profilePicture: undefined,
      });

      toast.success("Profile image removed successfully!");
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  }, [deleteFile, profileImageS3Key, mediaSource, formData, onFormDataChange]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Edit User</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Profile Photo Upload */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Photo
            </h4>
            <UploadMediaContainer
              type="image"
              title="Profile Picture"
              description="Upload a profile picture for this user (max 5MB)"
              mediaUrl={profileImageUrl}
              mediaSource={mediaSource}
              s3Key={profileImageS3Key}
              maxSize={5}
              folderName="profile-images"
              uploadContext={user._id}
              allowUrlInput={true}
              onFileUpload={handleFileUpload}
              onUrlSubmit={handleUrlSubmit}
              onFileRemove={handleFileRemove}
              isUploading={isUploadingImage}
              required={false}
            />
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName || ""}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  firstName: e.target.value,
                })
              }
            />
            <Input
              label="Last Name"
              value={formData.lastName || ""}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  lastName: e.target.value,
                })
              }
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                onFormDataChange({ ...formData, email: e.target.value })
              }
            />
            <div>
              <Select
                label="Status"
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "blocked", label: "Blocked" },
                ]}
                value={formData.status || "active"}
                onChange={(value) =>
                  onFormDataChange({ ...formData, status: value as any })
                }
              />
            </div>
            <Input
              label="Phone"
              value={formData.phone || ""}
              onChange={(e) =>
                onFormDataChange({ ...formData, phone: e.target.value })
              }
            />
            <Input
              label="WhatsApp Number"
              value={formData.whatsappNumber || ""}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  whatsappNumber: e.target.value,
                })
              }
            />
            <div>
              <DateSelector
                label="Date of Birth"
                value={
                  formData.dob ? new Date(formData.dob) : undefined
                }
                onChange={(date) =>
                  onFormDataChange({
                    ...formData,
                    dob: date || undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Instructor Specific Fields - shown before Address for visibility */}
          {(String(user?.userType || "").toLowerCase() === "instructor" ||
            Array.isArray((formData as any)?.previousExperience)) && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Professional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Current Position"
                  value={(formData as any).currentPosition || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      currentPosition: e.target.value,
                    })
                  }
                />
                <Input
                  label="Current Company"
                  value={(formData as any).currentCompany || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      currentCompany: e.target.value,
                    })
                  }
                />
                <Input
                  label="Industry"
                  placeholder="e.g., EdTech, Finance"
                  value={(formData as any).industry || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      industry: e.target.value,
                    })
                  }
                />
                <Input
                  label="Field"
                  placeholder="e.g., Data Science"
                  value={(formData as any).field || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      field: e.target.value,
                    })
                  }
                />
                <div className="md:col-span-2">
                  <Input
                    label="LinkedIn URL"
                    value={(formData as any).linkedinUrl || ""}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        linkedinUrl: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-gray-100 mt-2">
                  <InstructorCompanyImagesEditor
                    resetKey={companyImagesResetKey}
                    defaultUrls={(formData as Instructor).companyImages || []}
                    onUrlsChange={(urls) =>
                      onFormDataChange({
                        ...formData,
                        companyImages: urls,
                      })
                    }
                    uploadContext={user._id}
                    disabled={isUpdating}
                  />
                </div>

                {/* Previous Experience - same UI as Create Instructor */}
                <div className="md:col-span-2">
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
                      <OrangeButton
                        glow={false}
                        type="button"
                        onClick={() => {
                          onFormDataChange((prev) => {
                            const experiences =
                              (prev as any).previousExperience || [];
                            return {
                              ...prev,
                              previousExperience: [
                                ...experiences,
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
                            };
                          });
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Experience
                      </OrangeButton>
                    </div>

                    {((formData as any).previousExperience?.length ?? 0) ===
                    0 ? (
                      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Briefcase className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                          No previous experience added yet.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Click "Add Experience" to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {((formData as any).previousExperience || []).map(
                          (exp: any, index: number) => {
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    onFormDataChange((prev) => {
                                      const experiences = [
                                        ...((prev as any).previousExperience ||
                                          []),
                                      ];
                                      experiences.splice(index, 1);
                                      return {
                                        ...prev,
                                        previousExperience: experiences,
                                      };
                                    });
                                    setSavedExperiences((prev) =>
                                      prev
                                        .filter((i) => i !== index)
                                        .map((i) => (i > index ? i - 1 : i))
                                    );
                                  }}
                                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                                  title="Delete experience"
                                >
                                  <X className="w-4 h-4" />
                                </button>

                                {isSaved ? (
                                  <div className="pr-8">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                          {exp.position || "Position"}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                          {exp.companyName || "Company"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {exp.duration?.from &&
                                          exp.duration?.to
                                            ? `${new Date(
                                                exp.duration.from
                                              ).toLocaleDateString()} - ${new Date(
                                                exp.duration.to
                                              ).toLocaleDateString()}`
                                            : "Duration not specified"}
                                        </p>
                                      </div>
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-linear-to-r from-green-100 to-green-50 text-green-700 border border-green-200 shadow-sm">
                                        <Check className="w-3.5 h-3.5" />
                                        Saved
                                      </div>
                                    </div>
                                    {exp.description && (
                                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                                        {exp.description}
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-green-200">
                                      <div className="text-xs font-medium text-green-700 flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5" />
                                        Experience saved
                                      </div>
                                      <OrangeButton
                                        glow={false}
                                        type="button"
                                        onClick={() =>
                                          setSavedExperiences((prev) =>
                                            prev.filter((i) => i !== index)
                                          )
                                        }
                                        className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        Edit
                                      </OrangeButton>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="mb-5">
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-linear-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200 shadow-sm">
                                        <Edit3 className="w-3.5 h-3.5" />
                                        Editing
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                      <Input
                                        label="Company Name"
                                        placeholder="Enter company name"
                                        value={exp.companyName || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          onFormDataChange((prev) => {
                                            const experiences = [
                                              ...((prev as any)
                                                .previousExperience || []),
                                            ];
                                            experiences[index] = {
                                              ...experiences[index],
                                              companyName: value,
                                            };
                                            return {
                                              ...prev,
                                              previousExperience: experiences,
                                            };
                                          });
                                        }}
                                      />
                                      <Input
                                        label="Position"
                                        placeholder="Enter position"
                                        value={exp.position || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          onFormDataChange((prev) => {
                                            const experiences = [
                                              ...((prev as any)
                                                .previousExperience || []),
                                            ];
                                            experiences[index] = {
                                              ...experiences[index],
                                              position: value,
                                            };
                                            return {
                                              ...prev,
                                              previousExperience: experiences,
                                            };
                                          });
                                        }}
                                      />
                                      <div>
                                        <DateSelector
                                          label="Start Date"
                                          placeholder="Select start date"
                                          value={
                                            exp.duration?.from
                                              ? new Date(exp.duration.from)
                                              : undefined
                                          }
                                          onChange={(date) => {
                                            onFormDataChange((prev) => {
                                              const experiences = [
                                                ...((prev as any)
                                                  .previousExperience || []),
                                              ];
                                              experiences[index] = {
                                                ...experiences[index],
                                                duration: {
                                                  ...experiences[index]
                                                    ?.duration,
                                                  from: date || new Date(),
                                                  to:
                                                    experiences[index]
                                                      ?.duration?.to ||
                                                    new Date(),
                                                },
                                              };
                                              return {
                                                ...prev,
                                                previousExperience: experiences,
                                              };
                                            });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <DateSelector
                                          label="End Date"
                                          placeholder="Select end date"
                                          value={
                                            exp.duration?.to
                                              ? new Date(exp.duration.to)
                                              : undefined
                                          }
                                          onChange={(date) => {
                                            onFormDataChange((prev) => {
                                              const experiences = [
                                                ...((prev as any)
                                                  .previousExperience || []),
                                              ];
                                              experiences[index] = {
                                                ...experiences[index],
                                                duration: {
                                                  ...experiences[index]
                                                    ?.duration,
                                                  from:
                                                    experiences[index]
                                                      ?.duration?.from ||
                                                    new Date(),
                                                  to: date || new Date(),
                                                },
                                              };
                                              return {
                                                ...prev,
                                                previousExperience: experiences,
                                              };
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="md:col-span-2">
                                        <label className="font-medium text-black mb-2 block">
                                          Job Description
                                        </label>
                                        <textarea
                                          placeholder="Describe the role and responsibilities..."
                                          value={exp.description || ""}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            onFormDataChange((prev) => {
                                              const experiences = [
                                                ...((prev as any)
                                                  .previousExperience || []),
                                              ];
                                              experiences[index] = {
                                                ...experiences[index],
                                                description: value,
                                              };
                                              return {
                                                ...prev,
                                                previousExperience: experiences,
                                              };
                                            });
                                          }}
                                          rows={3}
                                          className="w-full px-4 py-3.5 border border-gray-300 rounded-xl resize-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md text-sm"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                          {(exp.description || "").length}/1000
                                          characters
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                                      <div className="text-xs text-gray-500">
                                        Fill all fields and save
                                      </div>
                                      <OrangeButton
                                        glow={false}
                                        type="button"
                                        onClick={() => {
                                          if (
                                            !exp.companyName?.trim() ||
                                            !exp.position?.trim() ||
                                            !exp.duration?.from ||
                                            !exp.duration?.to ||
                                            !exp.description?.trim()
                                          ) {
                                            toast.error(
                                              "Please fill all fields (company, position, dates, and description)"
                                            );
                                            return;
                                          }
                                          if (
                                            (exp.description || "").length < 10
                                          ) {
                                            toast.error(
                                              "Description must be at least 10 characters"
                                            );
                                            return;
                                          }
                                          setSavedExperiences((prev) =>
                                            [...prev, index].sort((a, b) => a - b)
                                          );
                                          toast.success(
                                            "Experience saved! It will be included when you click Update User."
                                          );
                                        }}
                                        className="px-5 py-3 bg-linear-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                      >
                                        <Save className="w-4 h-4" />
                                        Save Experience
                                      </OrangeButton>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={(formData as any).bio || ""}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        bio: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Address — hidden for partners since they don't collect it */}
          {String(user?.userType || "").toLowerCase() !== "partner" && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Address
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Street Address"
                  value={formData.address?.address || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      address: {
                        ...formData.address,
                        address: e.target.value,
                      } as any,
                    })
                  }
                />
              </div>
              <Input
                label="City"
                value={formData.address?.city || ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    address: {
                      ...formData.address,
                      city: e.target.value,
                    } as any,
                  })
                }
              />
              <Input
                label="State"
                value={formData.address?.state || ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    address: {
                      ...formData.address,
                      state: e.target.value,
                    } as any,
                  })
                }
              />
              <Input
                label="Country"
                value={formData.address?.country || ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    address: {
                      ...formData.address,
                      country: e.target.value,
                    } as any,
                  })
                }
              />
              <Input
                label="Pin Code"
                value={formData.address?.pincode || ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    address: {
                      ...formData.address,
                      pincode: e.target.value,
                    } as any,
                  })
                }
              />
            </div>
          </div>
          )}

          {/* Partner Specific Fields */}
          {String(user?.userType || "").toLowerCase() === "partner" && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Partner Information
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                Re-link this partner to a different college if their role has
                moved. The dropdown only shows colleges from the main
                directory.
              </p>
              <CollegeSelect
                label="Linked College"
                placeholder="Search and pick from the directory"
                value={resolvePartnerCollegeDisplay(formData)}
                onSelect={(c) =>
                  onFormDataChange({
                    ...formData,
                    partnerCollege: c._id,
                    // Stash a display copy so the input retains a label after
                    // an admin picks but before the parent re-fetches the
                    // populated payload.
                    partnerCollegeDisplay: c.display,
                  } as Partial<User & Instructor & Student> & {
                    partnerCollege?: string;
                    partnerCollegeDisplay?: string;
                  })
                }
              />
              <div className="mt-4">
                <PartnerAnalyticsToggles
                  courseAnalyticsEnabled={
                    (formData as { courseAnalyticsEnabled?: boolean })
                      .courseAnalyticsEnabled !== false
                  }
                  internshipAnalyticsEnabled={
                    (formData as { internshipAnalyticsEnabled?: boolean })
                      .internshipAnalyticsEnabled !== false
                  }
                  onChange={(next) =>
                    onFormDataChange({
                      ...formData,
                      ...next,
                    } as Partial<User & Instructor & Student>)
                  }
                />
              </div>
            </div>
          )}

          {/* Student Specific Fields */}
          {String(user?.userType || "").toLowerCase() === "student" && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Student Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CollegeSelect
                  label="University / College Name"
                  placeholder="Search and select, or type a custom name"
                  value={(formData as Student).collegeName || ""}
                  onChange={(value) =>
                    onFormDataChange({
                      ...formData,
                      collegeName: value,
                      college: "",
                    } as Partial<User & Instructor & Student>)
                  }
                  onSelect={(c) =>
                    onFormDataChange({
                      ...formData,
                      collegeName: c.display,
                      college: c._id,
                    } as Partial<User & Instructor & Student>)
                  }
                />
                <Input
                  label="Degree Name"
                  value={(formData as any).degreeName || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      degreeName: e.target.value,
                    })
                  }
                />
                <Input
                  label="Current Position"
                  value={(formData as any).currentPosition || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      currentPosition: e.target.value,
                    })
                  }
                />
                <Input
                  label="Domain"
                  value={(formData as any).domain || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      domain: e.target.value,
                    })
                  }
                />
                <div className="md:col-span-2">
                  <Input
                    label="Portfolio URL"
                    value={(formData as any).portfolio || ""}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        portfolio: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <WhiteButton
            glow={false}
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </WhiteButton>
          <OrangeButton
            glow={false}
            onClick={() => onUpdate(formData)}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update User"}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;

