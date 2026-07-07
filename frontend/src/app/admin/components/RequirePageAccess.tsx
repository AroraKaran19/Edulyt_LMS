"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AuthGuard from "@/app/providers/AuthGuard";
import { resolvePageKeyFromPath, sectionOf } from "@/config/adminPermissions";

/**
 * Page-level RBAC gate for the admin panel. Runs inside the admin layout (which
 * already confirms the viewer is an admin/super-admin) and resolves the current
 * pathname to a catalog page key, then delegates the actual allow/deny to the
 * shared {@link AuthGuard}:
 *   - "/admin/access" is super-admin only (never in the catalog).
 *   - Catalog pages require the page key OR its whole-section key. Super-admins
 *     bypass (handled inside AuthGuard).
 *   - Routes not in the catalog aren't page-gated here — the backend still
 *     enforces every API call, so this layer is UX, not the security boundary.
 */
const RequirePageAccess = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isAccessPage =
    pathname === "/admin/access" || pathname.startsWith("/admin/access/");
  if (isAccessPage) {
    return (
      <AuthGuard requiredUserType={["super-admin"]} wrongRoleShowsNotFound>
        {children}
      </AuthGuard>
    );
  }

  const pageKey = resolvePageKeyFromPath(pathname);
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
