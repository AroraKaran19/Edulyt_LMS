"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/hooks/useCourse";
import { useCategory } from "@/hooks/useCategory";
import { useInstructor } from "@/hooks/useInstructor";
import { Course } from "@/types/course";
import { Category } from "@/types/category";
import { Instructor } from "@/types/user";
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
  Star,
  Filter,
} from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import BrandMark from "@/components/admin/BrandMark";
import BrandSelect from "@/components/admin/BrandSelect";
import CategoryInputWithManagement from "@/components/ui/inputs/CategoryInputWithManagement";
import {
  AUDIENCE_BY_BRAND,
  AUDIENCE_LABEL,
  BRAND,
  BRANDS,
  BRAND_LABEL,
  BRAND_SITE_URL,
  isBrand,
  type Brand,
} from "@/constants/brands";

type AudienceFilter = "" | "college-students" | "professionals";

const STORAGE_KEY = "manage-courses-filters";

function readStoredFilters() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      categoryIds: Array.isArray(parsed.categoryIds) ? parsed.categoryIds : [],
      instructorIds: Array.isArray(parsed.instructorIds) ? parsed.instructorIds : [],
      audience: (parsed.audience === "college-students" || parsed.audience === "professionals")
        ? (parsed.audience as AudienceFilter)
        : "",
      brand: isBrand(parsed.brand) ? parsed.brand : ("" as Brand | ""),
      status: (parsed.status === "active" || parsed.status === "inactive")
        ? (parsed.status as string)
        : "",
      sortOrder: ["newest", "a-z", "z-a"].includes(parsed.sortOrder as string)
        ? (parsed.sortOrder as string)
        : "newest",
    };
  } catch {
    return null;
  }
}

