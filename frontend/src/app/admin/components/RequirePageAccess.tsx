"use client";

import React from "react";
import { notFound, usePathname } from "next/navigation";
import AuthGuard from "@/app/providers/AuthGuard";
import useAuth from "@/hooks/useAuth";
import {
  MARKETER_PAGE_KEYS,
  resolvePageKeyFromPath,
  sectionOf,
} from "@/config/adminPermissions";

/**
 * Page-level RBAC gate for the admin panel. Runs inside the admin layout (which
 * already confirms the viewer is admin, super-admin, or marketer) and resolves
 * the current pathname to a catalog page key, then delegates the actual
 * allow/deny to the shared {@link AuthGuard}:
 *   - "/admin/access" is super-admin only (never in the catalog).
 *   - A marketer is allowed by role rather than by permission key.
 *   - Catalog pages require the page key OR its whole-section key. Super-admins
 *     bypass (handled inside AuthGuard).
 *   - Routes not in the catalog aren't page-gated here — the backend still
 *     enforces every API call, so this layer is UX, not the security boundary.
 */
const RequirePageAccess = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  // Paths whose APIs are super-admin-only, so they are kept out of the
  // permission catalog. Without this branch they would fall through the
  // catalog lookup below and end up completely ungated.
  const isSuperAdminOnly =
    pathname === "/admin/access" ||
    pathname.startsWith("/admin/access/") ||
    pathname === "/admin/users/create-marketer";
  if (isSuperAdminOnly) {
    return (
      <AuthGuard requiredUserType={["super-admin"]} wrongRoleShowsNotFound>
        {children}
      </AuthGuard>
    );
  }

  const pageKey = resolvePageKeyFromPath(pathname);

  // Marketers carry no permissions array, so the AuthGuard permission path below
  // would deny them everything. Their allowed set is fixed by the role instead.
  // Denial uses notFound() to match how AuthGuard turns away a wrong role.
  if (user?.userType === "marketer") {
    if (pageKey && MARKETER_PAGE_KEYS.includes(pageKey)) {
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
