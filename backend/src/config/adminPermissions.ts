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
  /**
   * Belongs to a staff role rather than to a permission grant. Kept in the
   * catalog so a path still resolves to a key, but excluded from the grantable
   * set so it can never be handed to an admin.
   */
  roleOnly?: boolean;
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
      { key: "courses.course-internships", label: "Course Internships", href: "/admin/courses/course-internships/manage" },
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
    key: "crm",
    label: "CRM",
    pages: [
      {
        key: "crm.analytics",
        label: "Analytics",
        href: "/admin/crm/analytics",
      },
      { key: "crm.team", label: "Team", href: "/admin/crm/team" },
      // `roleOnly` pages belong to a marketer or sales person: they show that
      // person's own code, team and numbers, so they are meaningless for an
      // admin and are not grantable to one.
      {
        key: "crm.my-leads",
        label: "My leads",
        href: "/admin/crm/my-leads",
        roleOnly: true,
      },
      {
        key: "crm.my-team",
        label: "My team",
        href: "/admin/crm/my-team",
        roleOnly: true,
      },
      {
        key: "crm.performance",
        label: "My performance",
        href: "/admin/crm/performance",
        roleOnly: true,
      },
    ],
  },
  {
    key: "leads",
    label: "Leads",
    pages: [
      // Keeps the `leads` key: grants already stored against it would otherwise
      // silently lose access to the page they have today.
      { key: "leads", label: "Leads submission", href: "/admin/leads" },
      {
        key: "leads.enquiry-page",
        label: "Configure Enquiry Page",
        href: "/admin/enquiry-page",
      },
    ],
  },
  {
    key: "campus-ambassadors",
    label: "Campus Ambassadors",
    pages: [
      // Reuses the CA leads permission key: the directory is a read-only view over the same CAs.
      { key: "crm.ca-leads", label: "All CAs", href: "/admin/crm/cas" },
      { key: "crm.ca-leads", label: "CA leads", href: "/admin/crm/ca-leads" },
      { key: "crm.ca-tasks", label: "CA tasks", href: "/admin/crm/ca-tasks" },
      { key: "crm.ca-meetings", label: "CA meetings", href: "/admin/crm/ca-meetings" },
      // Reuses the CA leads permission key: reviews are a queue over the same CAs.
      { key: "crm.ca-leads", label: "CA reviews", href: "/admin/crm/ca-reviews" },
      { key: "leads.ca-page", label: "Configure CA Page", href: "/admin/ca-page" },
      { key: "ca.vouchers", label: "Voucher requests", href: "/admin/ca-vouchers/requests" },
      { key: "ca.vouchers", label: "Voucher enrollments", href: "/admin/ca-vouchers/enrollments" },
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
    key: "scholarship",
    label: "Scholarship",
    pages: [
      { key: "scholarship.tests", label: "Campaigns", href: "/admin/scholarship/campaigns" },
      { key: "scholarship.analytics", label: "Analytics", href: "/admin/scholarship/analytics" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    pages: [
      { key: "reports.success-points", label: "Success Points", href: "/admin/reports/success-points" },
      { key: "reports.referrals", label: "Referrals", href: "/admin/reports/referrals" },
    ],
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
      { key: "settings.lead-pipeline", label: "Lead Pipeline", href: "/admin/settings/lead-pipeline" },
    ],
  },
];

/** Every section-level key (bare), e.g. "courses". */
export const ALL_SECTION_KEYS: string[] = ADMIN_PERMISSION_CATALOG.map((s) => s.key);

/** Every page-level key, e.g. "courses.enrollments". */
export const ALL_PAGE_KEYS: string[] = ADMIN_PERMISSION_CATALOG.flatMap((s) =>
  s.pages.map((p) => p.key),
);

/** Pages owned by a staff role, never grantable to an admin. */
export const ROLE_ONLY_PAGE_KEYS: ReadonlySet<string> = new Set(
  ADMIN_PERMISSION_CATALOG.flatMap((s) =>
    s.pages.filter((p) => p.roleOnly).map((p) => p.key),
  ),
);

/** Page keys a super-admin may actually grant. */
export const GRANTABLE_PAGE_KEYS: string[] = ALL_PAGE_KEYS.filter(
  (k) => !ROLE_ONLY_PAGE_KEYS.has(k),
);

/**
 * All grantable permission keys: section keys + page keys (deduped — single
 * sections contribute one shared key). `admin.access` is deliberately absent.
 */
export const ALL_PERMISSION_KEYS: string[] = Array.from(
  new Set([...ALL_SECTION_KEYS, ...GRANTABLE_PAGE_KEYS]),
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

/**
 * Page keys a staff role reaches by virtue of the role itself. These roles
 * hold no permissions array at all, so `hasPageAccess` would deny them every
 * page.
 *
 * Mirrored in `frontend/src/config/adminPermissions.ts`; keep the two in sync.
 */
export const ROLE_PAGE_KEYS: Record<string, readonly string[]> = {
  marketer: ["scholarship.tests", "crm.my-team", "crm.performance", "crm.ca-leads"],
  // `crm.my-leads` is the inbox of assigned leads; a marketer has none.
  sales: [
    "scholarship.tests",
    "crm.my-team",
    "crm.performance",
    "crm.my-leads",
    "crm.ca-leads",
  ],
};

/**
 * True for a staff role whose grant is the role itself rather than a
 * permissions array. Such a role is scoped to its own work, so this is also
 * what ownership checks key off. One list, so the two can never disagree.
 */
export const isRolePageGated = (userType: string | undefined): boolean =>
  Boolean(userType && ROLE_PAGE_KEYS[userType]);

/**
 * Access check that understands roles, not just permission arrays. Anything
 * gating an admin route for a viewer who might hold a role-based grant must
 * use this rather than `hasPageAccess`.
 */
export const canAccessPageAsRole = (
  userType: string | undefined,
  permissions: readonly string[],
  pageKey: string,
): boolean => {
  // Checked before the super-admin bypass: a role-only page shows one person's
  // own code and team, so it belongs to that role and to nobody else.
  if (ROLE_ONLY_PAGE_KEYS.has(pageKey)) {
    const own = userType ? ROLE_PAGE_KEYS[userType] : undefined;
    return Boolean(own?.includes(pageKey));
  }
  if (userType === "super-admin") return true;
  const roleKeys = userType ? ROLE_PAGE_KEYS[userType] : undefined;
  // A role-gated user always has their own pages, and a grant adds to them, so
  // widening their access is possible but taking the role's pages away is not.
  if (roleKeys) {
    return roleKeys.includes(pageKey) || hasPageAccess(permissions, pageKey);
  }
  if (userType !== "admin") return false;
  return hasPageAccess(permissions, pageKey);
};
