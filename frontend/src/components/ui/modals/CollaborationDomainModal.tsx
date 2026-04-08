"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Check, BookOpen, Loader2, Info } from "lucide-react";
import { useCollaborationDomain } from "@/hooks/useCollaborationDomain";
import { useCourse } from "@/hooks/useCourse";
import {
  CollaborationDomain,
  CollaborationBenefit,
  CollaborationEnrollmentAccess,
  CreateCollaborationDomainData,
} from "@/types/collaborationDomain";
import { Plan, Course as CourseType } from "@/types/course";
import { Course, CourseModule } from "@/types";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { toast } from "react-toastify";
import CollaborationDomainPartialAccessPicker from "@/app/admin/settings/collaboration-domains/components/CollaborationDomainPartialAccessPicker";
import {
  buildPartialAccessFromSelections,
  hasAnyPartialSelection,
  hydratePartialAccessSelections,
} from "@/app/admin/settings/collaboration-domains/utils/buildPartialAccessFromSelections";

type AccessType = "full" | "partial" | "topN";
type PartnershipOffer = "course_access" | "discount";

const AUDIENCE_LABEL: Record<CourseType["audience"], string> = {
  "college-students": "College students",
  professionals: "Professionals",
};

interface CollaborationDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingDomain: CollaborationDomain | null;
  mode: "create" | "edit";
}

