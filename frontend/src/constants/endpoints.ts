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
    /** GET — active login sessions (one per device). */
    sessions: "/auth/sessions",
    /** POST body `{ family }` — sign out a specific device. */
    revokeSession: "/auth/sessions/revoke",
    /** POST — sign out every device except the current one. */
    revokeOtherSessions: "/auth/sessions/revoke-others",
    /** POST body `{ pendingId, otp }` — confirm the signup code, creates the account. */
    verifyRegistrationOtp: "/auth/register/verify-otp",
    /** POST body `{ pendingId }` — email a fresh signup code. */
    resendRegistrationOtp: "/auth/register/resend-otp",
  },

  /**
   * Opt-outs for non-essential email. Transactional mail (codes, resets,
   * receipts, certificates) is never governed by these.
   */
  emailPreferences: {
    /** GET — current opt-in state per category. */
    me: "/email-preferences/me",
    /** PATCH body `{ preferences: { reviews: boolean, ... } }`. */
    update: "/email-preferences/me",
    /** POST body `{ uid, cat, sig }` — from an emailed link, no session. */
    unsubscribe: "/email-preferences/unsubscribe",
    /** POST body `{ uid, cat, sig }` — undo an unsubscribe. */
    resubscribe: "/email-preferences/resubscribe",
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
      /** GET — paged `{ _id, title }` feed for pickers. Query: page, limit, search */
      options: "/internships/admin/options",
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

  /** Scholarship campaigns (marketer + admin CRUD). */
  scholarshipTests: {
    adminList: "/scholarship-tests/admin",
    create: "/scholarship-tests/admin",
    adminById: (testId: string) =>
      `/scholarship-tests/admin/${encodeURIComponent(testId)}`,
    adminDeletionPreview: (testId: string) =>
      `/scholarship-tests/admin/${encodeURIComponent(testId)}/deletion-preview`,
  },

  /**
   * Enquiry form verification. Public: most visitors arrive from an ad with no
   * account, and both codes prove the details handed to the sales team.
   */
  enquiry: {
    /** Opens a session from the typed email. The form proves only the phone. */
    start: "/enquiry/start",
    otp: "/enquiry/otp",
    verifyOtp: "/enquiry/otp/verify",
    session: "/enquiry/session",
    phoneOtpRequest: "/enquiry/phone/otp-request",
    phoneVerify: "/enquiry/phone/verify",
  },

  /** A signed-in learner changing their own number. Writes to the profile. */
  users: {
    phoneOtpStatus: "/users/me/phone/otp-status",
    phoneOtpRequest: "/users/me/phone/otp-request",
    phoneVerify: "/users/me/phone/verify",
  },

  /**
   * Public scholarship campaign flow. Every route is unauthenticated; the
   * attempt and result routes carry the token from `verifyOtp` as a bearer.
   */
  scholarshipPublic: {
    campaign: (slug: string) => `/scholarship/${encodeURIComponent(slug)}`,
    view: (slug: string) => `/scholarship/${encodeURIComponent(slug)}/view`,
    otp: (slug: string) => `/scholarship/${encodeURIComponent(slug)}/otp`,
    verifyOtp: (slug: string) =>
      `/scholarship/${encodeURIComponent(slug)}/otp/verify`,
    /** Signed-in shortcut past the email gate. */
    session: (slug: string) => `/scholarship/${encodeURIComponent(slug)}/session`,
    /**
     * Books an SMS before the MSG91 widget sends one from the browser. Skipping
     * it is not an option: it is the only thing metering the SMS bill.
     */
    phoneOtpRequest: (slug: string) =>
      `/scholarship/${encodeURIComponent(slug)}/phone/otp-request`,
    phoneVerify: (slug: string) =>
      `/scholarship/${encodeURIComponent(slug)}/phone/verify`,
    attempt: (slug: string) => `/scholarship/${encodeURIComponent(slug)}/attempt`,
    answer: (slug: string) =>
      `/scholarship/${encodeURIComponent(slug)}/attempt/answer`,
    submit: (slug: string) =>
      `/scholarship/${encodeURIComponent(slug)}/attempt/submit`,
    result: (slug: string) => `/scholarship/${encodeURIComponent(slug)}/result`,
  },

  /** Internship programs sold as a course add-on (admin CRUD). */
  courseInternships: {
    all: "/course-internships",
    byId: (programId: string) =>
      `/course-internships/${encodeURIComponent(programId)}`,
  },

  /** A learner's own course-internship enrollments. */
  courseInternshipEnrollments: {
    mine: "/course-internship-enrollments/me",
    mineById: (enrollmentId: string) =>
      `/course-internship-enrollments/me/${encodeURIComponent(enrollmentId)}`,
  },

  internshipTasks: {
    adminList: "/internship-tasks/admin",
    adminReachabilityPreview: "/internship-tasks/admin/reachability-preview",
    adminById: (taskId: string) =>
      `/internship-tasks/admin/${encodeURIComponent(taskId)}`,
    create: "/internship-tasks",
  },

  /**
   * One-off live meetings per internship batch + two-checkpoint attendance.
   * Admin creates a meeting, manually activates each link mid-meeting, and
   * shares the URL with students; a student is **present** only if both
   * links are clicked within their windows.
   */
  internshipLiveMeetings: {
    /** POST — create a meeting (admin). */
    create: "/internship-live-meetings",
    /** GET — list by internship/batch (admin). */
    adminList: "/internship-live-meetings/admin",
    adminById: (meetingId: string) =>
      `/internship-live-meetings/admin/${encodeURIComponent(meetingId)}`,
    adminAttendance: (meetingId: string) =>
      `/internship-live-meetings/admin/${encodeURIComponent(meetingId)}/attendance`,
    /** POST — admin forces/clears a student's attendance verdict. */
    adminAttendanceOverride: (meetingId: string) =>
      `/internship-live-meetings/admin/${encodeURIComponent(meetingId)}/attendance/override`,
    adminUpdate: (meetingId: string) =>
      `/internship-live-meetings/admin/${encodeURIComponent(meetingId)}`,
    adminActivate: (meetingId: string, slot: 1 | 2) =>
      `/internship-live-meetings/admin/${encodeURIComponent(meetingId)}/activate/${slot}`,
    /** POST — student records attendance click via token. */
    attend: (token: string) =>
      `/internship-live-meetings/attend/${encodeURIComponent(token)}`,
  },

  /**
   * Course live classes + two-link attendance — same mechanics as
   * `internshipLiveMeetings`, scoped to a course instead of a batch. Admin
   * activates each link mid-class and shares its URL; a student is **present**
   * only if both are opened within their windows.
   */
  liveClasses: {
    /** POST — create a live class (admin / instructor). */
    create: "/live-classes",
    /** GET — all live classes, optional ?courseId=&search= (admin). */
    adminList: "/live-classes/admin",
    /** GET — currently-running live classes (admin). */
    ongoing: "/live-classes/ongoing",
    /** GET — the caller's own live classes (instructor). */
    instructorList: "/live-classes/instructor",
    byId: (liveClassId: string) =>
      `/live-classes/${encodeURIComponent(liveClassId)}`,
    update: (liveClassId: string) =>
      `/live-classes/${encodeURIComponent(liveClassId)}`,
    remove: (liveClassId: string) =>
      `/live-classes/${encodeURIComponent(liveClassId)}`,
    adminAttendance: (liveClassId: string) =>
      `/live-classes/admin/${encodeURIComponent(liveClassId)}/attendance`,
    /** POST — admin forces/clears a learner's attendance verdict. */
    adminAttendanceOverride: (liveClassId: string) =>
      `/live-classes/admin/${encodeURIComponent(liveClassId)}/attendance/override`,
    adminActivate: (liveClassId: string, slot: 1 | 2) =>
      `/live-classes/admin/${encodeURIComponent(liveClassId)}/activate/${slot}`,
    /** GET — live classes for the learner's elite-plan enrollments. */
    student: "/live-classes/student",
    /** GET — one enrolled course's feed, for the course player's tab. */
    studentByCourse: (courseId: string) =>
      `/live-classes/student/course/${encodeURIComponent(courseId)}`,
    /** POST — student records an attendance click via token. */
    attend: (token: string) =>
      `/live-classes/attend/${encodeURIComponent(token)}`,
  },

  internshipSubmissions: {
    /** POST — create a new exam/task submission. */
    create: "/internship-submissions",
    adminList: "/internship-submissions/admin",
    adminById: (id: string) =>
      `/internship-submissions/admin/${encodeURIComponent(id)}`,
    adminFinalizeCertification: (id: string) =>
      `/internship-submissions/admin/${encodeURIComponent(id)}/finalize-certification`,
    /** PATCH — reviewer scores / accepts / requests re-upload of one file answer. */
    adminReviewFile: (id: string, questionId: string) =>
      `/internship-submissions/admin/${encodeURIComponent(id)}/review/${encodeURIComponent(questionId)}`,
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
    /** GET — paginated live-meetings (history + upcoming) for the learner's batch. */
    meProgramLiveMeetingsBySlug: (slug: string) =>
      `/internship-enrollments/me/program/${encodeURIComponent(slug)}/live-meetings`,
    /** POST — learner submits Aadhar + photo to leave `pending_documentation`. */
    meSubmitDocumentation: (enrollmentId: string) =>
      `/internship-enrollments/me/${encodeURIComponent(enrollmentId)}/documentation`,
    /** POST body `{ batchId }` — learner moves a pre-exam (`exam_registered`) registration to another cohort. */
    meSwitchBatch: (enrollmentId: string) =>
      `/internship-enrollments/me/${encodeURIComponent(enrollmentId)}/switch-batch`,
    /** POST — learner registers (entrance exam or paid seat). Body: { internshipId, batchId, path? } */
    create: "/internship-enrollments",
    register: "/internship-enrollments",
    /** GET — public verify-an-offer-letter by intern ID (scanned from QR). */
    verify: (internId: string) =>
      `/internship-enrollments/verify/${encodeURIComponent(internId)}`,
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
    /** PATCH body `{ months: number }` — admin changes the learner's program duration. */
    adminUpdateDuration: (enrollmentId: string) =>
      `/internship-enrollments/admin/${encodeURIComponent(enrollmentId)}/duration`,
    /** PATCH body `{ verdict: "pass" | "fail" | "clear" }` — admin overrides the certificate verdict. */
    adminCertificateOverride: (enrollmentId: string) =>
      `/internship-enrollments/admin/${encodeURIComponent(enrollmentId)}/certificate-override`,
    /** PATCH — admin edits Aadhar number / learner photo on an enrollment. */
    adminUpdateDocumentation: (enrollmentId: string) =>
      `/internship-enrollments/admin/${encodeURIComponent(enrollmentId)}/documentation`,
    /** POST body `{ action: "approve" | "reject", rejectionNote?: string }` — verify docs_under_review enrollment. */
    adminVerifyDocumentation: (enrollmentId: string) =>
      `/internship-enrollments/admin/${encodeURIComponent(enrollmentId)}/documentation/verify`,
    /** GET — internships that have at least one `docs_under_review` enrollment, with pending counts. */
    adminPendingDocInternships:
      "/internship-enrollments/admin/documentation/pending-internships",
    /** POST body `{ enrollmentIds: string[] }` — bulk-approve docs_under_review enrollments. */
    adminBulkApproveDocumentation:
      "/internship-enrollments/admin/documentation/bulk-approve",
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

  // Payment Gateway Routes
  payments: {
    /** GET — gateways that are enabled AND configured, in preference order. */
    gateways: "/payment/gateways",
    /** POST — settle an order from a client-side gateway signature. */
    verify: (orderId: string) => `/payment/verify/${encodeURIComponent(orderId)}`,
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

  /** Referral module — per-user referral code, commission accrual, withdrawals. */
  referral: {
    /** GET — overview (code, balance, tiers, recent sales, UPI). Lazy-creates the profile. */
    me: "/referral/me",
    /** PATCH — set/update payout UPI: body { upiId }. */
    meUpi: "/referral/me/upi",
    /** POST — validate a referral code: body { code } → { valid, referrerName? }. */
    validateCode: "/referral/validate-code",
    /** GET — paginated commission transactions for the current user. */
    meSales: "/referral/me/sales",
    /** POST — request a withdrawal: body { amount }. */
    meWithdrawals: "/referral/me/withdrawals",
    /** GET — paginated withdrawal history for the current user. */
    meWithdrawalsList: "/referral/me/withdrawals",
    /** Admin — global commission tier configuration. */
    adminConfig: "/referral/admin/config",
    /** Admin — paginated list of all withdrawal requests. */
    adminWithdrawals: "/referral/admin/withdrawals",
    /** Admin — PATCH transition: body { status, notes? }. */
    adminWithdrawalStatus: (id: string) =>
      `/referral/admin/withdrawals/${encodeURIComponent(id)}/status`,
  },

  /**
   * Admin reports. All three accept `from`, `to` (YYYY-MM-DD), `q`, `page`,
   * `limit`, and `format=csv` to get the whole window as a CSV attachment.
   */
  reports: {
    /** GET — student wallet success points: earned vs spent, per user. */
    successPointsPlatform: "/reports/success-points/platform",
    /** GET — internship success points earned, per user. */
    successPointsInternship: "/reports/success-points/internship",
    /** GET — per-referrer referrals, commission earned, and payouts. */
    referrals: "/reports/referrals",
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

  /**
   * Private video notes. Every route is scoped to the caller's own notes;
   * there is deliberately no admin or instructor variant.
   */
  notes: {
    /** GET `?courseId=` — the caller's whole note set for one course. */
    list: "/notes",
    /** POST body `{ courseId, lessonId, contentId, content, timestamp }`. */
    create: "/notes",
    /** PUT `/notes/:id` body `{ content }` — text only, anchor stays put. */
    update: "/notes",
    /** DELETE `/notes/:id`. */
    delete: "/notes",
  },

  /** Public marketing home page CMS — read-only. */
  homePageSettings: "/home-page-settings",
  enquiryPageSettings: "/enquiry-page-settings",
  /** Public Campus Ambassador page CMS, read-only. */
  caPageSettings: "/ca-page/settings",
  /** Per-visit and uncached: the answer depends on the `?ref=` link. */
  enquiryScholarship: "/enquiry-page-settings/scholarship",

  /** Public legal documents (course + internship T&C) — read-only. */
  legalSettings: "/legal-settings",

  /**
   * Campus Ambassador applications: public submission plus staff review
   * (list, detail, reveal, approve, decline, owner and hold changes, team).
   */
  caApplications: Object.assign("/ca-applications", {
    changeDuration: (id: string) => `/ca-applications/${encodeURIComponent(id)}/duration`,
    forcePass: (id: string) => `/ca-applications/${encodeURIComponent(id)}/force-pass`,
  }),

  /** CA task programme: mine, one attempt, submit (all CA-facing). */
  caTasks: {
    mine: "/ca-tasks/mine",
    byId: (taskId: string) => `/ca-tasks/${encodeURIComponent(taskId)}`,
    submit: (taskId: string) => `/ca-tasks/${encodeURIComponent(taskId)}/submit`,
  },

  /** CA meetings: mine and attendance click (CA-facing). */
  caMeetings: {
    mine: "/ca-meetings/mine",
    attend: (token: string) => `/ca-meetings/attend/${encodeURIComponent(token)}`,
  },

  /** Pending file-answer review queue, shared by owners and admins. */
  caReviews: {
    list: "/ca-reviews",
    review: (submissionId: string, questionId: string) =>
      `/ca-reviews/${encodeURIComponent(submissionId)}/answers/${encodeURIComponent(questionId)}`,
  },

  /** `/api/admin/*` — dashboard & global admin config */
  admin: {
    pointsSettings: "/admin/points-settings",
    homePageSettings: "/admin/home-page-settings",
    enquiryPageSettings: "/admin/enquiry-page-settings",
    /** The signed-in admin's own campaigns, for the attach picker. */
    enquiryScholarshipOptions: "/admin/enquiry-page-settings/scholarship-options",
    legalSettings: "/admin/legal-settings",
    /** Batch and form configuration for the public CA page. */
    caPageSettings: "/admin/ca-page-settings",
    caTasks: {
      list: "/admin/ca-tasks",
      create: "/admin/ca-tasks",
      byId: (id: string) => `/admin/ca-tasks/${encodeURIComponent(id)}`,
    },
    caMeetings: {
      list: "/admin/ca-meetings",
      create: "/admin/ca-meetings",
      byId: (id: string) => `/admin/ca-meetings/${encodeURIComponent(id)}`,
      activate: (id: string, slot: 1 | 2) => `/admin/ca-meetings/${encodeURIComponent(id)}/activate/${slot}`,
      attendance: (id: string) => `/admin/ca-meetings/${encodeURIComponent(id)}/attendance`,
      attendanceOverride: (id: string) => `/admin/ca-meetings/${encodeURIComponent(id)}/attendance/override`,
    },
  },
};
