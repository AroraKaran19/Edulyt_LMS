import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import React, { useState, useEffect, useCallback } from "react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Container from "@/app/admin/components/ui/Container";
import {
  Plus,
  Search,
  Users,
  Check,
  X,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Building,
  GraduationCap,
  Linkedin,
  ShieldCheck,
  User,
} from "lucide-react";
import { Testimonial } from "@/types";
import { useTestimonial } from "@/hooks/useTestimonial";
import { useFormContext, Controller } from "react-hook-form";

interface ProfileImageProps {
  src: string;
  name: string;
  className: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  name,
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    } else {
      setImageError(true);
      setImageLoading(false);
    }
  }, [src]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  if (!src || imageError) {
    return (
      <div
        className={`${className} bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div
          className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}
        >
          <User className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={name}
        className={`${className} ${
          imageLoading ? "opacity-0 absolute" : "opacity-100"
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

const Screen7 = () => {
  // Form context
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const {
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    isLoading,
    error: hookError,
    clearError,
  } = useTestimonial();

  const [testimonials, setTestimonials] = useState<Testimonial[] | null>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    name: "",
    currentRole: "",
    currentCompany: "",
    linkedin: "",
    pastRole: "",
    pastCompany: "",
    college: "",
    collegeUrl: "",
    collegeProfileUrl: "",
    companyUrl: "",
    companyProfileUrl: "",
    profileImage: "",
    verified: false,
    category: "" as "" | "college-students" | "professionals" | "internships",
    feedback: "",
    heading2: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);
  const [updating, setUpdating] = useState(false);

  const [deletingTestimonialId, setDeletingTestimonialId] = useState<
    string | null
  >(null);

  // Watch form values
  const testimonialsValue = watch("testimonials") || [];

  // Selected testimonials for the course - sync with form
  const [selectedTestimonialIds, setSelectedTestimonialIds] =
    useState<string[]>(testimonialsValue);

  const [expandedTestimonials, setExpandedTestimonials] = useState<Set<string>>(
    new Set(),
  );

  // Client-side mounting
  const [isMounted, setIsMounted] = useState(false);

  // Initialize selectedTestimonialIds from form value only once
  useEffect(() => {
    if (
      isMounted &&
      testimonialsValue.length > 0 &&
      selectedTestimonialIds.length === 0
    ) {
      setSelectedTestimonialIds(testimonialsValue);
    }
  }, [testimonialsValue, isMounted, selectedTestimonialIds.length]);

  // Client-side mounting effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setTestimonials([]);
    setPage(1);
    setHasMore(true);
    clearError();
    loadTestimonials(1, true);
  }, [searchDebounced]);

  const loadTestimonials = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (isLoading) return;

      try {
        const result = await getTestimonials({
          page: pageNum,
          limit: 10,
          search: searchDebounced,
        });

        if (result) {
          if (reset) {
            setTestimonials(result.testimonials);
          } else {
            setTestimonials((prev) => [
              ...(prev || []),
              ...(result.testimonials || []),
            ]);
          }

          setHasMore(
            result.testimonials?.length === 10 &&
              (testimonials?.length || 0) + (result.testimonials?.length || 0) <
                result.total,
          );
          setPage(pageNum + 1);
        }
      } catch (error) {
        console.error("Error loading testimonials:", error);
      }
    },
    [
      isLoading,
      searchDebounced,
      getTestimonials,
      clearError,
      testimonials?.length,
    ],
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight + 100 &&
        hasMore &&
        !isLoading
      ) {
        loadTestimonials(page);
      }
    },
    [hasMore, isLoading, page, loadTestimonials],
  );

  // Load initial testimonials
  useEffect(() => {
    loadTestimonials(1, true);
  }, []);

  const handleTestimonialToggle = (testimonialId: string) => {
    const newSelected = selectedTestimonialIds.includes(testimonialId)
      ? selectedTestimonialIds.filter((id: string) => id !== testimonialId)
      : [...selectedTestimonialIds, testimonialId];

    setSelectedTestimonialIds(newSelected);
    setValue("testimonials", newSelected, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleCreateTestimonial = async () => {
    if (
      !newTestimonial.name.trim() ||
      !newTestimonial.currentRole.trim() ||
      !newTestimonial.currentCompany.trim()
    )
      return;

    setCreating(true);
    try {
      const { category, feedback, heading2, ...rest } = newTestimonial;
      const payload = {
        ...rest,
        ...(category && { category }),
        ...(feedback?.trim() && { feedback: feedback.trim() }),
        ...(heading2?.trim() && { heading2: heading2.trim() }),
      };
      const createdTestimonial = await createTestimonial(payload);
      if (createdTestimonial) {
        setTestimonials((prev) => [createdTestimonial, ...(prev || [])]);
        setNewTestimonial({
          name: "",
          currentRole: "",
          currentCompany: "",
          linkedin: "",
          pastRole: "",
          pastCompany: "",
          college: "",
          collegeUrl: "",
          collegeProfileUrl: "",
          companyUrl: "",
          companyProfileUrl: "",
          profileImage: "",
          verified: false,
          category: "",
          feedback: "",
          heading2: "",
        });
        setShowCreateModal(false);
        clearError();
      }
    } catch (error) {
      console.error("Error creating testimonial:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setShowEditModal(true);
  };

  const handleUpdateTestimonial = async () => {
    if (
      !editingTestimonial ||
      !editingTestimonial._id ||
      !editingTestimonial.name.trim() ||
      !editingTestimonial.currentRole.trim()
    )
      return;

    setUpdating(true);
    try {
      const result = await updateTestimonial(editingTestimonial._id, {
        name: editingTestimonial.name,
        currentRole: editingTestimonial.currentRole,
        currentCompany: editingTestimonial.currentCompany,
        linkedin: editingTestimonial.linkedin,
        pastRole: editingTestimonial.pastRole,
        pastCompany: editingTestimonial.pastCompany,
        college: editingTestimonial.college,
        collegeUrl: editingTestimonial.collegeUrl,
        collegeProfileUrl: editingTestimonial.collegeProfileUrl,
        companyUrl: editingTestimonial.companyUrl,
        companyProfileUrl: editingTestimonial.companyProfileUrl,
        profileImage: editingTestimonial.profileImage,
        verified: editingTestimonial.verified,
        category: editingTestimonial.category,
        feedback: editingTestimonial.feedback,
        heading2: editingTestimonial.heading2,
      });

      if (result) {
        // Update the testimonial in the local state
        setTestimonials((prev) =>
          (prev || []).map((testimonial) =>
            testimonial._id === editingTestimonial._id ? result : testimonial,
          ),
        );
        setShowEditModal(false);
        setEditingTestimonial(null);
        clearError();
      }
    } catch (error) {
      console.error("Error updating testimonial:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this testimonial? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingTestimonialId(testimonialId);
    try {
      const result = await deleteTestimonial(testimonialId);

      if (result) {
        setTestimonials((prev) =>
          (prev || []).filter(
            (testimonial) => testimonial._id !== testimonialId,
          ),
        );

        // Calculate new selected testimonials
        const newSelected = selectedTestimonialIds.filter(
          (id) => id !== testimonialId,
        );

        // Update both local state and form value
        setSelectedTestimonialIds(newSelected);
        setValue("testimonials", newSelected, {
          shouldDirty: true,
          shouldTouch: true,
        });

        clearError();
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    } finally {
      setDeletingTestimonialId(null);
    }
  };

  const toggleTestimonialExpansion = (testimonialId: string) => {
    setExpandedTestimonials((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(testimonialId)) {
        newExpanded.delete(testimonialId);
      } else {
        newExpanded.add(testimonialId);
      }
      return newExpanded;
    });
  };

  // Show loading during SSR
  if (!isMounted) {
    return (
      <Container
        title="Course Testimonials (Screen 7)"
        description="Select existing testimonials for your course"
        icon={Users}
        className="h-full w-full max-h-full overflow-y-auto flex flex-col"
        classNameBody="flex flex-col gap-6"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
            Loading testimonials...
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Course Testimonials (Screen 7)"
      description={`Select existing testimonials for your course (${selectedTestimonialIds.length} selected)`}
      icon={Users}
      className="h-full w-full max-h-full overflow-y-auto flex flex-col"
      classNameBody="flex flex-col gap-6"
      style={{ scrollbarWidth: "thin" }}
    >
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="Search testimonials by name, role, or company..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WhiteButton
            onClick={() => {
              const allTestimonialIds =
                testimonials
                  ?.map((testimonial) => testimonial._id)
                  .filter((id): id is string => !!id) || [];
              setSelectedTestimonialIds(allTestimonialIds);
              setValue("testimonials", allTestimonialIds, {
                shouldDirty: true,
                shouldTouch: true,
              });
            }}
            className="flex items-center gap-2"
            disabled={!testimonials || testimonials.length === 0}
          >
            <Check className="w-4 h-4" />
            Select All
          </WhiteButton>
          <WhiteButton
            onClick={() => {
              setSelectedTestimonialIds([]);
              setValue("testimonials", [], {
                shouldDirty: true,
                shouldTouch: true,
              });
            }}
            className="flex items-center gap-2"
            disabled={selectedTestimonialIds.length === 0}
          >
            <X className="w-4 h-4" />
            Clear All
          </WhiteButton>
          <OrangeButton
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
            glow={false}
          >
            <Plus className="w-4 h-4" />
            Create Testimonial
          </OrangeButton>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Create New Testimonial
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Name"
                  value={newTestimonial.name}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter full name"
                  required
                />

                <Input
                  label="Profile Image URL"
                  value={newTestimonial.profileImage}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      profileImage: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/profile.jpg"
                  required
                />

                <Input
                  label="Current Role"
                  value={newTestimonial.currentRole}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      currentRole: e.target.value,
                    }))
                  }
                  placeholder="e.g., Senior Software Engineer"
                  required
                />

                <Input
                  label="Current Company"
                  value={newTestimonial.currentCompany}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      currentCompany: e.target.value,
                    }))
                  }
                  placeholder="e.g., Google"
                  required
                />

                <Input
                  label="Past Course/Role"
                  value={newTestimonial.pastRole}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      pastRole: e.target.value,
                    }))
                  }
                  placeholder="e.g., Junior Developer"
                  required
                />

                <Input
                  label="Past College/Company"
                  value={newTestimonial.pastCompany}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      pastCompany: e.target.value,
                    }))
                  }
                  placeholder="e.g., Startup Inc."
                  required
                />

                <Input
                  label="Tagline"
                  value={newTestimonial.college}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      college: e.target.value,
                    }))
                  }
                  placeholder="e.g., Stanford University"
                  required
                />

                <Input
                  label="LinkedIn Profile"
                  value={newTestimonial.linkedin}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      linkedin: e.target.value,
                    }))
                  }
                  placeholder="https://linkedin.com/in/username"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="College URL"
                  value={newTestimonial.collegeUrl}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      collegeUrl: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/college"
                />

                <Input
                  label="College Profile URL"
                  value={newTestimonial.collegeProfileUrl}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      collegeProfileUrl: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/college/profile"
                />

                <Input
                  label="Company URL"
                  value={newTestimonial.companyUrl}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      companyUrl: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/company"
                />

                <Input
                  label="Company Profile URL"
                  value={newTestimonial.companyProfileUrl}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      companyProfileUrl: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/company/profile"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="verified"
                  checked={newTestimonial.verified}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      verified: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label
                  htmlFor="verified"
                  className="text-sm font-medium text-gray-700"
                >
                  Mark as verified testimonial
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DropDown
                  label="Category"
                  options={[
                    "",
                    "college-students",
                    "professionals",
                    "internships",
                  ]}
                  optionLabels={{
                    "": "Select category",
                    "college-students": "College Students",
                    professionals: "Professionals",
                    internships: "Internships",
                  }}
                  value={newTestimonial.category ?? ""}
                  defaultValue="Select category"
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      category: e.target.value as
                        | ""
                        | "college-students"
                        | "professionals"
                        | "internships",
                    }))
                  }
                />
                <Input
                  label="Heading 2"
                  value={newTestimonial.heading2}
                  onChange={(e) =>
                    setNewTestimonial((prev) => ({
                      ...prev,
                      heading2: e.target.value,
                    }))
                  }
                  placeholder="e.g., Subheadline"
                />
              </div>

              <TextArea
                label="Feedback"
                value={newTestimonial.feedback}
                onChange={(e) =>
                  setNewTestimonial((prev) => ({
                    ...prev,
                    feedback: e.target.value,
                  }))
                }
                placeholder="Testimonial feedback or quote"
                rows={4}
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={handleCreateTestimonial}
                disabled={
                  !newTestimonial.name.trim() ||
                  !newTestimonial.currentRole.trim() ||
                  !newTestimonial.currentCompany.trim() ||
                  creating
                }
                className="flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Testimonial
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTestimonial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Edit Testimonial
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTestimonial(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Name"
                  value={editingTestimonial.name}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, name: e.target.value } : null,
                    )
                  }
                  placeholder="Enter full name"
                  required
                />

                <Input
                  label="Profile Image URL"
                  value={editingTestimonial.profileImage}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, profileImage: e.target.value } : null,
                    )
                  }
                  placeholder="https://example.com/profile.jpg"
                  required
                />

                <Input
                  label="Current Role"
                  value={editingTestimonial.currentRole}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, currentRole: e.target.value } : null,
                    )
                  }
                  placeholder="e.g., Senior Software Engineer"
                  required
                />

                <Input
                  label="Current Company"
                  value={editingTestimonial.currentCompany}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, currentCompany: e.target.value } : null,
                    )
                  }
                  placeholder="e.g., Google"
                  required
                />

                <Input
                  label="Past Course/Role"
                  value={editingTestimonial.pastRole}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, pastRole: e.target.value } : null,
                    )
                  }
                  placeholder="e.g., Junior Developer"
                  required
                />

                <Input
                  label="Past College/Company"
                  value={editingTestimonial.pastCompany}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, pastCompany: e.target.value } : null,
                    )
                  }
                  placeholder="e.g., Startup Inc."
                  required
                />

                <Input
                  label="Tagline"
                  value={editingTestimonial.college}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, college: e.target.value } : null,
                    )
                  }
                  placeholder="e.g., Stanford University"
                  required
                />

                <Input
                  label="LinkedIn Profile"
                  value={editingTestimonial.linkedin}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, linkedin: e.target.value } : null,
                    )
                  }
                  placeholder="https://linkedin.com/in/username"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="College URL"
                  value={editingTestimonial.collegeUrl || ""}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, collegeUrl: e.target.value } : null,
                    )
                  }
                  placeholder="https://example.com/college"
                />

                <Input
                  label="College Profile URL"
                  value={editingTestimonial.collegeProfileUrl || ""}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev
                        ? { ...prev, collegeProfileUrl: e.target.value }
                        : null,
                    )
                  }
                  placeholder="https://example.com/college/profile"
                />

                <Input
                  label="Company URL"
                  value={editingTestimonial.companyUrl || ""}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, companyUrl: e.target.value } : null,
                    )
                  }
                  placeholder="https://example.com/company"
                />

                <Input
                  label="Company Profile URL"
                  value={editingTestimonial.companyProfileUrl || ""}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev
                        ? { ...prev, companyProfileUrl: e.target.value }
                        : null,
                    )
                  }
                  placeholder="https://example.com/company/profile"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit-verified"
                  checked={editingTestimonial.verified || false}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, verified: e.target.checked } : null,
                    )
                  }
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label
                  htmlFor="edit-verified"
                  className="text-sm font-medium text-gray-700"
                >
                  Mark as verified testimonial
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DropDown
                  label="Category"
                  options={[
                    "",
                    "college-students",
                    "professionals",
                    "internships",
                  ]}
                  optionLabels={{
                    "": "Select category",
                    "college-students": "College Students",
                    professionals: "Professionals",
                    internships: "Internships",
                  }}
                  value={editingTestimonial.category ?? ""}
                  defaultValue="Select category"
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev
                        ? {
                            ...prev,
                            category:
                              e.target.value === ""
                                ? undefined
                                : (e.target.value as
                                    | "college-students"
                                    | "professionals"
                                    | "internships"),
                          }
                        : null,
                    )
                  }
                />
                <Input
                  label="Heading 2"
                  value={editingTestimonial.heading2 || ""}
                  onChange={(e) =>
                    setEditingTestimonial((prev) =>
                      prev ? { ...prev, heading2: e.target.value } : null,
                    )
                  }
                  placeholder="e.g., Subheadline"
                />
              </div>

              <TextArea
                label="Feedback"
                value={editingTestimonial.feedback || ""}
                onChange={(e) =>
                  setEditingTestimonial((prev) =>
                    prev ? { ...prev, feedback: e.target.value } : null,
                  )
                }
                placeholder="Testimonial feedback or quote"
                rows={4}
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTestimonial(null);
                }}
                disabled={updating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={handleUpdateTestimonial}
                disabled={
                  !editingTestimonial?.name.trim() ||
                  !editingTestimonial?.currentRole.trim() ||
                  updating
                }
                className="flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Update Testimonial
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* Testimonials Field Error Display */}
      {errors.testimonials && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="text-red-800 font-semibold">Validation Error</h4>
              <p className="text-red-700 text-sm">
                {String(errors.testimonials?.message || "")}
              </p>
            </div>
          </div>
        </div>
      )}

      {hookError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="text-red-800 font-semibold">Error</h4>
              <p className="text-red-700 text-sm">{hookError}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto space-y-4 pr-2"
        onScroll={handleScroll}
        style={{ scrollbarWidth: "thin" }}
      >
        {testimonials?.map((testimonial) => {
          if (!testimonial._id) return null; // Skip testimonials without ID

          const isSelected = selectedTestimonialIds.includes(testimonial._id);
          const isExpanded = expandedTestimonials.has(testimonial._id);

          return (
            <div
              key={testimonial._id}
              className={`border rounded-xl p-6 transition-all ${
                isSelected
                  ? "border-purple-500 bg-purple-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      testimonial._id &&
                      handleTestimonialToggle(testimonial._id)
                    }
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                </div>

                <div className="shrink-0">
                  {testimonial.profileImage ? (
                    <ProfileImage
                      src={testimonial.profileImage}
                      name={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-semibold">
                      {testimonial.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {testimonial.name}
                        </h4>
                        {testimonial.verified && (
                          <div title="Verified">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="w-4 h-4" />
                            <span>
                              {testimonial.currentRole} at{" "}
                              {testimonial.currentCompany}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <GraduationCap className="w-4 h-4" />
                            <span>{testimonial.college}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>
                                Previously: {testimonial.pastRole} at{" "}
                                {testimonial.pastCompany}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Linkedin className="w-4 h-4" />
                              <a
                                href={testimonial.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                LinkedIn Profile
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Created:{" "}
                          {new Date(
                            testimonial.createdAt!,
                          ).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </span>
                        {testimonial.updatedAt && (
                          <span>
                            Updated:{" "}
                            {new Date(
                              testimonial.updatedAt,
                            ).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTestimonial(testimonial);
                        }}
                        className="text-gray-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit Testimonial"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          testimonial._id &&
                            handleDeleteTestimonial(testimonial._id);
                        }}
                        disabled={deletingTestimonialId === testimonial._id}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete Testimonial"
                      >
                        {deletingTestimonialId === testimonial._id ? (
                          <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          testimonial._id &&
                            toggleTestimonialExpansion(testimonial._id);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2 mt-3 text-purple-600 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Selected for this course
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
              Loading testimonials...
            </div>
          </div>
        )}

        {!hasMore && testimonials && testimonials.length > 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No more testimonials to load
          </div>
        )}

        {testimonials && testimonials.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "No testimonials found"
                : "No testimonials available"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first testimonial to get started"}
            </p>
            <OrangeButton
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 mx-auto"
              glow={false}
            >
              <Plus className="w-4 h-4" />
              Create First Testimonial
            </OrangeButton>
          </div>
        )}

        {/* Hidden input for form validation */}
        <Controller
          name="testimonials"
          control={control}
          rules={{ required: "At least one testimonial is required" }}
          render={({ field }) => (
            <input type="hidden" {...field} value={selectedTestimonialIds} />
          )}
        />
      </div>
    </Container>
  );
};

export default Screen7;
