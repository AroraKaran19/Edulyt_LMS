"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/hooks/useCourse";
import { Course } from "@/types/course";
import { toast } from "react-toastify";
import {
  Search,
  Plus,
  Eye,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Users,
  BookOpen,
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ManageCoursesPage = () => {
  const router = useRouter();
  const { getAdminCourses, updateCourseStatus, isLoading } = useCourse();

  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Load courses
  const loadCourses = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        const response = await getAdminCourses({
          page,
          limit: 12,
          search: search || undefined,
          sortBy: "updatedAt",
          sortOrder: "desc",
        });

        if (response) {
          setCourses(response.courses);
          setTotalPages(response.totalPages);
          setTotalCourses(response.total);
          setCurrentPage(page);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
        toast.error("Failed to load courses");
      }
    },
    [getAdminCourses]
  );

  // Initial load
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      loadCourses(1, value);
    },
    [loadCourses]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      loadCourses(page, searchTerm);
    },
    [loadCourses, searchTerm]
  );

  // Handle status toggle
  const handleStatusToggle = async (
    courseId: string,
    currentStatus: boolean
  ) => {
    if (!courseId) return;

    setIsUpdating(courseId);
    try {
      const updatedCourse = await updateCourseStatus(courseId, !currentStatus);
      if (updatedCourse) {
        setCourses((prev) =>
          prev.map((course) =>
            course._id === courseId
              ? { ...course, isActive: !currentStatus }
              : course
          )
        );
        toast.success(
          `Course ${!currentStatus ? "activated" : "deactivated"} successfully`
        );
      }
    } catch (error) {
      console.error("Failed to update course status:", error);
      toast.error("Failed to update course status");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle view course
  const handleViewCourse = (slug: string) => {
    if (slug) {
      window.open(`/courses/${slug}`, "_blank");
    }
  };

  // Handle edit course
  const handleEditCourse = (courseId: string) => {
    if (courseId) {
      router.push(`/admin/courses/manage-courses/edit/${courseId}`);
    }
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
            <p className="text-gray-600 mt-1">
              {totalCourses} {totalCourses === 1 ? "course" : "courses"} total
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/courses/manage-courses/create")}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Course
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && courses.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {courses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                {/* Course Thumbnail */}
                <div className="relative h-48 bg-gray-100">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        course.isActive
                      )}`}
                    >
                      {course.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Featured Badge */}
                  {course.isFeatured && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-200">
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {course.shortDescription || course.description}
                  </p>

                  {/* Course Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(
                        course.updatedAt || course.createdAt || new Date()
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {course.audience === "college-students"
                        ? "Students"
                        : "Professionals"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* View Course */}
                      <button
                        onClick={() => handleViewCourse(course.slug)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                        title="View Course"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>

                      {/* Edit Course */}
                      <button
                        onClick={() => handleEditCourse(course._id || "")}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                        title="Edit Course"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          Status:
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            course.isActive ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {course.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleStatusToggle(course._id || "", course.isActive)
                        }
                        disabled={isUpdating === course._id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          course.isActive ? "bg-green-600" : "bg-gray-300"
                        } ${
                          isUpdating === course._id
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        title={
                          course.isActive
                            ? "Deactivate Course"
                            : "Activate Course"
                        }
                      >
                        {isUpdating === course._id ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          </div>
                        ) : (
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              course.isActive
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {courses.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No courses found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first course"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() =>
                    router.push("/admin/courses/manage-courses/create")
                  }
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Course
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === page
                          ? "bg-orange-600 text-white"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageCoursesPage;
