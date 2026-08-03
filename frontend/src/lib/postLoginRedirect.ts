import type { User } from "@/types/user";

const STUDENT_HOME = "/dashboard";

/** Path used as NextAuth `callbackUrl` for OAuth so the final redirect runs client-side (role-based). */
export const OAUTH_HANDOFF_PATH = "/auth-redirect" as const;

/**
 * After OAuth, NextAuth redirects the browser to `callbackUrl` (server redirect).
 * That must be this handoff page — not /dashboard — or admins never hit client-side
 * getPostLoginRedirectPath from login/register.
 *
 * @param nextFromQuery optional safe same-origin path (e.g. ?callbackUrl= from login/register)
 */
export function buildOAuthHandoffPath(
  nextFromQuery: string | null | undefined
): string {
  const safe = safeRelativeAppPath(nextFromQuery);
  if (safe) {
    return `${OAUTH_HANDOFF_PATH}?next=${encodeURIComponent(safe)}`;
  }
  return OAUTH_HANDOFF_PATH;
}

function safeRelativeAppPath(
  value: string | null | undefined
): string | undefined {
  if (value == null) return undefined;
  let p = value.trim();
  try {
    p = decodeURIComponent(p);
  } catch {
    return undefined;
  }
  if (!p.startsWith("/") || p.startsWith("//")) return undefined;
  return p;
}

/** Paths that mean "no explicit deep link" — role-based home is used instead. */
function isGenericStudentHome(path: string): boolean {
  const [p = "", query = ""] = path.split("?");

  // A query string is an explicit destination even when the path is the plain
  // home: `/dashboard?refer=1` opens the Refer & Earn modal, and collapsing it
  // to `/dashboard` would silently drop what the learner clicked for.
  if (query) return false;

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
 * Admins, super-admins, and instructors always go to their app home.
 */
export function getPostLoginRedirectPath(
  user: Pick<User, "userType"> | { userType?: string },
  callbackUrl: string | null | undefined
): string {
  const ut = user?.userType;
  if (ut === "admin" || ut === "super-admin") {
    return "/admin";
  }
  if (ut === "instructor") {
    return "/instructor";
  }
  if (ut === "partner") {
    return "/partner/dashboard";
  }

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

  if (ut === "collaborator") {
    return "/profile";
  }

  return STUDENT_HOME;
}
