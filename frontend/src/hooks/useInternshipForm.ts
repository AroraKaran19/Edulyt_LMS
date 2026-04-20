import { useCallback, useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import {
  InternshipFormData,
  UseInternshipFormOptions,
  UseInternshipFormReturn,
  createDefaultInternshipBatchPlan,
  createDefaultInternshipDiscount,
  createDefaultInternshipAnalytics,
} from "@/types/internshipForm";
import { toast } from "react-toastify";
import type {
  Internship,
  InternshipBatches,
  InternshipResponse,
  InternshipBatchPlan,
} from "@/types/internship";
import type { CourseDiscount, InternshipAnalytics } from "@/types";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import {
  getInternshipScreenTriggerFields,
} from "@/lib/internshipScreenValidation";

/** Internship create/edit wizard: 14 steps total; Screen 14 is the summary. */
const INTERNSHIP_WIZARD_MAX_SCREEN = 14;

function getNextInternshipWizardScreen(prev: number): number {
  if (prev >= INTERNSHIP_WIZARD_MAX_SCREEN) return INTERNSHIP_WIZARD_MAX_SCREEN;
  return prev + 1;
}

function getPrevInternshipWizardScreen(prev: number): number {
  return Math.max(1, prev - 1);
}

// ===================
// Helper Functions
// ===================

const getInitialFormData = (
  isEditMode: boolean,
  internshipId?: string
): InternshipFormData => {
  return {
    title: "",
    slug: "",
    description: "",
    thumbnail: "",
    thumbnailSource: "upload",
    thumbnailS3Key: "",
    audience: "college-students",
    mode: "online",
    certification: true,
    featured: false,
    headerList: [],
    discount: createDefaultInternshipDiscount(),
    analytics: createDefaultInternshipAnalytics(),
    batches: isEditMode
      ? []
      : [
          {
            name: "",
            applicationLastDate: "",
            internshipStartDate: "",
            status: "active",
            isActive: true,
            plan: createDefaultInternshipBatchPlan(),
            examTemplateIds: [],
            taskTemplateIds: [],
          },
        ],
    perks: [],
    features: [],
    whyJoin: [],
    preRequisites: [],
    whoCanJoin: [],
    internshipJourney: [],
    media: [],
    brochure: "",
    brochureSource: "upload",
    brochureS3Key: "",
    testimonials: [],
    faqs: [],
    mentors: [],
    partnerColleges: [],
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    isActive: true,
    currentScreen: 1,
    completedScreens: [],
    isEditMode,
    internshipId,
  };
};

/** Normalize populated docs or raw ids from GET responses into form id strings. */
const toIdStringList = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object" && "_id" in item) {
      const id = (item as { _id?: string })._id;
      return id ?? "";
    }
    return "";
  });
};

function normalizePartnerCollegesFromStorage(
  raw: unknown,
): string[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === "string") {
    return raw as string[];
  }
  return [];
}

function normalizeInternshipAnalyticsFromApi(
  a: InternshipAnalytics | null | undefined,
): InternshipAnalytics {
  const d = createDefaultInternshipAnalytics();
  if (!a || typeof a !== "object") return d;
  return {
    totalRatings: typeof a.totalRatings === "number" ? a.totalRatings : 0,
    totalReviews: typeof a.totalReviews === "number" ? a.totalReviews : 0,
    totalEnrollments:
      typeof a.totalEnrollments === "number" ? a.totalEnrollments : 0,
    averageRating: typeof a.averageRating === "number" ? a.averageRating : 0,
  };
}

