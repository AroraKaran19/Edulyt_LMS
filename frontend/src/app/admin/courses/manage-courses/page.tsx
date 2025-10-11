"use client";

import React, { useState, useMemo, useEffect } from "react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Course } from "@/types";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Filter,
  Users,
  Star,
} from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import Loader from "@/components/ui/Loader";
import {
  clearAllCourseStorage,
  clearCourseEditStorage,
} from "@/utils/courseStorage";
import { WhiteButton } from "@/components/ui";

const StatusToggle = ({
  isActive,
  onToggle,
  courseId,
  isLoading = false,
}: {
  isActive: boolean;
  onToggle: (courseId: string, newStatus: boolean) => void;
  courseId: string;
  isLoading?: boolean;
}) => {
  return (
    <button
      onClick={() => onToggle(courseId, !isActive)}
      disabled={isLoading}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
        isActive ? "bg-orange-500" : "bg-gray-200",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          isActive ? "translate-x-6" : "translate-x-1"
        )}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
};

const ManageCoursesPage = () => {
  const router = useRouter();
  const {
    getAllCourses,
    deleteCourseById,
    updateCourseStatusBulk,
    updateCourseStatus,
  } = useCourses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        // Use 'basic' data level for admin listing - includes all needed fields without heavy module/lesson data
        const result = await getAllCourses(1, 100, "", undefined);
        if (result.success && result.data) {
          setCourses(result.data.courses);
        } else {
          console.error("Failed to fetch courses:", result.error);
          toast.error("Failed to load courses. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("An error occurred while loading courses.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [getAllCourses]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && course.isActive) ||
        (selectedStatus === "inactive" && !course.isActive) ||
        (selectedStatus === "featured" && course.isFeatured) ||
        (selectedStatus === "certified" && course.isCertified);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [courses, searchTerm, selectedCategory, selectedStatus]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const cats = Array.from(new Set(courses.map((course) => course.category)));
    return cats.sort();
  }, [courses]);

  // Handlers
  const handleCreateCourse = () => {
    // Clear all course-related localStorage keys to start fresh
    clearAllCourseStorage();

    router.push("/admin/courses/manage-courses/create");
  };

  const handleEditCourse = (courseId: string) => {
    clearCourseEditStorage();
    router.push(`/admin/courses/manage-courses/edit/${courseId}`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    ) {
      try {
        setCourses((prev) => prev.filter((course) => course._id !== courseId));
        await deleteCourseById(courseId);
      } catch (error) {
        console.error("Failed to delete course:", error);
      }
    }
  };

  const handleViewCourse = (slug: string) => {
    router.push(`/courses/${slug}`);
  };

  // Individual course status toggle
  const handleStatusToggle = async (courseId: string, newStatus: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [courseId]: true }));

    try {
      const result = await updateCourseStatus(courseId, newStatus);
      if (result.success) {
        setCourses((prev) =>
          prev.map((course) =>
            course._id === courseId
              ? { ...course, isActive: newStatus }
              : course
          )
        );
      } else {
        console.error("Failed to update course status:", result.error);
      }
    } catch (error) {
      console.error("Error updating course status:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCourses.length === 0) {
      toast.warning("Please select courses first");
      return;
    }

    switch (action) {
      case "delete":
        if (confirm(`Delete ${selectedCourses.length} selected courses?`)) {
          setCourses((prev) =>
            prev.filter((course) => !selectedCourses.includes(course._id!))
          );
          setSelectedCourses([]);
        }
        break;
      case "activate":
        await updateCourseStatusBulk(selectedCourses, true);
        setSelectedCourses([]);
        break;
      case "deactivate":
        await updateCourseStatusBulk(selectedCourses, false);
        setSelectedCourses([]);
        break;
    }
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map((course) => course._id!));
    }
  };

  const formatPrice = (course: Course) => {
    const price = course.plans?.essential?.price || course.plans?.elite?.price;
    return price ? `₹${price}` : "Free";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 w-full shadow-sm">
        <div className="w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center shadow-sm">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Course Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and organize your courses
                </p>
              </div>
            </div>
            <OrangeButton
              onClick={handleCreateCourse}
              className="flex items-center gap-2 px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </OrangeButton>
          </div>
        </div>
      </div>

      <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader
              size="lg"
              variant="spinner"
              text="Loading courses..."
              showText={true}
              className="min-w-[200px]"
            />
          </div>
        )}

        {/* Search and Controls */}
        {!isLoading && (
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search Bar */}
              <div className="flex-1 relative max-w-md">
                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses by title, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm hover:border-orange-400 transition-all duration-200 text-base"
                />
              </div>

              {/* Filter Toggle */}
              <WhiteButton
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-3 px-6 py-4 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </WhiteButton>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 p-8 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm hover:border-orange-400 transition-all duration-200 text-base"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm hover:border-orange-400 transition-all duration-200 text-base"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="featured">Featured</option>
                      <option value="certified">Certified</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        {!isLoading && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-3 rounded-2xl border border-orange-200 shadow-sm">
                  <span className="text-orange-700 font-bold text-base">
                    {filteredCourses.length} of {courses.length} courses
                  </span>
                </div>
              </div>
              {filteredCourses.length > 0 && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCourses.length === filteredCourses.length}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-base font-medium text-gray-700">
                    Select all
                  </span>
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedCourses.length > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                      <span className="text-orange-800 font-bold text-sm">
                        {selectedCourses.length}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-orange-800">
                      course{selectedCourses.length > 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <WhiteButton
                      onClick={() => handleBulkAction("activate")}
                      className="px-6 py-3 text-base font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Activate
                    </WhiteButton>
                    <WhiteButton
                      onClick={() => handleBulkAction("deactivate")}
                      className="px-6 py-3 text-base font-medium bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Deactivate
                    </WhiteButton>
                    <WhiteButton
                      onClick={() => handleBulkAction("delete")}
                      className="px-6 py-3 text-base font-medium bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Delete
                    </WhiteButton>
                  </div>
                </div>
              </div>
            )}

            {/* Course Grid */}
            {filteredCourses.length === 0 ? (
              <div className="h-full bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchTerm ||
                    selectedCategory !== "all" ||
                    selectedStatus !== "all"
                      ? "No courses match your search"
                      : "No courses yet"}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-lg mx-auto text-lg">
                    {searchTerm ||
                    selectedCategory !== "all" ||
                    selectedStatus !== "all"
                      ? "We couldn't find any courses matching your current filters. Try adjusting your search terms or filter options to discover more content."
                      : "Start building your educational platform by creating your first course. You can add modules, lessons, and content to engage your students."}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <OrangeButton
                      onClick={handleCreateCourse}
                      className="flex items-center gap-2 px-6 py-3 text-base font-semibold"
                    >
                      <Plus className="w-5 h-5" />
                      {searchTerm ||
                      selectedCategory !== "all" ||
                      selectedStatus !== "all"
                        ? "Create New Course"
                        : "Create Your First Course"}
                    </OrangeButton>
                    {(searchTerm ||
                      selectedCategory !== "all" ||
                      selectedStatus !== "all") && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("all");
                          setSelectedStatus("all");
                        }}
                        className="px-6 py-3 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredCourses.map((course) => (
                  <div
                    key={course._id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-orange-300 group"
                  >
                    <div className="relative">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />

                      {/* Selection checkbox */}
                      <div className="absolute top-3 left-3">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course._id!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCourses((prev) => [
                                ...prev,
                                course._id!,
                              ]);
                            } else {
                              setSelectedCourses((prev) =>
                                prev.filter((id) => id !== course._id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500"
                        />
                      </div>

                      {/* Status badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1">
                        {course.isFeatured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Featured
                          </span>
                        )}
                        {course.isCertified && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Certified
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            course.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {course.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="p-8">
                      <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-xl">
                        {course.title}
                      </h3>

                      <p
                        className="text-gray-600 mb-6 line-clamp-2 text-base leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: course.shortDescription,
                        }}
                      ></p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                        <span className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-orange-500" />
                          <span className="font-medium">
                            {course.analytics?.totalEnrollments.toLocaleString() ||
                              0}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="font-medium">
                            {course.analytics?.totalRatings || 0}
                          </span>
                        </span>
                        <span className="font-bold text-orange-600 text-lg">
                          {formatPrice(course)}
                        </span>
                      </div>

                      {/* Status Toggle */}
                      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-2xl">
                        <span className="text-base font-semibold text-gray-700">
                          Status
                        </span>
                        <StatusToggle
                          isActive={course.isActive}
                          onToggle={handleStatusToggle}
                          courseId={course._id!}
                          isLoading={loadingStates[course._id!]}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <WhiteButton
                          onClick={() => handleViewCourse(course.slug!)}
                          className="flex-1 px-4 py-3 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          View
                        </WhiteButton>
                        <OrangeButton
                          onClick={() => handleEditCourse(course._id!)}
                          className="flex-1 px-4 py-3 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          Edit
                        </OrangeButton>
                        <button
                          onClick={() => handleDeleteCourse(course._id!)}
                          className="px-4 py-3 text-base border border-red-300 text-red-600 rounded-2xl hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageCoursesPage;
