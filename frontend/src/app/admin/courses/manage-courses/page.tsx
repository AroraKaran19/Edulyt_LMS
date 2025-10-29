"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/hooks/useCourse";
import { Course } from "@/types/course";
import { toast } from "react-toastify";
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Users,
  BookOpen,
  MoreVertical,
  Copy,
  Languages,
  Star,
} from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

const ManageCoursesPage = () => {
  const router = useRouter();
  const {
    getAdminCourses,
    updateCourseStatus,
    deleteCourse,
    duplicateCourse,
    isLoading,
  } = useCourse();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [duplicatingCourseId, setDuplicatingCourseId] = useState<string | null>(
    null
  );

  // Load courses (with appending for infinite scroll)
  const loadCourses = useCallback(
    async (page: number = 1, search: string = "", append: boolean = false) => {
      try {
        const response = await getAdminCourses({
          page,
          limit: 12,
          search: search || undefined,
          sortBy: "updatedAt",
          sortOrder: "desc",
        });

        if (response) {
          if (append) {
            // Append new courses to existing ones
            setCourses((prev) => [...prev, ...response.courses]);
          } else {
            // Replace courses (initial load or search)
            setCourses(response.courses);
          }

          setTotalPages(response.totalPages);
          setTotalCourses(response.total);
          setCurrentPage(page);

          // Update hasMore flag
          setHasMore(page < response.totalPages);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
        toast.error("Failed to load courses");
      } finally {
        setIsLoadingMore(false);
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
      setHasMore(true);
      loadCourses(1, value, false);
    },
    [loadCourses]
  );

  // Handle infinite scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Trigger when user is 300px from bottom
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom < 300 && hasMore && !isLoadingMore && !isLoading) {
        setIsLoadingMore(true);
        loadCourses(currentPage + 1, searchTerm, true);
      }
    },
    [
      hasMore,
      isLoadingMore,
      isLoading,
      currentPage,
      searchTerm,
      loadCourses,
      totalPages,
    ]
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
      setOpenMenuId(null);
      window.open(`/courses/${slug}`, "_blank");
    }
  };

  // Handle edit course
  const handleEditCourse = (courseId: string) => {
    if (courseId) {
      setOpenMenuId(null);
      router.push(`/admin/courses/manage-courses/edit/${courseId}`);
    }
  };

  // Handle duplicate course
  const handleDuplicateCourse = async (courseId: string) => {
    if (!courseId) return;

    setOpenMenuId(null);
    setDuplicatingCourseId(courseId);

    try {
      const duplicatedCourse = await duplicateCourse(courseId);
      if (duplicatedCourse && duplicatedCourse._id) {
        toast.success("Course duplicated successfully!");
        // Navigate to edit page for the duplicated course
        router.push(
          `/admin/courses/manage-courses/edit/${duplicatedCourse._id}`
        );
      } else {
        toast.error("Failed to duplicate course");
      }
    } catch (error) {
      console.error("Failed to duplicate course:", error);
      toast.error("Failed to duplicate course");
    } finally {
      setDuplicatingCourseId(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openMenuId &&
        !(event.target as HTMLElement).closest(".course-menu")
      ) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  // Handle delete course
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteCourse(courseToDelete._id || "");
      if (success) {
        // Remove course from list
        setCourses((prev) =>
          prev.filter((course) => course._id !== courseToDelete._id)
        );
        setTotalCourses((prev) => prev - 1);
        toast.success("Course deleted successfully");
        setCourseToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error("Failed to delete course");
    } finally {
      setIsDeleting(false);
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
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="w-full min-h-screen bg-gray-50 p-6 overflow-y-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
            <p className="text-gray-600 mt-1">
              {totalCourses} {totalCourses === 1 ? "course" : "courses"} total
            </p>
          </div>
          <OrangeButton
            onClick={() => router.push("/admin/courses/manage-courses/create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Course
          </OrangeButton>
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
            {courses.map((course, index) => (
              <div
                key={index}
                className="bg-white rounded-xl flex flex-col border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                {/* Course Thumbnail */}
                <div className="relative h-48 bg-gray-100 shrink-0">
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
                <div className="p-4 flex flex-col h-full">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  <p
                    className="text-gray-600 text-sm mb-3 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: course.shortDescription || course.description,
                    }}
                  />

                  {/* Course Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(
                        course.updatedAt || course.createdAt || new Date()
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="">
                        Audience:{" "}
                        {course.audience === "college-students"
                          ? "College Students"
                          : "Professionals"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#F7AD24]" fill="#F7AD24" />
                      <span className="">
                        Rating {course.analytics?.totalRatings || 0}/5 (
                        {course.analytics?.totalReviews || 0} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 mt-auto">
                    {/* Menu Button and Dropdown */}
                    <div className="flex items-center justify-end">
                      {/* Menu Button */}
                      <div className="relative course-menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === course._id
                                ? null
                                : course._id || null
                            );
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === course._id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleViewCourse(course.slug);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                              View Course
                            </button>
                            <button
                              onClick={() =>
                                handleDuplicateCourse(course._id || "")
                              }
                              disabled={duplicatingCourseId === course._id}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left ${
                                duplicatingCourseId === course._id
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              {duplicatingCourseId === course._id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                  Duplicating...
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 text-gray-500" />
                                  Duplicate Course
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleEditCourse(course._id || "")}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4 text-gray-500" />
                              Edit Course
                            </button>
                            <div className="border-t border-gray-200">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setCourseToDelete(course);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Course
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
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
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Create Course
                </button>
              )}
            </div>
          )}

          {/* Infinite Scroll Loading Indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-gray-500">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin" />
                Loading more courses...
              </div>
            </div>
          )}

          {/* No More Courses Message */}
          {!hasMore && courses.length > 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No more courses to load
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Course
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              <strong>"{courseToDelete.title}"</strong>? This will permanently
              delete the course, all its modules, lessons, and content.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCourseToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoursesPage;
