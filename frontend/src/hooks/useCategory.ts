import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { Category } from "@/types";
import { toast } from "react-toastify";

// ===================
// Filter Interfaces
// ===================

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  audience?: "college-students" | "professionals";
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CategoryResponse {
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SingleCategoryResponse {
  category: Category;
}

// ===================
// Category Creation/Update Interfaces
// ===================

export interface CreateCategoryData {
  name: string;
  audience: "college-students" | "professionals";
  description?: string;
  showOnHomePage?: boolean;
  showOnCourseList?: boolean;
  categoryImage?: string;
}

export interface UpdateCategoryData {
  _id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ===================
// Main Hook
// ===================

export const useCategory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await requestFn();
        return response;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error?.message || err?.message || errorMessage;
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ===================
  // Public Category Methods
  // ===================

  const getCategories = useCallback(
    async (filters: CategoryFilters = {}): Promise<CategoryResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.isActive !== undefined)
          params.append("isActive", filters.isActive.toString());
        if (filters.audience) params.append("audience", filters.audience);
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

        const response = await apiClient.get(
          `/categories?${params.toString()}`
        );
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch categories"
          );
        }
      }, "Failed to fetch categories");
    },
    [handleRequest]
  );

  const getActiveCategories = useCallback(
    async (
      filters: Omit<CategoryFilters, "isActive"> = {}
    ): Promise<CategoryResponse | null> => {
      return getCategories({ ...filters, isActive: true });
    },
    [getCategories]
  );

  const getHomePageCategories = useCallback(
    async (): Promise<Category[] | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get("/categories/homepage");
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch home page categories"
          );
        }
      }, "Failed to fetch home page categories");
    },
    [handleRequest]
  );

  const getCategoryById = useCallback(
    async (id: string): Promise<Category | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/categories/${id}`);
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch category"
          );
        }
      }, "Failed to fetch category");
    },
    [handleRequest]
  );

  // ===================
  // Admin Category Methods
  // ===================

  const getAdminCategories = useCallback(
    async (filters: CategoryFilters = {}): Promise<CategoryResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.isActive !== undefined)
          params.append("isActive", filters.isActive.toString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

        const response = await apiClient.get(
          `/categories/admin?${params.toString()}`
        );
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch admin categories"
          );
        }
      }, "Failed to fetch admin categories");
    },
    [handleRequest]
  );

  const getAdminCategoryById = useCallback(
    async (id: string): Promise<Category | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/categories/admin/${id}`);
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch admin category"
          );
        }
      }, "Failed to fetch admin category");
    },
    [handleRequest]
  );

  const createCategory = useCallback(
    async (data: CreateCategoryData): Promise<Category | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post("/categories", data);
        if (response.data.success) {
          toast.success("Category created successfully");
          return response.data.data;
        } else {
          toast.error(
            response.data.error?.message || "Failed to create category"
          );
          throw new Error(
            response.data.error?.message || "Failed to create category"
          );
        }
      }, "Failed to create category");
    },
    [handleRequest]
  );

  const updateCategory = useCallback(
    async (
      id: string,
      data: Partial<CreateCategoryData & { isActive?: boolean }>
    ): Promise<Category | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(`/categories/${id}`, data);
        if (response.data.success) {
          toast.success("Category updated successfully");
          return response.data.data;
        } else {
          toast.error(
            response.data.error?.message || "Failed to update category"
          );
          throw new Error(
            response.data.error?.message || "Failed to update category"
          );
        }
      }, "Failed to update category");
    },
    [handleRequest]
  );

  const updateCategoryStatus = useCallback(
    async (id: string, isActive: boolean): Promise<Category | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(`/categories/${id}`, { isActive });
        if (response.data.success) {
          toast.success("Category status updated successfully");
          return response.data.data;
        } else {
          toast.error(
            response.data.error?.message || "Failed to update category status"
          );
          throw new Error(
            response.data.error?.message || "Failed to update category status"
          );
        }
      }, "Failed to update category status");
    },
    [handleRequest]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<boolean | null> => {
      return handleRequest(async () => {
        const response = await apiClient.delete(`/categories/${id}`);
        if (response.data.success) {
          toast.success("Category deleted successfully");
          return response.data.success;
        } else {
          toast.error(
            response.data.error?.message || "Failed to delete category"
          );
          throw new Error(
            response.data.error?.message || "Failed to delete category"
          );
        }
      }, "Failed to delete category");
    },
    [handleRequest]
  );

  // ===================
  // Bulk Operations
  // ===================

  const bulkUpdateCategories = useCallback(
    async (
      updates: Array<{
        id: string;
        data: Partial<CreateCategoryData & { isActive?: boolean }>;
      }>
    ): Promise<{
      success: number;
      failed: number;
      results: Array<{ id: string; success: boolean; error?: string }>;
    }> => {
      setIsLoading(true);
      setError(null);

      const results: Array<{ id: string; success: boolean; error?: string }> =
        [];
      let successCount = 0;
      let failedCount = 0;

      try {
        for (const update of updates) {
          try {
            const result = await updateCategory(update.id, update.data);
            if (result) {
              results.push({ id: update.id, success: true });
              successCount++;
            } else {
              results.push({
                id: update.id,
                success: false,
                error: "Update failed",
              });
              failedCount++;
            }
          } catch (err: any) {
            results.push({
              id: update.id,
              success: false,
              error:
                err?.response?.data?.error?.message ||
                err?.message ||
                "Update failed",
            });
            failedCount++;
          }
        }

        return { success: successCount, failed: failedCount, results };
      } catch (err: any) {
        const errorMessage = err?.message || "Bulk update failed";
        setError(errorMessage);
        return { success: successCount, failed: failedCount, results };
      } finally {
        setIsLoading(false);
      }
    },
    [updateCategory]
  );

  const bulkDeleteCategories = useCallback(
    async (
      ids: string[]
    ): Promise<{
      success: number;
      failed: number;
      results: Array<{ id: string; success: boolean; error?: string }>;
    }> => {
      setIsLoading(true);
      setError(null);

      const results: Array<{ id: string; success: boolean; error?: string }> =
        [];
      let successCount = 0;
      let failedCount = 0;

      try {
        for (const id of ids) {
          try {
            const result = await deleteCategory(id);
            if (result) {
              results.push({ id, success: true });
              successCount++;
            } else {
              results.push({ id, success: false, error: "Delete failed" });
              failedCount++;
            }
          } catch (err: any) {
            results.push({
              id,
              success: false,
              error:
                err?.response?.data?.error?.message ||
                err?.message ||
                "Delete failed",
            });
            failedCount++;
          }
        }

        return { success: successCount, failed: failedCount, results };
      } catch (err: any) {
        const errorMessage = err?.message || "Bulk delete failed";
        setError(errorMessage);
        return { success: successCount, failed: failedCount, results };
      } finally {
        setIsLoading(false);
      }
    },
    [deleteCategory]
  );

  // ===================
  // Utility Methods
  // ===================

  const validateCategory = useCallback(
    (
      data: Partial<CreateCategoryData>
    ): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!data.name?.trim()) {
        errors.push("Category name is required");
      }
      if (!data.audience || !["college-students", "professionals"].includes(data.audience)) {
        errors.push("Audience is required (college-students or professionals)");
      }
      if (data.name?.trim()) {
      if (data.name.trim().length < 2) {
        errors.push("Category name must be at least 2 characters long");
      } else if (data.name.trim().length > 100) {
        errors.push("Category name must be less than 100 characters");
      }
      }

      if (data.description && data.description.length > 500) {
        errors.push("Description must be less than 500 characters");
      }

      // Check for special characters in name
      if (data.name && !/^[a-zA-Z0-9\s\-_&()]+$/.test(data.name.trim())) {
        errors.push(
          "Category name can only contain letters, numbers, spaces, hyphens, underscores, ampersands, and parentheses"
        );
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
    []
  );

  const generateCategorySlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  }, []);

  const searchCategories = useCallback(
    async (
      query: string,
      filters: Omit<CategoryFilters, "search"> = {}
    ): Promise<CategoryResponse | null> => {
      return getCategories({ ...filters, search: query });
    },
    [getCategories]
  );

  const getCategoriesByStatus = useCallback(
    async (
      isActive: boolean,
      filters: Omit<CategoryFilters, "isActive"> = {}
    ): Promise<CategoryResponse | null> => {
      return getCategories({ ...filters, isActive });
    },
    [getCategories]
  );

  // ===================
  // Statistics Methods
  // ===================

  const getCategoryStats = useCallback(async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    recent: number; // Created in last 30 days
  } | null> => {
    return handleRequest(async () => {
      const [allCategories, activeCategories, recentCategories] =
        await Promise.all([
          getAdminCategories({ limit: 1 }), // Just to get total count
          getAdminCategories({ isActive: true, limit: 1 }), // Just to get active count
          getAdminCategories({
            limit: 1,
            // Note: This would need backend support for date filtering
          }),
        ]);

      if (!allCategories || !activeCategories) {
        return null;
      }

      return {
        total: allCategories.total,
        active: activeCategories.total,
        inactive: allCategories.total - activeCategories.total,
        recent: 0, // Would need backend support for date filtering
      };
    }, "Failed to fetch category statistics");
  }, [handleRequest, getAdminCategories]);

  return {
    // State
    isLoading,
    error,
    clearError,

    // Public Category Methods
    getCategories,
    getActiveCategories,
    getHomePageCategories,
    getCategoryById,

    // Admin Category Methods
    getAdminCategories,
    getAdminCategoryById,
    createCategory,
    updateCategory,
    updateCategoryStatus,
    deleteCategory,

    // Bulk Operations
    bulkUpdateCategories,
    bulkDeleteCategories,

    // Utility Methods
    validateCategory,
    generateCategorySlug,
    searchCategories,
    getCategoriesByStatus,
    getCategoryStats,

    // Aliases for convenience
    getAllCategories: getCategories,
    getAllAdminCategories: getAdminCategories,
    createCategoryAdmin: createCategory,
    updateCategoryAdmin: updateCategory,
    deleteCategoryAdmin: deleteCategory,
  };
};