const CollaborationDomainModal = ({
  isOpen,
  onClose,
  onSuccess,
  editingDomain,
  mode,
}: CollaborationDomainModalProps) => {
  const { createCollaborationDomain, updateCollaborationDomain, isLoading } =
    useCollaborationDomain();
  const { getAdminCourses, getAdminCourseOptions, getAdminCourseById } = useCourse();

  // Form fields
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [accessType, setAccessType] = useState<AccessType>("full");
  const [topN, setTopN] = useState<number>(5);
  const [partnershipOffer, setPartnershipOffer] =
    useState<PartnershipOffer>("course_access");
  const [benefitType, setBenefitType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [benefitValue, setBenefitValue] = useState<number>(0);
  const [plan, setPlan] = useState<Plan["type"]>("elite");
  const [audience, setAudience] =
    useState<CourseType["audience"]>("college-students");
  const [durationDays, setDurationDays] = useState<number>(365);

  const [courseSearch, setCourseSearch] = useState("");
  const [courseResults, setCourseResults] = useState<Course[]>([]);
  const [coursePage, setCoursePage] = useState(1);
  const [hasMoreCourses, setHasMoreCourses] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectingAllCourses, setSelectingAllCourses] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const courseSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const coursesScrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadCourses = useCallback(
    async (
      page: number,
      search: string,
      append: boolean,
      opts?: { applyAudienceFilter?: boolean },
    ) => {
      const applyAudience =
        opts?.applyAudienceFilter ?? partnershipOffer === "course_access";
      setLoadingCourses(true);
      try {
        const res = await getAdminCourses({
          page,
          limit: 20,
          search: search.trim() || undefined,
          isActive: true,
          ...(applyAudience ? { audience } : {}),
        });
        if (res?.courses) {
          const list = res.courses;
          setCourseResults((prev) => (append ? [...prev, ...list] : list));
          setHasMoreCourses(page < (res.totalPages ?? 0));
        } else {
          if (!append) setCourseResults([]);
          setHasMoreCourses(false);
        }
      } catch {
        if (!append) setCourseResults([]);
        setHasMoreCourses(false);
      } finally {
        setLoadingCourses(false);
      }
    },
    [getAdminCourses, partnershipOffer, audience],
  );

  const [courseDetailForPartial, setCourseDetailForPartial] =
    useState<Course | null>(null);
  const [loadingCourseDetail, setLoadingCourseDetail] = useState(false);
  const [partialModules, setPartialModules] = useState<Set<string>>(
    () => new Set(),
  );
  const [partialLessons, setPartialLessons] = useState<
    Record<string, Set<string>>
  >({});
  const [partialContents, setPartialContents] = useState<
    Record<string, Set<string>>
  >({});
  const hydratedPartialEditKeyRef = useRef<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && editingDomain) {
      setTitle(editingDomain.title);
      setDomain(editingDomain.domain.replace(/^@/, ""));
      setIsActive(editingDomain.isActive);
      setPartnershipOffer(
        editingDomain.collaborationKind === "discount"
          ? "discount"
          : "course_access",
      );
      const ea = editingDomain.enrollmentAccess;
      if (editingDomain.collaborationKind === "course_allot" && ea) {
        if (ea.mode === "full") {
          setAccessType("full");
        } else if (
          ea.topNSettings != null &&
          typeof ea.topNSettings.contentsPerLesson === "number"
        ) {
          setAccessType("topN");
          setTopN(ea.topNSettings.contentsPerLesson);
        } else {
          setAccessType("partial");
          setTopN(5);
        }
        setPlan(ea.plan ?? "elite");
        setAudience(ea.audience ?? "college-students");
        setDurationDays(ea.durationDays ?? 365);
      } else {
        setAccessType("full");
        setTopN(5);
        setPlan("elite");
        setAudience("college-students");
        setDurationDays(365);
      }
      setBenefitType(editingDomain.benefit?.type ?? "percentage");
      setBenefitValue(editingDomain.benefit?.value ?? 0);
      const courses = editingDomain.courses as Course[];
      setSelectedCourses(courses.filter((c) => typeof c === "object"));
      setPartialModules(new Set());
      setPartialLessons({});
      setPartialContents({});
      hydratedPartialEditKeyRef.current = null;
      setCourseSearch("");
    } else if (isOpen) {
      resetForm();
    }
  }, [mode, editingDomain, isOpen]);

  // Load full course structure for explicit partial access (single course only)
  useEffect(() => {
    if (
      partnershipOffer !== "course_access" ||
      accessType !== "partial" ||
      selectedCourses.length !== 1
    ) {
      setCourseDetailForPartial(null);
      setLoadingCourseDetail(false);
      return;
    }
    const courseId = selectedCourses[0]._id;
    if (!courseId) return;
    let cancelled = false;
    setLoadingCourseDetail(true);
    getAdminCourseById(courseId).then((c) => {
      if (cancelled) return;
      setCourseDetailForPartial(c);
      setLoadingCourseDetail(false);
    });
    return () => {
      cancelled = true;
    };
  }, [partnershipOffer, accessType, selectedCourses, getAdminCourseById]);

  // Hydrate partial selections when editing a domain with explicit partial access
  useEffect(() => {
    if (!isOpen || mode !== "edit" || !editingDomain) return;
    if (partnershipOffer !== "course_access" || accessType !== "partial")
      return;
    const pa = editingDomain.enrollmentAccess?.partialAccess;
    if (!pa?.accessibleModules?.length || !courseDetailForPartial?._id) {
      return;
    }
    const key = `${editingDomain._id}-${courseDetailForPartial._id}`;
    if (hydratedPartialEditKeyRef.current === key) return;
    const h = hydratePartialAccessSelections(pa, courseDetailForPartial);
    setPartialModules(h.selectedModules);
    setPartialLessons(h.selectedLessons);
    setPartialContents(h.selectedContents);
    hydratedPartialEditKeyRef.current = key;
  }, [
    isOpen,
    mode,
    editingDomain?._id,
    editingDomain?.enrollmentAccess?.partialAccess,
    partnershipOffer,
    accessType,
    courseDetailForPartial,
  ]);

  useEffect(() => {
    if (
      partnershipOffer === "course_access" &&
      accessType === "partial" &&
      selectedCourses.length !== 1
    ) {
      setPartialModules(new Set());
      setPartialLessons({});
      setPartialContents({});
    }
  }, [partnershipOffer, accessType, selectedCourses.length]);

  // Initial load and reset on modal open (same as CouponModal)
  useEffect(() => {
    if (isOpen) {
      setCourseResults([]);
      setCoursePage(1);
      setCourseSearch("");
      setHasMoreCourses(true);
      loadCourses(1, "", false);
    }
  }, [isOpen, loadCourses]);

  // Debounced search for courses
  useEffect(() => {
    if (!isOpen) return;
    if (courseSearchDebounceRef.current) {
      clearTimeout(courseSearchDebounceRef.current);
    }

    courseSearchDebounceRef.current = setTimeout(() => {
      setCourseResults([]);
      setCoursePage(1);
      setHasMoreCourses(true);
      loadCourses(1, courseSearch, false);
    }, 500);

    return () => {
      if (courseSearchDebounceRef.current) {
        clearTimeout(courseSearchDebounceRef.current);
      }
    };
  }, [courseSearch, loadCourses]);

  const handleCoursesScroll = useCallback(() => {
    const el = coursesScrollRef.current;
    if (!el || loadingCourses || !hasMoreCourses) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      const nextPage = coursePage + 1;
      setCoursePage(nextPage);
      loadCourses(nextPage, courseSearch, true);
    }
  }, [coursePage, courseSearch, loadingCourses, hasMoreCourses, loadCourses]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowCourseDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetForm = () => {
    setTitle("");
    setDomain("");
    setIsActive(true);
    setAccessType("full");
    setTopN(5);
    setPartnershipOffer("course_access");
    setBenefitType("percentage");
    setBenefitValue(0);
    setPlan("elite");
    setAudience("college-students");
    setDurationDays(365);
    setSelectedCourses([]);
    setCourseSearch("");
    setCourseResults([]);
    setCoursePage(1);
    setHasMoreCourses(true);
    setSelectingAllCourses(false);
    setCourseDetailForPartial(null);
    setPartialModules(new Set());
    setPartialLessons({});
    setPartialContents({});
    hydratedPartialEditKeyRef.current = null;
  };

  const selectPartnershipOffer = useCallback(
    (offer: PartnershipOffer) => {
      setPartnershipOffer(offer);
      if (offer === "discount") {
        setSelectedCourses([]);
        setShowCourseDropdown(false);
        setAccessType("full");
        setPartialModules(new Set());
        setPartialLessons({});
        setPartialContents({});
        setCourseDetailForPartial(null);
      } else {
        setBenefitValue(0);
        setBenefitType("percentage");
        setCourseResults([]);
        setCoursePage(1);
        setHasMoreCourses(true);
        void loadCourses(1, courseSearch, false, {
          applyAudienceFilter: true,
        });
      }
    },
    [loadCourses, courseSearch],
  );

  const handleAudienceChange = useCallback(
    (next: CourseType["audience"]) => {
      setAudience(next);
      setSelectedCourses((prev) => prev.filter((c) => c.audience === next));
      setCourseResults([]);
      setCoursePage(1);
      setHasMoreCourses(true);
      void loadCourses(1, courseSearch, false, { applyAudienceFilter: true });
    },
    [loadCourses, courseSearch],
  );

  const handleAccessTypeSelect = useCallback((t: AccessType) => {
    setAccessType(t);
    if (t === "full") {
      setPartialModules(new Set());
      setPartialLessons({});
      setPartialContents({});
      setCourseDetailForPartial(null);
    }
  }, []);

  const togglePartialModule = useCallback(
    (moduleId: string) => {
      if (!courseDetailForPartial?.modules) return;
      const newSelected = new Set(partialModules);
      if (newSelected.has(moduleId)) {
        newSelected.delete(moduleId);
        const nextLessons = { ...partialLessons };
        delete nextLessons[moduleId];
        setPartialLessons(nextLessons);
        const nextContents = { ...partialContents };
        const module = (courseDetailForPartial.modules as CourseModule[]).find(
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
            if (lessonId) delete nextContents[lessonId];
          });
        }
        setPartialContents(nextContents);
      } else {
        newSelected.add(moduleId);
      }
      setPartialModules(newSelected);
    },
    [courseDetailForPartial, partialModules, partialLessons, partialContents],
  );

  const togglePartialLesson = useCallback(
    (moduleId: string, lessonId: string) => {
      const moduleLessons = partialLessons[moduleId] || new Set<string>();
      const newModuleLessons = new Set(moduleLessons);

      if (newModuleLessons.has(lessonId)) {
        newModuleLessons.delete(lessonId);
        const nextContents = { ...partialContents };
        delete nextContents[lessonId];
        setPartialContents(nextContents);
      } else {
        newModuleLessons.add(lessonId);
        const cd = courseDetailForPartial;
        if (cd?.modules && Array.isArray(cd.modules)) {
          const module = (cd.modules as CourseModule[]).find(
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
              setPartialContents({
                ...partialContents,
                [lessonId]: new Set(allContentIds),
              });
            }
          }
        }
      }

      setPartialLessons({
        ...partialLessons,
        [moduleId]: newModuleLessons,
      });
    },
    [courseDetailForPartial, partialLessons, partialContents],
  );

  const togglePartialContent = useCallback(
    (moduleId: string, lessonId: string, contentId: string) => {
      const moduleLessons = partialLessons[moduleId] || new Set<string>();
      const isLessonSelected = moduleLessons.has(lessonId);

      if (isLessonSelected) {
        const newModuleLessons = new Set(moduleLessons);
        newModuleLessons.delete(lessonId);
        setPartialLessons({
          ...partialLessons,
          [moduleId]: newModuleLessons,
        });

        const cd = courseDetailForPartial;
        if (cd?.modules && Array.isArray(cd.modules)) {
          const module = (cd.modules as CourseModule[]).find(
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
              const newContentIds = allContentIds.filter(
                (id) => id !== contentId,
              );
              const nextContents = { ...partialContents };
              if (newContentIds.length > 0) {
                nextContents[lessonId] = new Set(newContentIds);
              } else {
                delete nextContents[lessonId];
              }
              setPartialContents(nextContents);
            }
          }
        }
      } else {
        const lessonContents = partialContents[lessonId] || new Set<string>();
        const newLessonContents = new Set(lessonContents);
        if (newLessonContents.has(contentId)) {
          newLessonContents.delete(contentId);
        } else {
          newLessonContents.add(contentId);
        }
        const nextContents = { ...partialContents };
        if (newLessonContents.size > 0) {
          nextContents[lessonId] = newLessonContents;
        } else {
          delete nextContents[lessonId];
        }
        setPartialContents(nextContents);
      }
    },
    [courseDetailForPartial, partialLessons, partialContents],
  );

  const handleSelectAllActiveCourses = useCallback(async () => {
    if (accessType === "partial" || partnershipOffer !== "course_access") {
      return;
    }
    setSelectingAllCourses(true);
    try {
      const fetched: Course[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await getAdminCourseOptions({
          page,
          search: courseSearch.trim() || undefined,
          audience,
          isActive: true,
        });
        if (res?.courses?.length) {
          fetched.push(...(res.courses as unknown as Course[]));
        }
        totalPages = res?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);

      let newList: Course[] = [];
      setSelectedCourses((prev) => {
        const merged = new Map<string, Course>();
        prev.forEach((c) => {
          if (c._id) merged.set(String(c._id), c);
        });
        fetched.forEach((c) => {
          if (c._id) merged.set(String(c._id), c);
        });
        newList = Array.from(merged.values());
        return newList;
      });

      if (fetched.length === 0) {
        toast.info("No active courses match the current search and audience.");
      } else {
        toast.success(`${newList.length} course(s) in your selection.`);
      }
      setShowCourseDropdown(false);
    } catch {
      toast.error("Could not load all active courses.");
    } finally {
      setSelectingAllCourses(false);
    }
  }, [accessType, partnershipOffer, audience, courseSearch, getAdminCourses]);

  const toggleCourse = (course: Course) => {
    setSelectedCourses((prev) => {
      const exists = prev.some((c) => c._id === course._id);
      return exists
        ? prev.filter((c) => c._id !== course._id)
        : [...prev, course];
    });
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourses((prev) => prev.filter((c) => c._id !== courseId));
  };

  const buildPayload = (): CreateCollaborationDomainData | null => {
    if (!title.trim()) {
      toast.error("Title is required");
      return null;
    }
    if (!domain.trim()) {
      toast.error("Domain is required");
      return null;
    }

    if (partnershipOffer === "discount") {
      if (benefitValue <= 0) {
        toast.error("Discount value must be greater than 0");
        return null;
      }
      if (benefitType === "percentage" && benefitValue > 100) {
        toast.error("Percentage discount cannot exceed 100");
        return null;
      }
      return {
        title: title.trim(),
        domain: domain.trim().replace(/^@/, ""),
        isActive,
        collaborationKind: "discount",
        courses: [],
        benefit: { type: benefitType, value: benefitValue },
      };
    }

    if (selectedCourses.length === 0) {
      toast.error("At least one course must be selected");
      return null;
    }

    if (accessType === "topN" && topN < 1) {
      toast.error("Contents per lesson must be at least 1");
      return null;
    }
    if (accessType === "partial") {
      if (selectedCourses.length !== 1) {
        toast.error(
          "Partial access (modules and lessons) requires exactly one course. Use full access or top N for multiple courses.",
        );
        return null;
      }
      if (!courseDetailForPartial) {
        toast.error("Course structure could not be loaded. Try again.");
        return null;
      }
      if (
        !hasAnyPartialSelection(partialModules, partialLessons, partialContents)
      ) {
        toast.error(
          "Select at least one module, lesson, or content for partial access.",
        );
        return null;
      }
    }

    if (durationDays < 1) {
      toast.error("Duration must be at least 1 day");
      return null;
    }

    let enrollmentAccess: CollaborationEnrollmentAccess;
    if (accessType === "full") {
      enrollmentAccess = {
        mode: "full",
        plan,
        audience,
        durationDays,
      };
    } else if (accessType === "topN") {
      enrollmentAccess = {
        mode: "partial",
        topNSettings: { contentsPerLesson: topN },
        plan,
        audience,
        durationDays,
      };
    } else {
      const pa = buildPartialAccessFromSelections(
        courseDetailForPartial!,
        partialModules,
        partialLessons,
        partialContents,
      );
      if (!pa?.accessibleModules?.length) {
        toast.error(
          "Select at least one module, lesson, or content for partial access.",
        );
        return null;
      }
      enrollmentAccess = {
        mode: "partial",
        partialAccess: pa,
        plan,
        audience,
        durationDays,
      };
    }

    return {
      title: title.trim(),
      domain: domain.trim().replace(/^@/, ""),
      isActive,
      collaborationKind: "course_allot",
      courses: selectedCourses.map((c) => c._id!),
      enrollmentAccess,
      benefit: null,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;

    if (mode === "create") {
      const result = await createCollaborationDomain(payload);
      if (result) {
        toast.success("Collaboration Domain created successfully!");
        onSuccess();
        onClose();
      }
    } else {
      const result = await updateCollaborationDomain(
        editingDomain?._id!,
        payload,
      );
      if (result) {
        toast.success("Collaboration Domain updated successfully!");
        onSuccess();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "create"
              ? "Create Collaboration Domain"
              : "Edit Collaboration Domain"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div
            className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
            role="note"
          >
            <Info
              className="w-5 h-5 shrink-0 text-amber-700 mt-0.5"
              aria-hidden
            />
            <div>
              <p className="font-semibold text-amber-900 mb-1.5">
                One audience per collaboration domain
              </p>
              <ul className="list-disc pl-5 space-y-1 text-amber-900/90 leading-snug">
                <li>
                  Each entry applies to a single audience. To cover a different
                  audience (for example college students vs professionals),
                  create a separate collaboration domain.
                </li>
              </ul>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ABC Engineering College"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Domain + Active */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Domain <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
                <span className="pl-3 text-gray-500 font-medium select-none">
                  @
                </span>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.replace(/^@/, ""))}
                  placeholder="college.edu or *.mait.ac.in"
                  className="flex-1 px-2 py-2.5 outline-none bg-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Exact host (e.g. college.edu), or wildcard *.suffix — matches
                apex (suffix) and one subdomain label (e.g. cse.mait.ac.in and
                mait.ac.in for *.mait.ac.in). Nested hosts like a.b.mait.ac.in
                are not matched.
              </p>
            </div>

            <div className="w-32">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`w-full py-2.5 px-4 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                  isActive
                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          {/* Partnership offer: course access rules OR discount (mutually exclusive) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Partnership offer
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Pick one: Course allot (linked courses + access rules) or Discount
              (global checkout % / fixed off)—not both.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  partnershipOffer === "course_access"
                    ? "border-orange-500 bg-orange-50/60"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="partnershipOffer"
                  checked={partnershipOffer === "course_access"}
                  onChange={() => selectPartnershipOffer("course_access")}
                  className="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    Course allot
                  </span>
                  <span className="text-xs text-gray-500">
                    Full, partial, or top-N content for linked courses
                  </span>
                </span>
              </label>
              <label
                className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  partnershipOffer === "discount"
                    ? "border-orange-500 bg-orange-50/60"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="partnershipOffer"
                  checked={partnershipOffer === "discount"}
                  onChange={() => selectPartnershipOffer("discount")}
                  className="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    Discount
                  </span>
                  <span className="text-xs text-gray-500">
                    Global % or fixed amount at checkout (no course list)
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Plan, Audience, Duration (course-access partnerships only) */}
          {partnershipOffer === "course_access" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Plan <span className="text-red-500">*</span>
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as Plan["type"])}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                >
                  <option value="elite">Elite</option>
                  <option value="essential">Essential</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Audience <span className="text-red-500">*</span>
                </label>
                <select
                  value={audience}
                  onChange={(e) =>
                    handleAudienceChange(
                      e.target.value as CourseType["audience"],
                    )
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                >
                  <option value="college-students">College Students</option>
                  <option value="professionals">Professionals</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Access duration (days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  min={1}
                  placeholder="365"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  aria-describedby="collab-duration-hint"
                />
                <p
                  id="collab-duration-hint"
                  className="text-xs text-gray-500 mt-1.5 leading-snug"
                >
                  Sets enrollment expiry: this many days after the user is
                  enrolled, their access ends.
                </p>
              </div>
            </div>
          )}

          {/* Courses (course-access partnerships only) */}
          {partnershipOffer === "course_access" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Courses <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2 leading-snug">
                Search is filtered to{" "}
                <span className="font-medium text-gray-700">active</span>{" "}
                courses tagged for{" "}
                <span className="font-medium text-gray-700">
                  {AUDIENCE_LABEL[audience]}
                </span>
                , matching the audience above (collaboration enrollments use
                that audience).
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => void handleSelectAllActiveCourses()}
                  disabled={
                    accessType === "partial" ||
                    selectingAllCourses ||
                    partnershipOffer !== "course_access"
                  }
                  className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                >
                  {selectingAllCourses ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading…
                    </span>
                  ) : (
                    "Select all active"
                  )}
                </button>
                {accessType === "partial" && (
                  <span className="text-xs text-gray-400">
                    (Use one course for partial access)
                  </span>
                )}
              </div>

              {/* Selected courses */}
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedCourses.map((course) => (
                    <div
                      key={course._id}
                      className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="text-orange-800 font-medium max-w-[160px] truncate">
                        {course.title}
                      </span>
                      <button
                        onClick={() => removeCourse(course._id!)}
                        className="text-orange-400 hover:text-orange-700 cursor-pointer ml-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Course search */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => {
                      setCourseSearch(e.target.value);
                      setShowCourseDropdown(true);
                    }}
                    onFocus={() => setShowCourseDropdown(true)}
                    placeholder="Search and add courses..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                  {loadingCourses && courseResults.length === 0 && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>

                {showCourseDropdown && (
                  <div
                    ref={coursesScrollRef}
                    onScroll={handleCoursesScroll}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-52 overflow-y-auto"
                  >
                    {!loadingCourses && courseResults.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-center text-gray-500">
                        No courses found
                      </div>
                    ) : (
                      <>
                        {courseResults.map((course) => {
                          const selected = selectedCourses.some(
                            (c) => c._id === course._id,
                          );
                          return (
                            <button
                              key={course._id}
                              type="button"
                              onClick={() => {
                                toggleCourse(course);
                                setCourseSearch("");
                                setShowCourseDropdown(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                  selected
                                    ? "bg-orange-500 border-orange-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {selected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-gray-800 font-medium truncate">
                                {course.title}
                              </span>
                            </button>
                          );
                        })}
                        {loadingCourses && courseResults.length > 0 && (
                          <div className="py-2 text-center text-xs text-gray-400">
                            Loading more…
                          </div>
                        )}
                        {!loadingCourses &&
                          courseResults.length > 0 &&
                          !hasMoreCourses && (
                            <div className="py-2 text-center text-[10px] text-gray-400 border-t border-gray-100">
                              End of list
                            </div>
                          )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enrollment access (only when not using discount) */}
          {partnershipOffer === "course_access" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Access type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <label
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    accessType === "full"
                      ? "border-orange-500 bg-orange-50/60"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="collabAccessType"
                    checked={accessType === "full"}
                    onChange={() => handleAccessTypeSelect("full")}
                    className="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">
                      Full access
                    </span>
                    <span className="text-xs text-gray-500">
                      All modules and lessons
                    </span>
                  </span>
                </label>
                <label
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    accessType === "partial"
                      ? "border-orange-500 bg-orange-50/60"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="collabAccessType"
                    checked={accessType === "partial"}
                    onChange={() => handleAccessTypeSelect("partial")}
                    className="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">
                      Partial access
                    </span>
                    <span className="text-xs text-gray-500">
                      Choose modules, lessons, or items
                    </span>
                  </span>
                </label>
                <label
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    accessType === "topN"
                      ? "border-orange-500 bg-orange-50/60"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="collabAccessType"
                    checked={accessType === "topN"}
                    onChange={() => handleAccessTypeSelect("topN")}
                    className="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">
                      Top N contents
                    </span>
                    <span className="text-xs text-gray-500">
                      First N per lesson (by order)
                    </span>
                  </span>
                </label>
              </div>

              {accessType === "topN" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    N (contents per lesson)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={topN}
                    onChange={(e) => setTopN(parseInt(e.target.value, 10) || 1)}
                    className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Applies to each lesson in every linked course.
                  </p>
                </div>
              )}

              {accessType === "partial" && (
                <div className="mt-3 space-y-2">
                  {selectedCourses.length !== 1 ? (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Add exactly one course to set partial access. For several
                      courses, use full access or top N.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-600">
                        Select modules for full access within a module, or
                        expand to pick lessons or individual content items.
                      </p>
                      <CollaborationDomainPartialAccessPicker
                        courseDetails={courseDetailForPartial}
                        loading={loadingCourseDetail}
                        selectedModules={partialModules}
                        selectedLessons={partialLessons}
                        selectedContents={partialContents}
                        onToggleModule={togglePartialModule}
                        onToggleLesson={togglePartialLesson}
                        onToggleContent={togglePartialContent}
                      />
                      {courseDetailForPartial &&
                        !loadingCourseDetail &&
                        !hasAnyPartialSelection(
                          partialModules,
                          partialLessons,
                          partialContents,
                        ) && (
                          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            Select at least one module, lesson, or content.
                          </p>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {partnershipOffer === "discount" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Discount
              </label>
              <div className="flex gap-3">
                <div className="w-40">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Type
                  </label>
                  <select
                    value={benefitType}
                    onChange={(e) =>
                      setBenefitType(e.target.value as "percentage" | "fixed")
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Value{" "}
                    {benefitType === "percentage" ? "(0–100)" : "(₹ amount)"}
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
                    <span className="pl-3 text-gray-500 text-sm font-medium select-none">
                      {benefitType === "percentage" ? "%" : "₹"}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={benefitType === "percentage" ? 100 : undefined}
                      value={benefitValue}
                      onChange={(e) =>
                        setBenefitValue(parseFloat(e.target.value) || 0)
                      }
                      className="flex-1 px-2 py-2.5 outline-none bg-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Applies to students with this email domain at checkout for any
                course—no course list is required.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <WhiteButton onClick={onClose} disabled={isLoading}>
            Cancel
          </WhiteButton>
          <OrangeButton onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Saving..."}
              </span>
            ) : mode === "create" ? (
              "Create Domain"
            ) : (
              "Save Changes"
            )}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

export default CollaborationDomainModal;
