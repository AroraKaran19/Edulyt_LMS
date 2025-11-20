"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Gift,
  Eye,
  Edit,
  Trash2,
  Key,
  X,
  Check,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import useUserManagement, { GiftCourseData } from "@/hooks/useUserManagement";
import useCourseManagement from "@/hooks/useCourseManagement";
import { User, Instructor, Student } from "@/types/user";
import { Course, CourseModule } from "@/types/course";
import {
  PartialAccessControl,
  ModuleAccessControl,
  LessonAccessControl,
} from "@/types/enrollment";
import { toast } from "react-toastify";
import { ChevronDown, ChevronRight } from "lucide-react";
import DateSelector from "@/components/ui/inputs/DateSelector";

const ManageUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [giftStep, setGiftStep] = useState<1 | 2 | 3 | 4>(1);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [userEnrollments, setUserEnrollments] = useState<
    Record<string, string[]>
  >({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fullUserData, setFullUserData] = useState<User | null>(null);
  const [userEnrollmentsCount, setUserEnrollmentsCount] = useState<number>(0);
  const [isGifting, setIsGifting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editFormData, setEditFormData] = useState<
    Partial<User & Instructor & Student>
  >({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser,
    changeUserPassword,
    giftCourse,
    isLoading,
    getUserEnrollments,
  } = useUserManagement();
  const { getCourses, getCourseById } = useCourseManagement();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = async () => {
    const result = await getUsers({
      page: currentPage,
      limit: 10,
      search: debouncedSearch || undefined,
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
  }, [currentPage, debouncedSearch, userTypeFilter, statusFilter]);

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

  // Fetch full user data when viewing details
  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
 
    // Fetch full user data
    if (user._id) {
      const fullData = await getUserById(user._id);
      if (fullData) {
        setFullUserData(fullData);
      }

      // Fetch user enrollments count
      const enrollments = await getUserEnrollments(user._id, {
        limit: 1000,
      });
      if (enrollments) {
        setUserEnrollmentsCount(enrollments.total || enrollments.enrollments.length);
      } else {
        setUserEnrollmentsCount(0);
      }
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      whatsappNumber: user.whatsappNumber || "",
      dob: user.dob ? new Date(user.dob) : undefined,
      status: user.status || "active",
      address: user.address || {
        address: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      },
      ...(user.userType === "instructor" && {
        bio: (user as Instructor).bio || "",
        currentPosition: (user as Instructor).currentPosition || "",
        currentCompany: (user as Instructor).currentCompany || "",
        linkedinUrl: (user as Instructor).linkedinUrl || "",
      }),
      ...(user.userType === "student" && {
        collegeName: (user as Student).collegeName || "",
        degreeName: (user as Student).degreeName || "",
        currentPosition: (user as Student).currentPosition || "",
        currentCompany: (user as Student).currentCompany || "",
        domain: (user as Student).domain || "",
        portfolio: (user as Student).portfolio || "",
      }),
    });
    setShowEditModal(true);
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser?._id) return;

    setIsUpdating(true);
    try {
      const result = await updateUser(selectedUser._id, editFormData);
      if (result) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        setEditFormData({});
        fetchUsers(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to update user"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!selectedUser?._id) return;

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changeUserPassword(selectedUser._id, newPassword);
      if (result) {
        toast.success("Password changed successfully");
        setShowChangePasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to change password"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser?._id) return;

    setIsDeleting(true);
    try {
      const result = await deleteUser(selectedUser._id);
      if (result) {
        toast.success("User deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to delete user"
      );
    } finally {
      setIsDeleting(false);
    }
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
      (lessonId) =>
        selectedContents[lessonId] && selectedContents[lessonId].size > 0
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
    const allLessonsMap = new Map<
      string,
      { lessonId: string; moduleId: string }
    >(); // Map lessonId to lesson info

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
              const lessonId =
                typeof lesson === "string" ? lesson : lesson._id || "";
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
          const lessonId =
            typeof lesson === "string" ? lesson : lesson._id || "";
          if (lessonId) {
            allModuleLessons.add(lessonId);
          }
        });
      }

      // Check if there are any selected contents for lessons in this module
      const hasSelectedContents = Array.from(
        Object.keys(selectedContents)
      ).some((lessonId) => {
        return (
          lessonToModuleMap.get(lessonId) === moduleId &&
          selectedContents[lessonId] &&
          selectedContents[lessonId].size > 0
        );
      });

      // If no lessons selected AND no contents selected, user has access to all lessons in module
      if (
        (!moduleLessons || moduleLessons.size === 0) &&
        !hasSelectedContents
      ) {
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
                        onClick={() => handleViewUserDetails(user)}
                        className="cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowChangePasswordModal(true);
                        }}
                        className="cursor-pointer text-purple-600 hover:text-purple-700"
                        title="Change Password"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteConfirm(true);
                        }}
                        className="cursor-pointer text-red-600 hover:text-red-700"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-linear-to-r from-orange-500 to-orange-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Gift Course to Users
                    </h3>
                    <p className="text-sm text-orange-50">
                      Step {giftStep} of 4
                    </p>
                  </div>
                </div>
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
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-center">
                <div className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                        giftStep >= 1
                          ? "bg-orange-500 text-white shadow-lg scale-110"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {giftStep > 1 ? <Check className="w-5 h-5" /> : "1"}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        giftStep >= 1 ? "text-orange-600" : "text-gray-500"
                      }`}
                    >
                      Course
                    </span>
                  </div>
                  <div
                    className={`w-16 h-1 mx-2 transition-all ${
                      giftStep >= 2 ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  />
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                        giftStep >= 2
                          ? "bg-orange-500 text-white shadow-lg scale-110"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {giftStep > 2 ? <Check className="w-5 h-5" /> : "2"}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        giftStep >= 2 ? "text-orange-600" : "text-gray-500"
                      }`}
                    >
                      Plan
                    </span>
                  </div>
                  <div
                    className={`w-16 h-1 mx-2 transition-all ${
                      giftStep >= 3 ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  />
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                        giftStep >= 3
                          ? "bg-orange-500 text-white shadow-lg scale-110"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {giftStep > 3 ? <Check className="w-5 h-5" /> : "3"}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        giftStep >= 3 ? "text-orange-600" : "text-gray-500"
                      }`}
                    >
                      Users
                    </span>
                  </div>
                  <div
                    className={`w-16 h-1 mx-2 transition-all ${
                      giftStep >= 4 ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  />
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                        giftStep >= 4
                          ? "bg-orange-500 text-white shadow-lg scale-110"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      4
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        giftStep >= 4 ? "text-orange-600" : "text-gray-500"
                      }`}
                    >
                      Access
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="space-y-6">
                {/* Step 1: Course Selection */}
                {giftStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
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
                        placeholder="Choose a course to gift"
                      />
                      {selectedCourse &&
                        (!selectedCourse.plans ||
                          (!selectedCourse.plans.elite &&
                            !selectedCourse.plans.essential)) && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">
                              ⚠️ This course doesn't have any plans available.
                            </p>
                          </div>
                        )}
                      {selectedCourse && selectedCourse.plans && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700">
                            ✓ Course selected:{" "}
                            <span className="font-semibold">
                              {selectedCourse.title}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Plan Selection */}
                {giftStep === 2 &&
                  selectedCourse &&
                  selectedCourse.plans &&
                  (selectedCourse.plans.elite ||
                    selectedCourse.plans.essential) && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">
                            Selected Course:
                          </span>{" "}
                          <span className="text-blue-700 font-medium">
                            {selectedCourse.title}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
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
                          placeholder="Choose a plan type"
                        />
                        {selectedPlan && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">
                              ✓ Plan selected:{" "}
                              <span className="font-semibold capitalize">
                                {selectedPlan}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Step 3: User Selection (Multi-select) */}
                {giftStep === 3 && selectedCourse && selectedPlan && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">
                            Course:
                          </span>{" "}
                          <span className="text-blue-700 font-medium">
                            {selectedCourse.title}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div>
                          <span className="font-semibold text-gray-700">
                            Plan:
                          </span>{" "}
                          <span className="text-blue-700 font-medium capitalize">
                            {selectedPlan}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Select Users
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (Multiple selection allowed)
                        </span>
                      </label>
                      {loadingStudents ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                          <p className="text-gray-500">Loading users...</p>
                        </div>
                      ) : (
                        <div className="border-2 border-gray-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                          {getAvailableUsers().length === 0 ? (
                            <div className="p-8 text-center">
                              <div className="text-gray-400 mb-2">
                                <UserIcon className="w-12 h-12 mx-auto" />
                              </div>
                              <p className="text-gray-600 font-medium">
                                No available users
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                All users already own this course.
                              </p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {getAvailableUsers().map((user) => (
                                <label
                                  key={user._id}
                                  className="flex items-center p-4 hover:bg-orange-50 transition-colors cursor-pointer group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(
                                      user._id || ""
                                    )}
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
                                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                  />
                                  <div className="ml-4 flex-1">
                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-700">
                                      {user.firstName || "Unknown"}{" "}
                                      {user.lastName || "User"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {user.email}
                                    </div>
                                  </div>
                                  {selectedUsers.includes(user._id || "") && (
                                    <div className="text-orange-600">
                                      <Check className="w-5 h-5" />
                                    </div>
                                  )}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {selectedUsers.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ {selectedUsers.length} user
                            {selectedUsers.length > 1 ? "s" : ""} selected
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Access Control Selection */}
                {giftStep === 4 &&
                  selectedCourse &&
                  selectedPlan &&
                  selectedUsers.length > 0 && (
                    <div className="space-y-6">
                      <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div>
                            <span className="font-semibold text-gray-700">
                              Course:
                            </span>{" "}
                            <span className="text-blue-700 font-medium">
                              {selectedCourse.title}
                            </span>
                          </div>
                          <div className="h-4 w-px bg-gray-300"></div>
                          <div>
                            <span className="font-semibold text-gray-700">
                              Plan:
                            </span>{" "}
                            <span className="text-blue-700 font-medium capitalize">
                              {selectedPlan}
                            </span>
                          </div>
                          <div className="h-4 w-px bg-gray-300"></div>
                          <div>
                            <span className="font-semibold text-gray-700">
                              Users:
                            </span>{" "}
                            <span className="text-blue-700 font-medium">
                              {selectedUsers.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-4">
                          Access Type
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <label
                            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              accessType === "full"
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="accessType"
                              value="full"
                              checked={accessType === "full"}
                              onChange={() => handleAccessTypeSelect("full")}
                              className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-2 focus:ring-orange-500"
                            />
                            <div className="ml-3">
                              <span className="text-sm font-semibold text-gray-900 block">
                                Full Access
                              </span>
                              <span className="text-xs text-gray-500">
                                Grant access to all course content
                              </span>
                            </div>
                          </label>
                          <label
                            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              accessType === "partial"
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="accessType"
                              value="partial"
                              checked={accessType === "partial"}
                              onChange={() => handleAccessTypeSelect("partial")}
                              className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-2 focus:ring-orange-500"
                            />
                            <div className="ml-3">
                              <span className="text-sm font-semibold text-gray-900 block">
                                Partial Access
                              </span>
                              <span className="text-xs text-gray-500">
                                Select specific modules and lessons
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {accessType === "partial" && (
                        <div>
                          {loadingCourseDetails ? (
                            <div className="text-center py-12">
                              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-3"></div>
                              <p className="text-gray-600 font-medium">
                                Loading course structure...
                              </p>
                            </div>
                          ) : courseDetails &&
                            courseDetails.modules &&
                            Array.isArray(courseDetails.modules) &&
                            courseDetails.modules.length > 0 ? (
                            <div className="border-2 border-gray-200 rounded-xl max-h-96 overflow-y-auto p-5 bg-gray-50">
                              <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                  Select Modules, Lessons, and Content
                                </label>
                                <p className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  💡 <strong>Tip:</strong> Select modules to
                                  grant access. If you select a module without
                                  selecting lessons, users will have access to
                                  all lessons in that module. Same applies for
                                  lessons and content.
                                </p>
                              </div>
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
                                                  selectedLessons[
                                                    moduleId
                                                  ]?.has(lessonId);
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
                                                                ]?.has(
                                                                  lessonId
                                                                );
                                                              // Check if this specific content is selected (when lesson is not selected)
                                                              const isContentIndividuallySelected =
                                                                !isLessonSelected &&
                                                                selectedContents[
                                                                  lessonId
                                                                ]?.has(
                                                                  contentId
                                                                );

                                                              return (
                                                                <label
                                                                  key={
                                                                    contentId
                                                                  }
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
                                                                    {
                                                                      contentTitle
                                                                    }{" "}
                                                                    (
                                                                    {
                                                                      contentType
                                                                    }
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
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-sm text-amber-700 font-medium">
                                    ⚠️ Please select at least one module,
                                    lesson, or content to grant partial access.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <p className="text-gray-600 font-medium">
                                This course doesn't have any modules yet.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center gap-3">
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
                    ← Back
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
                      (accessType === "partial" &&
                        !hasValidPartialAccessSelection())
                    }
                    className={`px-6 py-2.5 font-semibold ${
                      isGifting ||
                      isLoading ||
                      (accessType === "partial" &&
                        !hasValidPartialAccessSelection())
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:shadow-lg transition-shadow"
                    }`}
                  >
                    {isGifting || isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Gifting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Gift to {selectedUsers.length} User
                        {selectedUsers.length > 1 ? "s" : ""}
                      </span>
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
                    className={`px-6 py-2.5 font-semibold ${
                      (giftStep === 1 &&
                        (!selectedCourse ||
                          !selectedCourse.plans ||
                          (!selectedCourse.plans.elite &&
                            !selectedCourse.plans.essential))) ||
                      (giftStep === 2 && !selectedPlan) ||
                      (giftStep === 3 && selectedUsers.length === 0)
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:shadow-lg transition-shadow"
                    }`}
                  >
                    Next →
                  </OrangeButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">User Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                  setFullUserData(null);
                }}
                className="cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
                <Image
                  src={
                    fullUserData?.profilePicture ||
                    selectedUser.profilePicture ||
                    "/user.svg"
                  }
                  alt={`${selectedUser.firstName || "Unknown"} ${
                    selectedUser.lastName || "User"
                  }`}
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                  width={96}
                  height={96}
                />
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {fullUserData?.firstName ||
                      selectedUser.firstName ||
                      "Unknown"}{" "}
                    {fullUserData?.lastName || selectedUser.lastName || "User"}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {fullUserData?.email || selectedUser.email}
                  </p>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getUserTypeBadgeColor(
                        selectedUser.userType
                      )}`}
                    >
                      {selectedUser.userType}
                    </span>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(
                        selectedUser.status
                      )}`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowUserDetails(false);
                      handleEditUser(selectedUser);
                    }}
                    className="cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowUserDetails(false);
                      setSelectedUser(selectedUser);
                      setShowChangePasswordModal(true);
                    }}
                    className="cursor-pointer"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Basic Information
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        User ID:
                      </span>
                      <span className="ml-2 text-sm text-gray-600 font-mono">
                        {selectedUser._id}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Email:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {fullUserData?.email || selectedUser.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Phone:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {fullUserData?.phone || selectedUser.phone || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        WhatsApp:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {fullUserData?.whatsappNumber ||
                          selectedUser.whatsappNumber ||
                          "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Date of Birth:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {fullUserData?.dob || selectedUser.dob
                          ? new Date(
                              fullUserData?.dob || selectedUser.dob!
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Provider:
                      </span>
                      <span className="ml-2 text-sm text-gray-600 capitalize">
                        {selectedUser.provider || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Address
                  </h5>
                  <div className="space-y-3">
                    {fullUserData?.address || selectedUser.address ? (
                      <>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Street:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {(fullUserData?.address || selectedUser.address)
                              ?.address || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            City:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {(fullUserData?.address || selectedUser.address)
                              ?.city || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            State:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {(fullUserData?.address || selectedUser.address)
                              ?.state || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Country:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {(fullUserData?.address || selectedUser.address)
                              ?.country || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Pin Code:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {(fullUserData?.address || selectedUser.address)
                              ?.pincode || "N/A"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No address information
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructor Specific Information */}
              {selectedUser.userType === "instructor" &&
                (fullUserData as Instructor) && (
                  <div className="pt-6 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      Professional Information
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Current Position:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {(fullUserData as Instructor).currentPosition ||
                            "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Current Company:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {(fullUserData as Instructor).currentCompany || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          LinkedIn:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {(fullUserData as Instructor).linkedinUrl || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Rating:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {(fullUserData as Instructor).rating || "N/A"}
                        </span>
                      </div>
                      {(fullUserData as Instructor).bio && (
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-gray-700">
                            Bio:
                          </span>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-5">
                            {(fullUserData as Instructor).bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Student Specific Information */}
              {selectedUser.userType === "student" &&
                (fullUserData as Student) && (
                  <div className="pt-6 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      Student Information
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          College:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {(fullUserData as Student).collegeName || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Degree:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {(fullUserData as Student).degreeName || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Current Position:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {(fullUserData as Student).currentPosition || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Domain:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {(fullUserData as Student).domain || "N/A"}
                        </span>
                      </div>
                      {(fullUserData as Student).portfolio && (
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-gray-700">
                            Portfolio:
                          </span>
                          <a
                            href={(fullUserData as Student).portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-sm text-blue-600 hover:underline"
                          >
                            {(fullUserData as Student).portfolio}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Enrollment Information */}
              {selectedUser.userType === "student" && (
                <div className="pt-6 border-t border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Enrollment Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Gift className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700 block">
                            Courses Enrolled
                          </span>
                          <span className="text-2xl font-bold text-blue-700">
                            {userEnrollmentsCount}
                          </span>
                          <span className="ml-1 text-sm text-gray-500">
                            {userEnrollmentsCount === 1 ? "course" : "courses"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div className="pt-6 border-t border-gray-200">
                <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Account Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Joined:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Last Updated:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {fullUserData?.updatedAt || selectedUser.updatedAt
                        ? new Date(
                            fullUserData?.updatedAt || selectedUser.updatedAt!
                          ).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                  setFullUserData(null);
                  setUserEnrollmentsCount(0);
                }}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Edit User</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData({});
                }}
                className="cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={editFormData.firstName || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      firstName: e.target.value,
                    })
                  }
                />
                <Input
                  label="Last Name"
                  value={editFormData.lastName || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      lastName: e.target.value,
                    })
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  value={editFormData.email || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
                <div>
                  <Select
                    label="Status"
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                      { value: "blocked", label: "Blocked" },
                    ]}
                    value={editFormData.status || "active"}
                    onChange={(value) =>
                      setEditFormData({ ...editFormData, status: value as any })
                    }
                  />
                </div>
                <Input
                  label="Phone"
                  value={editFormData.phone || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                />
                <Input
                  label="WhatsApp Number"
                  value={editFormData.whatsappNumber || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      whatsappNumber: e.target.value,
                    })
                  }
                />
                <div>
                  <DateSelector
                    label="Date of Birth"
                    value={
                      editFormData.dob ? new Date(editFormData.dob) : undefined
                    }
                    onChange={(date) =>
                      setEditFormData({
                        ...editFormData,
                        dob: date || undefined,
                      })
                    }
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Street Address"
                      value={editFormData.address?.address || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          address: {
                            ...editFormData.address,
                            address: e.target.value,
                          } as any,
                        })
                      }
                    />
                  </div>
                  <Input
                    label="City"
                    value={editFormData.address?.city || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        address: {
                          ...editFormData.address,
                          city: e.target.value,
                        } as any,
                      })
                    }
                  />
                  <Input
                    label="State"
                    value={editFormData.address?.state || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        address: {
                          ...editFormData.address,
                          state: e.target.value,
                        } as any,
                      })
                    }
                  />
                  <Input
                    label="Country"
                    value={editFormData.address?.country || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        address: {
                          ...editFormData.address,
                          country: e.target.value,
                        } as any,
                      })
                    }
                  />
                  <Input
                    label="Pin Code"
                    value={editFormData.address?.pincode || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        address: {
                          ...editFormData.address,
                          pincode: e.target.value,
                        } as any,
                      })
                    }
                  />
                </div>
              </div>

              {/* Instructor Specific Fields */}
              {selectedUser.userType === "instructor" && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Current Position"
                      value={(editFormData as any).currentPosition || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          currentPosition: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Current Company"
                      value={(editFormData as any).currentCompany || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          currentCompany: e.target.value,
                        })
                      }
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="LinkedIn URL"
                        value={(editFormData as any).linkedinUrl || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            linkedinUrl: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={(editFormData as any).bio || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            bio: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Student Specific Fields */}
              {selectedUser.userType === "student" && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Student Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="College Name"
                      value={(editFormData as any).collegeName || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          collegeName: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Degree Name"
                      value={(editFormData as any).degreeName || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          degreeName: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Current Position"
                      value={(editFormData as any).currentPosition || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          currentPosition: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Domain"
                      value={(editFormData as any).domain || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          domain: e.target.value,
                        })
                      }
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Portfolio URL"
                        value={(editFormData as any).portfolio || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            portfolio: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData({});
                }}
                className="cursor-pointer"
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isUpdating ? "Updating..." : "Update User"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Change Password
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Changing password for:{" "}
                <span className="font-medium">{selectedUser.email}</span>
              </p>
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <p className="text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="cursor-pointer"
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword || !newPassword || !confirmPassword
                }
                className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-red-600">Delete User</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                }}
                className="cursor-pointer"
                disabled={isDeleting}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  User Type: {selectedUser.userType}
                </p>
              </div>
              <p className="text-sm text-red-600 font-medium">
                ⚠️ This will soft delete the user (mark as deleted)
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                }}
                className="cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersPage;
