export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const ENDPOINTS = {
	API_BASE_URL:API_BASE_URL,
  courses: {
    navbar: "/courses/navbar",
    featured: "/courses/featured",
    all: "/courses",
    slug: "/courses",
    category: "/courses/category",
    enrolled: "/user/enrolled-courses",
  },
  instructors: {
    all: "/instructors",
    slug: "/instructors/",
  },
  admin: {
    media: "/admin/add/courses",
    saveDraft: "/admin/add/courses/",
  },
};