function normalizeDiscountFromApi(
  d: CourseDiscount | null | undefined,
): CourseDiscount {
  const base = createDefaultInternshipDiscount();
  if (!d || typeof d !== "object") return base;
  const start =
    typeof d.startTime === "string" && d.startTime.length >= 4
      ? d.startTime.substring(0, 5)
      : base.startTime;
  const end =
    typeof d.endTime === "string" && d.endTime.length >= 4
      ? d.endTime.substring(0, 5)
      : base.endTime;
  return {
    ...base,
    ...d,
    discount: d.discount === "fixed" ? "fixed" : "percentage",
    value:
      typeof d.value === "number" && !Number.isNaN(d.value) ? d.value : 0,
    isActive: d.isActive ?? false,
    startTime: start,
    endTime: end,
  };
}

function normalizeInternshipBatchPlanFromApi(
  plan: InternshipBatchPlan | null | undefined,
  legacyRoot?: unknown,
): InternshipBatchPlan {
  const d = createDefaultInternshipBatchPlan();
  const useLegacy = !plan && legacyRoot && typeof legacyRoot === "object";
  const raw =
    plan && typeof plan === "object" ? plan : useLegacy ? legacyRoot : null;
  if (!raw || typeof raw !== "object") return d;
  const p = raw as Record<string, unknown>;
  return {
    ...d,
    price:
      typeof p.price === "number" && !Number.isNaN(p.price as number)
        ? (p.price as number)
        : 0,
    isPopular: Boolean(p.isPopular),
    isActive: p.isActive !== false,
    discount: p.discount as InternshipBatchPlan["discount"],
  };
}

function ensureBatchPlans(
  batches: InternshipFormData["batches"],
): InternshipFormData["batches"] {
  return (batches ?? []).map((row) => ({
    ...row,
    plan: row.plan ?? createDefaultInternshipBatchPlan(),
    examTemplateIds: row.examTemplateIds ?? [],
    taskTemplateIds: row.taskTemplateIds ?? [],
  }));
}

function mapApiPartnerCollegesToFormRows(partnerColleges: unknown): string[] {
  if (!Array.isArray(partnerColleges) || partnerColleges.length === 0) return [];
  return partnerColleges.map((p) => {
    if (typeof p === "string") {
      return p;
    }
    const o = p as {
      _id?: string;
    };
    return o._id ? String(o._id) : "";
  }).filter(id => id.length > 0);
}

const transformFormDataToInternship = (
  formData: InternshipFormData,
  partnerCollegeIds: string[],
): Partial<Internship> => {
  return {
    title: formData.title,
    slug: formData.slug,
    description: formData.description,
    thumbnail: formData.thumbnail,
    audience: formData.audience,
    mode: formData.mode,
    certification: formData.certification,
    featured: formData.featured,
    headerList: formData.headerList
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0),
    discount: formData.discount,
    analytics: formData.analytics,
    batches: formData.batches.map((b) => ({
      name: b.name.trim(),
      applicationLastDate: new Date(b.applicationLastDate),
      internshipStartDate: new Date(b.internshipStartDate),
      status: b.status,
      isActive: b.isActive,
      plan: b.plan,
      ...(b._id ? { _id: b._id } : {}),
      ...(Array.isArray(b.reviews) && b.reviews.length > 0
        ? { reviews: b.reviews }
        : {}),
      ...(b.analytics ? { analytics: b.analytics } : {}),
      examTemplateIds: Array.isArray(b.examTemplateIds)
        ? b.examTemplateIds
        : [],
      taskTemplateIds: Array.isArray(b.taskTemplateIds)
        ? b.taskTemplateIds
        : [],
    })),
    perks: formData.perks,
    features: formData.features,
    whyJoin: formData.whyJoin,
    preRequisites: formData.preRequisites,
    whoCanJoin: formData.whoCanJoin,
    internshipJourney: formData.internshipJourney,
    media: formData.media.map((m) => ({
      icon: m.icon,
      content: m.content,
      title: m.title,
    })),
    brochure: formData.brochure,
    testimonials: formData.testimonials,
    faqs: formData.faqs,
    mentors: formData.mentors,
    partnerColleges: partnerCollegeIds,
    metaTitle: formData.metaTitle,
    metaDescription: formData.metaDescription,
    keywords: formData.keywords,
    isActive: formData.isActive,
  };
};

