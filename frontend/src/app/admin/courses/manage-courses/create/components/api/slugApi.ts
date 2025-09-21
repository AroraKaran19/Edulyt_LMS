import apiClient from "@/configs/apiConfig";

/**
 * Check if a course slug already exists
 */
export const checkSlugAvailability = async (
  slug: string
): Promise<{ available: boolean; message: string }> => {
  try {
    await apiClient.get(`/courses/slug/${slug}`);
    
    // If we get a response, the slug exists
    return {
      available: false,
      message: "This slug is already taken"
    };
  } catch (error: any) {
    // If we get a 404, the slug is available
    if (error.response?.status === 404) {
      return {
        available: true,
        message: "This slug is available"
      };
    }
    
    // For other errors, we'll assume it's not available to be safe
    console.error("Error checking slug availability:", error);
    return {
      available: false,
      message: "Unable to verify slug availability"
    };
  }
};
