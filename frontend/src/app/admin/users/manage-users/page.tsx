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
import { User, Instructor, Student } from "@/types/user";
import {
  PartialAccessControl,
  ModuleAccessControl,
  LessonAccessControl,
} from "@/types/enrollment";
import { toast } from "react-toastify";
import DateSelector from "@/components/ui/inputs/DateSelector";
import GiftCourseModal from "./components/GiftCourseModal";
import EditUserModal from "./components/EditUserModal";

const ManageUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [userEnrollments, setUserEnrollments] = useState<
    Record<string, string[]>
  >({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fullUserData, setFullUserData] = useState<User | null>(null);
  const [userEnrollmentsCount, setUserEnrollmentsCount] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editFormData, setEditFormData] = useState<
    Partial<User & Instructor & Student>
  >({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    getUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser,
    changeUserPassword,
    isLoading,
    getUserEnrollments,
  } = useUserManagement();

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

  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearch, userTypeFilter, statusFilter]);

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
        setUserEnrollmentsCount(
          enrollments.total || enrollments.enrollments.length
        );
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
      profilePicture: user.profilePicture || "",
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

  // Handle modal open
  const handleOpenGiftModal = () => {
    setShowGiftModal(true);
    fetchAllStudents();
  };

  // OLD CODE REMOVED - Gift course functionality moved to GiftCourseModal component
  /* const handleGiftCourse = async () => {
    if (selectedCourses.length === 0 || selectedUsers.length === 0) {
      toast.error("Please select at least one course and one user");
      return;
    }

    // Check if all selected courses have plans selected
    const coursesWithoutPlans = selectedCourses.filter(
      (course) => !selectedPlans[course._id || ""]
    );
    if (coursesWithoutPlans.length > 0) {
      toast.error(
        `Please select a plan for: ${coursesWithoutPlans
          .map((c) => c.title)
          .join(", ")}`
      );
      return;
    }

    // Check if all selected plans exist for their courses
    for (const course of selectedCourses) {
      const planType = selectedPlans[course._id || ""];
      if (!course.plans || !course.plans[planType]) {
        toast.error(
          `Selected plan (${planType}) is not available for course: ${course.title}`
        );
        return;
      }
    }

    // Build access control (same for all courses)
    const accessControl = buildAccessControl();

    setIsGifting(true);
    try {
      let totalSuccessCount = 0;
      let totalFailCount = 0;
      const errors: string[] = [];

      // Gift each course to each selected user
      for (const course of selectedCourses) {
        const planType = selectedPlans[course._id || ""];
        let courseSuccessCount = 0;
        let courseFailCount = 0;

        for (const userId of selectedUsers) {
          try {
            const giftData = {
              userId,
              courseId: course._id!,
              planType,
              ...(accessControl && { accessControl }),
            } as GiftCourseData;
            const result = await giftCourse(giftData);

            if (result) {
              courseSuccessCount++;
              totalSuccessCount++;
            } else {
              courseFailCount++;
              totalFailCount++;
            }
          } catch (error: any) {
            courseFailCount++;
            totalFailCount++;
            const user = allStudents.find((u) => u._id === userId);
            const userName = user
              ? `${user.firstName || "Unknown"} ${user.lastName || "User"}`
              : userId;
            errors.push(
              `${course.title} → ${userName}: ${
                error.message || "Failed to gift course"
              }`
            );
          }
        }

        if (courseSuccessCount > 0) {
          const accessInfo =
            accessType === "full" ? "full access" : "partial access";
          console.log(
            `Successfully gifted ${course.title} (${planType} plan, ${accessInfo}) to ${courseSuccessCount} user(s)`
          );
        }
      }

      if (totalSuccessCount > 0) {
        const accessInfo =
          accessType === "full" ? "full access" : "partial access";
        const courseNames = selectedCourses.map((c) => c.title).join(", ");
        toast.success(
          `Successfully gifted ${selectedCourses.length} course(s) (${accessInfo}) to ${selectedUsers.length} user(s). Total: ${totalSuccessCount} gift(s) completed.`
        );
      }

      if (totalFailCount > 0) {
        toast.error(
          `Failed to gift ${totalFailCount} course(s). ${errors
            .slice(0, 5)
            .join("; ")}${
            errors.length > 5 ? ` and ${errors.length - 5} more...` : ""
          }`
        );
      }

      // Reset and close modal
      setShowGiftModal(false);
      setSelectedUsers([]);
      setSelectedCourses([]);
      setSelectedPlans({});
      setGiftStep(1);
      setAccessType("full");
      setSelectedModules(new Set());
      setSelectedLessons({});
      setSelectedContents({});
      setCourseDetails(null);
      setCoursesDetails({});
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to gift course. Please try again.";
      toast.error(errorMessage);
      console.error("Gift course error:", error);
    } finally {
      setIsGifting(false);
    }
  }; */

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
      <GiftCourseModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        userEnrollments={userEnrollments}
        onGiftComplete={() => {
          fetchUsers();
          fetchAllStudents();
        }}
      />

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
      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        formData={editFormData}
        onClose={() => {
          setShowEditModal(false);
          setEditFormData({});
        }}
        onUpdate={handleUpdateUser}
        isUpdating={isUpdating}
        onFormDataChange={setEditFormData}
      />

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
