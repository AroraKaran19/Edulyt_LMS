import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Course, Filter } from '@/types';
import { API_BASE_URL } from '@/constants/endpoints';
import { buildQueryString } from '@/lib/utils';

// Define API response interfaces
interface CoursesResponse {
  success: boolean;
  message: string;
  data: {
    courses: Course[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalCourses: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

interface GetCoursesParams {
  category?: string;
  search?: string;
  filters?: Filter[];
  page?: number;
}

// Create the API slice
export const coursesApi = createApi({
  reducerPath: 'coursesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Course'],
  endpoints: (builder) => ({
    // Get all courses with optional filters
    getCourses: builder.query<CoursesResponse, GetCoursesParams>({
      query: ({ category, search = '', filters = [], page = 1 }) => {
        const queryString = buildQueryString(search, filters, page);
        const categoryParam = category ? `category=${category}` : '';

        const finalQuery = [categoryParam, queryString]
          .filter(Boolean)
          .join('&');

        return {
          url: `/courses${finalQuery ? `?${finalQuery}` : ''}`,
        };
      },
      providesTags: ['Course'],
    }),

    // Get featured courses
    getFeaturedCourses: builder.query<CoursesResponse, void>({
      query: () => '/courses/featured',
      providesTags: ['Course'],
    }),

    // Get courses by audience for navbar
    getCoursesByAudience: builder.query<CoursesResponse, string>({
      query: (audience) => `/courses?audience=${audience}`,
      providesTags: ['Course'],
    }),

    // Get courses by category
    getCoursesByCategory: builder.query<CoursesResponse, string>({
      query: (category) => `/courses?category=${category}`,
      providesTags: ['Course'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetCoursesQuery,
  useGetFeaturedCoursesQuery,
  useGetCoursesByAudienceQuery,
  useGetCoursesByCategoryQuery,
} = coursesApi;
