export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const ENDPOINTS = {
  API_BASE_URL: API_BASE_URL,
  
  // Authentication Routes
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    oauthSignin: "/auth/oauth-signin",
    refreshToken: "/auth/refresh-token",
    generateAccessToken: "/auth/generate-access-token",
    logout: "/auth/logout",
    resetPassword: "/auth/reset-password",
    generateResetPasswordToken: "/auth/generate-reset-password-token",
    changePassword: "/auth/change-password",
  },

  // Course Routes
  courses: {
    // Public Routes
    all: "/courses",
    featured: "/courses/featured",
    audience: "/courses/audience",
    category: "/courses/category",
    byId: "/courses/id",
    bySlug: "/courses/slug",

    // User Routes
    enrolled: "/courses/enrolled",
    
    // Admin Routes
    admin: {
      all: "/courses/admin",
      byId: "/courses/admin/id",
      bySlug: "/courses/admin/slug",
      duplicate: "/courses/admin/duplicate",
    },
    
    // Course Management
    metadata: "/courses/metadata",
    status: "/courses",
    
    // Module Management
    modules: {
      create: "/courses",
      update: "/courses",
      delete: "/courses",
    },
    
    // Lesson Management
    lessons: {
      create: "/courses",
      update: "/courses",
      delete: "/courses",
    },
    
    // Content Management
    contents: {
      create: "/courses",
      update: "/courses",
      delete: "/courses",
    },
  },

  // Category Routes
  categories: {
    // Public Routes
    all: "/categories",
    byId: "/categories",
    
    // Admin Routes
    admin: {
      all: "/categories/admin",
      byId: "/categories/admin",
      update: "/categories/admin",
      delete: "/categories/admin",
    },
    
    // CRUD Operations
    create: "/categories",
    update: "/categories",
    delete: "/categories",
  },

  // Order Routes
  orders: {
    // User Routes
    self: "/orders",
    create: "/orders",
    verify: "/orders/verify",
    webhook: "/orders/webhook",
    
    // Admin Routes
    byId: "/orders",
    delete: "/orders",
  },

  // FAQ Routes
  faqs: {
    // Public Routes
    all: "/faqs",
    byId: "/faqs",
    
    // Admin Routes
    admin: {
      all: "/faqs/admin",
      byId: "/faqs/admin",
      update: "/faqs/admin",
      delete: "/faqs/admin",
    },
    
    // CRUD Operations
    create: "/faqs",
    update: "/faqs",
    delete: "/faqs",
  },

  // Testimonial Routes
  testimonials: {
    // Public Routes
    all: "/testimonials",
    byId: "/testimonials",
    
    // Admin Routes
    admin: {
      all: "/testimonials/admin",
      byId: "/testimonials/admin",
      update: "/testimonials/admin",
      delete: "/testimonials/admin",
    },
    
    // CRUD Operations
    create: "/testimonials",
    update: "/testimonials",
    delete: "/testimonials",
  },

  // QnA Routes
  qnas: {
    // Public Routes
    all: "/qnas",
    byId: "/qnas",
    
    // Admin Routes
    admin: {
      all: "/qnas/admin",
      byId: "/qnas/admin",
      update: "/qnas/admin",
      delete: "/qnas/admin",
    },
    
    // CRUD Operations
    create: "/qnas",
    update: "/qnas",
    delete: "/qnas",
    
    // Reply Management
    reply: {
      add: "/qnas",
      remove: "/qnas",
    },
  },
};