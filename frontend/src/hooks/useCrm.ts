import { useCallback, useState } from "react";
import apiClient from "@/configs/apiConfig";

export type AmbassadorKind = "marketing" | "sales";

export type CrmRole =
  | "marketer"
  | "sales"
  | "marketing-intern"
  | "sales-intern"
  | "ambassador";

export const AMBASSADOR_KIND_LABELS: Record<AmbassadorKind, string> = {
  marketing: "Marketing intern",
  sales: "Sales intern",
};

/** Dashboard tab label for each intern kind. */
export const AMBASSADOR_KIND_TAB_LABELS: Record<AmbassadorKind, string> = {
  marketing: "Marketing Intern",
  sales: "Sales Intern",
};

export interface CrmProfile {
  code: string;
  role: CrmRole;
  canOwnAmbassadors: boolean;
  /** Whether this owner lets their ambassadors add questions. Staff only. */
  allowAmbassadorQuestions?: boolean;
  /** The caller's own questions, so an editor can seed itself. */
  questions?: CrmExtraQuestion[];
  /** False for an ambassador whose owner has not allowed it. */
  canSetQuestions?: boolean;
  /** Hides plan prices on this member's own link. Staff only. */
  hidePlanPrices?: boolean;
  /** Hides plan prices on this owner's ambassadors' links. Staff only. */
  hideAmbassadorPlanPrices?: boolean;
  /** Campaign advertised on this member's own link, or null. Staff only. */
  scholarshipTestId?: string | null;
  /** Campaign advertised on this owner's ambassadors' links. Staff only. */
  ambassadorScholarshipTestId?: string | null;
}

export interface CrmExtraQuestion {
  enabled: boolean;
  key: string;
  label: string;
  type: "text" | "select";
  options: string[];
  required: boolean;
}

export interface Ambassador {
  userId: string;
  name: string;
  email: string;
  code: string | null;
  kind: AmbassadorKind | null;
  active: boolean;
}

export interface Assignee {
  userId: string;
  name: string;
  email: string;
}

export interface CrmStats {
  generated: number;
  teamGenerated: number;
  assigned: number;
  converted: number;
}

export interface DateRange {
  from?: string;
  to?: string;
}

const useCrm = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getProfile = useCallback(async (): Promise<CrmProfile | null> => {
    try {
      const res = await apiClient.get("/crm/me");
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }, []);

  const getStats = useCallback(
    async (range: DateRange = {}): Promise<CrmStats | null> => {
      try {
        const res = await apiClient.get("/crm/me/stats", { params: range });
        return res.data?.data ?? null;
      } catch {
        return null;
      }
    },
    [],
  );

  const listAmbassadors = useCallback(
    async (
      page = 1,
      limit = 20,
    ): Promise<{
      ambassadors: Ambassador[];
      total: number;
      totalPages: number;
    }> => {
      const empty = { ambassadors: [], total: 0, totalPages: 1 };
      try {
        const res = await apiClient.get("/crm/me/ambassadors", {
          params: { page, limit },
        });
        const data = res.data?.data;
        return {
          ambassadors: data?.ambassadors ?? [],
          total: data?.total ?? 0,
          totalPages: data?.totalPages ?? 1,
        };
      } catch {
        return empty;
      }
    },
    [],
  );

  const addAmbassador = useCallback(
    async (email: string, kind: AmbassadorKind) => {
    setIsLoading(true);
    try {
      await apiClient.post("/crm/me/ambassadors", { email, kind });
      return { ok: true as const };
    } catch (e) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      return {
        ok: false as const,
        message: err?.response?.data?.error?.message ?? "Could not add that student",
      };
    } finally {
      setIsLoading(false);
    }
    },
    [],
  );

  const removeAmbassador = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/crm/me/ambassadors/${userId}`);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Ambassadors have no say here: their link follows whoever owns them, which
   * the public resolve endpoint reads from the parent at request time.
   */
  const saveLinkSettings = useCallback(
    async (settings: {
      hidePlanPrices: boolean;
      hideAmbassadorPlanPrices: boolean;
      allowAmbassadorQuestions: boolean;
      scholarshipTestId: string | null;
      ambassadorScholarshipTestId: string | null;
    }) => {
      setIsLoading(true);
      try {
        const res = await apiClient.patch("/crm/me/link-settings", settings);
        return {
          ok: true as const,
          hidePlanPrices: Boolean(res.data?.data?.hidePlanPrices),
          hideAmbassadorPlanPrices: Boolean(
            res.data?.data?.hideAmbassadorPlanPrices,
          ),
          allowAmbassadorQuestions: Boolean(
            res.data?.data?.allowAmbassadorQuestions,
          ),
          scholarshipTestId: (res.data?.data?.scholarshipTestId ??
            null) as string | null,
          ambassadorScholarshipTestId: (res.data?.data
            ?.ambassadorScholarshipTestId ?? null) as string | null,
        };
      } catch (e) {
        const err = e as { response?: { data?: { error?: { message?: string } } } };
        return {
          ok: false as const,
          message:
            err?.response?.data?.error?.message ?? "Could not save the link settings",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const saveQuestion = useCallback(
    async (questions: Omit<CrmExtraQuestion, "key" | "enabled">[]) => {
      setIsLoading(true);
      try {
        const res = await apiClient.patch("/crm/me/questions", { questions });
        return {
          ok: true as const,
          questions: (res.data?.data?.questions ?? []) as CrmExtraQuestion[],
        };
      } catch (e) {
        const err = e as { response?: { data?: { error?: { message?: string } } } };
        return {
          ok: false as const,
          message: err?.response?.data?.error?.message ?? "Could not save the questions",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Paged sales-user lookup for the assignee pickers, in the shape
   * `InfiniteScrollSelect` expects. Items are pre-normalised so a caller can
   * prepend its own pseudo-rows (Unassign, Any assignee) to page 1.
   */
  const fetchAssignees = useCallback(
    async (page: number, search: string) => {
      try {
        const res = await apiClient.get("/leads/admin/assignees", {
          params: { page, limit: 20, search: search || undefined },
        });
        const data = res.data?.data;
        return {
          items: (data?.assignees ?? []).map((a: Assignee) => ({
            value: a.userId,
            label: a.name,
          })),
          totalPages: data?.totalPages ?? 1,
        };
      } catch {
        return { items: [], totalPages: 1 };
      }
    },
    [],
  );

  const listMyAssignedLeads = useCallback(
    async (page = 1, limit = 20, status?: string, subStatus?: string) => {
      try {
        const res = await apiClient.get("/leads/mine", {
          params: {
            page,
            limit,
            status: status || undefined,
            subStatus: subStatus || undefined,
          },
        });
        return res.data?.data ?? { leads: [], total: 0, totalPages: 1 };
      } catch {
        return { leads: [], total: 0, totalPages: 1 };
      }
    },
    [],
  );

  return {
    isLoading,
    getProfile,
    getStats,
    listAmbassadors,
    addAmbassador,
    removeAmbassador,
    saveQuestion,
    saveLinkSettings,
    fetchAssignees,
    listMyAssignedLeads,
  };
};

export default useCrm;
