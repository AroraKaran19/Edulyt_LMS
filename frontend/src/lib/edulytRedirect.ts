const MOVED_PREFIXES = ["/internships", "/dashboard/internships"];

/** Server-only; read per request so the flag flips with a restart, not a rebuild. */
const edulytOrigin = (): string =>
  (process.env.EDULYT_SITE_URL || "https://www.edulyt.com").replace(/\/+$/, "");

const edulytCutover = (): boolean => process.env.EDULYT_CUTOVER === "true";

/** Where a moved Airkrit path now lives, or null when it has not moved. */
export const edulytRedirectUrl = (url: {
  pathname: string;
  search: string;
}): string | null => {
  if (!edulytCutover()) return null;
  const moved = MOVED_PREFIXES.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );
  return moved ? `${edulytOrigin()}${url.pathname}${url.search}` : null;
};

export const movedCourseUrl = (slug: string): string =>
  `${edulytOrigin()}/programs/${encodeURIComponent(slug)}`;
