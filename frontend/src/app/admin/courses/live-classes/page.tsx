"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { LiveClass } from "@/types";
import { toast } from "react-toastify";
import { useCourse } from "@/hooks/useCourse";
import { Course } from "@/types/course";
import LiveClassFilters from "./components/LiveClassFilters";
import LiveClassesList from "./components/LiveClassesList";
import LiveClassModal from "./components/LiveClassModal";

const LiveClassesManagementPage = () => {
  const {
    getAllLiveClasses,
    getOngoingLiveClasses,
    getInstructorLiveClasses,
    createLiveClass,
    updateLiveClass,
    deleteLiveClass,
    getLiveClassById,
    isLoading,
    error,
  } = useLiveClasses();
  const { getCourses } = useCourse();

  // State management
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLiveClasses, setTotalLiveClasses] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "ongoing">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingLiveClass, setEditingLiveClass] = useState<LiveClass | null>(
    null,
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [allLiveClasses, setAllLiveClasses] = useState<LiveClass[]>([]);

  // Load courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      const result = await getCourses({ page: 1, limit: 100 });
      if (result) {
        setCourses(result.courses);
      }
    };
    fetchCourses();
  }, [getCourses]);

  // Load live classes
  const loadLiveClasses = useCallback(
    async (
      page: number = 1,
      mode: "all" | "ongoing" = "all",
      loadAll: boolean = false,
    ) => {
      try {
        let response;
        if (mode === "ongoing") {
          response = await getOngoingLiveClasses(page, 10);
        } else {
          // Use admin endpoint for "all" view mode
          // If loadAll is true, load a large number to enable full search
          const limit = loadAll ? 1000 : 10;
          response = await getAllLiveClasses(page, limit);
        }

        if (response) {
          if (loadAll) {
            // When loading all, store all data for search
            setAllLiveClasses(response.liveClasses);
          } else {
            // When loading paginated, update all data
            setAllLiveClasses(response.liveClasses);
          }
          setTotalPages(response.totalPages);
          setTotalLiveClasses(response.total);
          setCurrentPage(page);
        }
      } catch (error) {
        console.error("Failed to load live classes:", error);
        toast.error("Failed to load live classes");
      }
    },
    [getAllLiveClasses, getOngoingLiveClasses],
  );

  // Initial load - load all data for search functionality
  useEffect(() => {
    if (viewMode === "all") {
      // Load all data for "all" mode to enable full search
      loadLiveClasses(1, viewMode, true);
    } else {
      // For "ongoing" mode, load normally
      loadLiveClasses(1, viewMode, false);
    }
  }, [viewMode, loadLiveClasses]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Filter live classes based on search term and handle pagination
  useEffect(() => {
    let filtered: LiveClass[] = [];

    if (!debouncedSearchTerm.trim()) {
      filtered = allLiveClasses;
    } else {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      filtered = allLiveClasses.filter((liveClass) => {
        const title = liveClass.title?.toLowerCase() || "";
        const description = liveClass.description?.toLowerCase() || "";

        // Check course title if populated
        const courseTitle =
          typeof liveClass.course === "object"
            ? liveClass.course.title?.toLowerCase() || ""
            : "";

        // Check instructor name if populated
        const instructorName =
          typeof liveClass.instructor === "object"
            ? `${liveClass.instructor.firstName || ""} ${liveClass.instructor.lastName || ""}`
                .toLowerCase()
                .trim()
            : "";

        return (
          title.includes(searchLower) ||
          description.includes(searchLower) ||
          courseTitle.includes(searchLower) ||
          instructorName.includes(searchLower)
        );
      });
    }

    // Calculate pagination for filtered results
    const itemsPerPage = 10;
    const filteredTotalPages = Math.max(
      1,
      Math.ceil(filtered.length / itemsPerPage),
    );
    const validPage = Math.min(currentPage, filteredTotalPages);
    const startIndex = (validPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = filtered.slice(startIndex, endIndex);

    setLiveClasses(paginatedResults);
    setTotalPages(filteredTotalPages);
    setTotalLiveClasses(filtered.length);
  }, [debouncedSearchTerm, allLiveClasses, currentPage]);

  // Display error when it occurs during save operations
  useEffect(() => {
    if (error && isSaving) {
      // Show error toast - the error state is already set by the hook
      toast.error(error);
    }
  }, [error, isSaving]);

  // Handle view mode change
  const handleViewModeChange = (mode: "all" | "ongoing") => {
    setViewMode(mode);
    setCurrentPage(1);
    setSearchTerm(""); // Reset search when changing view mode
    loadLiveClasses(1, mode, mode === "all");
  };

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setEditingLiveClass(null);
    setShowModal(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = async (liveClass: LiveClass) => {
    try {
      const fullLiveClass = await getLiveClassById(liveClass._id!);
      if (fullLiveClass) {
        setEditingLiveClass(fullLiveClass);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Failed to load live class:", error);
      toast.error("Failed to load live class details");
    }
  };

  // Handle save (create or update)
  const handleSave = async (data: {
    title: string;
    description: string;
    imageUrl: string;
    course: string;
    instructor?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  }) => {
    // Combine date and time for validation
    const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
    const endDateTime = new Date(`${data.endDate}T${data.endTime}`);

    if (endDateTime <= startDateTime) {
      toast.error("End date and time must be after start date and time");
      return;
    }

    setIsSaving(true);
    try {
      if (editingLiveClass) {
        const updated = await updateLiveClass(editingLiveClass._id!, {
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          course: data.course,
          instructor: data.instructor,
          startDate: data.startDate,
          startTime: data.startTime,
          endDate: data.endDate,
          endTime: data.endTime,
        });

        if (updated) {
          toast.success("Live class updated successfully");
          setShowModal(false);
          loadLiveClasses(1, viewMode, viewMode === "all");
        } else {
          // Error will be shown by useEffect watching the error state
        }
      } else {
        const created = await createLiveClass({
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          course: data.course,
          instructor: data.instructor,
          startDate: data.startDate,
          startTime: data.startTime,
          endDate: data.endDate,
          endTime: data.endTime,
        });

        if (created) {
          toast.success("Live class created successfully");
          setShowModal(false);
          loadLiveClasses(1, viewMode, viewMode === "all");
        } else {
          // Error will be shown by useEffect watching the error state
        }
      }
    } catch (error: any) {
      console.error("Failed to save live class:", error);
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save live class";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    // For "all" mode, we load all data so pagination is handled client-side
    // For "ongoing" mode, use server-side pagination
    if (viewMode === "all") {
      setCurrentPage(page);
      // Pagination is handled client-side after filtering
    } else {
      loadLiveClasses(page, viewMode, false);
    }
  };

  // Handle delete
  const handleDelete = async (liveClass: LiveClass) => {
    if (!liveClass._id) {
      toast.error("Invalid live class");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${liveClass.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const deleted = await deleteLiveClass(liveClass._id);
      if (deleted) {
        toast.success("Live class deleted successfully");
        loadLiveClasses(1, viewMode, viewMode === "all");
      } else {
        if (error) {
          toast.error(error);
        } else {
          toast.error("Failed to delete live class");
        }
      }
    } catch (error: any) {
      console.error("Failed to delete live class:", error);
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete live class";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* Filters and header with Create button on same line */}
      <LiveClassFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        totalLiveClasses={totalLiveClasses}
        onCreateClick={handleOpenCreateModal}
      />

      {/* Live Classes List */}
      <LiveClassesList
        liveClasses={liveClasses}
        isLoading={isLoading}
        viewMode={viewMode}
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        onCreate={handleOpenCreateModal}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Create/Edit Modal */}
      <LiveClassModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingLiveClass(null);
        }}
        onSave={handleSave}
        editingLiveClass={editingLiveClass}
        courses={courses}
        isSaving={isSaving}
      />
    </div>
  );
};

export default LiveClassesManagementPage;
