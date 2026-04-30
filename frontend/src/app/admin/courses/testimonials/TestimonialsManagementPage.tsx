"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Users,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Building,
  GraduationCap,
  Linkedin,
  ShieldCheck,
  User,
} from "lucide-react";
import { Testimonial } from "@/types";
import { useTestimonial } from "@/hooks/useTestimonial";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import { toast } from "react-toastify";

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

const TestimonialsManagementPage = () => {
  const {
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    isLoading,
    error: hookError,
    clearError,
  } = useTestimonial();

  // Testimonial state management
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [totalTestimonials, setTotalTestimonials] = useState(0);

  // Create modal state
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

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);
  const [updating, setUpdating] = useState(false);

  // Delete state
  const [deletingTestimonialId, setDeletingTestimonialId] = useState<
    string | null
  >(null);

  // Expanded state for details
  const [expandedTestimonials, setExpandedTestimonials] = useState<Set<string>>(
    new Set(),
  );

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset when search changes
  useEffect(() => {
    setTestimonials([]);
    setPage(1);
    setHasMore(true);
    clearError();
    loadTestimonials(1, true);
  }, [searchDebounced]);

  // Load testimonials function
  const loadTestimonials = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (isLoading) return;

      try {
        const result = await getTestimonials({
          page: pageNum,
          limit: 20,
          search: searchDebounced,
        });

        if (result) {
          if (reset) {
            setTestimonials(result.testimonials || []);
          } else {
            setTestimonials((prev) => [
              ...prev,
              ...(result.testimonials || []),
            ]);
          }

          setTotalTestimonials(result.total);
          setHasMore(pageNum < result.totalPages);
          setPage(pageNum + 1);
        }
      } catch (error) {
        console.error("Error loading testimonials:", error);
        toast.error("Failed to load testimonials");
      }
    },
    [isLoading, searchDebounced, getTestimonials],
  );

  // Infinite scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight + 200 &&
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

  // Handle create
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
        setTestimonials((prev) => [createdTestimonial, ...prev]);
        setTotalTestimonials((prev) => prev + 1);
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
        toast.success("Testimonial created successfully!");
        clearError();
      }
    } catch (error) {
      console.error("Error creating testimonial:", error);
      toast.error("Failed to create testimonial");
    } finally {
      setCreating(false);
    }
  };

  // Handle edit
  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setShowEditModal(true);
  };

  // Handle update
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
        setTestimonials((prev) =>
          prev.map((testimonial) =>
            testimonial._id === editingTestimonial._id ? result : testimonial,
          ),
        );
        setShowEditModal(false);
        setEditingTestimonial(null);
        toast.success("Testimonial updated successfully!");
        clearError();
      }
    } catch (error) {
      console.error("Error updating testimonial:", error);
      toast.error("Failed to update testimonial");
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete
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
          prev.filter((testimonial) => testimonial._id !== testimonialId),
        );
        setTotalTestimonials((prev) => prev - 1);
        toast.success("Testimonial deleted successfully!");
        clearError();
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    } finally {
      setDeletingTestimonialId(null);
    }
  };

  // Toggle expansion
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

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Testimonials
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage course testimonials ({totalTestimonials}{" "}
                total)
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Search and Actions */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search testimonials by name, role, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-shadow shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Create Button */}
              <OrangeButton
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Testimonial
              </OrangeButton>
            </div>
          </div>

          {/* Content Area */}
          <div
            className="p-6 min-h-[600px] max-h-[calc(100vh-300px)] overflow-y-auto"
            onScroll={handleScroll}
            style={{ scrollbarWidth: "thin" }}
          >
            {/* Error Display */}
            {hookError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-800 font-semibold">Error</h4>
                    <p className="text-red-700 text-sm">{hookError}</p>
                  </div>
                  <button
                    onClick={clearError}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Testimonials List */}
            {testimonials.length === 0 && !isLoading ? (
              <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm
                    ? "No testimonials found"
                    : "No testimonials available"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Create your first testimonial to get started"}
                </p>
                <OrangeButton
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create First Testimonial
                </OrangeButton>
              </div>
            ) : (
              <div className="space-y-4">
                {testimonials.map((testimonial) => {
                  if (!testimonial._id) return null;

                  const isExpanded = expandedTestimonials.has(testimonial._id);

                  return (
                    <div
                      key={testimonial._id}
                      className="border border-gray-200 bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-purple-200"
                    >
                      <div className="flex items-start gap-4">
                        {/* Profile Image */}
                        <div className="shrink-0">
                          {testimonial.profileImage ? (
                            <ProfileImage
                              src={testimonial.profileImage}
                              name={testimonial.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg font-semibold">
                              {testimonial.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-xl font-bold text-gray-900">
                                  {testimonial.name}
                                </h4>
                                {testimonial.verified && (
                                  <div title="Verified">
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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
                                <div className="space-y-2 mb-3 p-4 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>
                                      Previously: {testimonial.pastRole} at{" "}
                                      {testimonial.pastCompany}
                                    </span>
                                  </div>
                                  {testimonial.linkedin && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Linkedin className="w-4 h-4 text-blue-600" />
                                      <a
                                        href={testimonial.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        LinkedIn Profile
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  Created:{" "}
                                  {new Date(
                                    testimonial.createdAt!,
                                  ).toLocaleDateString()}
                                </span>
                                {testimonial.updatedAt && (
                                  <span>
                                    Updated:{" "}
                                    {new Date(
                                      testimonial.updatedAt,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() =>
                                  handleEditTestimonial(testimonial)
                                }
                                className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Edit Testimonial"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() =>
                                  testimonial._id &&
                                  handleDeleteTestimonial(testimonial._id)
                                }
                                disabled={
                                  deletingTestimonialId === testimonial._id
                                }
                                className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Delete Testimonial"
                              >
                                {deletingTestimonialId === testimonial._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  testimonial._id &&
                                  toggleTestimonialExpansion(testimonial._id)
                                }
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center gap-3 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                      Loading testimonials...
                    </div>
                  </div>
                )}

                {/* No More */}
                {!hasMore && testimonials.length > 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No more testimonials to load
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal - Same structure as Screen7, truncated for brevity */}
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
                  label="Past Role"
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
                  label="Past Company"
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
                  label="College/Tagline"
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
                  options={["", "college-students", "professionals", "internships"]}
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
                      category: e.target.value as "" | "college-students" | "professionals" | "internships",
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
                    <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* Edit Modal - Similar to create modal but with editingTestimonial */}
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
                  label="Past Role"
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
                  label="Past Company"
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
                  label="College/Tagline"
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
                  options={["", "college-students", "professionals", "internships"]}
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
                    <Loader2 className="w-4 h-4 animate-spin" />
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
    </div>
  );
};

export default TestimonialsManagementPage;