const transformInternshipToFormData = (
  internship: Internship | InternshipResponse,
  isEditMode: boolean
): InternshipFormData => {
  const legacyRootPlan = (internship as unknown as Record<string, unknown>)[
    "plan"
  ];
  return {
    title: internship.title || "",
    slug: internship.slug || "",
    description: internship.description || "",
    thumbnail: internship.thumbnail || "",
    thumbnailSource: "url",
    thumbnailS3Key: "",
    audience: internship.audience || "college-students",
    mode: internship.mode || "online",
    certification: internship.certification ?? true,
    featured: internship.featured ?? false,
    headerList: Array.isArray(internship.headerList)
      ? [...internship.headerList]
      : [],
    discount: normalizeDiscountFromApi(internship.discount ?? undefined),
    analytics: normalizeInternshipAnalyticsFromApi(internship.analytics),
    batches: ensureBatchPlans(
      (internship.batches || []).map((b: InternshipBatches, index: number) => ({
        _id: b._id ? String(b._id) : undefined,
        name: b.name ?? "",
        applicationLastDate: b.applicationLastDate
          ? new Date(b.applicationLastDate).toISOString().split("T")[0]
          : "",
        internshipStartDate: b.internshipStartDate
          ? new Date(b.internshipStartDate).toISOString().split("T")[0]
          : "",
        status: b.status,
        isActive: b.isActive,
        reviews: b.reviews?.map((id) => String(id)),
        analytics: b.analytics
          ? normalizeInternshipAnalyticsFromApi(b.analytics)
          : undefined,
        plan: normalizeInternshipBatchPlanFromApi(
          b.plan ?? undefined,
          index === 0 ? legacyRootPlan : undefined,
        ),
        examTemplateIds: Array.isArray(b.examTemplateIds)
          ? b.examTemplateIds.map((id) => String(id))
          : [],
        taskTemplateIds: Array.isArray(b.taskTemplateIds)
          ? b.taskTemplateIds.map((id) => String(id))
          : [],
      })),
    ),
    perks: internship.perks || [],
    features: internship.features || [],
    whyJoin: internship.whyJoin || [],
    preRequisites: internship.preRequisites || [],
    whoCanJoin: internship.whoCanJoin || [],
    internshipJourney: internship.internshipJourney || [],
    media: (internship.media || []).map((m) => ({
      icon: m.icon,
      content: m.content,
      title: m.title,
      contentSource: "url" as const,
      contentS3Key: "",
    })),
    brochure: internship.brochure || "",
    brochureSource: "url",
    brochureS3Key: "",
    testimonials: toIdStringList(internship.testimonials),
    faqs: toIdStringList(internship.faqs),
    mentors: toIdStringList(internship.mentors),
    partnerColleges: mapApiPartnerCollegesToFormRows(internship.partnerColleges),
    metaTitle: internship.metaTitle || "",
    metaDescription: internship.metaDescription || "",
    keywords: internship.keywords || [],
    isActive: internship.isActive ?? true,
    currentScreen: 1,
    completedScreens: [],
    isEditMode,
    internshipId: internship._id,
  };
};

// Storage helpers
const saveFormDataToStorage = (
  formData: InternshipFormData,
  mode: string,
  internshipId?: string
) => {
  const key =
    mode === "edit" && internshipId
      ? `internship_form_data_${internshipId}`
      : "internship_form_data";
  localStorage.setItem(key, JSON.stringify(formData));
};