const ManageCoursesPage = () => {
  const router = useRouter();
  const {
    getAdminCourses,
    updateCourseStatus,
    deleteCourse,
    duplicateCourse,
    duplicateCourseWithModules,
    isLoading,
  } = useCourse();
  const { getAdminCategories } = useCategory();
  const { getInstructors } = useInstructor();

  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>(() => {
    const stored = readStoredFilters();
    return stored?.categoryIds ?? [];
  });
  const [filterInstructorIds, setFilterInstructorIds] = useState<string[]>(() => {
    const stored = readStoredFilters();
    return stored?.instructorIds ?? [];
  });
  const [filterAudience, setFilterAudience] = useState<AudienceFilter>(() => {
    const stored = readStoredFilters();
    return stored?.audience ?? "";
  });
  const [filterBrand, setFilterBrand] = useState<Brand | "">(() => {
    const stored = readStoredFilters();
    return stored?.brand ?? "";
  });
  const [filterStatus, setFilterStatus] = useState<string>(() => {
    const stored = readStoredFilters();
    return stored?.status ?? "";
  });
  const [sortOrder, setSortOrder] = useState<string>(() => {
    const stored = readStoredFilters();
    return stored?.sortOrder ?? "newest";
  });
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [duplicatingCourseId, setDuplicatingCourseId] = useState<string | null>(
    null,
  );
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [courseToDuplicate, setCourseToDuplicate] = useState<Course | null>(
    null,
  );

  // Load courses (with appending for infinite scroll)
  const loadCourses = useCallback(
    async (
      page: number = 1,
      search: string = "",
      append: boolean = false,
      filters?: {
        categoryIds: string[];
        instructorIds: string[];
        audience: AudienceFilter;
        brand?: Brand | "";
        status: string;
        sort: string;
      },
    ) => {
      const categoryIds = filters?.categoryIds ?? filterCategoryIds;
      const instructorIds = filters?.instructorIds ?? filterInstructorIds;
      const audience = filters?.audience ?? filterAudience;
      const brand = filters?.brand ?? filterBrand;
      const status = filters?.status ?? filterStatus;
      const sort = filters?.sort ?? sortOrder;

      try {
        const response = await getAdminCourses({
          page,
          limit: 12,
          search: search || undefined,
          searchTitleOnly: true,
          categories:
            categoryIds.length > 0 ? categoryIds.join(",") : undefined,
          instructors:
            instructorIds.length > 0 ? instructorIds.join(",") : undefined,
          audience: audience || undefined,
          brand: brand || undefined,
          isActive:
            status === "active"
              ? true
              : status === "inactive"
                ? false
                : undefined,
          sortBy: sort === "a-z" || sort === "z-a" ? "title" : "updatedAt",
          sortOrder: sort === "z-a" ? "desc" : sort === "a-z" ? "asc" : "desc",
        });

        if (response) {
          if (append) {
            setCourses((prev) => [...prev, ...response.courses]);
          } else {
            setCourses(response.courses);
          }

          setTotalPages(response.totalPages);
          setTotalCourses(response.total);
          setCurrentPage(page);
          setHasMore(page < response.totalPages);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
        toast.error("Failed to load courses");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [getAdminCourses, filterCategoryIds, filterInstructorIds, filterAudience, filterBrand, filterStatus, sortOrder],
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load courses when search or filters change (replaces initial load + filter-triggered loads)
  useEffect(() => {
    setHasMore(true);
    loadCourses(1, searchDebounced, false);
  }, [
    searchDebounced,
    filterCategoryIds,
    filterInstructorIds,
    filterAudience,
    filterStatus,
    sortOrder,
    loadCourses,
  ]);

  // Persist filters to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        categoryIds: filterCategoryIds,
        instructorIds: filterInstructorIds,
        audience: filterAudience,
        brand: filterBrand,
        status: filterStatus,
        sortOrder,
      })
    );
  }, [filterCategoryIds, filterInstructorIds, filterAudience, filterBrand, filterStatus, sortOrder]);

  // Auto-apply filters on change (effect above handles loadCourses)
  const handleCategoryFilterChange = useCallback((value: string | string[]) => {
    const ids = Array.isArray(value) ? value : value ? [value] : [];
    setFilterCategoryIds(ids);
  }, []);

  const handleInstructorFilterChange = useCallback((value: string | string[]) => {
    const ids = Array.isArray(value) ? value : value ? [value] : [];
    setFilterInstructorIds(ids);
  }, []);

  const handleAudienceFilterChange = useCallback((value: string | string[]) => {
    const aud = (Array.isArray(value) ? value[0] : value) as AudienceFilter;
    setFilterAudience(aud);
  }, []);

  const handleBrandFilterChange = useCallback((value: string | string[]) => {
    const next = Array.isArray(value) ? value[0] : value;
    setFilterBrand(isBrand(next) ? next : "");
  }, []);

  const handleStatusFilterChange = useCallback((value: string | string[]) => {
    const stat = Array.isArray(value) ? value[0] : value;
    setFilterStatus(stat);
  }, []);

  const handleSortOrderChange = useCallback((value: string | string[]) => {
    const sort = Array.isArray(value) ? value[0] : value;
    setSortOrder(sort);
  }, []);

  // Handle search (only update input; debounced effect triggers loadCourses)
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Sentinel ref for IntersectionObserver (works with any scroll container, including mobile)
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Handle infinite scroll via IntersectionObserver - works on mobile when parent layout scrolls
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          setIsLoadingMore(true);
          loadCourses(currentPage + 1, searchDebounced, true);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, currentPage, searchDebounced, loadCourses]);

  // Handle status toggle
  const handleStatusToggle = async (
    courseId: string,
    currentStatus: boolean,
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
              : course,
          ),
        );
        toast.success(
          `Course ${!currentStatus ? "activated" : "deactivated"} successfully`,
        );
      }
    } catch (error) {
      console.error("Failed to update course status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update course status",
      );
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle view course
  const handleViewCourse = (slug: string, brand?: unknown) => {
    if (slug) {
      setOpenMenuId(null);
      const origin = isBrand(brand) && brand !== BRAND ? BRAND_SITE_URL[brand] : "";
      window.open(`${origin}/programs/${slug}`, "_blank");
    }
  };

  // Handle edit course
  const handleEditCourse = (courseId: string) => {
    if (courseId) {
      setOpenMenuId(null);
      router.push(`/admin/courses/manage-courses/edit/${courseId}`);
    }
  };

  const [duplicateBrand, setDuplicateBrand] = useState<Brand | "">("");
  const [duplicateCategories, setDuplicateCategories] = useState<string[]>([]);
  const sourceBrand: Brand =
    courseToDuplicate && isBrand(courseToDuplicate.brand)
      ? courseToDuplicate.brand
      : "airkrit";
  // Categories belong to one brand, so a copy to the other one needs its own.
  const duplicateTarget =
    duplicateBrand && duplicateBrand !== sourceBrand
      ? { brand: duplicateBrand, category: duplicateCategories }
      : undefined;
  const duplicateBlocked = !!duplicateTarget && duplicateCategories.length === 0;

  // Handle duplicate course option click
  const handleDuplicateClick = (course: Course) => {
    setOpenMenuId(null);
    setCourseToDuplicate(course);
    setDuplicateBrand(isBrand(course.brand) ? course.brand : "airkrit");
    setDuplicateCategories([]);
    setShowDuplicateModal(true);
  };

  // Handle duplicate course (metadata only)
  const handleDuplicateCourse = async (courseId: string) => {
    if (!courseId) return;

    setShowDuplicateModal(false);
    setDuplicatingCourseId(courseId);

    try {
      const duplicatedCourse = await duplicateCourse(courseId, duplicateTarget);
      if (duplicatedCourse && duplicatedCourse._id) {
        toast.success("Course metadata duplicated successfully!");
        // Navigate to edit page for the duplicated course
        router.push(
          `/admin/courses/manage-courses/edit/${duplicatedCourse._id}`,
        );
      } else {
        toast.error("Failed to duplicate course");
      }
    } catch (error) {
      console.error("Failed to duplicate course:", error);
      toast.error("Failed to duplicate course");
    } finally {
      setDuplicatingCourseId(null);
      setCourseToDuplicate(null);
    }
  };

  // Handle duplicate course with modules
  const handleDuplicateCourseWithModules = async (courseId: string) => {
    if (!courseId) return;

    setShowDuplicateModal(false);
    setDuplicatingCourseId(courseId);

    try {
      const duplicatedCourse = await duplicateCourseWithModules(courseId, duplicateTarget);
      if (duplicatedCourse && duplicatedCourse._id) {
        toast.success("Course with modules duplicated successfully!");
        // Navigate to edit page for the duplicated course
        router.push(
          `/admin/courses/manage-courses/edit/${duplicatedCourse._id}`,
        );
      } else {
        toast.error("Failed to duplicate course with modules");
      }
    } catch (error) {
      console.error("Failed to duplicate course with modules:", error);
      toast.error("Failed to duplicate course with modules");
    } finally {
      setDuplicatingCourseId(null);
      setCourseToDuplicate(null);
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
          prev.filter((course) => course._id !== courseToDelete._id),
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
      timeZone: "Asia/Kolkata",
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
    <div className="w-full min-h-screen bg-gray-50 p-6">
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

        {/* Filters: Category, Instructor, Audience, Status */}
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
            <InfiniteScrollSelect<Category>
              label="Category"
              placeholder="All categories"
              value={filterCategoryIds}
              onChange={handleCategoryFilterChange}
              multi
              fetchOptions={async (page, search) => {
                const res = await getAdminCategories({
                  page,
                  limit: 15,
                  search: search || undefined,
                });
                return res
                  ? {
                      items: res.categories as {
                        _id?: string;
                        name?: string;
                      }[],
                      totalPages: res.totalPages,
                    }
                  : { items: [], totalPages: 0 };
              }}
              getOptionLabel={(c) => c.name ?? ""}
              getOptionValue={(c) => c._id ?? ""}
              searchPlaceholder="Search categories..."
              emptyMessage="No categories found"
            />
          </div>
          <div>
            <InfiniteScrollSelect<Instructor>
              label="Instructor"
              placeholder="All instructors"
              value={filterInstructorIds}
              onChange={handleInstructorFilterChange}
              multi
              fetchOptions={async (page, search) => {
                const res = await getInstructors({
                  page,
                  limit: 15,
                  search: search || undefined,
                });
                return res
                  ? {
                      items: res.instructors as {
                        _id?: string;
                        name?: string;
                      }[],
                      totalPages: res.totalPages,
                    }
                  : { items: [], totalPages: 0 };
              }}
              getOptionLabel={(i) => {
                const inst = i as Instructor;
                return (
                  ([inst.firstName, inst.lastName].filter(Boolean).join(" ") ||
                    inst.email ||
                    inst._id) ??
                  ""
                );
              }}
              getOptionValue={(i) => (i as Instructor)._id ?? ""}
              searchPlaceholder="Search instructors..."
              emptyMessage="No instructors found"
            />
          </div>
          <div>
            <InfiniteScrollSelect
              label="Brand"
              placeholder="All brands"
              value={filterBrand}
              onChange={handleBrandFilterChange}
              multi={false}
              fetchOptions={async () => ({
                items: BRANDS.map((b) => ({ value: b, label: BRAND_LABEL[b] })),
                totalPages: 1,
              })}
              searchPlaceholder="Search brands..."
              emptyMessage="No brands found"
            />
          </div>
          <div>
            <InfiniteScrollSelect
              label="Audience"
              placeholder="All audiences"
              value={filterAudience}
              onChange={handleAudienceFilterChange}
              multi={false}
              fetchOptions={async () => {
                return {
                  items: [
                    { value: "college-students", label: "College Students" },
                    { value: "professionals", label: "Professionals" },
                  ],
                  totalPages: 1,
                };
              }}
              searchPlaceholder="Search audiences..."
              emptyMessage="No audiences found"
            />
          </div>
          <div>
            <InfiniteScrollSelect
              label="Status"
              placeholder="All statuses"
              value={filterStatus}
              onChange={handleStatusFilterChange}
              multi={false}
              fetchOptions={async () => {
                return {
                  items: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ],
                  totalPages: 1,
                };
              }}
              searchPlaceholder="Search status..."
              emptyMessage="No status found"
            />
          </div>
          <div>
            <InfiniteScrollSelect
              label="Sort By"
              placeholder="Newest first"
              value={sortOrder}
              onChange={handleSortOrderChange}
              multi={false}
              fetchOptions={async () => {
                return {
                  items: [
                    { value: "newest", label: "Newest First" },
                    { value: "a-z", label: "A-Z" },
                    { value: "z-a", label: "Z-A" },
                  ],
                  totalPages: 1,
                };
              }}
              searchPlaceholder="Search sort..."
              emptyMessage="No sort options found"
            />
          </div>
          </div>
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
                        course.isActive,
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
                  {isBrand(course.brand) && (
                    <div className="mb-2">
                      <BrandMark brand={course.brand} />
                    </div>
                  )}
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
                        course.updatedAt || course.createdAt || new Date(),
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
                                : course._id || null,
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
                                handleViewCourse(course.slug, course.brand);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                              View Course
                            </button>
                            <button
                              onClick={() => handleDuplicateClick(course)}
                              disabled={duplicatingCourseId === course._id}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left ${
                                duplicatingCourseId === course._id
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                              Duplicate Course
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
                {searchDebounced
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first course"}
              </p>
              {!searchDebounced && (
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

          {/* Sentinel for IntersectionObserver - triggers load when visible */}
          {hasMore && courses.length > 0 && (
            <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
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

      {/* Duplicate Course Modal */}
      {showDuplicateModal && courseToDuplicate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Copy className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Duplicate Course
                </h3>
                <p className="text-sm text-gray-600">Choose duplication type</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              How would you like to duplicate{" "}
              <strong>"{courseToDuplicate.title}"</strong>?
            </p>

            <div className="space-y-3 mb-6">
              <BrandSelect
                label="Copy to brand"
                value={duplicateBrand}
                onChange={(next) => {
                  if (next === "all") return;
                  setDuplicateBrand(next);
                  setDuplicateCategories([]);
                }}
              />
              {duplicateTarget && (
                <>
                  <CategoryInputWithManagement
                    label={`${BRAND_LABEL[duplicateTarget.brand]} categories`}
                    name="duplicateCategories"
                    value={duplicateCategories}
                    setChange={setDuplicateCategories}
                    brand={duplicateTarget.brand}
                    required
                  />
                  <p className="text-sm text-gray-600">
                    The copy is created inactive and set to target{" "}
                    {AUDIENCE_LABEL[AUDIENCE_BY_BRAND[duplicateTarget.brand]]},
                    the only audience a live{" "}
                    {BRAND_LABEL[duplicateTarget.brand]} course can have.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() =>
                  handleDuplicateCourse(courseToDuplicate._id || "")
                }
                disabled={duplicatingCourseId === courseToDuplicate._id || duplicateBlocked}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  duplicatingCourseId === courseToDuplicate._id
                    ? "opacity-50 cursor-not-allowed border-gray-200"
                    : "border-gray-200 hover:border-orange-500 hover:bg-orange-50 cursor-pointer"
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">
                  Copy Metadata Only
                </div>
                <div className="text-sm text-gray-600">
                  Duplicate course information, settings, and pricing. Modules
                  and lessons will not be copied.
                </div>
              </button>

              <button
                onClick={() =>
                  handleDuplicateCourseWithModules(courseToDuplicate._id || "")
                }
                disabled={duplicatingCourseId === courseToDuplicate._id || duplicateBlocked}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  duplicatingCourseId === courseToDuplicate._id
                    ? "opacity-50 cursor-not-allowed border-gray-200"
                    : "border-gray-200 hover:border-orange-500 hover:bg-orange-50 cursor-pointer"
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">
                  Copy Whole Course
                </div>
                <div className="text-sm text-gray-600">
                  Duplicate everything including all modules, lessons, and
                  content. Creates a complete copy of the course structure.
                </div>
              </button>
            </div>

            {duplicatingCourseId === courseToDuplicate._id && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Duplicating...
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setCourseToDuplicate(null);
                }}
                disabled={duplicatingCourseId === courseToDuplicate._id}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoursesPage;
