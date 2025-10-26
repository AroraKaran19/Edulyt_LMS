"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Users,
  Gift,
  UserCheck,
  UserX,
  Eye,
  MoreVertical,
} from "lucide-react";
import Image from "next/image";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import useUserManagement from "@/hooks/useUserManagement";
import useCourseManagement from "@/hooks/useCourseManagement";
import { User } from "@/types/user";
import { Course } from "@/types/course";
import { toast } from "react-toastify";

const ManageUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"elite" | "essential" | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const { getUsers, updateUserStatus, giftCourse, isLoading } =
    useUserManagement();
  const { getCourses } = useCourseManagement();

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
    if (!selectedUser || !selectedCourse || !selectedPlan) {
      toast.error("Please select user, course, and plan type");
      return;
    }

    // Check if the selected plan exists for the course
    if (!selectedCourse.plans[selectedPlan]) {
      toast.error(`Selected plan (${selectedPlan}) is not available for this course`);
      return;
    }

    try {
      const result = await giftCourse({
        userId: selectedUser._id!,
        courseId: selectedCourse._id!,
        planType: selectedPlan,
      });

      if (result) {
        toast.success(
          `Successfully gifted ${selectedCourse.title} (${selectedPlan} plan) to ${
            selectedUser.firstName || "Unknown"
          } ${selectedUser.lastName || "User"}`
        );
        setShowGiftModal(false);
        setSelectedUser(null);
        setSelectedCourse(null);
        setSelectedPlan(null);
      }
    } catch (error: any) {
      // Handle the specific error message from the backend
      const errorMessage = error.message || "Failed to gift course. Please try again.";
      toast.error(errorMessage);
      console.error("Gift course error:", error);
    }
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
            onClick={() => setShowGiftModal(true)}
            className="flex items-center gap-2"
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
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
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
                    className="rounded-l-md"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-r-md"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Gift Course to User
            </h3>

            <div className="space-y-4">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <Select
                  options={users.map((user) => ({
                    value: user._id!,
                    label: `${user.firstName || "Unknown"} ${
                      user.lastName || "User"
                    } (${user.email})`,
                  }))}
                  value={selectedUser?._id || ""}
                  onChange={(userId: string) => {
                    const user = users.find((u) => u._id === userId);
                    setSelectedUser(user || null);
                  }}
                  placeholder="Choose a user"
                />
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course
                </label>
                <Select
                  options={courses.map((course) => {
                    const elitePlan = course.plans.elite;
                    const essentialPlan = course.plans.essential;
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
                  onChange={(courseId: string) => {
                    const course = courses.find((c) => c._id === courseId);
                    setSelectedCourse(course || null);
                    setSelectedPlan(null); // Reset plan selection when course changes
                  }}
                  placeholder="Choose a course"
                />
              </div>

              {/* Plan Selection */}
              {selectedCourse && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Plan Type
                  </label>
                  <Select
                    options={[
                      ...(selectedCourse.plans.elite ? [{
                        value: "elite",
                        label: `Elite Plan - ₹${selectedCourse.plans.elite.price}`,
                      }] : []),
                      ...(selectedCourse.plans.essential ? [{
                        value: "essential", 
                        label: `Essential Plan - ₹${selectedCourse.plans.essential.price}`,
                      }] : []),
                    ]}
                    value={selectedPlan || ""}
                    onChange={(planType: string) => {
                      setSelectedPlan(planType as "elite" | "essential");
                    }}
                    placeholder="Choose a plan"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGiftModal(false);
                  setSelectedUser(null);
                  setSelectedCourse(null);
                  setSelectedPlan(null);
                }}
              >
                Cancel
              </Button>
              <OrangeButton
                onClick={handleGiftCourse}
                disabled={!selectedUser || !selectedCourse || !selectedPlan || isLoading}
              >
                {isLoading ? "Gifting..." : "Gift Course"}
              </OrangeButton>
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
