import { useState, useCallback } from "react";

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryResponse {
  success: boolean;
  data?: Category | Category[];
  message?: string;
  error?: string;
}

export interface CategoryListResponse {
  success: boolean;
  data?: {
    categories: Category[];
    total: number;
    page: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

export const useCategory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Get all categories with pagination and filtering
  const getAllCategories = useCallback(
    async (
      page: number = 1,
      limit: number = 50,
      search: string = "",
      isActive?: boolean
    ): Promise<CategoryListResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
        });

        if (isActive !== undefined) {
          params.append("isActive", isActive.toString());
        }

        const response = await fetch(`${baseUrl}/categories?${params}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch categories";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch categories",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Get active categories only (for dropdowns)
  const getActiveCategories = useCallback(
    async (): Promise<CategoryResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/categories/active`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch active categories";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch active categories",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Create a new category
  const createCategory = useCallback(
    async (categoryData: {
      name: string;
      description?: string;
    }): Promise<CategoryResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create category";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to create category",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Update a category
  const updateCategory = useCallback(
    async (
      categoryId: string,
      updateData: {
        name?: string;
        description?: string;
        isActive?: boolean;
      }
    ): Promise<CategoryResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/categories/${categoryId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update category";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to update category",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Delete a category
  const deleteCategory = useCallback(
    async (categoryId: string): Promise<CategoryResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/categories/${categoryId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete category";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to delete category",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Get category by ID
  const getCategoryById = useCallback(
    async (categoryId: string): Promise<CategoryResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/categories/${categoryId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch category";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch category",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    isLoading,
    error,
    clearError,
    getAllCategories,
    getActiveCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };
};
