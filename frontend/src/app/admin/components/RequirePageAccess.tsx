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
} from "@/config/adminPermissions";

// First page the viewer may open, in sidebar order; "#" hrefs are actions, not pages.
const firstAccessibleHref = (userType: string | undefined, permissions: readonly string[]): string | null => {
  for (const section of ADMIN_PERMISSION_CATALOG) {
    for (const page of section.pages) {
      if (page.href.includes("#")) continue;
      if (canAccessPageAsRole(userType, permissions, page.key)) return page.href;
    }
  }
  return null;
};

/** Admin page gate: allowed pages render, denied ones redirect to the first allowed page. */
const RequirePageAccess = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Paths whose APIs are super-admin-only, so they are kept out of the
  // permission catalog. Without this branch they would fall through the
  // catalog lookup below and end up completely ungated.
  const isSuperAdminOnly =
    pathname === "/admin/access" ||
    pathname.startsWith("/admin/access/") ||
    pathname === "/admin/users/create-marketer" ||
    pathname === "/admin/users/create-sales";

  const pageKey = isSuperAdminOnly ? null : resolvePageKeyFromPath(pathname);
  const permissions = user?.permissions ?? [];
  const denied =
    !!user &&
    !!pageKey &&
    user.userType !== "super-admin" &&
    !canAccessPageAsRole(user.userType, permissions, pageKey);
  // Denied pages send the viewer to their first allowed page instead of bouncing back.
  const fallbackHref = denied ? firstAccessibleHref(user?.userType, permissions) : null;
  useEffect(() => {
    if (fallbackHref && fallbackHref !== pathname) router.replace(fallbackHref);
  }, [fallbackHref, pathname, router]);

  if (denied) {
    return fallbackHref ? null : (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-lg font-semibold text-gray-900">No admin pages yet</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your account has no page access. Ask a super admin to grant you the pages you need.
        </p>
      </div>
    );
  }

  if (isSuperAdminOnly) {
    return (
      <AuthGuard requiredUserType={["super-admin"]} wrongRoleShowsNotFound>
        {children}
      </AuthGuard>
    );
  }

  // Marketers and sales only ever reach catalog pages.
  if (user?.userType && ROLE_PAGE_KEYS[user.userType] && !pageKey) notFound();

  return <>{children}</>;
};

export default RequirePageAccess;
