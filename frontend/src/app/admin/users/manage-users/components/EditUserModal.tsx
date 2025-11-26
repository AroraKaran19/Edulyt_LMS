"use client";
import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import DateSelector from "@/components/ui/inputs/DateSelector";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { User, Instructor, Student } from "@/types/user";
import { useUpload } from "@/hooks/useUpload";
import { toast } from "react-toastify";

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  formData: Partial<User & Instructor & Student>;
  onClose: () => void;
  onUpdate: (data: Partial<User & Instructor & Student>) => Promise<void>;
  isUpdating: boolean;
  onFormDataChange: (data: Partial<User & Instructor & Student>) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  formData,
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
    (url: string) => {
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
    [formData, onFormDataChange]
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

          {/* Address */}
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

          {/* Instructor Specific Fields */}
          {user.userType === "instructor" && (
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

          {/* Student Specific Fields */}
          {user.userType === "student" && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Student Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="College Name"
                  value={(formData as any).collegeName || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      collegeName: e.target.value,
                    })
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
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onUpdate(formData)}
            disabled={isUpdating}
            className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isUpdating ? "Updating..." : "Update User"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;

