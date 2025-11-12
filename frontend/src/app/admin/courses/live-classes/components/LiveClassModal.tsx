import React, { useState, useEffect } from "react";
import { LiveClass, Course, Instructor } from "@/types";
import { X, Save } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import TextArea from "@/components/ui/inputs/TextArea";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import { useCourse } from "@/hooks/useCourse";
import useAuth from "@/hooks/useAuth";

interface LiveClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    imageUrl: string;
    course: string;
    instructor?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  }) => Promise<void>;
  editingLiveClass: LiveClass | null;
  courses: Course[];
  isSaving: boolean;
}

const LiveClassModal: React.FC<LiveClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLiveClass,
  courses,
  isSaving,
}) => {
  const { uploadFile, isUploading } = useUpload();
  const { getCourseById } = useCourse();
  const { user } = useAuth();
  const isAdmin = user?.userType === "admin";
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    imageSource: "url" as "upload" | "url",
    imageS3Key: "",
    course: "",
    instructor: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });
  
  const [courseInstructors, setCourseInstructors] = useState<Instructor[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  // Fetch course instructors when course is selected (for admins)
  useEffect(() => {
    const fetchCourseInstructors = async () => {
      if (!isAdmin || !formData.course) {
        setCourseInstructors([]);
        return;
      }

      setLoadingInstructors(true);
      try {
        const course = await getCourseById(formData.course);
        if (course && course.instructor) {
          // Handle both populated and non-populated instructors
          const instructors = Array.isArray(course.instructor)
            ? course.instructor.map((inst: any) => {
                if (typeof inst === "object" && inst._id) {
                  return inst as Instructor;
                }
                return null;
              }).filter(Boolean) as Instructor[]
            : [];
          setCourseInstructors(instructors);
        } else {
          setCourseInstructors([]);
        }
      } catch (error) {
        console.error("Failed to fetch course instructors:", error);
        setCourseInstructors([]);
      } finally {
        setLoadingInstructors(false);
      }
    };

    fetchCourseInstructors();
  }, [formData.course, isAdmin, getCourseById]);

  // Reset form when modal opens/closes or editingLiveClass changes
  useEffect(() => {
    if (isOpen) {
      if (editingLiveClass) {
        const courseId =
          typeof editingLiveClass.course === "object"
            ? editingLiveClass.course._id || ""
            : editingLiveClass.course || "";

        const instructorId =
          typeof editingLiveClass.instructor === "object"
            ? editingLiveClass.instructor._id || ""
            : editingLiveClass.instructor || "";

        const startDateObj = new Date(editingLiveClass.startDate);
        const endDateObj = new Date(editingLiveClass.endDate);
        
        setFormData({
          title: editingLiveClass.title,
          description: editingLiveClass.description || "",
          imageUrl: editingLiveClass.imageUrl || "",
          imageSource: editingLiveClass.imageUrl?.startsWith("http") ? "url" : "upload",
          imageS3Key: "",
          course: courseId,
          instructor: instructorId,
          startDate: startDateObj.toISOString().split("T")[0],
          startTime: editingLiveClass.startTime || startDateObj.toTimeString().slice(0, 5),
          endDate: endDateObj.toISOString().split("T")[0],
          endTime: editingLiveClass.endTime || endDateObj.toTimeString().slice(0, 5),
        });
      } else {
        setFormData({
          title: "",
          description: "",
          imageUrl: "",
          imageSource: "url",
          imageS3Key: "",
          course: "",
          instructor: "",
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: "",
        });
      }
    }
  }, [isOpen, editingLiveClass]);

  // Handle image upload
  const handleImageUpload = async (
    file: File,
    folderName: string
  ): Promise<string> => {
    const result = await uploadFile(file, folderName);
    if (result.success && result.data) {
      setFormData((prev) => ({
        ...prev,
        imageUrl: result.data!.url,
        imageS3Key: result.data!.s3Key,
        imageSource: "upload",
      }));
      return result.data.url;
    }
    throw new Error(result.error || "Failed to upload image");
  };

  // Handle image URL submit
  const handleImageUrlSubmit = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: url,
      imageSource: "url",
    }));
  };

  // Handle image remove
  const handleImageRemove = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: "",
      imageS3Key: "",
      imageSource: "url",
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.title || !formData.course || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      return;
    }

    // For admins, instructor is required
    if (isAdmin && !formData.instructor) {
      return;
    }

    // Combine date and time for validation
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      return;
    }

    await onSave({
      title: formData.title,
      description: formData.description,
      imageUrl: formData.imageUrl,
      course: formData.course,
      instructor: isAdmin ? formData.instructor : undefined,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate,
      endTime: formData.endTime,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingLiveClass ? "Edit Live Class" : "Create Live Class"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <Input
            label="Title"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter live class title"
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Enter live class description"
            rows={4}
          />

          <UploadMediaContainer
            title="Live Class Image"
            description="Upload an image for the live class or provide a URL"
            type="image"
            folderName="live-classes"
            mediaUrl={formData.imageUrl}
            mediaSource={formData.imageSource}
            s3Key={formData.imageS3Key}
            onFileUpload={handleImageUpload}
            onFileRemove={handleImageRemove}
            onUrlSubmit={handleImageUrlSubmit}
            allowUrlInput
            maxSize={10}
            acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".webp"]}
            isUploading={isUploading}
          />

          <Select
            label="Course"
            required
            value={formData.course}
            onChange={(value) =>
              setFormData({ ...formData, course: value, instructor: "" })
            }
            options={[
              { value: "", label: "Select a course" },
              ...courses.map((course) => ({
                value: course._id || "",
                label: course.title,
              })),
            ]}
          />

          {isAdmin && formData.course && (
            <Select
              label="Instructor"
              required
              value={formData.instructor}
              onChange={(value) =>
                setFormData({ ...formData, instructor: value })
              }
              disabled={loadingInstructors}
              options={[
                { value: "", label: loadingInstructors ? "Loading instructors..." : "Select an instructor" },
                ...courseInstructors.map((instructor) => ({
                  value: instructor._id || "",
                  label: `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim() || instructor.email,
                })),
              ]}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <WhiteButton
            onClick={onClose}
            glow={false}
            className="px-4 py-2"
          >
            Cancel
          </WhiteButton>
          <OrangeButton
            onClick={handleSave}
            disabled={
              isSaving || 
              !formData.title || 
              !formData.course || 
              (isAdmin && !formData.instructor) ||
              !formData.startDate || 
              !formData.startTime || 
              !formData.endDate || 
              !formData.endTime
            }
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {editingLiveClass ? "Update" : "Create"}
              </>
            )}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

export default LiveClassModal;

