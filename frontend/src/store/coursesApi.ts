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
  dataLevel?: 'summary' | 'basic' | 'full';
  fields?: string[];
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
    // Get all courses with optional filters and optimization
    getCourses: builder.query<CoursesResponse, GetCoursesParams>({
      query: ({ category, search = '', filters = [], page = 1, dataLevel, fields }) => {
        const queryString = buildQueryString(search, filters, page);
        const categoryParam = category ? `category=${category}` : '';
        const dataLevelParam = dataLevel ? `dataLevel=${dataLevel}` : '';
        const fieldsParam = fields && fields.length > 0 ? `fields=${fields.join(',')}` : '';

        const finalQuery = [categoryParam, queryString, dataLevelParam, fieldsParam]
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

    // Get courses by audience for navbar (optimized for lightweight display)
    getCoursesByAudience: builder.query<CoursesResponse, string>({
      query: (audience) => `/courses?audience=${audience}&dataLevel=summary`,
      providesTags: ['Course'],
    }),

    // Get courses by category (optimized for course browsing)
    getCoursesByCategory: builder.query<CoursesResponse, string>({
      query: (category) => `/courses?category=${category}&dataLevel=basic`,
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
