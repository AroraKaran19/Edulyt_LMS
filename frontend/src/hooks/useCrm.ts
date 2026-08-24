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
      const err = e as { response?: { data?: { message?: string } } };
      return {
        ok: false as const,
        message: err?.response?.data?.message ?? "Could not add that student",
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

  const saveQuestion = useCallback(
    async (question: Partial<CrmExtraQuestion> & { enabled: boolean }) => {
      setIsLoading(true);
      try {
        const res = await apiClient.patch("/crm/me/question", question);
        return { ok: true as const, question: res.data?.data?.question ?? null };
      } catch (e) {
        const err = e as { response?: { data?: { message?: string } } };
        return {
          ok: false as const,
          message: err?.response?.data?.message ?? "Could not save the question",
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
    async (page = 1, limit = 20, status?: string) => {
      try {
        const res = await apiClient.get("/leads/mine", {
          params: { page, limit, status: status || undefined },
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
    fetchAssignees,
    listMyAssignedLeads,
  };
};

export default useCrm;
