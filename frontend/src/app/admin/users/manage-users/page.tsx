"use client";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Gift,
  Eye,
  Edit,
  Trash2,
  Key,
  X,
  User as UserIcon,
  Clock,
  UserX,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import useUserManagement from "@/hooks/useUserManagement";
import { User, Instructor, Student } from "@/types/user";
import { toast } from "react-toastify";
import GiftCourseModal from "./components/GiftCourseModal";
import TrialCourseModal from "./components/TrialCourseModal";
import EditUserModal from "./components/EditUserModal";
import UserDetailsModal from "./components/UserDetailsModal";
import { formatUserTypeLabel } from "./components/UserDetailsModalShared";
import {
  validatePassword,
  getPasswordRequirementsText,
} from "@/lib/passwordValidation";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

const ManageUsersPage = () => {
  const { data: session } = useSession();
  const isSuperAdmin =
    (session?.user as { userType?: string } | undefined)?.userType ===
    "super-admin";

  const userTypeFilterOptions = useMemo(
    () => [
      { value: "all", label: "All Types" },
      { value: "student", label: "Students" },
      { value: "instructor", label: "Instructors" },
      { value: "admin", label: "Admins" },
      ...(isSuperAdmin
        ? [{ value: "super-admin", label: "Super Admins" as const }]
        : []),
    ],
    [isSuperAdmin],
  );
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [statusToggleUserId, setStatusToggleUserId] = useState<string | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState<
    Partial<User & Instructor & Student>
  >({});
  /** Bumps when opening edit so company image slots reset from loaded user */
  const [companyImagesResetKey, setCompanyImagesResetKey] = useState("");
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

  useEffect(() => {
    if (!isSuperAdmin && userTypeFilter === "super-admin") {
      setUserTypeFilter("all");
    }
  }, [isSuperAdmin, userTypeFilter]);

  // Open user details modal (modal fetches its own data)
  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  // Handle edit user - fetch full data for instructors to get previousExperience
  const handleEditUser = async (user: User) => {
    setSelectedUser(user);
    let dataToUse = user;

    if (user.userType === "instructor" && user._id) {
      const fullData = await getUserById(user._id);
      if (fullData) {
        dataToUse = fullData;
      }
    }

    const instructorData = dataToUse as Instructor;
    setEditFormData({
      firstName: dataToUse.firstName || "",
      lastName: dataToUse.lastName || "",
      email: dataToUse.email || "",
      phone: dataToUse.phone || "",
      whatsappNumber: dataToUse.whatsappNumber || "",
      dob: dataToUse.dob ? new Date(dataToUse.dob) : undefined,
      status: dataToUse.status || "active",
      profilePicture: dataToUse.profilePicture || "",
      address: dataToUse.address || {
        address: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      },
      ...(dataToUse.userType === "instructor" && {
        bio: instructorData.bio || "",
        industry: instructorData.industry || "",
        field: instructorData.field || "",
        currentPosition: instructorData.currentPosition || "",
        currentCompany: instructorData.currentCompany || "",
        linkedinUrl: instructorData.linkedinUrl || "",
        previousExperience:
          instructorData.previousExperience?.map((exp: any) => ({
            companyName: exp.companyName || "",
            position: exp.position || "",
            duration: {
              from: exp.duration?.from
                ? new Date(exp.duration.from)
                : new Date(),
              to: exp.duration?.to ? new Date(exp.duration.to) : new Date(),
            },
            description: exp.description || "",
          })) || [],
        companyImages: instructorData.companyImages?.length
          ? [...instructorData.companyImages]
          : [],
      }),
      ...(dataToUse.userType === "student" && {
        collegeName: (dataToUse as Student).collegeName || "",
        degreeName: (dataToUse as Student).degreeName || "",
        currentPosition: (dataToUse as Student).currentPosition || "",
        currentCompany: (dataToUse as Student).currentCompany || "",
        domain: (dataToUse as Student).domain || "",
        portfolio: (dataToUse as Student).portfolio || "",
      }),
    });
    setCompanyImagesResetKey(`${dataToUse._id}-${Date.now()}`);
    setShowEditModal(true);
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser?._id) return;

    setIsUpdating(true);
    try {
      // Prepare update data - filter instructor previousExperience to valid entries only
      let updateData = { ...editFormData };
      if (
        selectedUser.userType === "instructor" &&
        (updateData as any).previousExperience
      ) {
        const validExperiences = ((updateData as any).previousExperience || [])
          .filter(
            (exp: any) =>
              exp.companyName?.trim() &&
              exp.position?.trim() &&
              exp.duration?.from &&
              exp.duration?.to &&
              exp.description?.trim(),
          )
          .map((exp: any) => ({
            companyName: exp.companyName.trim(),
            position: exp.position.trim(),
            description: exp.description.trim(),
            duration: {
              from:
                exp.duration.from instanceof Date
                  ? exp.duration.from.toISOString()
                  : new Date(exp.duration.from).toISOString(),
              to:
                exp.duration.to instanceof Date
                  ? exp.duration.to.toISOString()
                  : new Date(exp.duration.to).toISOString(),
            },
          }));
        (updateData as any).previousExperience = validExperiences;
      }

      const result = await updateUser(selectedUser._id, updateData);
      if (result) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        setEditFormData({});
        fetchUsers(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to update user",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!selectedUser?._id) return;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password against rules
    const passwordValidationErrors = validatePassword(newPassword);
    if (Object.keys(passwordValidationErrors).length > 0) {
      const errorMessages = Object.values(passwordValidationErrors).filter(
        Boolean,
      );
      toast.error(errorMessages.join(". "));
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
        error.response?.data?.error?.message || "Failed to change password",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleAccountActive = async (user: User) => {
    if (!user._id) return;
    const sessionUser = session?.user as
      | { _id?: string; id?: string }
      | undefined;
    const currentAdminId = sessionUser?._id ?? sessionUser?.id;
    if (currentAdminId && user._id === currentAdminId) {
      toast.error("You cannot disable your own account");
      return;
    }
    const isListedActive = user.status === "active";
    const nextStatus = isListedActive ? "inactive" : "active";
    if (isListedActive) {
      const ok = window.confirm(
        "Disable this account? The user will not be able to sign in until re-enabled.",
      );
      if (!ok) return;
    }
    setStatusToggleUserId(user._id);
    try {
      const result = await updateUserStatus(user._id, nextStatus);
      if (result) {
        toast.success(
          nextStatus === "active"
            ? "Account enabled. User can sign in again."
            : "Account disabled. User cannot sign in.",
        );
        fetchUsers();
      }
    } finally {
      setStatusToggleUserId(null);
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
        error.response?.data?.error?.message || "Failed to delete user",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle modal open (modals fetch their own users + enrollments on-demand in Step 3)
  const handleOpenGiftModal = () => setShowGiftModal(true);
  const handleOpenTrialModal = () => setShowTrialModal(true);

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
    <div className="p-4 sm:p-6 mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <UserIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Manage Users
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              View and manage all users, gift courses, and update status
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          {/* Left Section: Filters */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* User Type Filter */}
            <div className="sm:col-span-1">
              <Select
                options={userTypeFilterOptions}
                value={userTypeFilter}
                onChange={setUserTypeFilter}
                placeholder="Filter by type"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-1">
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
            </div>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="flex items-center gap-3 lg:ml-6 lg:pl-6 lg:border-l lg:border-gray-200 lg:shrink-0">
            {/* Gift Course Button */}
            <OrangeButton
              glow={false}
              className="flex items-center gap-2"
              onClick={handleOpenGiftModal}
            >
              <Gift className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">Gift Course</span>
              <span className="font-medium sm:hidden">Gift</span>
            </OrangeButton>
            {/* Trial Course Button */}
            <OrangeButton
              glow={false}
              className="flex items-center gap-2"
              onClick={handleOpenTrialModal}
            >
              <Clock className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">Give Trial</span>
              <span className="font-medium sm:hidden">Trial</span>
            </OrangeButton>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Spend
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
                      <p className="text-gray-500 text-sm">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UserIcon className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-gray-500 text-sm font-medium">
                        No users found
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {search ||
                        userTypeFilter !== "all" ||
                        statusFilter !== "all"
                          ? "Try adjusting your filters"
                          : "No users in the system"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10">
                          {user.profilePicture ? (
                            <Image
                              src={user.profilePicture}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="h-10 w-10 rounded-full object-cover"
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                              {user.firstName?.[0]?.toUpperCase() ||
                                user.lastName?.[0]?.toUpperCase() ||
                                user.email?.[0]?.toUpperCase() ||
                                "U"}
                            </div>
                          )}
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
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {user.userType === "student" ? (
                        <>
                          ₹
                          {(
                            user as User & { totalSpend?: number }
                          ).totalSpend?.toLocaleString("en-IN") ?? 0}
                        </>
                      ) : (
                        <span className="text-gray-400 font-normal">N/A</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeBadgeColor(
                          user.userType,
                        )}`}
                      >
                        {formatUserTypeLabel(user.userType)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                          user.status,
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                          onClick={() => handleToggleAccountActive(user)}
                          disabled={statusToggleUserId === user._id}
                          className={
                            user.status === "active"
                              ? "cursor-pointer text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                              : "cursor-pointer text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                          }
                          title={
                            user.status === "active"
                              ? "Disable account (cannot sign in)"
                              : "Enable account"
                          }
                        >
                          {user.status === "active" ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between items-center gap- sm:hidden">
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
                <nav className="relative z-0 inline-flex -space-x-px items-center gap-4">
                  <WhiteButton
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </WhiteButton>
                  <OrangeButton
                    glow={false}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </OrangeButton>
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
        onGiftComplete={fetchUsers}
      />

      {/* Trial Course Modal */}
      <TrialCourseModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onTrialComplete={fetchUsers}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={!!(showUserDetails && selectedUser)}
        user={selectedUser}
        onClose={() => {
          setShowUserDetails(false);
          setSelectedUser(null);
        }}
        onEdit={(u) => {
          setShowUserDetails(false);
          handleEditUser(u);
        }}
        onChangePassword={(u) => {
          setShowUserDetails(false);
          setSelectedUser(u);
          setShowChangePasswordModal(true);
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        formData={editFormData}
        companyImagesResetKey={companyImagesResetKey}
        onClose={() => {
          setShowEditModal(false);
          setEditFormData({});
        }}
        onUpdate={handleUpdateUser}
        isUpdating={isUpdating}
        onFormDataChange={(data) =>
          setEditFormData((prev) =>
            typeof data === "function" ? data(prev) : data,
          )
        }
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
                {getPasswordRequirementsText()}
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
                  User Type: {formatUserTypeLabel(selectedUser.userType)}
                </p>
              </div>
              <p className="text-sm text-red-600 font-medium">
                ⚠️ This will permanently delete the user and all their data
                (enrollments, orders, etc.)
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
