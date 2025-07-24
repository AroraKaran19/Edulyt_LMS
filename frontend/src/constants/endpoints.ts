export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
    courses: {
        navbar: '/courses/navbar',
        featured: '/courses/featured',
        all: '/courses',
        slug: '/courses',
        category: '/courses/category',
    },
    instructors: {
        all: '/instructors',
        slug: '/instructors/',
    },
    admin: {
        media: '/admin/add/courses',
        saveDraft: '/admin/add/courses/',
    },
};
