import { fetcher } from "@/lib/utils";

export const checkSlug = async (slug: string) => {
  try {
    const response = await fetcher(`/courses/check-slug/${slug}`);

    // Handle the nested response structure
    const { data } = response;
    return {
      available: data.available,
      message: data.message,
    };
  } catch (error) {
    console.error("Error checking slug:", error);
    return {
      available: false,
      message: "Error checking slug availability",
    };
  }
};
