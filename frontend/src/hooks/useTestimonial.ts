import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { toast } from "react-toastify";

// Types for testimonial responses
export interface Testimonial {
  _id?: string;
  name: string;
  currentRole: string;
  currentCompany: string;
  linkedin: string;
  pastRole: string;
  pastCompany: string;
  college: string;
  collegeUrl?: string;
  collegeProfileUrl?: string;
  companyUrl?: string;
  companyProfileUrl?: string;
  verified?: boolean;
  profileImage?: string;
  category?: "college-students" | "professionals" | "internships";
  feedback?: string;
  heading2?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestimonialResponse {
  success: boolean;
  message: string;
  data?:
    | Testimonial
    | Testimonial[]
    | {
        testimonials: Testimonial[];
        total: number;
        page: number;
        totalPages: number;
      };
  error?: string;
}

export interface TestimonialListResponse {
  testimonials: Testimonial[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TestimonialFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateTestimonialData {
  name: string;
  currentRole: string;
  currentCompany: string;
  linkedin: string;
  pastRole: string;
  pastCompany: string;
  college: string;
  collegeUrl?: string;
  collegeProfileUrl?: string;
  companyUrl?: string;
  companyProfileUrl?: string;
  verified?: boolean;
  profileImage?: string;
  category?: "college-students" | "professionals" | "internships";
  feedback?: string;
  heading2?: string;
}

export interface UpdateTestimonialData {
  name?: string;
  currentRole?: string;
  currentCompany?: string;
  linkedin?: string;
  pastRole?: string;
  pastCompany?: string;
  college?: string;
  collegeUrl?: string;
  collegeProfileUrl?: string;
  companyUrl?: string;
  companyProfileUrl?: string;
  verified?: boolean;
  profileImage?: string;
  category?: "college-students" | "professionals" | "internships";
  feedback?: string;
  heading2?: string;
}

export const useTestimonial = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Get all testimonials with pagination and search
  const getTestimonials = useCallback(
    async (
      filters: TestimonialFilters = {}
    ): Promise<TestimonialListResponse | null> => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);

        const response = await apiClient.get(
          `/testimonials?${params.toString()}`
        );

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch testimonials"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to fetch testimonials";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get testimonial by ID
  const getTestimonialById = useCallback(
    async (id: string): Promise<Testimonial | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/testimonials/${id}`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch testimonial"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to fetch testimonial";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Create new testimonial (Admin only)
  const createTestimonial = useCallback(
    async (
      testimonialData: CreateTestimonialData
    ): Promise<Testimonial | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.post("/testimonials", testimonialData);

        if (response.data.success) {
          toast.success("Testimonial created successfully");
          return response.data.data;
        } else {
          toast.error(
            response.data.error?.message || "Failed to create testimonial"
          );
          throw new Error(
            response.data.error?.message || "Failed to create testimonial"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to create testimonial";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update testimonial (Admin only)
  const updateTestimonial = useCallback(
    async (
      id: string,
      testimonialData: UpdateTestimonialData
    ): Promise<Testimonial | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(
          `/testimonials/${id}`,
          testimonialData
        );

        if (response.data.success) {
          toast.success("Testimonial updated successfully");
          return response.data.data;
        } else {
          toast.error(
            response.data.error?.message || "Failed to update testimonial"
          );
          throw new Error(
            response.data.error?.message || "Failed to update testimonial"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to update testimonial";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Delete testimonial (Admin only)
  const deleteTestimonial = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.delete(`/testimonials/${id}`);

        if (response.data.success) {
          toast.success("Testimonial deleted successfully");
          return true;
        } else {
          toast.error(
            response.data.error?.message || "Failed to delete testimonial"
          );
          throw new Error(
            response.data.error?.message || "Failed to delete testimonial"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to delete testimonial";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Admin-specific methods
  const getAdminTestimonials = useCallback(
    async (
      filters: TestimonialFilters = {}
    ): Promise<TestimonialListResponse | null> => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);

        const response = await apiClient.get(
          `/testimonials/admin?${params.toString()}`
        );

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch admin testimonials"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to fetch admin testimonials";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getAdminTestimonialById = useCallback(
    async (id: string): Promise<Testimonial | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/testimonials/admin/${id}`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch admin testimonial"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to fetch admin testimonial";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateAdminTestimonial = useCallback(
    async (
      id: string,
      testimonialData: UpdateTestimonialData
    ): Promise<Testimonial | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(
          `/testimonials/admin/${id}`,
          testimonialData
        );

        if (response.data.success) {
          toast.success("Admin testimonial updated successfully");
          return response.data.data;
        } else {
          toast.error(
            response.data.error?.message || "Failed to update admin testimonial"
          );
          throw new Error(
            response.data.error?.message || "Failed to update admin testimonial"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to update admin testimonial";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteAdminTestimonial = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.delete(`/testimonials/admin/${id}`);

        if (response.data.success) {
          toast.success("Admin testimonial deleted successfully");
          return true;
        } else {
          toast.error(
            response.data.error?.message || "Failed to delete admin testimonial"
          );
          throw new Error(
            response.data.error?.message || "Failed to delete admin testimonial"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to delete admin testimonial";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Utility functions
  const searchTestimonials = useCallback(
    async (
      searchTerm: string,
      page: number = 1,
      limit: number = 10
    ): Promise<TestimonialListResponse | null> => {
      return getTestimonials({ search: searchTerm, page, limit });
    },
    [getTestimonials]
  );

  const getTestimonialsByPage = useCallback(
    async (
      page: number,
      limit: number = 10
    ): Promise<TestimonialListResponse | null> => {
      return getTestimonials({ page, limit });
    },
    [getTestimonials]
  );

  // Get verified testimonials only
  const getVerifiedTestimonials = useCallback(
    async (
      filters: Omit<TestimonialFilters, "search"> = {}
    ): Promise<TestimonialListResponse | null> => {
      return getTestimonials({ ...filters, search: "" });
    },
    [getTestimonials]
  );

  // Validation utilities
  const validateTestimonial = useCallback(
    (
      testimonialData: CreateTestimonialData | UpdateTestimonialData
    ): { valid: boolean; error?: string } => {
      // Required fields for creation
      if ("name" in testimonialData) {
        if (!testimonialData.name || testimonialData.name.trim().length === 0) {
          return {
            valid: false,
            error: "Name is required and cannot be empty",
          };
        }

        if (testimonialData.name.length < 2) {
          return {
            valid: false,
            error: "Name must be at least 2 characters long",
          };
        }

        if (testimonialData.name.length > 100) {
          return {
            valid: false,
            error: "Name must be less than 100 characters",
          };
        }
      }

      if ("currentRole" in testimonialData) {
        if (
          !testimonialData.currentRole ||
          testimonialData.currentRole.trim().length === 0
        ) {
          return {
            valid: false,
            error: "Current role is required and cannot be empty",
          };
        }

        if (testimonialData.currentRole.length < 2) {
          return {
            valid: false,
            error: "Current role must be at least 2 characters long",
          };
        }

        if (testimonialData.currentRole.length > 100) {
          return {
            valid: false,
            error: "Current role must be less than 100 characters",
          };
        }
      }

      if ("currentCompany" in testimonialData) {
        if (
          !testimonialData.currentCompany ||
          testimonialData.currentCompany.trim().length === 0
        ) {
          return {
            valid: false,
            error: "Current company is required and cannot be empty",
          };
        }

        if (testimonialData.currentCompany.length < 2) {
          return {
            valid: false,
            error: "Current company must be at least 2 characters long",
          };
        }

        if (testimonialData.currentCompany.length > 100) {
          return {
            valid: false,
            error: "Current company must be less than 100 characters",
          };
        }
      }

      if ("linkedin" in testimonialData) {
        if (
          !testimonialData.linkedin ||
          testimonialData.linkedin.trim().length === 0
        ) {
          return {
            valid: false,
            error: "LinkedIn profile is required and cannot be empty",
          };
        }

        // Basic LinkedIn URL validation
        const linkedinRegex =
          /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
        if (!linkedinRegex.test(testimonialData.linkedin)) {
          return {
            valid: false,
            error: "Please provide a valid LinkedIn profile URL",
          };
        }
      }

      if ("pastRole" in testimonialData) {
        if (
          !testimonialData.pastRole ||
          testimonialData.pastRole.trim().length === 0
        ) {
          return {
            valid: false,
            error: "Past Course/Role is required and cannot be empty",
          };
        }

        if (testimonialData.pastRole.length < 2) {
          return {
            valid: false,
            error: "Past Course/Role must be at least 2 characters long",
          };
        }

        if (testimonialData.pastRole.length > 100) {
          return {
            valid: false,
            error: "Past Course/Role must be less than 100 characters",
          };
        }
      }

      if ("pastCompany" in testimonialData) {
        if (
          !testimonialData.pastCompany ||
          testimonialData.pastCompany.trim().length === 0
        ) {
          return {
            valid: false,
            error: "Past College/Company is required and cannot be empty",
          };
        }

        if (testimonialData.pastCompany.length < 2) {
          return {
            valid: false,
            error: "Past College/Company must be at least 2 characters long",
          };
        }

        if (testimonialData.pastCompany.length > 100) {
          return {
            valid: false,
            error: "Past College/Company must be less than 100 characters",
          };
        }
      }

      if ("college" in testimonialData) {
        if (
          !testimonialData.college ||
          testimonialData.college.trim().length === 0
        ) {
          return {
            valid: false,
            error: "Tagline is required and cannot be empty",
          };
        }

        if (testimonialData.college.length < 2) {
          return {
            valid: false,
            error: "Tagline must be at least 2 characters long",
          };
        }

        if (testimonialData.college.length > 100) {
          return {
            valid: false,
            error: "Tagline must be less than 100 characters",
          };
        }
      }

      if ("profileImage" in testimonialData && testimonialData.profileImage) {
        // Basic URL validation for profile image
        const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
        if (!urlRegex.test(testimonialData.profileImage)) {
          return {
            valid: false,
            error:
              "Please provide a valid image URL (jpg, jpeg, png, gif, webp)",
          };
        }
      }

      // Validate URL fields if provided
      const urlFields = [
        { field: "collegeUrl", label: "College URL" },
        { field: "collegeProfileUrl", label: "College Profile URL" },
        { field: "companyUrl", label: "Company URL" },
        { field: "companyProfileUrl", label: "Company Profile URL" },
      ];

      for (const { field, label } of urlFields) {
        if (field in testimonialData && testimonialData[field as keyof typeof testimonialData]) {
          const url = testimonialData[field as keyof typeof testimonialData] as string;
          if (url && url.trim().length > 0) {
            const urlRegex = /^https?:\/\/.+/i;
            if (!urlRegex.test(url)) {
              return {
                valid: false,
                error: `${label} must be a valid URL starting with http:// or https://`,
              };
            }
          }
        }
      }

      return { valid: true };
    },
    []
  );

  return {
    // State
    isLoading,
    error,

    // Public methods
    getTestimonials,
    getTestimonialById,
    searchTestimonials,
    getTestimonialsByPage,
    getVerifiedTestimonials,

    // Admin methods
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    getAdminTestimonials,
    getAdminTestimonialById,
    updateAdminTestimonial,
    deleteAdminTestimonial,

    // Utilities
    validateTestimonial,

    // Reset error
    clearError: () => setError(""),
  };
};
