"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock,
  X,
  Check,
  User as UserIcon,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Input from "@/components/ui/inputs/Input";
import { Course } from "@/types/course";
import { User } from "@/types/user";
import { toast } from "react-toastify";
import useUserManagement, { TrialCourseData } from "@/hooks/useUserManagement";
import useCourseManagement from "@/hooks/useCourseManagement";

interface TrialCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEnrollments: Record<string, string[]>;
  onTrialComplete?: () => void;
}

const TrialCourseModal = ({
  isOpen,
  onClose,
  userEnrollments,
  onTrialComplete,
}: TrialCourseModalProps) => {
  const [trialStep, setTrialStep] = useState<1 | 2 | 3>(1);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [trialDurationDays, setTrialDurationDays] = useState<number>(7);

  // Infinite scroll state for courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const coursesScrollRef = useRef<HTMLDivElement>(null);
  const coursesObserverTarget = useRef<HTMLDivElement>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const lastCourseSearchRef = useRef<string>("");
  const isLoadingCoursesRef = useRef(false);

  // User search and infinite scroll state
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userHasMore, setUserHasMore] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const usersScrollRef = useRef<HTMLDivElement>(null);
  const usersObserverTarget = useRef<HTMLDivElement>(null);
  const isLoadingUsersRef = useRef(false);
  const lastSearchRef = useRef<string>("");

  const { createTrialEnrollment, isLoading, getUsers } = useUserManagement();
  const { getCourses } = useCourseManagement();

  // Fetch courses with pagination and search
  const fetchCourses = useCallback(
    async (page: number, append: boolean = false, search?: string) => {
      // Prevent duplicate calls
      if (isLoadingCoursesRef.current) return;

      isLoadingCoursesRef.current = true;
      setIsLoadingCourses(true);
      try {
        const limit = search ? 100 : 20; // 100 limit when searching, 20 for pagination
        const result = await getCourses({
          page,
          limit,
          search: search || undefined,
          isActive: true,
        });

        if (result) {
          if (append) {
            setCourses((prev) => [...prev, ...result.courses]);
          } else {
            setCourses(result.courses);
          }

          setHasMore(page < result.totalPages);
          setCurrentPage(page);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses");
      } finally {
        setIsLoadingCourses(false);
        isLoadingCoursesRef.current = false;
      }
    },
    [getCourses]
  );

  // Debounce course search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [courseSearch]);

  // Load courses when modal opens or search changes
  useEffect(() => {
    // Only run when we're on step 1 and modal is open
    if (trialStep !== 1 || !isOpen) return;

    // Check if search has actually changed to prevent duplicate calls
    if (lastCourseSearchRef.current === debouncedCourseSearch && courses.length > 0) {
      return;
    }

    lastCourseSearchRef.current = debouncedCourseSearch;

    // Reset pagination
    setCurrentPage(1);
    setHasMore(true);

    if (debouncedCourseSearch) {
      // Fetch with search (limit 100, no pagination)
      fetchCourses(1, false, debouncedCourseSearch);
    } else {
      // Initial load without search (pagination enabled)
      fetchCourses(1, false);
    }
  }, [trialStep, isOpen, debouncedCourseSearch, fetchCourses]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTrialStep(1);
      setSelectedUsers([]);
      setSelectedCourses([]);
      setTrialDurationDays(7);
      // Don't reset courses and users - keep them cached for better UX
      // Reset search when modal closes
      setUserSearch("");
      setDebouncedUserSearch("");
      lastSearchRef.current = "";
      isLoadingUsersRef.current = false;
      setCourseSearch("");
      setDebouncedCourseSearch("");
      lastCourseSearchRef.current = "";
      isLoadingCoursesRef.current = false;
    }
  }, [isOpen]);

  // Debounce user search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [userSearch]);

  // Fetch users with pagination and search
  const fetchUsers = useCallback(
    async (page: number, append: boolean = false, search?: string) => {
      // Prevent duplicate calls
      if (isLoadingUsersRef.current) return;

      isLoadingUsersRef.current = true;
      setIsLoadingUsers(true);
      try {
        const limit = search ? 100 : 20; // 100 limit when searching, 20 for pagination
        const result = await getUsers({
          page,
          limit,
          search: search || undefined,
          userType: "student", // Only students can receive trial enrollments
        });

        if (result) {
          if (append) {
            setUsers((prev) => [...prev, ...result.users]);
          } else {
            setUsers(result.users);
          }

          setUserHasMore(page < result.totalPages);
          setUserCurrentPage(page);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoadingUsers(false);
        isLoadingUsersRef.current = false;
      }
    },
    [getUsers]
  );

  // Load users when step 2 is reached or search changes
  useEffect(() => {
    // Only run when we're on step 2 and modal is open
    if (trialStep !== 2 || !isOpen) return;

    // Check if search has actually changed to prevent duplicate calls
    if (lastSearchRef.current === debouncedUserSearch && users.length > 0) {
      return;
    }

    lastSearchRef.current = debouncedUserSearch;

    // Reset pagination
    setUserCurrentPage(1);
    setUserHasMore(true);

    if (debouncedUserSearch) {
      // Fetch with search (limit 100, no pagination)
      fetchUsers(1, false, debouncedUserSearch);
    } else {
      // Initial load without search (pagination enabled)
      fetchUsers(1, false);
    }
  }, [trialStep, isOpen, debouncedUserSearch, fetchUsers]);

  // Intersection Observer for courses infinite scroll
  useEffect(() => {
    // Don't enable infinite scroll when searching (we load all results at once)
    if (debouncedCourseSearch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingCourses) {
          fetchCourses(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = coursesObserverTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingCourses, currentPage, fetchCourses, debouncedCourseSearch]);

  // Intersection Observer for users infinite scroll
  useEffect(() => {
    // Don't enable infinite scroll when searching (we load all results at once)
    if (debouncedUserSearch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && userHasMore && !isLoadingUsers) {
          fetchUsers(userCurrentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = usersObserverTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [userHasMore, isLoadingUsers, userCurrentPage, fetchUsers, debouncedUserSearch]);

  const coursesWithPlans = courses.filter(
    (c) => c.plans && (c.plans.elite || c.plans.essential)
  );
  const allLoadedSelected =
    coursesWithPlans.length > 0 &&
    coursesWithPlans.every((c) =>
      selectedCourses.some((s) => s._id === c._id)
    );
  const someLoadedSelected = courses.some((c) =>
    selectedCourses.some((s) => s._id === c._id)
  );

  // Select/deselect all currently loaded courses
  const handleSelectAllCourses = (selectAll: boolean) => {
    if (selectAll) {
      const toAdd = coursesWithPlans.filter(
        (c) => !selectedCourses.some((s) => s._id === c._id)
      );
      if (toAdd.length > 0) {
        setSelectedCourses((prev) => [...prev, ...toAdd]);
      }
    } else {
      setSelectedCourses([]);
    }
  };

  // Set indeterminate state on Select All checkbox
  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el) {
      el.indeterminate = someLoadedSelected && !allLoadedSelected;
    }
  }, [someLoadedSelected, allLoadedSelected]);

  // Handle course selection
  const handleCourseToggle = (courseId: string, checked: boolean) => {
    if (checked) {
      const course = courses.find((c) => c._id === courseId);
      if (course) {
        setSelectedCourses((prev) => [...prev, course]);
      }
    } else {
      setSelectedCourses((prev) => prev.filter((c) => c._id !== courseId));
    }
  };

  // Handle user selection
  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Handle trial enrollment creation
  const handleCreateTrial = async () => {
    if (selectedCourses.length === 0 || selectedUsers.length === 0) {
      toast.error("Please select at least one course and one user");
      return;
    }

    if (trialDurationDays < 1) {
      toast.error("Trial duration must be at least 1 day");
      return;
    }

    try {
      let totalSuccessCount = 0;
      let totalFailCount = 0;
      const errors: string[] = [];

      // Create trial enrollment for each course to each selected user
      for (const course of selectedCourses) {
        let courseSuccessCount = 0;
        let courseFailCount = 0;

        for (const userId of selectedUsers) {
          try {
            const trialData: TrialCourseData = {
              userId,
              courseId: course._id!,
              trialDurationDays,
              planType: "essential",
            };
            const result = await createTrialEnrollment(trialData);

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
            // Find user from loaded users
            const user = users.find((u) => u._id === userId);
            const userName = user
              ? `${user.firstName || "Unknown"} ${user.lastName || "User"}`
              : userId;
            errors.push(
              `${course.title} → ${userName}: ${
                error.message || "Failed to create trial enrollment"
              }`
            );
          }
        }

        if (courseSuccessCount > 0) {
          console.log(
            `Successfully created trial for ${course.title} (${trialDurationDays} days) for ${courseSuccessCount} user(s)`
          );
        }
      }

      if (totalSuccessCount > 0) {
        toast.success(
          `Successfully created ${totalSuccessCount} trial enrollment(s) for ${selectedCourses.length} course(s) to ${selectedUsers.length} user(s). Trials expire in ${trialDurationDays} day(s).`
        );
      }

      if (totalFailCount > 0) {
        toast.error(
          `Failed to create ${totalFailCount} trial enrollment(s). ${errors
            .slice(0, 5)
            .join("; ")}${
            errors.length > 5 ? ` and ${errors.length - 5} more...` : ""
          }`
        );
      }

      // Reset and close modal
      if (totalSuccessCount > 0) {
        setSelectedCourses([]);
        setSelectedUsers([]);
        setTrialDurationDays(7);
        setTrialStep(1);
        onTrialComplete?.();
        onClose();
      }
    } catch (error: any) {
      toast.error(
        error.message || "Failed to create trial enrollments. Please try again."
      );
      console.error("Trial enrollment error:", error);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-orange-500 to-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Give Trial Access
                </h3>
                <p className="text-sm text-orange-50">Step {trialStep} of 3</p>
              </div>
            </div>
            <button
              onClick={handleClose}
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
                    trialStep >= 1
                      ? "bg-orange-500 text-white shadow-lg scale-110"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {trialStep > 1 ? <Check className="w-5 h-5" /> : "1"}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    trialStep >= 1 ? "text-orange-600" : "text-gray-500"
                  }`}
                >
                  Courses
                </span>
              </div>
              <div
                className={`w-16 h-1 mx-2 transition-all ${
                  trialStep >= 2 ? "bg-orange-500" : "bg-gray-200"
                }`}
              />
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                    trialStep >= 2
                      ? "bg-orange-500 text-white shadow-lg scale-110"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {trialStep > 2 ? <Check className="w-5 h-5" /> : "2"}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    trialStep >= 2 ? "text-orange-600" : "text-gray-500"
                  }`}
                >
                  Users
                </span>
              </div>
              <div
                className={`w-16 h-1 mx-2 transition-all ${
                  trialStep >= 3 ? "bg-orange-500" : "bg-gray-200"
                }`}
              />
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                    trialStep >= 3
                      ? "bg-orange-500 text-white shadow-lg scale-110"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    trialStep >= 3 ? "text-orange-600" : "text-gray-500"
                  }`}
                >
                  Duration
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="space-y-6">
            {/* Step 1: Course Selection */}
            {trialStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Select Course(s)
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (Multiple selection allowed)
                    </span>
                  </label>
                  {/* Course Search */}
                  <div className="mb-3">
                    <Input
                      type="text"
                      placeholder="Search courses by title..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      icon={<Search className="w-5 h-5 text-gray-400" />}
                      className="w-full"
                    />
                  </div>
                  {/* Select All */}
                  {courses.length > 0 && (
                    <label className="flex items-center gap-2 mb-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        ref={selectAllCheckboxRef}
                        type="checkbox"
                        checked={allLoadedSelected}
                        onChange={(e) =>
                          handleSelectAllCourses(e.target.checked)
                        }
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Select all {coursesWithPlans.length} course
                        {coursesWithPlans.length !== 1 ? "s" : ""} (loaded)
                      </span>
                      {coursesWithPlans.length < courses.length && (
                        <span className="text-xs text-amber-600">
                          Only courses with plans will be selected
                        </span>
                      )}
                    </label>
                  )}
                  <div
                    ref={coursesScrollRef}
                    className="border-2 border-gray-200 rounded-xl overflow-hidden max-h-[calc(90vh-380px)] min-h-[400px] overflow-y-auto"
                  >
                    {courses.length === 0 && !isLoadingCourses ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-600 font-medium">
                          No courses available
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {courses.map((course) => {
                          const isSelected = selectedCourses.some(
                            (c) => c._id === course._id
                          );

                          return (
                            <label
                              key={course._id}
                              className="flex items-center p-4 hover:bg-orange-50 transition-colors cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  handleCourseToggle(
                                    course._id || "",
                                    e.target.checked
                                  );
                                }}
                                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                              />
                              <div className="ml-4 flex-1">
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-700">
                                  {course.title}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-orange-600">
                                  <Check className="w-5 h-5" />
                                </div>
                              )}
                            </label>
                          );
                        })}
                        {/* Infinite scroll trigger */}
                        {hasMore && !debouncedCourseSearch && (
                          <div
                            ref={coursesObserverTarget}
                            className="flex items-center justify-center p-4"
                          >
                            {isLoadingCourses && (
                              <div className="flex items-center gap-2 text-gray-500">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                                <span className="text-sm">
                                  Loading more courses...
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {!hasMore && courses.length > 0 && (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No more courses to load
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: User Selection */}
            {trialStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Select User(s)
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (Multiple selection allowed)
                    </span>
                  </label>
                  {/* User Search */}
                  <div className="mb-3">
                    <Input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      icon={<Search className="w-5 h-5 text-gray-400" />}
                      className="w-full"
                    />
                  </div>
                  <div
                    ref={usersScrollRef}
                    className="border-2 border-gray-200 rounded-xl overflow-hidden max-h-[calc(90vh-380px)] min-h-[400px] overflow-y-auto"
                  >
                    {users.length === 0 && !isLoadingUsers ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-600 font-medium">
                          No users available
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {users.map((user) => {
                          const isSelected = selectedUsers.includes(
                            user._id || ""
                          );
                          // Check if user is enrolled in any of the selected courses
                          const userEnrolledCourses = userEnrollments[user._id || ""] || [];
                          const isEnrolled = selectedCourses.some(
                            (course) => userEnrolledCourses.includes(course._id || "")
                          );

                          return (
                            <label
                              key={user._id}
                              className={`flex items-center p-4 hover:bg-orange-50 transition-colors cursor-pointer group ${
                                isEnrolled ? "opacity-50" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  handleUserToggle(
                                    user._id || "",
                                    e.target.checked
                                  );
                                }}
                                disabled={isEnrolled}
                                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                              />
                              <div className="ml-4 flex-1">
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-700">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.email}
                                </div>
                                {isEnrolled && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    Already enrolled
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <div className="text-orange-600">
                                  <Check className="w-5 h-5" />
                                </div>
                              )}
                            </label>
                          );
                        })}
                        {/* Infinite scroll trigger */}
                        {userHasMore && !debouncedUserSearch && (
                          <div
                            ref={usersObserverTarget}
                            className="flex items-center justify-center p-4"
                          >
                            {isLoadingUsers && (
                              <div className="flex items-center gap-2 text-gray-500">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                                <span className="text-sm">
                                  Loading more users...
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {!userHasMore && users.length > 0 && (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No more users to load
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Trial Duration */}
            {trialStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Trial Duration
                  </label>
                  <div className="space-y-4">
                    <div>
                      <Input
                        type="number"
                        placeholder="Enter trial duration in days"
                        value={trialDurationDays}
                        onChange={(e) =>
                          setTrialDurationDays(parseInt(e.target.value) || 7)
                        }
                        min={1}
                        icon={<Clock className="w-5 h-5 text-gray-400" />}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Trial will automatically expire after the specified number of days. Default is 7 days.
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-gray-900">Summary</h4>
                      <div className="text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Courses:</span>{" "}
                          {selectedCourses.length}
                        </p>
                        <p>
                          <span className="font-medium">Users:</span>{" "}
                          {selectedUsers.length}
                        </p>
                        <p>
                          <span className="font-medium">Duration:</span>{" "}
                          {trialDurationDays} day(s)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={trialStep > 1 ? () => setTrialStep((prev) => (prev - 1) as 1 | 2 | 3) : handleClose}
            className="text-gray-600 hover:text-gray-900"
          >
            {trialStep > 1 ? "Back" : "Cancel"}
          </Button>
          <div className="flex items-center gap-3">
            {trialStep < 3 ? (
              <OrangeButton
                onClick={() => {
                  if (trialStep === 1 && selectedCourses.length === 0) {
                    toast.error("Please select at least one course");
                    return;
                  }
                  if (trialStep === 2 && selectedUsers.length === 0) {
                    toast.error("Please select at least one user");
                    return;
                  }
                  setTrialStep((prev) => (prev + 1) as 1 | 2 | 3);
                }}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                Next
              </OrangeButton>
            ) : (
              <OrangeButton
                onClick={handleCreateTrial}
                disabled={isLoading || selectedCourses.length === 0 || selectedUsers.length === 0}
                className="flex items-center gap-2"
              >
                {isLoading ? "Creating..." : "Create Trial"}
              </OrangeButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialCourseModal;

