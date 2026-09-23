import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { CaDesk, CaReferralLeadsPage } from "@/types/ca-desk";

/** Both return null on failure; the desk page draws its own error states. */
export default function useCaDesk() {
  const getDesk = useCallback(async (): Promise<CaDesk | null> => {
    try {
      return ((await apiClient.get(ENDPOINTS.caApplications.meDesk)).data?.data ?? null) as CaDesk | null;
    } catch {
      return null;
    }
  }, []);

  const listMyLeads = useCallback(async (page: number, limit: number): Promise<CaReferralLeadsPage | null> => {
    try {
      const data = (await apiClient.get(ENDPOINTS.crm.myLeads, { params: { page, limit } })).data?.data;
      return data ? (data as CaReferralLeadsPage) : null;
    } catch {
      return null;
    }
  }, []);

  return { getDesk, listMyLeads };
}
