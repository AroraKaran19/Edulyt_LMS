"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Gift,
  X,
  Check,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Select from "@/components/ui/inputs/Select";
import BrandSelect from "@/components/admin/BrandSelect";
import type { Brand } from "@/constants/brands";
import Input from "@/components/ui/inputs/Input";
import { Course, CourseModule } from "@/types/course";
import { PartialAccessControl, ModuleAccessControl } from "@/types/enrollment";
import { toast } from "react-toastify";
import useUserManagement, { GiftCourseData } from "@/hooks/useUserManagement";
import useCourseManagement from "@/hooks/useCourseManagement";
import type { AdminUserOption } from "@/hooks/useUserManagement";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

interface GiftCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGiftComplete?: () => void;
}

const GiftCourseModal = ({
  isOpen,
  onClose,
  onGiftComplete,
}: GiftCourseModalProps) => {
  const [giftStep, setGiftStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<
    Record<string, "elite" | "essential">
  >({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [accessType, setAccessType] = useState<"full" | "partial" | "topN">(
    "full",
  );
  const [topNCount, setTopNCount] = useState<number>(5);
  const [courseDetails, setCourseDetails] = useState<Course | null>(null);
  const [coursesDetails, setCoursesDetails] = useState<Record<string, Course>>(
    {},
  );
  // Track expanded state per course
  const [expandedModules, setExpandedModules] = useState<
    Record<string, Set<string>>
  >({});
  const [expandedLessons, setExpandedLessons] = useState<
    Record<string, Set<string>>
  >({});
  // Track selections per course: courseId -> Set<moduleId>
  const [selectedModules, setSelectedModules] = useState<
    Record<string, Set<string>>
  >({});
  // Track selections per course: courseId -> moduleId -> Set<lessonId>
  const [selectedLessons, setSelectedLessons] = useState<
    Record<string, Record<string, Set<string>>>
  >({});
  // Track selections per course: courseId -> lessonId -> Set<contentId>
  const [selectedContents, setSelectedContents] = useState<
    Record<string, Record<string, Set<string>>>
  >({});
  const [loadingCourseDetails, setLoadingCourseDetails] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isGifting, setIsGifting] = useState(false);

  // Infinite scroll state for courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<
    "all" | "college-students" | "professionals"
  >("all");
  const [brand, setBrand] = useState<Brand | "">("");
  const lastBrandRef = useRef<string>("");
  const coursesScrollRef = useRef<HTMLDivElement>(null);
  const coursesObserverTarget = useRef<HTMLDivElement>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const lastCourseSearchRef = useRef<string>("");
  const lastAudienceFilterRef = useRef<string>("");
  const isLoadingCoursesRef = useRef(false);

  // User search and infinite scroll state
  const [users, setUsers] = useState<AdminUserOption[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userHasMore, setUserHasMore] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const usersScrollRef = useRef<HTMLDivElement>(null);
  const usersObserverTarget = useRef<HTMLDivElement>(null);
  const isLoadingUsersRef = useRef(false);
  const lastSearchRef = useRef<string>("");
  const lastSelectedCourseIdsRef = useRef<string>("");

  const { giftCourse, isLoading, getUserOptions } = useUserManagement();
  const { getCourses, getCourseById } = useCourseManagement();

  /** Full reset: selections, steps, access UI, pagination, and dedupe refs. */
  const resetGiftModalState = useCallback(() => {
    setGiftStep(1);
    setSelectedUsers([]);
    setSelectedCourses([]);
    setSelectedPlans({});
    setAccessType("full");
    setTopNCount(5);
    setSelectedModules({});
    setSelectedLessons({});
    setSelectedContents({});
    setExpandedModules({});
    setExpandedLessons({});
    setCourseDetails(null);
    setCoursesDetails({});
    setCurrentPage(1);
    setHasMore(true);
    setUserCurrentPage(1);
    setUserHasMore(true);
    setUserSearch("");
    setDebouncedUserSearch("");
    lastSearchRef.current = "";
    lastSelectedCourseIdsRef.current = "";
    isLoadingUsersRef.current = false;
    setCourseSearch("");
    setDebouncedCourseSearch("");
    setAudienceFilter("all");
    setBrand("");
    lastCourseSearchRef.current = "";
    lastAudienceFilterRef.current = "";
    lastBrandRef.current = "";
    isLoadingCoursesRef.current = false;
  }, []);

  // Fetch courses with pagination and search
  const fetchCourses = useCallback(
    async (page: number, append: boolean = false, search?: string) => {
      if (!brand) return;
      // Prevent duplicate calls
      if (isLoadingCoursesRef.current) return;

      isLoadingCoursesRef.current = true;
      setIsLoadingCourses(true);
      try {
        const result = await getCourses({
          page,
          limit: search ? 100 : 200, // 100 limit when searching, 200 for pagination
          search: search || undefined,
          audience: audienceFilter === "all" ? undefined : audienceFilter,
          brand,
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
    [getCourses, audienceFilter, brand],
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
    if (giftStep !== 1 || !isOpen) return;

    // Check if search has actually changed to prevent duplicate calls
    if (
      lastCourseSearchRef.current === debouncedCourseSearch &&
      lastAudienceFilterRef.current === audienceFilter &&
      lastBrandRef.current === brand &&
      courses.length > 0
    ) {
      return;
    }

    lastCourseSearchRef.current = debouncedCourseSearch;
    lastAudienceFilterRef.current = audienceFilter;
    lastBrandRef.current = brand;

    // Reset pagination
    setCurrentPage(1);
    setHasMore(true);
    setCourses([]);

    if (debouncedCourseSearch) {
      // Fetch with search (limit 100, no pagination)
      fetchCourses(1, false, debouncedCourseSearch);
    } else {
      // Initial load without search (pagination enabled)
      fetchCourses(1, false);
    }
  }, [giftStep, isOpen, debouncedCourseSearch, fetchCourses, audienceFilter, brand]);

  useEffect(() => {
    if (!isOpen) resetGiftModalState();
  }, [isOpen, resetGiftModalState]);

  // Debounce user search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [userSearch]);

  // Fetch users; backend returns enrolledCourseIds for selected courses when enrollmentStatusForCourseIds passed
  const fetchUsers = useCallback(
    async (
      page: number,
      append: boolean = false,
      search?: string,
      enrollmentStatusCourseIds?: string[],
    ) => {
      if (isLoadingUsersRef.current) return;

      isLoadingUsersRef.current = true;
      setIsLoadingUsers(true);
      try {
        const limit = search ? 100 : 20;
        const result = await getUserOptions({
          page,
          limit,
          search: search || undefined,
          userType: "student",
          enrollmentStatusForCourseIds: enrollmentStatusCourseIds?.length
            ? enrollmentStatusCourseIds
            : undefined,
        });

        if (result) {
          if (append) {
            setUsers((prev) => {
              const seen = new Set(prev.map((u) => u._id).filter(Boolean));
              const next = [...prev];
              for (const u of result.users) {
                const id = u?._id;
                if (!id || seen.has(id)) continue;
                seen.add(id);
                next.push(u);
              }
              return next;
            });
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
    [getUserOptions],
  );

  // Load users when step 3 is reached; backend provides per-course enrollment status
  const enrollmentStatusCourseIds = selectedCourses
    .map((c) => c._id)
    .filter((id): id is string => !!id);

  useEffect(() => {
    if (giftStep !== 3 || !isOpen) return;

    const selectedCourseIdsKey = enrollmentStatusCourseIds.join(",");
    if (
      lastSearchRef.current === debouncedUserSearch &&
      lastSelectedCourseIdsRef.current === selectedCourseIdsKey &&
      users.length > 0
    ) {
      return;
    }

    lastSearchRef.current = debouncedUserSearch;
    lastSelectedCourseIdsRef.current = selectedCourseIdsKey;
    setUserCurrentPage(1);
    setUserHasMore(true);
    setUsers([]);

    if (debouncedUserSearch) {
      fetchUsers(1, false, debouncedUserSearch, enrollmentStatusCourseIds);
    } else {
      fetchUsers(1, false, undefined, enrollmentStatusCourseIds);
    }
  }, [
    giftStep,
    isOpen,
    debouncedUserSearch,
    fetchUsers,
    enrollmentStatusCourseIds.join(","),
  ]);

  // Intersection Observer for courses infinite scroll
  useEffect(() => {
    if (!isOpen || giftStep !== 1 || debouncedCourseSearch) return;

    const scrollRoot = coursesScrollRef.current;
    const currentTarget = coursesObserverTarget.current;
    if (!scrollRoot || !currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMore &&
          !isLoadingCourses &&
          !isLoadingCoursesRef.current
        ) {
          fetchCourses(currentPage + 1, true);
        }
      },
      { root: scrollRoot, rootMargin: "0px 0px 80px 0px", threshold: 0.01 },
    );

    observer.observe(currentTarget);

    return () => {
      observer.disconnect();
    };
  }, [
    isOpen,
    giftStep,
    hasMore,
    isLoadingCourses,
    currentPage,
    fetchCourses,
    debouncedCourseSearch,
  ]);

  // Intersection Observer for users infinite scroll (root = list scrollport)
  useEffect(() => {
    if (!isOpen || debouncedUserSearch || giftStep !== 3) return;

    const scrollRoot = usersScrollRef.current;
    const currentTarget = usersObserverTarget.current;
    if (!scrollRoot || !currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          userHasMore &&
          !isLoadingUsers &&
          !isLoadingUsersRef.current
        ) {
          fetchUsers(
            userCurrentPage + 1,
            true,
            undefined,
            enrollmentStatusCourseIds,
          );
        }
      },
      { root: scrollRoot, rootMargin: "0px 0px 80px 0px", threshold: 0.01 },
    );

    observer.observe(currentTarget);

    return () => {
      observer.disconnect();
    };
  }, [
    isOpen,
    userHasMore,
    isLoadingUsers,
    userCurrentPage,
    fetchUsers,
    debouncedUserSearch,
    giftStep,
    enrollmentStatusCourseIds.join(","),
  ]);

  // Backend provides enrolledCourseIds via options endpoint
  const getAvailableUsers = () => users;

  // Fetch course details with modules, lessons, and content
  const fetchCourseDetails = async (courseId: string) => {
    setLoadingCourseDetails(true);
    try {
      const course = await getCourseById(courseId);
      if (course) {
        setCourseDetails(course);
        setCoursesDetails((prev) => ({
          ...prev,
          [courseId]: course,
        }));
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to load course details");
    } finally {
      setLoadingCourseDetails(false);
    }
  };

  // Default plan: essential if available, else elite
  const getDefaultPlan = (
    course: Course,
  ): "elite" | "essential" | undefined => {
    if (!course.plans) return undefined;
    if (course.plans.essential) return "essential";
    if (course.plans.elite) return "elite";
    return undefined;
  };

  // Select/deselect all currently loaded courses
  const handleSelectAllCourses = async (selectAll: boolean) => {
    if (selectAll) {
      const coursesWithPlans = courses.filter(
        (c) => c.plans && (c.plans.elite || c.plans.essential),
      );
      const toAdd = coursesWithPlans.filter(
        (c) => !selectedCourses.some((s) => s._id === c._id),
      );
      if (toAdd.length > 0) {
        setSelectedCourses((prev) => [...prev, ...toAdd]);
        const defaultPlans: Record<string, "elite" | "essential"> = {};
        toAdd.forEach((c) => {
          const plan = getDefaultPlan(c);
          if (c._id && plan) defaultPlans[c._id] = plan;
        });
        setSelectedPlans((prev) => ({ ...prev, ...defaultPlans }));
        // Fetch details for partial access
        await Promise.all(toAdd.map((c) => c._id && fetchCourseDetails(c._id)));
      }
    } else {
      setSelectedCourses([]);
      setSelectedPlans({});
      setCoursesDetails({});
    }
  };

  const allLoadedCoursesHavePlans =
    courses.length > 0 &&
    courses.every((c) => c.plans && (c.plans.elite || c.plans.essential));
  const allLoadedSelected =
    courses.length > 0 &&
    courses
      .filter((c) => c.plans && (c.plans.elite || c.plans.essential))
      .every((c) => selectedCourses.some((s) => s._id === c._id));
  const someLoadedSelected = courses.some((c) =>
    selectedCourses.some((s) => s._id === c._id),
  );

  // Set indeterminate state on Select All checkbox
  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el) {
      el.indeterminate = someLoadedSelected && !allLoadedSelected;
    }
  }, [someLoadedSelected, allLoadedSelected]);

  // Handle course selection toggle (step 1)
  const handleCourseToggle = async (courseId: string, isSelected: boolean) => {
    const course = courses.find((c) => c._id === courseId);
    if (!course) return;

    if (isSelected) {
      // Add course to selection
      setSelectedCourses((prev) => [...prev, course]);
      // Default plan: essential if available, else elite
      const defaultPlan = getDefaultPlan(course);
      if (defaultPlan) {
        setSelectedPlans((prev) => ({ ...prev, [courseId]: defaultPlan }));
      }
      // Fetch course details for partial access
      await fetchCourseDetails(courseId);
    } else {
      // Remove course from selection
      setSelectedCourses((prev) => prev.filter((c) => c._id !== courseId));
      // Remove plan selection for this course
      setSelectedPlans((prev) => {
        const newPlans = { ...prev };
        delete newPlans[courseId];
        return newPlans;
      });
      // Remove course details
      setCoursesDetails((prev) => {
        const newDetails = { ...prev };
        delete newDetails[courseId];
        return newDetails;
      });
    }
  };

  // Handle plan selection for a specific course (step 2)
  const handlePlanSelect = (
    courseId: string,
    planType: "elite" | "essential",
  ) => {
    setSelectedPlans((prev) => ({
      ...prev,
      [courseId]: planType,
    }));
    setSelectedUsers([]);
  };

  // Handle access type selection (step 3 -> step 4)
  const handleAccessTypeSelect = (type: "full" | "partial" | "topN") => {
    setAccessType(type);
    if (type === "full") {
      // Reset all selections for full access
      setSelectedModules({});
      setSelectedLessons({});
      setSelectedContents({});
    } else {
      // When switching to partial or topN, ensure all selected courses have their details loaded
      selectedCourses.forEach((course) => {
        if (course._id && !coursesDetails[course._id]) {
          fetchCourseDetails(course._id);
        }
      });
    }
  };

  // Toggle module selection for a specific course
  const toggleModule = (courseId: string, moduleId: string) => {
    const courseModules = selectedModules[courseId] || new Set<string>();
    const newSelected = new Set(courseModules);

    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
      // Remove all lessons and contents for this module
      const courseLessons = { ...(selectedLessons[courseId] || {}) };
      const courseContents = { ...(selectedContents[courseId] || {}) };
      delete courseLessons[moduleId];
      setSelectedLessons({ ...selectedLessons, [courseId]: courseLessons });
      // Note: contents are keyed by lessonId, not moduleId, so we need to find and remove them
      const courseDetails = coursesDetails[courseId];
      if (courseDetails && courseDetails.modules) {
        const module = (courseDetails.modules as CourseModule[]).find(
          (m) => (typeof m === "string" ? m : m._id) === moduleId,
        );
        if (
          module &&
          typeof module !== "string" &&
          Array.isArray(module.lessons)
        ) {
          module.lessons.forEach((lesson) => {
            const lessonId =
              typeof lesson === "string" ? lesson : lesson._id || "";
            if (lessonId) {
              delete courseContents[lessonId];
            }
          });
        }
      }
      setSelectedContents({ ...selectedContents, [courseId]: courseContents });
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules({ ...selectedModules, [courseId]: newSelected });
  };

  // Toggle lesson selection for a specific course
  const toggleLesson = (
    courseId: string,
    moduleId: string,
    lessonId: string,
  ) => {
    const courseLessons = selectedLessons[courseId] || {};
    const moduleLessons = courseLessons[moduleId] || new Set<string>();
    const newModuleLessons = new Set(moduleLessons);

    if (newModuleLessons.has(lessonId)) {
      // Unselect lesson - remove it and all its contents
      newModuleLessons.delete(lessonId);
      const courseContents = { ...(selectedContents[courseId] || {}) };
      delete courseContents[lessonId];
      setSelectedContents({ ...selectedContents, [courseId]: courseContents });
    } else {
      // Select lesson - automatically select all contents in this lesson
      newModuleLessons.add(lessonId);

      // Find the lesson and get all its content IDs
      const courseDetails = coursesDetails[courseId];
      if (
        courseDetails &&
        courseDetails.modules &&
        Array.isArray(courseDetails.modules)
      ) {
        const module = (courseDetails.modules as CourseModule[]).find(
          (m) => (typeof m === "string" ? m : m._id) === moduleId,
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

            const courseContents = { ...(selectedContents[courseId] || {}) };
            courseContents[lessonId] = new Set(allContentIds);
            setSelectedContents({
              ...selectedContents,
              [courseId]: courseContents,
            });
          }
        }
      }
    }

    setSelectedLessons({
      ...selectedLessons,
      [courseId]: { ...courseLessons, [moduleId]: newModuleLessons },
    });
  };

  // Toggle content selection for a specific course
  const toggleContent = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    contentId: string,
  ) => {
    const courseLessons = selectedLessons[courseId] || {};
    const moduleLessons = courseLessons[moduleId] || new Set<string>();
    const isLessonSelected = moduleLessons.has(lessonId);

    if (isLessonSelected) {
      // If lesson is selected, unselect the lesson first (which will remove all contents)
      // Then select only the remaining contents
      const newModuleLessons = new Set(moduleLessons);
      newModuleLessons.delete(lessonId);
      setSelectedLessons({
        ...selectedLessons,
        [courseId]: { ...courseLessons, [moduleId]: newModuleLessons },
      });

      // Get all content IDs for this lesson
      const courseDetails = coursesDetails[courseId];
      if (
        courseDetails &&
        courseDetails.modules &&
        Array.isArray(courseDetails.modules)
      ) {
        const module = (courseDetails.modules as CourseModule[]).find(
          (m) => (typeof m === "string" ? m : m._id) === moduleId,
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
              (id) => id !== contentId,
            );
            const courseContents = { ...(selectedContents[courseId] || {}) };

            if (newContentIds.length > 0) {
              courseContents[lessonId] = new Set(newContentIds);
            } else {
              delete courseContents[lessonId];
            }

            setSelectedContents({
              ...selectedContents,
              [courseId]: courseContents,
            });
          }
        }
      }
    } else {
      // Lesson is not selected, so we're selecting individual contents
      const courseContents = selectedContents[courseId] || {};
      const lessonContents = courseContents[lessonId] || new Set<string>();
      const newLessonContents = new Set(lessonContents);

      if (newLessonContents.has(contentId)) {
        newLessonContents.delete(contentId);
      } else {
        newLessonContents.add(contentId);
      }

      const newCourseContents = { ...courseContents };
      if (newLessonContents.size > 0) {
        newCourseContents[lessonId] = newLessonContents;
      } else {
        delete newCourseContents[lessonId];
      }
      setSelectedContents({
        ...selectedContents,
        [courseId]: newCourseContents,
      });
    }
  };

  // Toggle module expansion
  const toggleModuleExpansion = (courseId: string, moduleId: string) => {
    const courseExpanded = expandedModules[courseId] || new Set<string>();
    const newExpanded = new Set(courseExpanded);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules({ ...expandedModules, [courseId]: newExpanded });
  };

  // Toggle lesson expansion
  const toggleLessonExpansion = (courseId: string, lessonId: string) => {
    const courseExpanded = expandedLessons[courseId] || new Set<string>();
    const newExpanded = new Set(courseExpanded);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons({ ...expandedLessons, [courseId]: newExpanded });
  };

  // Check if there are any valid selections for partial access across all courses
  const hasValidPartialAccessSelection = (): boolean => {
    // For "topN" access type, check if topNCount is valid
    if (accessType === "topN") {
      return topNCount > 0;
    }

    // For "partial" access type, check selections
    // Check if any modules are selected in any course
    const hasSelectedModules = Object.values(selectedModules).some(
      (modules) => modules && modules.size > 0,
    );
    if (hasSelectedModules) {
      return true;
    }

    // Check if any lessons are selected in any course
    const hasSelectedLessons = Object.values(selectedLessons).some(
      (courseLessons) => {
        if (!courseLessons) return false;
        return Object.values(courseLessons).some(
          (lessons) => lessons && lessons.size > 0,
        );
      },
    );
    if (hasSelectedLessons) {
      return true;
    }

    // Check if any contents are selected in any course
    const hasSelectedContents = Object.values(selectedContents).some(
      (courseContents) => {
        if (!courseContents) return false;
        return Object.values(courseContents).some(
          (contents) => contents && contents.size > 0,
        );
      },
    );

    return hasSelectedContents;
  };

  // Build access control object from selections for a specific course
  const buildAccessControl = (
    courseId: string,
  ): PartialAccessControl | undefined => {
    if (accessType === "full") {
      return undefined; // Full access means no accessControl
    }

    const courseDetails = coursesDetails[courseId];
    if (
      !courseDetails ||
      !courseDetails.modules ||
      !Array.isArray(courseDetails.modules)
    ) {
      return undefined;
    }

    // Handle "topN" access type - automatically select top N contents from each lesson
    if (accessType === "topN") {
      const accessibleModules: ModuleAccessControl[] = [];
      const lessonToModuleMap = new Map<string, string>(); // Map lessonId to moduleId

      // First, build a map of lessons to their parent modules
      (courseDetails.modules as CourseModule[]).forEach((module) => {
        const moduleId = typeof module === "string" ? module : module._id || "";
        if (
          moduleId &&
          typeof module !== "string" &&
          Array.isArray(module.lessons)
        ) {
          module.lessons.forEach((lesson) => {
            const lessonId =
              typeof lesson === "string" ? lesson : lesson._id || "";
            if (lessonId) {
              lessonToModuleMap.set(lessonId, moduleId);
            }
          });
        }
      });

      // Process all modules and lessons to select top N contents
      (courseDetails.modules as CourseModule[]).forEach((module) => {
        const moduleId = typeof module === "string" ? module : module._id || "";
        if (!moduleId || typeof module === "string") return;

        const moduleAccess: ModuleAccessControl = {
          moduleId,
          accessibleLessons: [],
        };

        if (Array.isArray(module.lessons)) {
          module.lessons.forEach((lesson) => {
            const lessonId =
              typeof lesson === "string" ? lesson : lesson._id || "";
            if (!lessonId || typeof lesson === "string") return;

            // Get all contents for this lesson
            const lessonContents = Array.isArray(lesson.contents)
              ? lesson.contents
              : [];

            // Sort contents by order (ascending) and take top N
            const sortedContents = lessonContents
              .map((content) => {
                const contentId =
                  typeof content === "string" ? content : content._id || "";
                const order =
                  typeof content === "string" ? 0 : content.order || 0;
                return { contentId, order };
              })
              .filter((c) => c.contentId)
              .sort((a, b) => a.order - b.order)
              .slice(0, topNCount)
              .map((c) => c.contentId);

            // Only add lesson if it has accessible contents
            if (sortedContents.length > 0) {
              moduleAccess.accessibleLessons!.push({
                lessonId,
                accessibleContentIds: sortedContents,
              });
            }
          });
        }

        // Only add module if it has accessible lessons
        if (
          moduleAccess.accessibleLessons &&
          moduleAccess.accessibleLessons.length > 0
        ) {
          accessibleModules.push(moduleAccess);
        }
      });

      return {
        accessType: "partial",
        accessibleModules:
          accessibleModules.length > 0 ? accessibleModules : undefined,
      };
    }

    // Handle "partial" access type - use existing logic
    // Get selections for this course
    const courseSelectedModules =
      selectedModules[courseId] || new Set<string>();
    const courseSelectedLessons = selectedLessons[courseId] || {};
    const courseSelectedContents = selectedContents[courseId] || {};

    // First, build a complete map of lessons to their parent modules
    const lessonToModuleMap = new Map<string, string>(); // Map lessonId to moduleId
    const allModulesMap = new Map<string, CourseModule>(); // Map moduleId to module

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
            }
          });
        }
      }
    });

    // Build the access control structure
    const accessibleModules: ModuleAccessControl[] = [];

    // Process selected modules
    courseSelectedModules.forEach((moduleId) => {
      const module = allModulesMap.get(moduleId);
      if (module && typeof module !== "string") {
        const moduleAccess: ModuleAccessControl = {
          moduleId,
        };

        // If module is selected, include all its lessons
        if (Array.isArray(module.lessons)) {
          const accessibleLessons = module.lessons
            .map((lesson) => {
              const lessonId =
                typeof lesson === "string" ? lesson : lesson._id || "";
              return {
                lessonId,
              };
            })
            .filter((l) => l.lessonId);

          if (accessibleLessons.length > 0) {
            moduleAccess.accessibleLessons = accessibleLessons;
          }
        }

        accessibleModules.push(moduleAccess);
      }
    });

    // Process selected lessons (that are not part of selected modules)
    Object.keys(courseSelectedLessons).forEach((moduleId) => {
      if (!courseSelectedModules.has(moduleId)) {
        const moduleLessons = courseSelectedLessons[moduleId];
        if (moduleLessons && moduleLessons.size > 0) {
          const moduleAccess: ModuleAccessControl = {
            moduleId,
            accessibleLessons: Array.from(moduleLessons).map((lessonId) => ({
              lessonId,
            })),
          };

          accessibleModules.push(moduleAccess);
        }
      }
    });

    // Process selected contents (that are not part of selected lessons)
    Object.keys(courseSelectedContents).forEach((lessonId) => {
      const contents = courseSelectedContents[lessonId];
      if (contents && contents.size > 0) {
        const moduleId = lessonToModuleMap.get(lessonId);
        if (moduleId) {
          // Check if this lesson is already in access control
          let moduleAccess = accessibleModules.find(
            (m) => m.moduleId === moduleId,
          );

          if (!moduleAccess) {
            moduleAccess = {
              moduleId,
              accessibleLessons: [],
            };
            accessibleModules.push(moduleAccess);
          }

          if (!moduleAccess.accessibleLessons) {
            moduleAccess.accessibleLessons = [];
          }

          // Check if this lesson is already in the module's lessons
          let lessonAccess = moduleAccess.accessibleLessons.find(
            (l) => l.lessonId === lessonId,
          );

          if (!lessonAccess) {
            lessonAccess = {
              lessonId,
              accessibleContentIds: [],
            };
            moduleAccess.accessibleLessons.push(lessonAccess);
          }

          // Add contents
          if (!lessonAccess.accessibleContentIds) {
            lessonAccess.accessibleContentIds = [];
          }
          contents.forEach((contentId) => {
            lessonAccess!.accessibleContentIds!.push(contentId);
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

  // Handle course gifting
  const handleGiftCourse = async () => {
    if (selectedCourses.length === 0 || selectedUsers.length === 0) {
      toast.error("Please select at least one course and one user");
      return;
    }

    // Check if all selected courses have plans selected
    const coursesWithoutPlans = selectedCourses.filter(
      (course) => !selectedPlans[course._id || ""],
    );
    if (coursesWithoutPlans.length > 0) {
      toast.error(
        `Please select a plan for: ${coursesWithoutPlans
          .map((c) => c.title)
          .join(", ")}`,
      );
      return;
    }

    // Check if all selected plans exist for their courses
    for (const course of selectedCourses) {
      const planType = selectedPlans[course._id || ""];
      if (!course.plans || !course.plans[planType]) {
        toast.error(
          `Selected plan (${planType}) is not available for course: ${course.title}`,
        );
        return;
      }
    }

    setIsGifting(true);
    try {
      let totalSuccessCount = 0;
      let totalFailCount = 0;
      const errors: string[] = [];

      // Gift each course to each selected user
      for (const course of selectedCourses) {
        const planType = selectedPlans[course._id || ""];
        // Build access control for this specific course
        const accessControl = course._id
          ? buildAccessControl(course._id)
          : undefined;
        let courseSuccessCount = 0;
        let courseFailCount = 0;

        for (const userId of selectedUsers) {
          try {
            const enrolledForUser =
              users.find((u) => u._id === userId)?.enrolledCourseIds ?? [];
            if (course._id && enrolledForUser.includes(course._id)) {
              // Skip courses the user already owns; allow other courses to proceed
              continue;
            }

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
            // Find user from loaded users
            const user = users.find((u) => u._id === userId);
            const userName = user
              ? `${user.firstName || "Unknown"} ${user.lastName || "User"}`
              : userId;
            errors.push(
              `${course.title} → ${userName}: ${
                error.message || "Failed to gift course"
              }`,
            );
          }
        }
      }

      if (totalSuccessCount > 0) {
        let accessInfo = "full access";
        if (accessType === "topN") {
          accessInfo = `top ${topNCount} contents from each lesson`;
        } else if (accessType === "partial") {
          accessInfo = "partial access";
        }
        toast.success(
          `Successfully gifted ${selectedCourses.length} course(s) (${accessInfo}) to ${selectedUsers.length} user(s). Total: ${totalSuccessCount} gift(s) completed.`,
        );
      }

      if (totalFailCount > 0) {
        toast.error(
          `Failed to gift ${totalFailCount} course(s). ${errors
            .slice(0, 5)
            .join("; ")}${
            errors.length > 5 ? ` and ${errors.length - 5} more...` : ""
          }`,
        );
      }

      onClose();
      onGiftComplete?.();
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to gift course. Please try again.";
      toast.error(errorMessage);
      console.error("Gift course error:", error);
    } finally {
      setIsGifting(false);
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
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Gift Course to Users
                </h3>
                <p className="text-sm text-orange-50">Step {giftStep} of 4</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors cursor-pointer"
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
                    Select Course(s)
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (Multiple selection allowed)
                    </span>
                  </label>
                  <BrandSelect
                    className="mb-3"
                    required
                    placeholder="Choose a brand first"
                    value={brand}
                    onChange={(next) => {
                      if (next === "all") return;
                      setBrand(next);
                      setSelectedCourses([]);
                    }}
                  />
                  {!brand && (
                    <p className="text-sm text-gray-500 mb-3">
                      Choose a brand to list its courses. The learner joins that
                      brand when the course is granted.
                    </p>
                  )}
                  {/* Course Search + Filters */}
                  <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Input
                        type="text"
                        placeholder="Search courses by title..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        icon={<Search className="w-5 h-5 text-gray-400" />}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Select
                        options={[
                          { value: "all", label: "All audiences" },
                          {
                            value: "college-students",
                            label: "College students",
                          },
                          { value: "professionals", label: "Professionals" },
                        ]}
                        value={audienceFilter}
                        onChange={(value) =>
                          setAudienceFilter(
                            value as
                              | "all"
                              | "college-students"
                              | "professionals",
                          )
                        }
                        placeholder="Audience"
                      />
                    </div>
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
                        Select all{" "}
                        {
                          courses.filter(
                            (c) =>
                              c.plans && (c.plans.elite || c.plans.essential),
                          ).length
                        }{" "}
                        course
                        {courses.filter(
                          (c) =>
                            c.plans && (c.plans.elite || c.plans.essential),
                        ).length !== 1
                          ? "s"
                          : ""}{" "}
                        (loaded)
                      </span>
                      {!allLoadedCoursesHavePlans && (
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
                            (c) => c._id === course._id,
                          );
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

                          const hasPlans =
                            course.plans &&
                            (course.plans.elite || course.plans.essential);

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
                                    e.target.checked,
                                  );
                                }}
                                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                              />
                              <div className="ml-4 flex-1">
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-700">
                                  {course.title}
                                  {planInfo && (
                                    <span className="text-xs text-gray-500 font-normal ml-2">
                                      {planInfo}
                                    </span>
                                  )}
                                </div>
                                {!hasPlans && (
                                  <div className="text-xs text-red-600 mt-1">
                                    ⚠️ No plans available
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
                        {hasMore && (
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
                    {isLoadingCourses && courses.length === 0 && (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p className="text-gray-600 font-medium">
                          Loading courses...
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedCourses.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">
                        ✓ {selectedCourses.length} course
                        {selectedCourses.length > 1 ? "s" : ""} selected
                      </p>
                      <div className="mt-2 space-y-1">
                        {selectedCourses.map((course) => (
                          <div
                            key={course._id}
                            className="text-xs text-green-600"
                          >
                            • {course.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Plan Selection */}
            {giftStep === 2 && selectedCourses.length > 0 && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Selected Course(s):</span>{" "}
                    <span className="text-blue-700 font-medium">
                      {selectedCourses.length} course
                      {selectedCourses.length > 1 ? "s" : ""}
                    </span>
                  </p>
                </div>
                <div className="space-y-4">
                  {selectedCourses.map((course) => {
                    const courseId = course._id || "";
                    const selectedPlan = selectedPlans[courseId];
                    const hasElite = course.plans?.elite;
                    const hasEssential = course.plans?.essential;

                    if (!hasElite && !hasEssential) {
                      return (
                        <div
                          key={courseId}
                          className="p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <p className="text-sm text-red-600 font-medium">
                            ⚠️ {course.title} doesn't have any plans available.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={courseId}
                        className="p-4 border-2 border-gray-200 rounded-xl"
                      >
                        <div className="mb-3">
                          <label className="block text-sm font-semibold text-gray-900">
                            {course.title}
                          </label>
                        </div>
                        <Select
                          options={[
                            ...(hasElite
                              ? [
                                  {
                                    value: "elite",
                                    label: `Elite Plan - ₹${
                                      course.plans!.elite!.price
                                    }`,
                                  },
                                ]
                              : []),
                            ...(hasEssential
                              ? [
                                  {
                                    value: "essential",
                                    label: `Essential Plan - ₹${
                                      course.plans!.essential!.price
                                    }`,
                                  },
                                ]
                              : []),
                          ]}
                          value={selectedPlan || ""}
                          onChange={(value) =>
                            handlePlanSelect(
                              courseId,
                              value as "elite" | "essential",
                            )
                          }
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
                    );
                  })}
                </div>
                {Object.keys(selectedPlans).length === selectedCourses.length &&
                  selectedCourses.every((c) => selectedPlans[c._id || ""]) && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">
                        ✓ All courses have plans selected
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Step 3: User Selection (Multi-select) */}
            {giftStep === 3 &&
              selectedCourses.length > 0 &&
              Object.keys(selectedPlans).length === selectedCourses.length &&
              selectedCourses.every((c) => selectedPlans[c._id || ""]) && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div>
                        <span className="font-semibold text-gray-700">
                          Course(s):
                        </span>{" "}
                        <span className="text-blue-700 font-medium">
                          {selectedCourses.length} selected
                        </span>
                      </div>
                      <div className="h-4 w-px bg-gray-300"></div>
                      <div>
                        <span className="font-semibold text-gray-700">
                          Plan(s):
                        </span>{" "}
                        <span className="text-blue-700 font-medium">
                          {Object.keys(selectedPlans).length} selected
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

                    {/* Search Bar */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search users by name or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {debouncedUserSearch && (
                        <p className="text-xs text-gray-500 mt-1">
                          Showing up to 100 results for "{debouncedUserSearch}"
                        </p>
                      )}
                    </div>

                    {isLoadingUsers && users.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p className="text-gray-500">Loading users...</p>
                      </div>
                    ) : (
                      <div
                        ref={usersScrollRef}
                        className="border-2 border-gray-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto"
                      >
                        {getAvailableUsers().length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="text-gray-400 mb-2">
                              <UserIcon className="w-12 h-12 mx-auto" />
                            </div>
                            <p className="text-gray-600 font-medium">
                              {debouncedUserSearch
                                ? "No users found"
                                : "No available users"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {debouncedUserSearch
                                ? "Try a different search term"
                                : "All users already own this course."}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {getAvailableUsers().map((user) =>
                              (() => {
                                const enrolledCount =
                                  user.enrolledCourseIds?.length ?? 0;
                                const selectedCount = selectedCourses.length;
                                const isEnrolledInAll =
                                  selectedCount > 0 &&
                                  enrolledCount >= selectedCount;
                                const isSelected = selectedUsers.includes(
                                  user._id || "",
                                );

                                return (
                                  <label
                                    key={user._id}
                                    className={`flex items-center p-4 transition-colors group ${
                                      isEnrolledInAll
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-orange-50 cursor-pointer"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isEnrolledInAll}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedUsers([
                                            ...selectedUsers,
                                            user._id || "",
                                          ]);
                                        } else {
                                          setSelectedUsers(
                                            selectedUsers.filter(
                                              (id) => id !== user._id,
                                            ),
                                          );
                                        }
                                      }}
                                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                                    />
                                    <div className="ml-4 flex-1">
                                      <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-700">
                                        {user.firstName || "Unknown"}{" "}
                                        {user.lastName || "User"}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {user.email}
                                      </div>
                                      {selectedCount > 0 &&
                                        enrolledCount > 0 && (
                                          <div className="text-xs text-orange-600 mt-1">
                                            Enrolled in {enrolledCount}/
                                            {selectedCount} selected
                                          </div>
                                        )}
                                      {isEnrolledInAll && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Already enrolled in all selected
                                          courses
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
                              })(),
                            )}
                            {/* Infinite scroll trigger (only when not searching) */}
                            {!debouncedUserSearch && userHasMore && (
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
                            {!debouncedUserSearch &&
                              !userHasMore &&
                              users.length > 0 && (
                                <div className="p-4 text-center text-sm text-gray-500">
                                  No more users to load
                                </div>
                              )}
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
              selectedCourses.length > 0 &&
              Object.keys(selectedPlans).length === selectedCourses.length &&
              selectedCourses.every((c) => selectedPlans[c._id || ""]) &&
              selectedUsers.length > 0 && (
                <div className="space-y-6">
                  <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div>
                        <span className="font-semibold text-gray-700">
                          Course(s):
                        </span>{" "}
                        <span className="text-blue-700 font-medium">
                          {selectedCourses.length}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-gray-300"></div>
                      <div>
                        <span className="font-semibold text-gray-700">
                          Plan(s):
                        </span>{" "}
                        <span className="text-blue-700 font-medium">
                          {Object.keys(selectedPlans).length}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-gray-300"></div>
                      <div>
                        <span className="font-semibold text-gray-700">
                          User(s):
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                      <label
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          accessType === "topN"
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="accessType"
                          value="topN"
                          checked={accessType === "topN"}
                          onChange={() => handleAccessTypeSelect("topN")}
                          className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-semibold text-gray-900 block">
                            Top N Contents
                          </span>
                          <span className="text-xs text-gray-500">
                            Top N contents from each lesson
                          </span>
                        </div>
                      </label>
                    </div>
                    {accessType === "topN" && (
                      <div className="mb-6">
                        <Input
                          type="number"
                          label="Number of Contents (N)"
                          placeholder="e.g., 5"
                          value={topNCount.toString()}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (!isNaN(value) && value > 0) {
                              setTopNCount(value);
                            } else if (e.target.value === "") {
                              setTopNCount(1);
                            }
                          }}
                          min={1}
                          className="max-w-xs"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Users will get access to the top {topNCount}{" "}
                          content(s) from each lesson (sorted by order). If a
                          lesson has fewer than {topNCount} contents, all
                          available contents will be granted.
                        </p>
                      </div>
                    )}
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
                      ) : selectedCourses.length > 0 ? (
                        <div className="space-y-4">
                          <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Select Modules, Lessons, and Content for Each
                              Course
                            </label>
                            <p className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                              💡 <strong>Tip:</strong> Select modules to grant
                              access. If you select a module without selecting
                              lessons, users will have access to all lessons in
                              that module. Same applies for lessons and content.
                            </p>
                          </div>
                          {selectedCourses.map((course) => {
                            const courseId = course._id || "";
                            const courseDetails = coursesDetails[courseId];
                            const isLoadingCourse =
                              !courseDetails && loadingCourseDetails;

                            return (
                              <div
                                key={courseId}
                                className="border-2 border-gray-300 rounded-xl overflow-hidden"
                              >
                                <div className="bg-orange-50 px-4 py-3 border-b border-gray-300">
                                  <h4 className="text-sm font-bold text-gray-900">
                                    {course.title}
                                  </h4>
                                </div>
                                {isLoadingCourse ? (
                                  <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                                    <p className="text-xs text-gray-600">
                                      Loading structure...
                                    </p>
                                  </div>
                                ) : courseDetails &&
                                  courseDetails.modules &&
                                  Array.isArray(courseDetails.modules) &&
                                  courseDetails.modules.length > 0 ? (
                                  <div className="max-h-96 overflow-y-auto p-5 bg-gray-50">
                                    <div className="space-y-2">
                                      {(
                                        courseDetails.modules as CourseModule[]
                                      ).map((module) => {
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
                                          selectedModules[courseId]?.has(
                                            moduleId,
                                          ) || false;
                                        const isModuleExpanded =
                                          expandedModules[courseId]?.has(
                                            moduleId,
                                          ) || false;

                                        return (
                                          <div
                                            key={moduleId}
                                            className="border border-gray-200 rounded-lg"
                                          >
                                            <div className="flex items-center p-3 hover:bg-gray-50">
                                              <button
                                                onClick={() =>
                                                  toggleModuleExpansion(
                                                    courseId,
                                                    moduleId,
                                                  )
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
                                                  toggleModule(
                                                    courseId,
                                                    moduleId,
                                                  )
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
                                                  {moduleLessons.map(
                                                    (lesson) => {
                                                      const lessonId =
                                                        typeof lesson ===
                                                        "string"
                                                          ? lesson
                                                          : lesson._id || "";
                                                      const lessonTitle =
                                                        typeof lesson ===
                                                        "string"
                                                          ? "Unknown Lesson"
                                                          : lesson.title;
                                                      const lessonContents =
                                                        typeof lesson ===
                                                        "string"
                                                          ? []
                                                          : Array.isArray(
                                                                lesson.contents,
                                                              )
                                                            ? lesson.contents
                                                            : [];
                                                      const isLessonSelected =
                                                        selectedLessons[
                                                          courseId
                                                        ]?.[moduleId]?.has(
                                                          lessonId,
                                                        ) || false;
                                                      const isLessonExpanded =
                                                        expandedLessons[
                                                          courseId
                                                        ]?.has(lessonId) ||
                                                        false;

                                                      return (
                                                        <div
                                                          key={lessonId}
                                                          className="border border-gray-200 rounded p-2"
                                                        >
                                                          <div className="flex items-center">
                                                            <button
                                                              onClick={() =>
                                                                toggleLessonExpansion(
                                                                  courseId,
                                                                  lessonId,
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
                                                                  courseId,
                                                                  moduleId,
                                                                  lessonId,
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
                                                                        courseId
                                                                      ]?.[
                                                                        moduleId
                                                                      ]?.has(
                                                                        lessonId,
                                                                      ) ||
                                                                      false;
                                                                    // Check if this specific content is selected (when lesson is not selected)
                                                                    const isContentIndividuallySelected =
                                                                      !isLessonSelected &&
                                                                      (selectedContents[
                                                                        courseId
                                                                      ]?.[
                                                                        lessonId
                                                                      ]?.has(
                                                                        contentId,
                                                                      ) ||
                                                                        false);

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
                                                                              courseId,
                                                                              moduleId,
                                                                              lessonId,
                                                                              contentId,
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
                                                                  },
                                                                )}
                                                              </div>
                                                            )}
                                                        </div>
                                                      );
                                                    },
                                                  )}
                                                </div>
                                              )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {!hasValidPartialAccessSelection() && (
                                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-sm text-amber-700 font-medium">
                                          ⚠️ Please select at least one module,
                                          lesson, or content to grant partial
                                          access.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 bg-gray-50">
                                    <p className="text-xs text-gray-600">
                                      This course doesn't have any modules yet.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <p className="text-gray-600 font-medium">
                            No courses selected. Please select courses in step
                            1.
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
              <WhiteButton
                glow={false}
                onClick={() => {
                  if (giftStep === 4) {
                    setGiftStep(3);
                  } else if (giftStep === 3) {
                    setGiftStep(2);
                    setSelectedUsers([]);
                  } else if (giftStep === 2) {
                    setGiftStep(1);
                    setSelectedPlans({});
                    setSelectedUsers([]);
                  }
                }}
                className="cursor-pointer"
              >
                ← Back
              </WhiteButton>
            )}
          </div>
          <div className="flex gap-3">
            <WhiteButton
              glow={false}
              onClick={handleClose}
              className="cursor-pointer"
            >
              Cancel
            </WhiteButton>
            {giftStep === 4 ? (
              <OrangeButton
                glow={false}
                onClick={handleGiftCourse}
                disabled={
                  isGifting ||
                  isLoading ||
                  ((accessType === "partial" || accessType === "topN") &&
                    !hasValidPartialAccessSelection())
                }
                className={`px-6 py-2.5 font-semibold ${
                  isGifting ||
                  isLoading ||
                  ((accessType === "partial" || accessType === "topN") &&
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
                glow={false}
                onClick={() => {
                  if (
                    giftStep === 1 &&
                    selectedCourses.length > 0 &&
                    selectedCourses.every(
                      (c) => c.plans && (c.plans.elite || c.plans.essential),
                    )
                  ) {
                    setGiftStep(2);
                  } else if (
                    giftStep === 2 &&
                    Object.keys(selectedPlans).length ===
                      selectedCourses.length &&
                    selectedCourses.every((c) => selectedPlans[c._id || ""])
                  ) {
                    setGiftStep(3);
                  } else if (giftStep === 3 && selectedUsers.length > 0) {
                    setGiftStep(4);
                  }
                }}
                disabled={
                  (giftStep === 1 &&
                    (selectedCourses.length === 0 ||
                      !selectedCourses.every(
                        (c) => c.plans && (c.plans.elite || c.plans.essential),
                      ))) ||
                  (giftStep === 2 &&
                    (Object.keys(selectedPlans).length !==
                      selectedCourses.length ||
                      !selectedCourses.every(
                        (c) => selectedPlans[c._id || ""],
                      ))) ||
                  (giftStep === 3 && selectedUsers.length === 0)
                }
                className={`px-6 py-2.5 font-semibold ${
                  (giftStep === 1 &&
                    (selectedCourses.length === 0 ||
                      !selectedCourses.every(
                        (c) => c.plans && (c.plans.elite || c.plans.essential),
                      ))) ||
                  (giftStep === 2 &&
                    (Object.keys(selectedPlans).length !==
                      selectedCourses.length ||
                      !selectedCourses.every(
                        (c) => selectedPlans[c._id || ""],
                      ))) ||
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
  );
};

export default GiftCourseModal;
