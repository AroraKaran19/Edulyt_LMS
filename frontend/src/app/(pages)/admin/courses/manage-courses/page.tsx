"use client";
import FlexBox from "@/components/ui/FlexBox";
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Star,
  BookOpen,
  Image,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import courseService from "@/services/courseService";
import { cn } from "@/lib/utils";
import { Course, Instructor } from "@/types";
import InstructorDisplayCard from "@/components/ui/InstructorDisplayCard";

const AdminCourseManageCoursesPage = () => {
  const router = useRouter();

  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  // Filter and action states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const itemsPerPage = 12;

  // Categories for filtering
  const categories = [
    "all",
    "Technology",
    "Business",
    "Design",
    "Marketing",
    "Development",
    "Data Science",
    "Photography",
    "Music",
  ];

  // Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = [];
      if (selectedCategory !== "all") filters.push(selectedCategory);
      if (selectedStatus === "active") filters.push("active");
      if (selectedStatus === "inactive") filters.push("inactive");
      if (selectedStatus === "featured") filters.push("featured");

      const response = await courseService.getAllCoursesAdmin(
        currentPage,
        itemsPerPage,
        searchTerm,
        filters
      );

      if (response.success && response.data) {
        setCourses(response.data.courses);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCourses(response.data.pagination.total);
      } else {
        setError(response.message || "Failed to fetch courses");
      }
    } catch (err) {
      setError("An error occurred while fetching courses");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
      fetchCourses();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, selectedStatus, sortBy]);

  useEffect(() => {
    fetchCourses();
  }, [currentPage]);

  // Utility functions


  // Actions
  const handleCourseStatusToggle = async (
    courseId: string,
    currentStatus: boolean
  ) => {
    setActionLoading(courseId);

    try {
      const response = await courseService.updateCourseStatus(
        courseId,
        !currentStatus
      );

      if (response.success) {
        setCourses((prev) =>
          prev.map((course) =>
            course._id === courseId
              ? { ...course, isActive: !currentStatus }
              : course
          )
        );
      } else {
        setError(response.message || "Failed to update course status");
      }
    } catch {
      setError("An error occurred while updating course status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === courses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(courses.map((course) => course._id));
    }
  };

  // Handle delete course
  const handleDeleteCourse = async (courseId: string) => {
    setDeleteLoading(courseId);

    try {
      const response = await courseService.deleteCourse(courseId);

      if (response.success) {
        // Remove course from local state
        setCourses((prev) => prev.filter((course) => course._id !== courseId));
        setTotalCourses((prev) => prev - 1);
        
        // Remove from selected courses if it was selected
        setSelectedCourses((prev) => prev.filter((id) => id !== courseId));
        
        // Close confirmation dialog
        setShowDeleteConfirm(null);
        
        // Show success message (you could add a toast notification here)
        console.log('Course deleted successfully');
      } else {
        setError(response.message || "Failed to delete course");
      }
    } catch (err) {
      setError("An error occurred while deleting the course");
      console.error("Error deleting course:", err);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCourses.length} course${selectedCourses.length !== 1 ? 's' : ''}? This action cannot be undone and will also remove all associated media files from AWS.`
    );

    if (!confirmed) return;

    setActionLoading('bulk-delete');

    try {
      const deletePromises = selectedCourses.map(courseId => 
        courseService.deleteCourse(courseId)
      );

      const results = await Promise.allSettled(deletePromises);
      
      // Count successful deletions
      const successfulDeletions = results.filter(
        (result) => result.status === 'fulfilled' && result.value.success
      ).length;

      const failedDeletions = selectedCourses.length - successfulDeletions;

      // Update local state by removing successfully deleted courses
      const successfulCourseIds = selectedCourses.filter((courseId, index) => {
        const result = results[index];
        return result.status === 'fulfilled' && result.value.success;
      });

      setCourses((prev) => 
        prev.filter((course) => !successfulCourseIds.includes(course._id))
      );
      setTotalCourses((prev) => prev - successfulDeletions);
      setSelectedCourses([]);

      if (failedDeletions > 0) {
        setError(`${successfulDeletions} course(s) deleted successfully, but ${failedDeletions} failed to delete.`);
      } else {
        console.log(`${successfulDeletions} course(s) deleted successfully`);
      }

    } catch (err) {
      setError("An error occurred during bulk deletion");
      console.error("Error in bulk delete:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Render functions
  const renderCourseCard = (course: Course) => (
    <div key={course._id} className="relative">
      {/* Admin Controls Overlay */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={selectedCourses.includes(course._id)}
          onChange={() => handleSelectCourse(course._id)}
          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 bg-white shadow-sm"
        />
      </div>

      <div className="absolute top-2 right-2 z-10">
        <div className="relative group">
          <button className="p-1 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all shadow-sm">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 min-w-48">
            <button
              onClick={() => router.push(`/courses/${course.slug}`)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"

            >
              <Eye className="w-4 h-4" />
              View Course
            </button>
            <button
              onClick={() =>
                router.push(`/admin/courses/manage-courses/edit/${course._id}`)
              }
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Course
            </button>
            <button
              onClick={() =>
                handleCourseStatusToggle(course._id, course.isActive)
              }
              disabled={actionLoading === course._id}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading === course._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : course.isActive ? (
                <ToggleLeft className="w-4 h-4" />
              ) : (
                <ToggleRight className="w-4 h-4" />
              )}
              {course.isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(course._id)}
              disabled={deleteLoading === course._id}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg disabled:opacity-50"
            >
              {deleteLoading === course._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Course
            </button>
          </div>
        </div>
      </div>

      {/* Course Card - Using CourseCard.tsx design */}
      <div className="course-card w-full h-full bg-white rounded-2xl p-3 flex flex-col border-2 border-[rgb(233,117,0)] shadow-[0_0_2px_4px_rgba(233,117,0,0.3)] gap-4 cursor-default">
        <div className="course-image w-full rounded-2xl overflow-hidden relative flex-shrink-0">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="rounded-2xl w-full h-full object-cover max-h-[150px] opacity-90"
              draggable={false}
            />
          ) : (
            <div className="rounded-2xl w-full h-full object-cover max-h-[150px] opacity-90 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Image className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {course.discount && course.discount.isActive && (
              <span className="px-2 py-1 bg-orange-500 text-center text-white text-xs font-medium rounded-full">
                {course.discount ? `-${course.discount.value}%` : "No Discount"}
              </span>
            )}
            {course.isActive ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-center text-white text-xs font-medium rounded-full">
                <CheckCircle className="w-3 h-3" />
                Active
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-center text-white text-xs font-medium rounded-full">
                <Clock className="w-3 h-3" />
                Inactive
              </div>
            )}
          </div>
        </div>

        <div className="course-content w-full flex flex-col justify-between">
          {course.isFeatured ? (
            <div className="w-full h-4 flex items-center">
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                {course.enrolledCount} Students Enrolled
              </span>
            </div>
          ) : (
            <div className="w-full h-4" />
          )}

          <p className="text-2xl font-bold mt-2 font-coolvetica select-none text-balance break-words line-clamp-2">
            {course.title}
          </p>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-2">
            {course.totalRatings > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(course.totalRatings)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600">
                  ({course.totalRatings.toFixed(1)})
                </span>
              </div>
            )}
          </div>

          <div className="instructors mt-2 flex gap-2 select-none mb-2 flex-col sm:flex-row items-start sm:items-center">
            {course.instructor && course.instructor.length > 0 ? (
              <>
                {course.instructor.slice(0, 2).map((instructor: Instructor, index: number) => (
                  <InstructorDisplayCard
                    key={index}
                    instructor={instructor}
                  />
                ))}
                {course.instructor.length > 2 && (
                  <div className="instructor-count flex gap-0.25 items-center bg-[#EEEEEE] rounded-full p-1">
                    <Plus
                      className="w-3 h-3 text-text-primary"
                      fill="#2B1508"
                    />
                    <p className="text-xs font-bold text-text-primary">
                      {course.instructor.length - 2}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400">
                No instructor assigned
              </span>
            )}
          </div>

          <div className="mt-auto ml-auto flex flex-col sm:flex-row gap-2 sm:items-center select-none">
            <div className="pricing flex flex-row lg:flex-col xl:flex-row gap-2 sm:items-center flex-wrap">
              <span className="text-xl font-bold text-black">
                ₹
                {course.plans.essential?.price ||
                  course.plans.elite?.price ||
                  0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FlexBox className="w-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-gray-600">
            {totalCourses} course{totalCourses !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors",
              showFilters
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={() => router.push("/admin/courses/manage-courses/create")}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses by title, instructor, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
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
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="enrollments">Most Enrolled</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedCourses.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedCourses.length === courses.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                {selectedCourses.length} course
                {selectedCourses.length !== 1 ? "s" : ""} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                Activate All
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                Deactivate All
              </button>
              <button 
                onClick={handleBulkDelete}
                disabled={actionLoading === 'bulk-delete'}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center gap-1"
              >
                {actionLoading === 'bulk-delete' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Selected'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error loading courses</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={fetchCourses}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-gray-600">Loading courses...</span>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && (
        <>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map(renderCourseCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No courses found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ||
                selectedCategory !== "all" ||
                selectedStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first course"}
              </p>
              <button
                onClick={() =>
                  router.push("/admin/courses/manage-courses/create")
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Course
              </button>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalCourses)} of{" "}
            {totalCourses} courses
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "px-3 py-2 rounded-lg",
                      currentPage === pageNum
                        ? "bg-orange-500 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Course</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this course? This will permanently remove the course 
              and all associated media files from AWS. Students will lose access immediately.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleteLoading === showDeleteConfirm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(showDeleteConfirm)}
                disabled={deleteLoading === showDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading === showDeleteConfirm ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </FlexBox>
  );
};

export default AdminCourseManageCoursesPage;

