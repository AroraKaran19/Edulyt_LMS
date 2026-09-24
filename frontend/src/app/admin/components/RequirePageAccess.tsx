"use client";

import React, { useEffect } from "react";
import { notFound, usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/app/providers/AuthGuard";
import useAuth from "@/hooks/useAuth";
import {
  ADMIN_PERMISSION_CATALOG,
  ROLE_PAGE_KEYS,
  canAccessPageAsRole,
  resolvePageKeyFromPath,
  sectionOf,
} from "@/config/adminPermissions";

// First page the viewer may open, in sidebar order; "#" hrefs are actions, not pages.
const firstAccessibleHref = (userType: string | undefined, permissions: readonly string[]): string | null => {
  for (const section of ADMIN_PERMISSION_CATALOG) {
    for (const page of section.pages) {
      if (page.key === "dashboard" || page.href.includes("#")) continue;
      if (canAccessPageAsRole(userType, permissions, page.key)) return page.href;
    }
  }
  return null;
};

/**
 * Page-level RBAC gate for the admin panel. Runs inside the admin layout (which
 * already confirms the viewer is admin, super-admin, marketer, or sales) and
 * resolves
 * the current pathname to a catalog page key, then delegates the actual
 * allow/deny to the shared {@link AuthGuard}:
 *   - "/admin/access" is super-admin only (never in the catalog).
 *   - A marketer or sales user is allowed by role rather than by permission key.
 *   - Catalog pages require the page key OR its whole-section key. Super-admins
 *     bypass (handled inside AuthGuard).
 *   - Routes not in the catalog aren't page-gated here — the backend still
 *     enforces every API call, so this layer is UX, not the security boundary.
 */
const RequirePageAccess = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const onDashboard = pathname === "/admin" || pathname === "/admin/";
  const permissions = user?.permissions ?? [];
  const fallbackHref =
    onDashboard && user && !canAccessPageAsRole(user.userType, permissions, "dashboard")
      ? firstAccessibleHref(user.userType, permissions)
      : null;
  useEffect(() => {
    if (fallbackHref) router.replace(fallbackHref);
  }, [fallbackHref, router]);
  if (fallbackHref) return null;

  // Paths whose APIs are super-admin-only, so they are kept out of the
  // permission catalog. Without this branch they would fall through the
  // catalog lookup below and end up completely ungated.
  const isSuperAdminOnly =
    pathname === "/admin/access" ||
    pathname.startsWith("/admin/access/") ||
    pathname === "/admin/users/create-marketer" ||
    pathname === "/admin/users/create-sales";
  if (isSuperAdminOnly) {
    return (
      <AuthGuard requiredUserType={["super-admin"]} wrongRoleShowsNotFound>
        {children}
      </AuthGuard>
    );
  }

  const pageKey = resolvePageKeyFromPath(pathname);

  // Role-gated staff carry no permissions array, so the AuthGuard permission
  // path below would deny them everything. Their allowed set is fixed by the
  // role instead. Denial uses notFound() to match how AuthGuard turns away a
  // wrong role.
  const roleKeys = user?.userType ? ROLE_PAGE_KEYS[user.userType] : undefined;
  if (roleKeys) {
    if (pageKey && canAccessPageAsRole(user?.userType, permissions, pageKey)) {
      return <>{children}</>;
    }
    notFound();
  }

  if (!pageKey) return <>{children}</>;

  // Holding the exact page key OR the whole-section key grants access;
  // AuthGuard treats requiredPermissions as OR and bypasses for super-admins.
  return (
    <AuthGuard requiredPermissions={[pageKey, sectionOf(pageKey)]}>
      {children}
    </AuthGuard>
  );
};

export default RequirePageAccess;
