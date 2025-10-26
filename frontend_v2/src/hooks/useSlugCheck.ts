import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";

export interface SlugCheckResponse {
  success: boolean;
  message: string;
  data: {
    available: boolean;
    message: string;
  };
}

export const useSlugCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string>("");

  /**
   * Check if a slug is available for use
   * @param slug - The slug to check
   * @param excludeId - Optional course ID to exclude from check (for updates)
   * @returns Promise with availability status
   */
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
          `/courses/check-slug/${encodeURIComponent(slug)}?${params.toString()}`
        );

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to check slug availability"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to check slug availability";
        setError(errorMessage);
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  /**
   * Validate slug format (client-side validation)
   * @param slug - The slug to validate
   * @returns Validation result
   */
  const validateSlugFormat = useCallback(
    (slug: string): { valid: boolean; message: string } => {
      if (!slug || slug.trim().length === 0) {
        return {
          valid: false,
          message: "Slug cannot be empty",
        };
      }

      // Check slug format (alphanumeric, hyphens, underscores only)
      const slugRegex = /^[a-zA-Z0-9-_]+$/;
      if (!slugRegex.test(slug)) {
        return {
          valid: false,
          message:
            "Slug can only contain letters, numbers, hyphens, and underscores",
        };
      }

      // Check slug length
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

  /**
   * Generate a slug from a title
   * @param title - The title to convert to slug
   * @returns Generated slug
   */
  const generateSlug = useCallback((title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  }, []);

  return {
    // State
    isChecking,
    error,

    // Methods
    checkSlugAvailability,
    validateSlugFormat,
    generateSlug,

    // Reset error
    clearError: () => setError(""),
  };
};
