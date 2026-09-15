/** Airkrit path prefix, and the prefix it lives under on Edulyt. */
const MOVED_PREFIXES: readonly [from: string, to: string][] = [
  ["/internships", "/career"],
  ["/dashboard/internships", "/dashboard/internships"],
];

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
  for (const [from, to] of MOVED_PREFIXES) {
    if (url.pathname === from || url.pathname.startsWith(`${from}/`)) {
      return `${edulytOrigin()}${to}${url.pathname.slice(from.length)}${url.search}`;
    }
  }
  return null;
};

export const movedCourseUrl = (slug: string): string =>
  `${edulytOrigin()}/programs/${encodeURIComponent(slug)}`;
