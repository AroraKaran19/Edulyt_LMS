import type { User } from "@/types/user";

const STUDENT_HOME = "/dashboard";

/** Paths that mean "no explicit deep link" — role-based home is used instead. */
function isGenericStudentHome(path: string): boolean {
  const p = path.split("?")[0] || "";
  if (p === "" || p === "/") return true;
  if (p === STUDENT_HOME) return true;
  if (p === "/login" || p === "/register" || p === "/forgot-password") {
    return true;
  }
  return false;
}

/**
 * Resolves post-login navigation: role-specific home when the user only had a
 * generic destination, otherwise preserves `callbackUrl` (cart, course link, etc.).
 */
export function getPostLoginRedirectPath(
  user: Pick<User, "userType"> | { userType?: string },
  callbackUrl: string | null | undefined
): string {
  let raw = (callbackUrl ?? "").trim();
  if (!raw) raw = STUDENT_HOME;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }

  if (!isGenericStudentHome(raw)) {
    return raw;
  }

  const ut = user?.userType;
  if (ut === "admin" || ut === "super-admin") {
    return "/admin";
  }
  if (ut === "instructor") {
    return "/instructor";
  }
  return STUDENT_HOME;
}
