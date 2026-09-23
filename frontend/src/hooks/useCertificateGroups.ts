import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { CertificateGroup } from "@/types/certificateGroup";

/** Pulls the most specific message the API returned. */
function errorMessage(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { error?: { message?: string }; message?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error?.message ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
}

const useCertificateGroups = () => {
  const [groups, setGroups] = useState<CertificateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchCertificateGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(ENDPOINTS.certificates.byProgram);
      const data = response.data.data;
      setGroups(data?.groups ?? []);
    } catch (err: unknown) {
      const errorMsg = errorMessage(err, "Failed to fetch certificates");
      setError(errorMsg);
      console.error("Certificate groups fetch error:", err);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, []);

  return {
    groups,
    isLoading,
    error,
    hasFetched,
    fetchCertificateGroups,
  };
};

export default useCertificateGroups;
