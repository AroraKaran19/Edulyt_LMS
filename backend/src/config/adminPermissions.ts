/**
 * Canonical catalog of admin-panel page permissions — the single source of
 * truth for page-level RBAC. Mirrored on the frontend at
 * `frontend/src/config/adminPermissions.ts`; keep the two in sync.
 *
 * Permission key scheme (dot notation):
 *   - Whole-section grant  → the bare section key      e.g. "courses"
 *   - Single-page grant    → "<section>.<page>"         e.g. "courses.enrollments"
 *   - Single-page sections → one key                    e.g. "dashboard", "orders"
 *
 * A super-admin has implicit full access and is never stored in `permissions`.
 * The management page itself ("/admin/access") is intentionally NOT in this
 * catalog, so it can never be granted to an admin.
 */

export interface AdminPage {
  /** Permission key, e.g. "courses.enrollments" or "dashboard". */
  key: string;
  label: string;
  /** Frontend route this page lives at. */
  href: string;
}

export interface AdminSection {
  /** Section-level permission key, e.g. "courses" or "dashboard". */
  key: string;
  label: string;
  /** True when the section is a single page (key === its only page's key). */
  single?: boolean;
  pages: AdminPage[];
}

export const ADMIN_PERMISSION_CATALOG: AdminSection[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    single: true,
    pages: [{ key: "dashboard", label: "Dashboard", href: "/admin" }],
  },
  {
    key: "courses",
    label: "Courses",
    pages: [
      { key: "courses.analytics", label: "Analytics", href: "/admin/courses/analytics" },
      { key: "courses.manage", label: "Manage Courses", href: "/admin/courses/manage-courses" },
      { key: "courses.enrollments", label: "Enrollments", href: "/admin/courses/enrollments" },
      { key: "courses.live-classes", label: "Live Classes", href: "/admin/courses/live-classes" },
      { key: "courses.moderation", label: "Moderation", href: "/admin/courses/moderation" },
    ],
  },
  {
    key: "internships",
    label: "Internships",
    pages: [
      { key: "internships.analytics", label: "Analytics", href: "/admin/internships/analytics" },
      { key: "internships.manage", label: "Manage Internships", href: "/admin/internships/manage-internships" },
      { key: "internships.enrollments", label: "Enrollments", href: "/admin/internships/enrollments" },
      { key: "internships.doc-review", label: "Doc Review", href: "/admin/internships/doc-review" },
      { key: "internships.entrance-exams", label: "Entrance exams", href: "/admin/internships/entrance-exams" },
      { key: "internships.certification-exams", label: "Certification exams", href: "/admin/internships/certification-exams" },
      { key: "internships.questions", label: "Question bank", href: "/admin/internships/questions" },
      { key: "internships.exams", label: "Exam templates", href: "/admin/internships/exams" },
      { key: "internships.tasks", label: "Task templates", href: "/admin/internships/tasks" },
      { key: "internships.live-meetings", label: "Live meetings", href: "/admin/internships/live-meetings" },
    ],
  },
  {
    key: "course-internships",
    label: "CourseInternships",
    pages: [
      { key: "course-internships.manage", label: "Manage Programs", href: "/admin/course-internships/manage" },
    ],
  },
  {
    key: "users",
    label: "All Users",
    pages: [
      { key: "users.manage", label: "Manage Users", href: "/admin/users/manage-users" },
      { key: "users.referral-withdrawals", label: "Referral Withdrawals", href: "/admin/users/referral-withdrawals" },
      { key: "users.create-instructor", label: "Create Instructor", href: "/admin/users/create-instructor" },
    ],
  },
  {
    key: "community",
    label: "Community",
    pages: [
      { key: "community.moderation", label: "Moderation", href: "/admin/community/moderation" },
    ],
  },
  {
    key: "faqs",
    label: "FAQs",
    single: true,
    pages: [{ key: "faqs", label: "FAQs", href: "/admin/faq" }],
  },
  {
    key: "testimonials",
    label: "Testimonials",
    single: true,
    pages: [{ key: "testimonials", label: "Testimonials", href: "/admin/testimonials" }],
  },
  {
    key: "orders",
    label: "Orders",
    single: true,
    pages: [{ key: "orders", label: "Orders", href: "/admin/orders" }],
  },
  {
    key: "coupons",
    label: "Coupons",
    single: true,
    pages: [{ key: "coupons", label: "Coupons", href: "/admin/coupons" }],
  },
  {
    key: "settings",
    label: "Settings",
    pages: [
      { key: "settings.authentication-media", label: "Authentication Media", href: "/admin/settings/authentication-media" },
      { key: "settings.points", label: "Points (INR)", href: "/admin/settings/points" },
      { key: "settings.home-page", label: "Home Page", href: "/admin/settings/home-page" },
      { key: "settings.terms-and-conditions", label: "Terms & Conditions", href: "/admin/settings/terms-and-conditions" },
      { key: "settings.colleges", label: "Colleges List", href: "/admin/settings/colleges" },
      { key: "settings.certificate-jobs", label: "Certificate Jobs", href: "/admin/settings/certificate-jobs" },
      { key: "settings.invoice-jobs", label: "Invoice Jobs", href: "/admin/settings/invoice-jobs" },
      { key: "settings.offer-letter-jobs", label: "Offer Letter Jobs", href: "/admin/settings/offer-letter-jobs" },
      { key: "settings.collaboration-jobs", label: "Collaboration Jobs", href: "/admin/settings/collaboration-jobs" },
      { key: "settings.collaboration-domains", label: "Collaboration Domains", href: "/admin/settings/collaboration-domains" },
      { key: "settings.partnership-import", label: "Partnerships", href: "/admin/settings/partnership-import" },
      { key: "settings.announcements", label: "Announcements", href: "/admin/settings/announcements" },
      { key: "settings.referral-commission-tiers", label: "Referral Commission Tiers", href: "/admin/settings/referral-commission-tiers" },
    ],
  },
];

/** Every section-level key (bare), e.g. "courses". */
export const ALL_SECTION_KEYS: string[] = ADMIN_PERMISSION_CATALOG.map((s) => s.key);

/** Every page-level key, e.g. "courses.enrollments". */
export const ALL_PAGE_KEYS: string[] = ADMIN_PERMISSION_CATALOG.flatMap((s) =>
  s.pages.map((p) => p.key),
);

/**
 * All grantable permission keys: section keys + page keys (deduped — single
 * sections contribute one shared key). `admin.access` is deliberately absent.
 */
export const ALL_PERMISSION_KEYS: string[] = Array.from(
  new Set([...ALL_SECTION_KEYS, ...ALL_PAGE_KEYS]),
);

const GRANTABLE_KEY_SET = new Set(ALL_PERMISSION_KEYS);

/** Section key that owns a given permission key. For a bare/single key, itself. */
export const sectionOf = (permissionKey: string): string =>
  permissionKey.includes(".") ? permissionKey.split(".")[0] : permissionKey;

/** Is `key` a real, grantable permission key from the catalog? */
export const isValidPermissionKey = (key: string): boolean =>
  GRANTABLE_KEY_SET.has(key);

/**
 * Core access check (pure). A holder can access `pageKey` when they hold the
 * exact page key OR the whole-section key that owns it. Super-admin bypass is
 * handled by callers (they have implicit full access).
 */
export const hasPageAccess = (
  permissions: readonly string[],
  pageKey: string,
): boolean =>
  permissions.includes(pageKey) || permissions.includes(sectionOf(pageKey));
