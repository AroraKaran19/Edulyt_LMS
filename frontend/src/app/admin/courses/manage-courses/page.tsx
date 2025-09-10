"use client";

import React, { useState, useMemo, useEffect } from "react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Course } from "@/types";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Grid,
  List,
  Filter,
  Users,
  Star,
} from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

// Status Toggle Component
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

// Status Badge Component
const StatusBadge = ({
  isActive,
  isFeatured,
  isCertified,
}: {
  isActive: boolean;
  isFeatured?: boolean;
  isCertified?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
      {isFeatured && (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Featured
        </span>
      )}
      {isCertified && (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Certified
        </span>
      )}
    </div>
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const fetchCourses = async () => {
      // Use 'basic' data level for admin listing - includes all needed fields without heavy module/lesson data
      const result = await getAllCourses(1, 100, "", undefined, "basic");
      if (result.success && result.data) {
        setCourses(result.data.courses);
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
    router.push("/admin/courses/manage-courses/create");
  };

  const handleEditCourse = (courseId: string) => {
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
    return price ? `$${price}` : "Free";
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-orange-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Course Management
              </h1>
            </div>
            <OrangeButton
              onClick={handleCreateCourse}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </OrangeButton>
          </div>
        </div>
      </div>

      <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Bar */}
            <div className="flex-1 relative max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-auto flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 transition-colors ${
                  viewMode === "grid"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 border-l border-gray-300 transition-colors ${
                  viewMode === "list"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
          {filteredCourses.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedCourses.length === filteredCourses.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-600">Select all</span>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedCourses.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-800">
                {selectedCourses.length} course(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("activate")}
                  className="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction("deactivate")}
                  className="px-4 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-4 py-2 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course List */}
        {filteredCourses.length === 0 ? (
          <div className="h-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm ||
              selectedCategory !== "all" ||
              selectedStatus !== "all"
                ? "Try adjusting your filters or search terms to find what you're looking for."
                : "Get started by creating your first course to begin building your educational platform."}
            </p>
            <OrangeButton
              onClick={handleCreateCourse}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Your First Course
            </OrangeButton>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-orange-300"
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
                          setSelectedCourses((prev) => [...prev, course._id!]);
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

                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-lg">
                    {course.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.shortDescription}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.enrolledCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {course.totalRatings || 0}
                    </span>
                    <span className="font-semibold text-orange-600">
                      {formatPrice(course)}
                    </span>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Status
                    </span>
                    <StatusToggle
                      isActive={course.isActive}
                      onToggle={handleStatusToggle}
                      courseId={course._id!}
                      isLoading={loadingStates[course._id!]}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewCourse(course.slug!)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditCourse(course._id!)}
                      className="flex-1 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id!)}
                      className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedCourses.length === filteredCourses.length
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Enrollments
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Toggle
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr
                      key={course._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
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
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-12 h-12 rounded-lg object-cover mr-4"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {course.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {course.shortDescription}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.enrolledCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatPrice(course)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          isActive={course.isActive}
                          isFeatured={course.isFeatured}
                          isCertified={course.isCertified}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusToggle
                          isActive={course.isActive}
                          onToggle={handleStatusToggle}
                          courseId={course._id!}
                          isLoading={loadingStates[course._id!]}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(course.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewCourse(course.slug!)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="View Course"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditCourse(course._id!)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                            title="Edit Course"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course._id!)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCoursesPage;
