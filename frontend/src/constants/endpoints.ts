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

  // Internship Routes
  internships: {
    all: "/internships",
    /** GET — active + featured internships only (same query params as `all`). */
    featured: "/internships/featured",
    bySlug: "/internships/slug",

    // Authenticated
    checkSlug: "/internships/check-slug",
    // Admin Routes
    admin: {
      all: "/internships/admin",
      byId: "/internships/admin/id",
    },

    metadata: "/internships/metadata",
    base: "/internships",
  },

  /** Reusable internship exam templates (admin picker + exam bank). */
  internshipExams: {
    adminList: "/internship-exams/admin",
    adminById: (examId: string) =>
      `/internship-exams/admin/${encodeURIComponent(examId)}`,
    create: "/internship-exams",
  },

  internshipQuestions: {
    adminList: "/internship-questions/admin",
    adminBulkCreate: "/internship-questions/admin/bulk",
    adminRandom: "/internship-questions/admin/random",
    adminById: (questionId: string) =>
      `/internship-questions/admin/${encodeURIComponent(questionId)}`,
    create: "/internship-questions",
  },

  internshipTasks: {
    adminList: "/internship-tasks/admin",
    adminById: (taskId: string) =>
      `/internship-tasks/admin/${encodeURIComponent(taskId)}`,
    create: "/internship-tasks",
  },

  internshipSubmissions: {
    /** POST — create a new exam/task submission. */
    create: "/internship-submissions",
    adminList: "/internship-submissions/admin",
    adminById: (id: string) =>
      `/internship-submissions/admin/${encodeURIComponent(id)}`,
    adminFinalizeCertification: (id: string) =>
      `/internship-submissions/admin/${encodeURIComponent(id)}/finalize-certification`,
    byId: (id: string) => `/internship-submissions/${id}`,
    saveMcq: (id: string) => `/internship-submissions/${id}/answers/mcq`,
    saveFile: (id: string) => `/internship-submissions/${id}/answers/file`,
    submit: (id: string) => `/internship-submissions/${id}/submit`,
  },

  /** Internship program enrollments. */
  internshipEnrollments: {
    /** GET — authenticated learner’s enrollments (dashboard). Query: page, limit, search */
    me: "/internship-enrollments/me",
    /** GET — entrance exam for a specific enrollment (window must be open). Query: enrollmentId */
    meEntranceExam: "/internship-enrollments/me/entrance-exam",
    /** DELETE — remove unpaid direct-seat registration (`payment_pending`) */
    meWithdrawPaymentPending: (enrollmentId: string) =>
      `/internship-enrollments/me/${encodeURIComponent(enrollmentId)}`,
    /** GET — enrolled-program detail + unlocked tasks by internship slug. */
    meProgramBySlug: (slug: string) =>
      `/internship-enrollments/me/program/${encodeURIComponent(slug)}`,
    /** POST — learner registers (entrance exam or paid seat). Body: { internshipId, batchId, path? } */
    create: "/internship-enrollments",
    register: "/internship-enrollments",
    adminList: "/internship-enrollments/admin",
    /** POST body `{ enrollmentIds: string[] }` — merit path → enrolled (server). */
    adminApproveToEnrolled: "/internship-enrollments/admin/approve-to-enrolled",
    adminEntranceExamCohorts:
      "/internship-enrollments/admin/entrance-exam-cohorts",
    adminCertificationExamCohorts:
      "/internship-enrollments/admin/certification-exam-cohorts",
    adminById: (enrollmentId: string) =>
      `/internship-enrollments/admin/${encodeURIComponent(enrollmentId)}`,
    adminUpdateStatus: (enrollmentId: string) =>
      `/internship-enrollments/admin/${encodeURIComponent(enrollmentId)}/status`,
    adminChangeBatch: (enrollmentId: string) =>
      `/internship-enrollments/admin/${encodeURIComponent(enrollmentId)}/batch`,
    adminDelete: (enrollmentId: string) =>
      `/internship-enrollments/admin/${encodeURIComponent(enrollmentId)}`,
  },

  /** Read-only fixed list (optional; UI uses `QUESTION_CATEGORY_OPTIONS`). */
  questionCategories: {
    list: "/question-categories",
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
    createInternshipSeat: "/orders/internship-seat",
    createInternshipSuccessPoints: "/orders/internship-success-points",
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

  /**
   * Internship vouchers — single-use tokens earned by qualifying course
   * purchases (≥ 50 % of plan price paid).
   */
  internshipVouchers: {
    /** GET — current user's available count + voucher list. */
    me: "/internship-vouchers/me",
    /** POST — redeem a voucher by id or code. */
    redeem: "/internship-vouchers/redeem",
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

  /** Public marketing home page CMS — read-only. */
  homePageSettings: "/home-page-settings",

  /** `/api/admin/*` — dashboard & global admin config */
  admin: {
    pointsSettings: "/admin/points-settings",
    homePageSettings: "/admin/home-page-settings",
  },
};
