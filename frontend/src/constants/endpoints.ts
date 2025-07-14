export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
    courses: {
        featured: '/courses/featured',
        all: '/courses',
        slug: '/courses',
    },
    admin: {
        media: '/admin/add/courses',
        saveDraft: '/admin/add/courses/',
    },
};