const loadFormDataFromStorage = (
  mode: string,
  internshipId?: string
): InternshipFormData | null => {
  const key =
    mode === "edit" && internshipId
      ? `internship_form_data_${internshipId}`
      : "internship_form_data";
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const saveDraftToStorage = (
  formData: InternshipFormData,
  mode: string,
  internshipId?: string
) => {
  const key =
    mode === "edit" && internshipId
      ? `internship_form_draft_${internshipId}`
      : "internship_form_draft";
  localStorage.setItem(key, JSON.stringify(formData));
};

const loadDraftFromStorage = (
  mode: string,
  internshipId?: string
): InternshipFormData | null => {
  const key =
    mode === "edit" && internshipId
      ? `internship_form_draft_${internshipId}`
      : "internship_form_draft";
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const clearFormDataFromStorage = (mode: string, internshipId?: string) => {
  const key =
    mode === "edit" && internshipId
      ? `internship_form_data_${internshipId}`
      : "internship_form_data";
  const draftKey =
    mode === "edit" && internshipId
      ? `internship_form_draft_${internshipId}`
      : "internship_form_draft";
  localStorage.removeItem(key);
  localStorage.removeItem(draftKey);
};

const cleanupStorageForInternship = (internshipId: string) => {
  localStorage.removeItem(`internship_form_data_${internshipId}`);
  localStorage.removeItem(`internship_form_draft_${internshipId}`);
};

// ===================
// Main Internship Form Hook
// ===================

export const useInternshipForm = (
  options: UseInternshipFormOptions = {}
): UseInternshipFormReturn => {
  const {
    mode = "create",
    internshipId,
    initialData,
    autoSave = true,
    autoSaveInterval = 30000,
  } = options;

  // ===================
  // State Management
  // ===================

  const [currentScreen, setCurrentScreen] = useState(1);
  const [isEditMode] = useState(mode === "edit");
  const [currentInternshipId, setCurrentInternshipId] = useState<
    string | undefined
  >(internshipId);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInternshipDataLoading, setIsInternshipDataLoading] = useState(
    mode === "edit" && !!internshipId
  );
  const [createError, setCreateError] = useState<string>("");
  const [updateError, setUpdateError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  // API methods
  const createInternshipMetadata = useCallback(
    async (internshipData: Partial<Internship>): Promise<any> => {
      const response = await apiClient.post(
        ENDPOINTS.internships.metadata,
        internshipData
      );
      return response.data;
    },
    []
  );

  const updateInternshipMetadata = useCallback(
    async (
      internshipId: string,
      internshipData: Partial<Internship>
    ): Promise<any> => {
      const response = await apiClient.put(
        `${ENDPOINTS.internships.base}/${internshipId}/metadata`,
        internshipData
      );
      return response.data;
    },
    []
  );

  const getInternshipByIdAdmin = useCallback(
    async (internshipId: string): Promise<any> => {
      const response = await apiClient.get(
        `${ENDPOINTS.internships.admin.byId}/${internshipId}`
      );
      return response.data;
    },
    []
  );

  // ===================
  // Form Initialization
  // ===================

  const getInitialData = useCallback((): InternshipFormData => {
    const blank = getInitialFormData(isEditMode, currentInternshipId);

    if (initialData) {
      const merged = { ...blank, ...initialData };
      return {
        ...merged,
        batches: ensureBatchPlans(merged.batches ?? []),
        headerList: Array.isArray(merged.headerList) ? merged.headerList : [],
        discount: normalizeDiscountFromApi(merged.discount ?? undefined),
        analytics: normalizeInternshipAnalyticsFromApi(merged.analytics),
        partnerColleges: normalizePartnerCollegesFromStorage(
          merged.partnerColleges,
        ),
      };
    }

    const draftData = loadDraftFromStorage(mode, internshipId);
    if (draftData) {
      return {
        ...draftData,
        isEditMode,
        internshipId: currentInternshipId,
        batches: ensureBatchPlans(draftData.batches ?? []),
        headerList: Array.isArray(draftData.headerList)
          ? draftData.headerList
          : [],
        discount: normalizeDiscountFromApi(draftData.discount ?? undefined),
        analytics: normalizeInternshipAnalyticsFromApi(draftData.analytics),
        partnerColleges: normalizePartnerCollegesFromStorage(
          draftData.partnerColleges,
        ),
      };
    }

    const storedData = loadFormDataFromStorage(mode, internshipId);
    if (storedData) {
      return {
        ...storedData,
        isEditMode,
        internshipId: currentInternshipId,
        batches: ensureBatchPlans(storedData.batches ?? []),
        headerList: Array.isArray(storedData.headerList)
          ? storedData.headerList
          : [],
        discount: normalizeDiscountFromApi(storedData.discount ?? undefined),
        analytics: normalizeInternshipAnalyticsFromApi(storedData.analytics),
        partnerColleges: normalizePartnerCollegesFromStorage(
          storedData.partnerColleges,
        ),
      };
    }

    if (isEditMode && internshipId) {
      return getInitialFormData(isEditMode, internshipId);
    }

    return getInitialFormData(isEditMode, internshipId);
  }, [initialData, isEditMode, internshipId, mode]);

  const formMethods: UseFormReturn<InternshipFormData> =
    useForm<InternshipFormData>({
      defaultValues: getInitialData(),
      mode: "onChange",
      reValidateMode: "onChange",
    });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState,
    reset,
    trigger,
  } = formMethods;

  const generateSlugFromTitle = useCallback((title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }, []);

  const validateCurrentScreen = useCallback(async (): Promise<boolean> => {
    if (currentScreen === 1) {
      const title = getValues("title")?.trim();
      const slug = getValues("slug")?.trim();
      if (!slug && title) {
        setValue("slug", generateSlugFromTitle(title), {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
    }

    const names = getInternshipScreenTriggerFields(currentScreen, {
      batches: getValues("batches"),
      discount: getValues("discount"),
      headerList: getValues("headerList"),
    });
    if (names.length === 0) return true;

    return trigger(names as Parameters<typeof trigger>[0], {
      shouldFocus: true,
    });
  }, [currentScreen, generateSlugFromTitle, getValues, setValue, trigger]);

  const nextScreen = useCallback(async () => {
    const ok = await validateCurrentScreen();
    if (!ok) {
      toast.error("Please fix the errors before continuing.");
      return;
    }
    setCurrentScreen((prev) => getNextInternshipWizardScreen(prev));
  }, [validateCurrentScreen]);

  useEffect(() => {
    const initialData = getInitialData();
    reset(initialData);
  }, [reset, mode, internshipId, isEditMode]);

  // ===================
  // Data Loading
  // ===================

  const loadInternshipData = useCallback(async () => {
    if (!isEditMode || !currentInternshipId) {
      setIsInternshipDataLoading(false);
      return;
    }

    try {
      setIsInternshipDataLoading(true);
      setIsSaving(true);
      const response = await getInternshipByIdAdmin(currentInternshipId);

      if (response.success && response.data) {
        const apiFormData = transformInternshipToFormData(response.data, true);

        const draftData = loadDraftFromStorage(mode, internshipId);
        const storedData = loadFormDataFromStorage(mode, internshipId);
        const localData = draftData || storedData;

        if (localData) {
          const rawScreen =
            localData.currentScreen ?? apiFormData.currentScreen ?? 1;
          /** Older two-step tail used 15 for summary, 14 for optional tasks. */
          let normalizedScreen = rawScreen;
          if (normalizedScreen === 15) normalizedScreen = 14;
          else if (normalizedScreen > 14) normalizedScreen = 14;
          const mergedData = {
            ...localData,
            ...apiFormData,
            currentScreen: normalizedScreen,
            completedScreens:
              localData.completedScreens || apiFormData.completedScreens,
            isEditMode: true,
            internshipId: currentInternshipId,
          };
          reset(mergedData);
        } else {
          reset(apiFormData);
        }
      }
    } catch (error) {
      console.error("Failed to load internship data:", error);
      setUpdateError("Failed to load internship data");
    } finally {
      setIsInternshipDataLoading(false);
      setIsSaving(false);
    }
  }, [isEditMode, currentInternshipId, getInternshipByIdAdmin, reset, mode]);

  useEffect(() => {
    if (isEditMode && currentInternshipId) {
      loadInternshipData();
    }
  }, [isEditMode, currentInternshipId, loadInternshipData]);

  // ===================
  // Auto-save functionality
  // ===================

  useEffect(() => {
    if (!autoSave) return;

    const timeoutId = setTimeout(() => {
      const formData = getValues();
      saveDraftToStorage(formData, mode, internshipId);
      saveFormDataToStorage(formData, mode, internshipId);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch(), autoSave, mode, internshipId]);

  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(() => {
      const formData = getValues();
      saveDraftToStorage(formData, mode, internshipId);
      saveFormDataToStorage(formData, mode, internshipId);
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, getValues, mode, internshipId]);

  // ===================
  // Navigation Functions
  // ===================

  const prevScreen = useCallback(() => {
    setCurrentScreen((prev) => getPrevInternshipWizardScreen(prev));
  }, []);

  const goToScreen = useCallback(
    (screen: number) => {
      if (screen >= 1 && screen <= 11) {
        setCurrentScreen(screen);
        setValue("currentScreen", screen);
      } else {
        console.warn(
          `Invalid screen number: ${screen}. Must be between 1 and 11.`
        );
      }
    },
    [setValue]
  );

  // ===================
  // Internship Actions
  // ===================

  const createInternship = useCallback(async (): Promise<void> => {
    try {
      setIsCreating(true);
      setCreateError("");

      const formData = getValues();
      const partnerCollegeIds = formData.partnerColleges ?? [];
      const internshipData = transformFormDataToInternship(
        formData,
        partnerCollegeIds,
      );

      const response = await createInternshipMetadata(internshipData);

      if (!response.success) {
        const errorMessage = response.error || "Failed to create internship";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const responseData = response.data as any;
      let newInternshipId: string | null = null;

      if (responseData?._id) {
        newInternshipId = responseData._id;
        setCurrentInternshipId(responseData._id);
      } else if (responseData?.internshipId) {
        newInternshipId = responseData.internshipId;
        setCurrentInternshipId(responseData.internshipId);
      } else if (responseData?.internship?._id) {
        newInternshipId = responseData.internship._id;
        setCurrentInternshipId(responseData.internship._id);
      }

      if (newInternshipId) {
        setValue("internshipId", newInternshipId, { shouldDirty: true });
        localStorage.setItem("createdInternshipId", newInternshipId);
        localStorage.setItem(
          "internshipCreationTimestamp",
          Date.now().toString()
        );
      } else {
        console.error("No internship ID found in response:", responseData);
      }

      toast.success(
        "Internship Successfully Created!\n\nYour internship has been created and is now ready for students to enroll."
      );

      nextScreen();
      clearFormDataFromStorage(mode, currentInternshipId);
    } catch (error) {
      console.error("Failed to create internship:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create internship";
      setCreateError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [getValues, setValue, createInternshipMetadata]);

  const updateInternshipHandler = useCallback(async (): Promise<void> => {
    if (!isEditMode || !internshipId) {
      throw new Error(
        "Cannot update internship: not in edit mode or missing internship ID"
      );
    }

    try {
      setIsUpdating(true);
      setUpdateError("");

      const formData = getValues();
      const partnerCollegeIds = formData.partnerColleges ?? [];
      const internshipData = transformFormDataToInternship(
        formData,
        partnerCollegeIds,
      );

      const response = await updateInternshipMetadata(
        internshipId,
        internshipData
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to update internship");
      }

      toast.success("Internship updated successfully!");
    } catch (error) {
      console.error("Failed to update internship:", error);
      setUpdateError(
        error instanceof Error ? error.message : "Failed to update internship"
      );
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [isEditMode, internshipId, getValues, setValue, updateInternshipMetadata]);

  const updateInternshipMetadataHandler = useCallback(async (): Promise<void> => {
    let targetInternshipId = internshipId;

    if (!isEditMode) {
      const createdInternshipId = localStorage.getItem("createdInternshipId");
      if (!createdInternshipId) {
        throw new Error(
          "Cannot update internship metadata: internship not found. Please create the internship first."
        );
      }
      targetInternshipId = createdInternshipId;
    } else if (!internshipId) {
      throw new Error(
        "Cannot update internship metadata: missing internship ID"
      );
    }

    try {
      setIsUpdating(true);
      setUpdateError("");

      const formData = getValues();
      const partnerCollegeIds = formData.partnerColleges ?? [];
      const internshipData = transformFormDataToInternship(
        formData,
        partnerCollegeIds,
      );

      const response = await updateInternshipMetadata(
        targetInternshipId!,
        internshipData
      );

      if (!response.success) {
        const errorMessage =
          response.error || "Failed to update internship metadata";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(
        "Internship Successfully Updated!\n\nYour internship metadata has been updated!"
      );

      nextScreen();
    } catch (error) {
      console.error("Failed to update internship metadata:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update internship metadata";
      setUpdateError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [
    isEditMode,
    internshipId,
    getValues,
    setValue,
    updateInternshipMetadata,
    nextScreen,
  ]);

  // ===================
  // Computed Values
  // ===================

  const canGoNext = currentScreen <= INTERNSHIP_WIZARD_MAX_SCREEN;

  // ===================
  // Internship Creation Status
  // ===================

  const isInternshipCreated = useCallback((): boolean => {
    if (typeof window === "undefined") return false;

    const createdInternshipId = localStorage.getItem("createdInternshipId");
    const creationTimestamp = localStorage.getItem(
      "internshipCreationTimestamp"
    );

    if (!createdInternshipId || !creationTimestamp) return false;

    const timestamp = parseInt(creationTimestamp);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const isRecent = now - timestamp < twentyFourHours;

    return isRecent;
  }, []);

  const getCreatedInternshipId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("createdInternshipId");
  }, []);

  const clearInternshipCreationStatus = useCallback((): void => {
    if (typeof window === "undefined") return;

    const createdInternshipId = localStorage.getItem("createdInternshipId");

    localStorage.removeItem("createdInternshipId");
    localStorage.removeItem("internshipCreationTimestamp");

    localStorage.removeItem("internship_form_data");
    localStorage.removeItem("internship_form_draft");

    if (createdInternshipId) {
      cleanupStorageForInternship(createdInternshipId);
    }
  }, []);

  // ===================
  // Return Hook Interface
  // ===================

  return {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState,
    reset,
    trigger,

    currentScreen,
    completedScreens: [],
    isEditMode,
    internshipId: currentInternshipId,

    nextScreen,
    prevScreen,
    goToScreen,
    canGoNext,
    canGoPrev: currentScreen > 1,

    isScreenCompleted: () => true,
    validateCurrentScreen,
    getScreenErrors: () => [],

    createInternship,
    updateInternship: updateInternshipHandler,
    updateInternshipMetadata: updateInternshipMetadataHandler,
    deleteInternship: () => Promise.resolve(),
    saveDraft: () => {},
    loadDraft: () => {},
    clearDraft: () => {},

    isCreating,
    isUpdating,
    isDeleting: false,
    isSaving,
    isInternshipDataLoading,

    createError,
    updateError,
    deleteError: "",
    validationErrors,

    generateSlug: (title: string) => title.toLowerCase().replace(/\s+/g, "-"),
    generateMetaTitle: (title: string, audience: string) =>
      `${title} | ${audience === "college-students" ? "College Students" : "Professionals"}`,
    generateMetaDescription: (description: string) =>
      description.substring(0, 160),
    generateKeywords: (title: string, audience: string) => [
      title,
      audience,
      "internship",
    ],

    isInternshipCreated,
    getCreatedInternshipId,
    clearInternshipCreationStatus,
  };
};
