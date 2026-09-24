/**
 * Canonical catalog of admin-panel page permissions — the single source of
 * truth for page-level RBAC on the frontend. Mirrors
 * `backend/src/config/adminPermissions.ts`; keep the two in sync.
 *
 * Key scheme:
 *   - Whole-section grant  → bare section key   e.g. "courses"
 *   - Single-page grant    → "<section>.<page>"  e.g. "courses.enrollments"
 *   - Single-page sections → one key             e.g. "dashboard"
 *
 * A super-admin has implicit full access. The management page ("/admin/access")
 * is intentionally absent from the catalog, so it can never be granted.
 */

export interface AdminPage {
  key: string;
  label: string;
  href: string;
  /**
   * Belongs to a staff role rather than to a permission grant. Kept in the
   * catalog so a path still resolves to a key, but excluded from the grantable
   * set so it can never be handed to an admin.
   */
  roleOnly?: boolean;
}

export interface AdminSection {
  key: string;
  label: string;
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
      // Own key so granting the pool never grants the whole Leads section.
      { key: "leads.all", label: "All leads", href: "/admin/leads" },
      {
        key: "leads.enquiry-page",
        label: "Configure Enquiry Page",
        href: "/admin/enquiry-page",
      },
      { key: "leads.import", label: "Lead imports", href: "/admin/leads/imports" },
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

export const ALL_SECTION_KEYS: string[] = ADMIN_PERMISSION_CATALOG.map((s) => s.key);

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

export const ALL_PERMISSION_KEYS: string[] = Array.from(
  new Set([...ALL_SECTION_KEYS, ...GRANTABLE_PAGE_KEYS]),
);

const GRANTABLE_KEY_SET = new Set(ALL_PERMISSION_KEYS);

/** Section key that owns a permission key. For a bare/single key, itself. */
export const sectionOf = (permissionKey: string): string =>
  permissionKey.includes(".") ? permissionKey.split(".")[0] : permissionKey;

export const isValidPermissionKey = (key: string): boolean =>
  GRANTABLE_KEY_SET.has(key);

/**
 * Human-readable labels for a permission-key list — a whole-section grant
 * renders as "Courses (all)", individual pages as "Courses: Enrollments".
 */
export const describePermissionLabels = (
  keys: readonly string[] = [],
): string[] => {
  const labels: string[] = [];
  for (const section of ADMIN_PERMISSION_CATALOG) {
    if (!section.single && keys.includes(section.key)) {
      labels.push(`${section.label} (all)`);
      continue;
    }
    for (const page of section.pages) {
      if (keys.includes(page.key) || keys.includes(section.key)) {
        labels.push(
          section.single ? section.label : `${section.label}: ${page.label}`,
        );
      }
    }
  }
  return labels;
};

/** Pure access check — exact page key OR whole-section key that owns it. */
export const hasPageAccess = (
  permissions: readonly string[],
  pageKey: string,
): boolean =>
  permissions.includes(pageKey) || permissions.includes(sectionOf(pageKey));

/** Access check including super-admin implicit full access. */
export const canAccessPage = (
  permissions: readonly string[],
  isSuperAdmin: boolean,
  pageKey: string,
): boolean => isSuperAdmin || hasPageAccess(permissions, pageKey);

/**
 * Page keys a staff role reaches by virtue of the role itself. Mirrors
 * `ROLE_PAGE_KEYS` in `backend/src/config/adminPermissions.ts`; keep the two
 * in sync.
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

/** True for a role whose grant is the role itself, not a permissions array. */
export const isRolePageGated = (userType: string | undefined): boolean =>
  Boolean(userType && ROLE_PAGE_KEYS[userType]);

/**
 * Access check that understands roles, not just permission arrays.
 *
 * A marketer or sales user holds no permissions at all: the role itself is the
 * grant, so `canAccessPage` would deny them every page. Anything that gates an
 * admin route for such a viewer must use this instead.
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

/** True when the holder can see at least one page in the section. */
export const canAccessSection = (
  permissions: readonly string[],
  isSuperAdmin: boolean,
  section: AdminSection,
): boolean =>
  isSuperAdmin || section.pages.some((p) => hasPageAccess(permissions, p.key));

/** First page href the holder can access — used to redirect after a 403 / on landing. */
export const firstAccessibleHref = (
  permissions: readonly string[],
  isSuperAdmin: boolean,
): string | null => {
  for (const section of ADMIN_PERMISSION_CATALOG) {
    for (const page of section.pages) {
      if (canAccessPage(permissions, isSuperAdmin, page.key)) return page.href;
    }
  }
  return null;
};

// Flattened page list sorted by descending href length so the longest (most
// specific) href wins when resolving a pathname that has extra path segments.
const PAGES_BY_HREF_SPECIFICITY: AdminPage[] = ADMIN_PERMISSION_CATALOG.flatMap(
  (s) => s.pages,
).sort((a, b) => b.href.length - a.href.length);

/**
 * Resolve an admin pathname to its catalog page key, or null if the path isn't
 * a catalog-gated page (e.g. "/admin/access", or an unknown route). Matches the
 * longest page href that the pathname equals or is nested under.
 */
export const resolvePageKeyFromPath = (pathname: string): string | null => {
  // Exact dashboard root first ("/admin" is a prefix of everything).
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard";
  const match = PAGES_BY_HREF_SPECIFICITY.find(
    (p) =>
      p.href !== "/admin" &&
      (pathname === p.href || pathname.startsWith(p.href + "/")),
  );
  return match ? match.key : null;
};
