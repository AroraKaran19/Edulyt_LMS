"use client";
import { useState, useEffect } from "react";
import { Search, Gift, Eye } from "lucide-react";
import Image from "next/image";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import useUserManagement, { GiftCourseData } from "@/hooks/useUserManagement";
import useCourseManagement from "@/hooks/useCourseManagement";
import { User } from "@/types/user";
import { Course, CourseModule } from "@/types/course";
import {
  PartialAccessControl,
  ModuleAccessControl,
  LessonAccessControl,
} from "@/types/enrollment";
import { toast } from "react-toastify";
import { ChevronDown, ChevronRight } from "lucide-react";

const ManageUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<
    "elite" | "essential" | null
  >(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [giftStep, setGiftStep] = useState<1 | 2 | 3 | 4>(1);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [userEnrollments, setUserEnrollments] = useState<
    Record<string, string[]>
  >({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isGifting, setIsGifting] = useState(false);

  // Access control state
  const [accessType, setAccessType] = useState<"full" | "partial">("full");
  const [courseDetails, setCourseDetails] = useState<Course | null>(null);
  const [loadingCourseDetails, setLoadingCourseDetails] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );
  const [selectedModules, setSelectedModules] = useState<Set<string>>(
    new Set()
  );
  const [selectedLessons, setSelectedLessons] = useState<
    Record<string, Set<string>>
  >({});
  const [selectedContents, setSelectedContents] = useState<
    Record<string, Set<string>>
  >({});

  const {
    getUsers,
    updateUserStatus,
    giftCourse,
    isLoading,
    getUserEnrollments,
  } = useUserManagement();
  const { getCourses, getCourseById } = useCourseManagement();

  // Fetch users
  const fetchUsers = async () => {
    const result = await getUsers({
      page: currentPage,
      limit: 10,
      search: search || undefined,
      userType: userTypeFilter !== "all" ? (userTypeFilter as any) : undefined,
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    });

    if (result) {
      setUsers(result.users);
      setTotalPages(result.totalPages);
    }
  };

  // Fetch courses for gifting
  const fetchCourses = async () => {
    const result = await getCourses({
      page: 1,
      limit: 50,
      isActive: true,
    });

    if (result) {
      setCourses(result.courses);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, userTypeFilter, statusFilter]);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch all students for gift modal
  const fetchAllStudents = async () => {
    setLoadingStudents(true);
    try {
      const result = await getUsers({
        page: 1,
        limit: 1000, // Get all students
        userType: "student", // Only students can receive courses
      });

      if (result) {
        setAllStudents(result.users);
        // Fetch enrollments for all students
        const enrollmentsMap: Record<string, string[]> = {};
        await Promise.all(
          result.users.map(async (user) => {
            if (user._id) {
              const enrollments = await getUserEnrollments(user._id, {
                limit: 1000,
              });
              if (enrollments) {
                enrollmentsMap[user._id] = enrollments.enrollments.map(
                  (e: any) =>
                    typeof e === "string"
                      ? e
                      : e.courseId?._id || e.courseId || e._id
                );
              }
            }
          })
        );
        setUserEnrollments(enrollmentsMap);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Get available users (excluding those who already own the course)
  const getAvailableUsers = () => {
    if (!selectedCourse) return allStudents;

    return allStudents.filter((user) => {
      if (!user._id) return false;
      const userCourseIds = userEnrollments[user._id] || [];
      return !userCourseIds.includes(selectedCourse._id || "");
    });
  };

  // Handle user status update
  const handleStatusUpdate = async (
    userId: string,
    newStatus: "active" | "inactive" | "blocked"
  ) => {
    const result = await updateUserStatus(userId, newStatus);
    if (result) {
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers(); // Refresh the list
    }
  };

  // Handle course gifting
  const handleGiftCourse = async () => {
    if (!selectedCourse || !selectedPlan || selectedUsers.length === 0) {
      toast.error("Please select course, plan type, and at least one user");
      return;
    }

    // Check if the selected plan exists for the course
    if (!selectedCourse.plans || !selectedCourse.plans[selectedPlan]) {
      toast.error(
        `Selected plan (${selectedPlan}) is not available for this course`
      );
      return;
    }

    // Build access control
    const accessControl = buildAccessControl();

    setIsGifting(true);
    try {
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // Gift course to all selected users
      for (const userId of selectedUsers) {
        try {
          const giftData = {
            userId,
            courseId: selectedCourse._id!,
            planType: selectedPlan,
            ...(accessControl && { accessControl }),
          } as GiftCourseData;
          const result = await giftCourse(giftData);

          if (result) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error: any) {
          failCount++;
          const user = allStudents.find((u) => u._id === userId);
          const userName = user
            ? `${user.firstName || "Unknown"} ${user.lastName || "User"}`
            : userId;
          errors.push(
            `${userName}: ${error.message || "Failed to gift course"}`
          );
        }
      }

      if (successCount > 0) {
        const accessInfo =
          accessType === "full" ? "full access" : "partial access";
        toast.success(
          `Successfully gifted ${selectedCourse.title} (${selectedPlan} plan, ${accessInfo}) to ${successCount} user(s)`
        );
      }

      if (failCount > 0) {
        toast.error(
          `Failed to gift course to ${failCount} user(s). ${errors.join("; ")}`
        );
      }

      // Reset and close modal
      setShowGiftModal(false);
      setSelectedUsers([]);
      setSelectedCourse(null);
      setSelectedPlan(null);
      setGiftStep(1);
      setAccessType("full");
      setSelectedModules(new Set());
      setSelectedLessons({});
      setSelectedContents({});
      setCourseDetails(null);
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to gift course. Please try again.";
      toast.error(errorMessage);
      console.error("Gift course error:", error);
    } finally {
      setIsGifting(false);
    }
  };

  // Handle modal open
  const handleOpenGiftModal = () => {
    setShowGiftModal(true);
    setGiftStep(1);
    setSelectedUsers([]);
    setSelectedCourse(null);
    setSelectedPlan(null);
    setAccessType("full");
    setSelectedModules(new Set());
    setSelectedLessons({});
    setSelectedContents({});
    setCourseDetails(null);
    fetchAllStudents();
  };

  // Fetch course details with modules, lessons, and content
  const fetchCourseDetails = async (courseId: string) => {
    setLoadingCourseDetails(true);
    try {
      const course = await getCourseById(courseId);
      if (course) {
        setCourseDetails(course);
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to load course details");
    } finally {
      setLoadingCourseDetails(false);
    }
  };

  // Handle course selection (step 1 -> step 2)
  const handleCourseSelect = async (courseId: string) => {
    const course = courses.find((c) => c._id === courseId);
    setSelectedCourse(course || null);
    setSelectedPlan(null);
    setSelectedUsers([]);
    setAccessType("full");
    setSelectedModules(new Set());
    setSelectedLessons({});
    setSelectedContents({});
    setExpandedModules(new Set());
    setExpandedLessons(new Set());

    if (
      course &&
      course.plans &&
      (course.plans.elite || course.plans.essential)
    ) {
      // Fetch full course details for step 4
      await fetchCourseDetails(courseId);
      setGiftStep(2);
    }
  };

  // Handle plan selection (step 2 -> step 3)
  const handlePlanSelect = (planType: string) => {
    setSelectedPlan(planType as "elite" | "essential");
    setSelectedUsers([]);
    setGiftStep(3);
  };

  // Handle access type selection (step 3 -> step 4)
  const handleAccessTypeSelect = (type: "full" | "partial") => {
    setAccessType(type);
    if (type === "full") {
      // Reset all selections for full access
      setSelectedModules(new Set());
      setSelectedLessons({});
      setSelectedContents({});
    }
  };

  // Toggle module selection
  const toggleModule = (moduleId: string) => {
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
      // Remove all lessons and contents for this module
      const newLessons = { ...selectedLessons };
      const newContents = { ...selectedContents };
      delete newLessons[moduleId];
      delete newContents[moduleId];
      setSelectedLessons(newLessons);
      setSelectedContents(newContents);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules(newSelected);
  };

  // Toggle lesson selection
  const toggleLesson = (moduleId: string, lessonId: string) => {
    const moduleLessons = selectedLessons[moduleId] || new Set<string>();
    const newModuleLessons = new Set(moduleLessons);

    if (newModuleLessons.has(lessonId)) {
      // Unselect lesson - remove it and all its contents
      newModuleLessons.delete(lessonId);
      const newContents = { ...selectedContents };
      delete newContents[lessonId];
      setSelectedContents(newContents);
    } else {
      // Select lesson - automatically select all contents in this lesson
      newModuleLessons.add(lessonId);

      // Find the lesson and get all its content IDs
      if (
        courseDetails &&
        courseDetails.modules &&
        Array.isArray(courseDetails.modules)
      ) {
        const module = (courseDetails.modules as CourseModule[]).find(
          (m) => (typeof m === "string" ? m : m._id) === moduleId
        );

        if (module && typeof module !== "string") {
          const lesson = (
            Array.isArray(module.lessons) ? module.lessons : []
          ).find((l) => (typeof l === "string" ? l : l._id) === lessonId);

          if (
            lesson &&
            typeof lesson !== "string" &&
            Array.isArray(lesson.contents)
          ) {
            // Auto-select all content IDs in this lesson
            const allContentIds = lesson.contents
              .map((c) => (typeof c === "string" ? c : c._id))
              .filter((id): id is string => !!id);

            const newContents = { ...selectedContents };
            newContents[lessonId] = new Set(allContentIds);
            setSelectedContents(newContents);
          }
        }
      }
    }

    setSelectedLessons({ ...selectedLessons, [moduleId]: newModuleLessons });
  };

  // Toggle content selection
  const toggleContent = (
    moduleId: string,
    lessonId: string,
    contentId: string
  ) => {
    // Check if the lesson is already selected
    const moduleLessons = selectedLessons[moduleId] || new Set<string>();
    const isLessonSelected = moduleLessons.has(lessonId);

    if (isLessonSelected) {
      // If lesson is selected, unselect the lesson first (which will remove all contents)
      // Then select only the remaining contents
      const newModuleLessons = new Set(moduleLessons);
      newModuleLessons.delete(lessonId);
      setSelectedLessons({ ...selectedLessons, [moduleId]: newModuleLessons });

      // Get all content IDs for this lesson
      if (
        courseDetails &&
        courseDetails.modules &&
        Array.isArray(courseDetails.modules)
      ) {
        const module = (courseDetails.modules as CourseModule[]).find(
          (m) => (typeof m === "string" ? m : m._id) === moduleId
        );

        if (module && typeof module !== "string") {
          const lesson = (
            Array.isArray(module.lessons) ? module.lessons : []
          ).find((l) => (typeof l === "string" ? l : l._id) === lessonId);

          if (
            lesson &&
            typeof lesson !== "string" &&
            Array.isArray(lesson.contents)
          ) {
            const allContentIds = lesson.contents
              .map((c) => (typeof c === "string" ? c : c._id))
              .filter((id): id is string => !!id);

            // Remove the toggled content and keep the rest
            const newContentIds = allContentIds.filter(
              (id) => id !== contentId
            );
            const newContents = { ...selectedContents };

            if (newContentIds.length > 0) {
              newContents[lessonId] = new Set(newContentIds);
            } else {
              delete newContents[lessonId];
            }

            setSelectedContents(newContents);
          }
        }
      }
    } else {
      // Lesson is not selected, so we're selecting individual contents
      const lessonContents = selectedContents[lessonId] || new Set<string>();
      const newLessonContents = new Set(lessonContents);

      if (newLessonContents.has(contentId)) {
        newLessonContents.delete(contentId);
      } else {
        newLessonContents.add(contentId);
      }

      const newContents = { ...selectedContents };
      if (newLessonContents.size > 0) {
        newContents[lessonId] = newLessonContents;
      } else {
        delete newContents[lessonId];
      }
      setSelectedContents(newContents);
    }
  };

  // Toggle module expansion
  const toggleModuleExpansion = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Toggle lesson expansion
  const toggleLessonExpansion = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  // Check if there are any valid selections for partial access
  const hasValidPartialAccessSelection = (): boolean => {
    // Check if any modules are selected
    if (selectedModules.size > 0) {
      return true;
    }
    
    // Check if any contents are selected (which implies modules/lessons need to be included)
    const hasSelectedContents = Object.keys(selectedContents).some(
      (lessonId) => selectedContents[lessonId] && selectedContents[lessonId].size > 0
    );
    
    return hasSelectedContents;
  };

  // Build access control object from selections
  const buildAccessControl = (): PartialAccessControl | undefined => {
    if (accessType === "full") {
      return undefined; // Full access means no accessControl
    }

    // First, build a complete map of lessons to their parent modules
    const lessonToModuleMap = new Map<string, string>(); // Map lessonId to moduleId
    const allModulesMap = new Map<string, CourseModule>(); // Map moduleId to module
    const allLessonsMap = new Map<string, { lessonId: string; moduleId: string }>(); // Map lessonId to lesson info
    
    if (
      courseDetails &&
      courseDetails.modules &&
      Array.isArray(courseDetails.modules)
    ) {
      (courseDetails.modules as CourseModule[]).forEach((module) => {
        const moduleId = typeof module === "string" ? module : module._id || "";
        if (moduleId && typeof module !== "string") {
          allModulesMap.set(moduleId, module);
          
          if (Array.isArray(module.lessons)) {
            module.lessons.forEach((lesson) => {
              const lessonId = typeof lesson === "string" ? lesson : lesson._id || "";
              if (lessonId) {
                lessonToModuleMap.set(lessonId, moduleId);
                allLessonsMap.set(lessonId, { lessonId, moduleId });
              }
            });
          }
        }
      });
    }

    // Find all modules that need to be included:
    // 1. Explicitly selected modules
    // 2. Modules that contain lessons with selected contents (even if module wasn't selected)
    const modulesToProcess = new Set<string>();
    
    // Add explicitly selected modules
    selectedModules.forEach((moduleId) => modulesToProcess.add(moduleId));
    
    // Add modules that contain lessons with selected contents
    Object.keys(selectedContents).forEach((lessonId) => {
      if (selectedContents[lessonId] && selectedContents[lessonId].size > 0) {
        const moduleId = lessonToModuleMap.get(lessonId);
        if (moduleId) {
          modulesToProcess.add(moduleId);
        }
      }
    });

    const accessibleModules: ModuleAccessControl[] = [];

    // Process each module that needs to be included
    modulesToProcess.forEach((moduleId) => {
      const moduleLessons = selectedLessons[moduleId];
      const module = allModulesMap.get(moduleId);
      
      if (!module) return;

      // Get all lessons in this module
      const allModuleLessons = new Set<string>();
      if (typeof module !== "string" && Array.isArray(module.lessons)) {
        module.lessons.forEach((lesson) => {
          const lessonId = typeof lesson === "string" ? lesson : lesson._id || "";
          if (lessonId) {
            allModuleLessons.add(lessonId);
          }
        });
      }

      // Check if there are any selected contents for lessons in this module
      const hasSelectedContents = Array.from(Object.keys(selectedContents)).some(
        (lessonId) => {
          return lessonToModuleMap.get(lessonId) === moduleId &&
                 selectedContents[lessonId] &&
                 selectedContents[lessonId].size > 0;
        }
      );

      // If no lessons selected AND no contents selected, user has access to all lessons in module
      if ((!moduleLessons || moduleLessons.size === 0) && !hasSelectedContents) {
        accessibleModules.push({ moduleId });
      } else {
        // User has access to specific lessons or specific contents
        const accessibleLessons: LessonAccessControl[] = [];

        // Process all lessons in the module
        allModuleLessons.forEach((lessonId) => {
          const isLessonSelected = moduleLessons?.has(lessonId) || false;
          const lessonContents = selectedContents[lessonId];

          if (isLessonSelected) {
            // Lesson is selected - all contents are accessible (no need to specify content IDs)
            accessibleLessons.push({ lessonId });
          } else if (lessonContents && lessonContents.size > 0) {
            // Lesson is NOT selected but has individual contents selected
            // Add the lesson with only those specific content IDs
            accessibleLessons.push({
              lessonId,
              accessibleContentIds: Array.from(lessonContents),
            });
          }
        });

        // Only add module if there are accessible lessons
        if (accessibleLessons.length > 0) {
          accessibleModules.push({
            moduleId,
            accessibleLessons,
          });
        }
      }
    });

    return {
      accessType: "partial",
      accessibleModules:
        accessibleModules.length > 0 ? accessibleModules : undefined,
    };
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get user type badge color
  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case "student":
        return "bg-blue-100 text-blue-800";
      case "instructor":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-orange-100 text-orange-800";
      case "super-admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Users</h1>
        <p className="text-gray-600">
          View and manage all users, gift courses, and update status
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* User Type Filter */}
          <Select
            options={[
              { value: "all", label: "All Types" },
              { value: "student", label: "Students" },
              { value: "instructor", label: "Instructors" },
              { value: "admin", label: "Admins" },
            ]}
            value={userTypeFilter}
            onChange={setUserTypeFilter}
            placeholder="Filter by type"
          />

          {/* Status Filter */}
          <Select
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "blocked", label: "Blocked" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter by status"
          />

          {/* Gift Course Button */}
          <OrangeButton
            onClick={handleOpenGiftModal}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            Gift Course
          </OrangeButton>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10">
                        <Image
                          src={user.profilePicture || "/user.svg"}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                          width={40}
                          height={40}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName || "Unknown"}{" "}
                          {user.lastName || "User"}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user._id?.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeBadgeColor(
                        user.userType
                      )}`}
                    >
                      {user.userType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Select
                        options={[
                          { value: "active", label: "Activate" },
                          { value: "inactive", label: "Deactivate" },
                          { value: "blocked", label: "Block" },
                        ]}
                        value=""
                        onChange={(value: string) =>
                          handleStatusUpdate(user._id!, value as any)
                        }
                        placeholder="Actions"
                        className="w-32"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={
                  currentPage === 1 ? "cursor-not-allowed" : "cursor-pointer"
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page{" "}
                  <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`rounded-l-md ${
                      currentPage === 1
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`rounded-r-md ${
                      currentPage === totalPages
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gift Course Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Gift Course to Users
              </h3>
              <button
                onClick={() => {
                  setShowGiftModal(false);
                  setSelectedUsers([]);
                  setSelectedCourse(null);
                  setSelectedPlan(null);
                  setGiftStep(1);
                  setAccessType("full");
                  setSelectedModules(new Set());
                  setSelectedLessons({});
                  setSelectedContents({});
                  setCourseDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    giftStep >= 1
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  1
                </div>
                <div
                  className={`w-12 h-1 ${
                    giftStep >= 2 ? "bg-orange-500" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    giftStep >= 2
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                <div
                  className={`w-12 h-1 ${
                    giftStep >= 3 ? "bg-orange-500" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    giftStep >= 3
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  3
                </div>
                <div
                  className={`w-12 h-1 ${
                    giftStep >= 4 ? "bg-orange-500" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    giftStep >= 4
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  4
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Step 1: Course Selection */}
              {giftStep === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <Select
                    options={courses.map((course) => {
                      const elitePlan = course.plans?.elite;
                      const essentialPlan = course.plans?.essential;
                      let planInfo = "";

                      if (elitePlan && essentialPlan) {
                        planInfo = ` (Elite: ₹${elitePlan.price}, Essential: ₹${essentialPlan.price})`;
                      } else if (elitePlan) {
                        planInfo = ` (Elite: ₹${elitePlan.price})`;
                      } else if (essentialPlan) {
                        planInfo = ` (Essential: ₹${essentialPlan.price})`;
                      }

                      return {
                        value: course._id!,
                        label: `${course.title}${planInfo}`,
                      };
                    })}
                    value={selectedCourse?._id || ""}
                    onChange={handleCourseSelect}
                    placeholder="Choose a course"
                  />
                  {selectedCourse &&
                    (!selectedCourse.plans ||
                      (!selectedCourse.plans.elite &&
                        !selectedCourse.plans.essential)) && (
                      <p className="mt-2 text-sm text-red-500">
                        This course doesn't have any plans available.
                      </p>
                    )}
                </div>
              )}

              {/* Step 2: Plan Selection */}
              {giftStep === 2 &&
                selectedCourse &&
                selectedCourse.plans &&
                (selectedCourse.plans.elite ||
                  selectedCourse.plans.essential) && (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        Selected Course:{" "}
                        <span className="font-medium">
                          {selectedCourse.title}
                        </span>
                      </p>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Plan Type
                    </label>
                    <Select
                      options={[
                        ...(selectedCourse.plans?.elite
                          ? [
                              {
                                value: "elite",
                                label: `Elite Plan - ₹${selectedCourse.plans.elite.price}`,
                              },
                            ]
                          : []),
                        ...(selectedCourse.plans?.essential
                          ? [
                              {
                                value: "essential",
                                label: `Essential Plan - ₹${selectedCourse.plans.essential.price}`,
                              },
                            ]
                          : []),
                      ]}
                      value={selectedPlan || ""}
                      onChange={handlePlanSelect}
                      placeholder="Choose a plan"
                    />
                  </div>
                )}

              {/* Step 3: User Selection (Multi-select) */}
              {giftStep === 3 && selectedCourse && selectedPlan && (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Course:{" "}
                      <span className="font-medium">
                        {selectedCourse.title}
                      </span>{" "}
                      | Plan:{" "}
                      <span className="font-medium capitalize">
                        {selectedPlan}
                      </span>
                    </p>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Users (Multiple selection)
                  </label>
                  {loadingStudents ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Loading users...</p>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                      {getAvailableUsers().length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p>
                            No available users. All users already own this
                            course.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {getAvailableUsers().map((user) => (
                            <label
                              key={user._id}
                              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id || "")}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([
                                      ...selectedUsers,
                                      user._id || "",
                                    ]);
                                  } else {
                                    setSelectedUsers(
                                      selectedUsers.filter(
                                        (id) => id !== user._id
                                      )
                                    );
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                              />
                              <div className="ml-3 flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName || "Unknown"}{" "}
                                  {user.lastName || "User"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedUsers.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      {selectedUsers.length} user(s) selected
                    </p>
                  )}
                </div>
              )}

              {/* Step 4: Access Control Selection */}
              {giftStep === 4 &&
                selectedCourse &&
                selectedPlan &&
                selectedUsers.length > 0 && (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        Course:{" "}
                        <span className="font-medium">
                          {selectedCourse.title}
                        </span>{" "}
                        | Plan:{" "}
                        <span className="font-medium capitalize">
                          {selectedPlan}
                        </span>{" "}
                        | Users:{" "}
                        <span className="font-medium">
                          {selectedUsers.length}
                        </span>
                      </p>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Access Type
                    </label>
                    <div className="flex gap-4 mb-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="accessType"
                          value="full"
                          checked={accessType === "full"}
                          onChange={() => handleAccessTypeSelect("full")}
                          className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Full Access
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="accessType"
                          value="partial"
                          checked={accessType === "partial"}
                          onChange={() => handleAccessTypeSelect("partial")}
                          className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Partial Access
                        </span>
                      </label>
                    </div>

                    {accessType === "partial" && (
                      <div>
                        {loadingCourseDetails ? (
                          <div className="text-center py-4">
                            <p className="text-gray-500">
                              Loading course structure...
                            </p>
                          </div>
                        ) : courseDetails &&
                          courseDetails.modules &&
                          Array.isArray(courseDetails.modules) &&
                          courseDetails.modules.length > 0 ? (
                          <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Select Modules, Lessons, and Content
                            </label>
                            <p className="text-xs text-gray-500 mb-4">
                              Select modules to grant access. If you select a
                              module without selecting lessons, users will have
                              access to all lessons in that module. Same applies
                              for lessons and content.
                            </p>
                            <div className="space-y-2">
                              {(courseDetails.modules as CourseModule[]).map(
                                (module) => {
                                  const moduleId =
                                    typeof module === "string"
                                      ? module
                                      : module._id || "";
                                  const moduleTitle =
                                    typeof module === "string"
                                      ? "Unknown Module"
                                      : module.title;
                                  const moduleLessons =
                                    typeof module === "string"
                                      ? []
                                      : Array.isArray(module.lessons)
                                      ? module.lessons
                                      : [];
                                  const isModuleSelected =
                                    selectedModules.has(moduleId);
                                  const isModuleExpanded =
                                    expandedModules.has(moduleId);

                                  return (
                                    <div
                                      key={moduleId}
                                      className="border border-gray-200 rounded-lg"
                                    >
                                      <div className="flex items-center p-3 hover:bg-gray-50">
                                        <button
                                          onClick={() =>
                                            toggleModuleExpansion(moduleId)
                                          }
                                          className="mr-2 text-gray-400 hover:text-gray-600"
                                        >
                                          {isModuleExpanded ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                        </button>
                                        <input
                                          type="checkbox"
                                          checked={isModuleSelected}
                                          onChange={() =>
                                            toggleModule(moduleId)
                                          }
                                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-900">
                                          {moduleTitle}
                                        </span>
                                      </div>

                                      {isModuleExpanded &&
                                        moduleLessons.length > 0 && (
                                          <div className="pl-8 pr-4 pb-2 space-y-1">
                                            {moduleLessons.map((lesson) => {
                                              const lessonId =
                                                typeof lesson === "string"
                                                  ? lesson
                                                  : lesson._id || "";
                                              const lessonTitle =
                                                typeof lesson === "string"
                                                  ? "Unknown Lesson"
                                                  : lesson.title;
                                              const lessonContents =
                                                typeof lesson === "string"
                                                  ? []
                                                  : Array.isArray(
                                                      lesson.contents
                                                    )
                                                  ? lesson.contents
                                                  : [];
                                              const isLessonSelected =
                                                selectedLessons[moduleId]?.has(
                                                  lessonId
                                                );
                                              const isLessonExpanded =
                                                expandedLessons.has(lessonId);

                                              return (
                                                <div
                                                  key={lessonId}
                                                  className="border border-gray-200 rounded p-2"
                                                >
                                                  <div className="flex items-center">
                                                    <button
                                                      onClick={() =>
                                                        toggleLessonExpansion(
                                                          lessonId
                                                        )
                                                      }
                                                      className="mr-2 text-gray-400 hover:text-gray-600"
                                                    >
                                                      {isLessonExpanded ? (
                                                        <ChevronDown className="w-3 h-3" />
                                                      ) : (
                                                        <ChevronRight className="w-3 h-3" />
                                                      )}
                                                    </button>
                                                    <input
                                                      type="checkbox"
                                                      checked={
                                                        isLessonSelected ||
                                                        false
                                                      }
                                                      onChange={() =>
                                                        toggleLesson(
                                                          moduleId,
                                                          lessonId
                                                        )
                                                      }
                                                      className="w-3 h-3 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                                    />
                                                    <span className="ml-2 text-xs font-medium text-gray-700">
                                                      {lessonTitle}
                                                    </span>
                                                  </div>

                                                  {isLessonExpanded &&
                                                    lessonContents.length >
                                                      0 && (
                                                      <div className="pl-6 pr-2 pt-1 space-y-1">
                                                        {lessonContents.map(
                                                          (content) => {
                                                            const contentId =
                                                              typeof content ===
                                                              "string"
                                                                ? content
                                                                : content._id ||
                                                                  "";
                                                            const contentTitle =
                                                              typeof content ===
                                                              "string"
                                                                ? "Unknown Content"
                                                                : content.title;
                                                            const contentType =
                                                              typeof content ===
                                                              "string"
                                                                ? "unknown"
                                                                : content.type;

                                                            // Check if lesson is selected (all contents are accessible)
                                                            const isLessonSelected =
                                                              selectedLessons[
                                                                moduleId
                                                              ]?.has(lessonId);
                                                            // Check if this specific content is selected (when lesson is not selected)
                                                            const isContentIndividuallySelected =
                                                              !isLessonSelected &&
                                                              selectedContents[
                                                                lessonId
                                                              ]?.has(contentId);

                                                            return (
                                                              <label
                                                                key={contentId}
                                                                className="flex items-center text-xs text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                                              >
                                                                <input
                                                                  type="checkbox"
                                                                  checked={
                                                                    isLessonSelected ||
                                                                    isContentIndividuallySelected ||
                                                                    false
                                                                  }
                                                                  onChange={() =>
                                                                    toggleContent(
                                                                      moduleId,
                                                                      lessonId,
                                                                      contentId
                                                                    )
                                                                  }
                                                                  className="w-3 h-3 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                                                />
                                                                <span className="ml-2">
                                                                  {contentTitle}{" "}
                                                                  ({contentType}
                                                                  )
                                                                </span>
                                                              </label>
                                                            );
                                                          }
                                                        )}
                                                      </div>
                                                    )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            {!hasValidPartialAccessSelection() && (
                              <p className="mt-4 text-sm text-amber-600">
                                Please select at least one module, lesson, or content to grant
                                partial access.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <p>This course doesn't have any modules yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <div>
                {giftStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (giftStep === 4) {
                        setGiftStep(3);
                      } else if (giftStep === 3) {
                        setGiftStep(2);
                        setSelectedUsers([]);
                      } else if (giftStep === 2) {
                        setGiftStep(1);
                        setSelectedPlan(null);
                        setSelectedUsers([]);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGiftModal(false);
                    setSelectedUsers([]);
                    setSelectedCourse(null);
                    setSelectedPlan(null);
                    setGiftStep(1);
                    setAccessType("full");
                    setSelectedModules(new Set());
                    setSelectedLessons({});
                    setSelectedContents({});
                    setCourseDetails(null);
                  }}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                {giftStep === 4 ? (
                  <OrangeButton
                    onClick={handleGiftCourse}
                    disabled={
                      isGifting ||
                      isLoading ||
                      (accessType === "partial" && !hasValidPartialAccessSelection())
                    }
                    className={
                      isGifting ||
                      isLoading ||
                      (accessType === "partial" && !hasValidPartialAccessSelection())
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  >
                    {isGifting || isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Gifting...
                      </span>
                    ) : (
                      `Gift to ${selectedUsers.length} User(s)`
                    )}
                  </OrangeButton>
                ) : (
                  <OrangeButton
                    onClick={() => {
                      if (
                        giftStep === 1 &&
                        selectedCourse &&
                        selectedCourse.plans &&
                        (selectedCourse.plans.elite ||
                          selectedCourse.plans.essential)
                      ) {
                        setGiftStep(2);
                      } else if (giftStep === 2 && selectedPlan) {
                        setGiftStep(3);
                      } else if (giftStep === 3 && selectedUsers.length > 0) {
                        setGiftStep(4);
                      }
                    }}
                    disabled={
                      (giftStep === 1 &&
                        (!selectedCourse ||
                          !selectedCourse.plans ||
                          (!selectedCourse.plans.elite &&
                            !selectedCourse.plans.essential))) ||
                      (giftStep === 2 && !selectedPlan) ||
                      (giftStep === 3 && selectedUsers.length === 0)
                    }
                    className={
                      (giftStep === 1 &&
                        (!selectedCourse ||
                          !selectedCourse.plans ||
                          (!selectedCourse.plans.elite &&
                            !selectedCourse.plans.essential))) ||
                      (giftStep === 2 && !selectedPlan) ||
                      (giftStep === 3 && selectedUsers.length === 0)
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  >
                    Next
                  </OrangeButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              User Details
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Image
                  src={selectedUser.profilePicture || "/user.svg"}
                  alt={`${selectedUser.firstName || "Unknown"} ${
                    selectedUser.lastName || "User"
                  }`}
                  className="h-16 w-16 rounded-full object-cover"
                  width={64}
                  height={64}
                />
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedUser.firstName || "Unknown"}{" "}
                    {selectedUser.lastName || "User"}
                  </h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">User Type:</span>
                  <span
                    className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeBadgeColor(
                      selectedUser.userType
                    )}`}
                  >
                    {selectedUser.userType}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                      selectedUser.status
                    )}`}
                  >
                    {selectedUser.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-gray-600">
                    {selectedUser.phone || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Joined:</span>
                  <span className="ml-2 text-gray-600">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                }}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersPage;
