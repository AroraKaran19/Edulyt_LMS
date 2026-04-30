import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

/**
 * Slug availability + helpers for internships (parity with {@link useSlugCheck} for courses).
 * Expects GET /api/internships/check-slug/:slug?excludeId=...
 */
export const useInternshipSlugCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string>("");

  const checkSlugAvailability = useCallback(
    async (
      slug: string,
      excludeId?: string
    ): Promise<{
      available: boolean;
      message: string;
    } | null> => {
      if (!slug || slug.trim().length === 0) {
        return {
          available: false,
          message: "Slug cannot be empty",
        };
      }

      setIsChecking(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (excludeId) {
          params.append("excludeId", excludeId);
        }

        const response = await apiClient.get(
          `${ENDPOINTS.internships.checkSlug}/${encodeURIComponent(slug)}?${params.toString()}`
        );

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to check slug availability"
          );
        }
      } catch (err: unknown) {
        const errObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
        const errorMessage =
          errObj?.response?.data?.error?.message ||
          errObj?.message ||
          "Failed to check slug availability";
        setError(errorMessage);
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  const validateSlugFormat = useCallback(
    (slug: string): { valid: boolean; message: string } => {
      if (!slug || slug.trim().length === 0) {
        return {
          valid: false,
          message: "Slug cannot be empty",
        };
      }

      const slugRegex = /^[a-zA-Z0-9-_]+$/;
      if (!slugRegex.test(slug)) {
        return {
          valid: false,
          message:
            "Slug can only contain letters, numbers, hyphens, and underscores",
        };
      }

      if (slug.length < 3) {
        return {
          valid: false,
          message: "Slug must be at least 3 characters long",
        };
      }

      if (slug.length > 50) {
        return {
          valid: false,
          message: "Slug must be less than 50 characters",
        };
      }

      return {
        valid: true,
        message: "Slug format is valid",
      };
    },
    []
  );

  const generateSlug = useCallback((title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  return {
    isChecking,
    error,
    checkSlugAvailability,
    validateSlugFormat,
    generateSlug,
    clearError: () => setError(""),
  };
};
