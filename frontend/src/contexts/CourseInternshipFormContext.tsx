"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import {
  COURSE_INTERNSHIP_SCREENS,
  COURSE_INTERNSHIP_TOTAL_SCREENS,
  CourseInternshipFormData,
  getDefaultCourseInternshipFormData,
} from "@/types/courseInternshipForm";

const LIST_ROUTE = "/admin/courses/course-internships/manage";

type ContextValue = {
  currentScreen: number;
  totalScreens: number;
  nextScreen: () => Promise<void>;
  prevScreen: () => void;
  goToScreen: (screen: number) => void;
  canGoNext: boolean;
  save: () => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
  mode: "create" | "edit";
};

const CourseInternshipFormContext = createContext<ContextValue | null>(null);

export const useCourseInternshipFormContext = (): ContextValue => {
  const ctx = useContext(CourseInternshipFormContext);
  if (!ctx) {
    throw new Error(
      "useCourseInternshipFormContext must be used inside CourseInternshipFormProvider",
    );
  }
  return ctx;
};

/** Shape returned by GET /course-internships/:id — templates arrive populated. */
type ProgramResponse = {
  title?: string;
  description?: string;
  thumbnail?: string;
  offerLetterDesignation?: string;
  whatsappGroupLink?: string;
  perks?: string[];
  whatYouWillDo?: string[];
  taskTemplateIds?: Array<string | { _id?: string }>;
  documentationRequired?: boolean;
  documentationDueOffsetDays?: number;
  isActive?: boolean;
};

export const CourseInternshipFormProvider = ({
  programId,
  children,
}: {
  /** Omit to create. */
  programId?: string;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const mode: "create" | "edit" = programId ? "edit" : "create";

  const methods = useForm<CourseInternshipFormData>({
    defaultValues: getDefaultCourseInternshipFormData(),
    mode: "onChange",
  });

  const [currentScreen, setCurrentScreen] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!programId);

  const { reset, watch, trigger, getValues } = methods;
  const values = watch();

  // Load the existing programme into the form when editing.
  useEffect(() => {
    if (!programId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await apiClient.get(
          ENDPOINTS.courseInternships.byId(programId),
        );
        if (cancelled) return;
        const p = (res.data?.data ?? {}) as ProgramResponse;

        reset({
          ...getDefaultCourseInternshipFormData(),
          title: p.title ?? "",
          description: p.description ?? "",
          thumbnail: p.thumbnail ?? "",
          thumbnailSource: p.thumbnail ? "url" : "url",
          offerLetterDesignation: p.offerLetterDesignation ?? "",
          whatsappGroupLink: p.whatsappGroupLink ?? "",
          perks: Array.isArray(p.perks) ? p.perks : [],
          whatYouWillDo: Array.isArray(p.whatYouWillDo) ? p.whatYouWillDo : [],
          taskTemplateIds: Array.isArray(p.taskTemplateIds)
            ? p.taskTemplateIds.map((t) =>
                typeof t === "string" ? t : String(t?._id ?? ""),
              )
            : [],
          documentationRequired: p.documentationRequired ?? true,
          documentationDueOffsetDays: p.documentationDueOffsetDays ?? 7,
          isActive: p.isActive ?? true,
        });
      } catch {
        if (!cancelled) {
          toast.error("Failed to load program");
          router.push(LIST_ROUTE);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [programId, reset, router]);

  const canGoNext =
    COURSE_INTERNSHIP_SCREENS[currentScreen]?.validation(values) ?? true;

  const save = useCallback(async () => {
    const ok = await trigger();
    if (!ok) {
      toast.error("Fix the highlighted fields first");
      return;
    }

    // Upload bookkeeping is local to the form — the API stores only the URL.
    const values = getValues();
    const payload = {
      title: values.title,
      description: values.description,
      thumbnail: values.thumbnail,
      perks: values.perks,
      whatYouWillDo: values.whatYouWillDo,
      offerLetterDesignation: values.offerLetterDesignation,
      whatsappGroupLink: values.whatsappGroupLink,
      taskTemplateIds: values.taskTemplateIds,
      documentationRequired: values.documentationRequired,
      documentationDueOffsetDays: values.documentationDueOffsetDays,
      isActive: values.isActive,
    };

    setIsSaving(true);
    try {
      if (programId) {
        await apiClient.patch(
          ENDPOINTS.courseInternships.byId(programId),
          payload,
        );
        toast.success("Program updated");
      } else {
        await apiClient.post(ENDPOINTS.courseInternships.all, payload);
        toast.success("Program created");
      }
      router.push(LIST_ROUTE);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not save program";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }, [getValues, programId, router, trigger]);

  const nextScreen = useCallback(async () => {
    const ok = await trigger();
    if (!ok) return;
    setCurrentScreen((s) => Math.min(s + 1, COURSE_INTERNSHIP_TOTAL_SCREENS));
  }, [trigger]);

  const prevScreen = useCallback(() => {
    setCurrentScreen((s) => Math.max(1, s - 1));
  }, []);

  const goToScreen = useCallback((screen: number) => {
    setCurrentScreen(
      Math.min(Math.max(1, screen), COURSE_INTERNSHIP_TOTAL_SCREENS),
    );
  }, []);

  return (
    <CourseInternshipFormContext.Provider
      value={{
        currentScreen,
        totalScreens: COURSE_INTERNSHIP_TOTAL_SCREENS,
        nextScreen,
        prevScreen,
        goToScreen,
        canGoNext,
        save,
        isSaving,
        isLoading,
        mode,
      }}
    >
      <FormProvider {...methods}>{children}</FormProvider>
    </CourseInternshipFormContext.Provider>
  );
};
