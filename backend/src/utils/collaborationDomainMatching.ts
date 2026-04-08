/**
 * Collaboration domain matching: exact host (e.g. @college.edu) or wildcard
 * `@*.suffix` (e.g. @*.mait.ac.in):
 * - matches apex `suffix` (user@mait.ac.in)
 * - matches one subdomain label (user@cse.mait.ac.in)
 * - does not match nested subdomains (user@a.b.mait.ac.in)
 */

/** `host` = part after @ in email, lowercased. `storedDomain` = DB value e.g. @x.y or @*.x.y */
export function hostMatchesCollaborationDomain(
  host: string,
  storedDomain: string
): boolean {
  const stored = (
    storedDomain.startsWith("@") ? storedDomain.slice(1) : storedDomain
  ).toLowerCase();
  const h = host.toLowerCase();

  if (stored.startsWith("*.")) {
    const suffix = stored.slice(2);
    if (!suffix || !h.endsWith(suffix)) return false;
    // Apex: host equals suffix (e.g. @*.mait.ac.in → mait.ac.in)
    if (h === suffix) return true;
    // One label + suffix (e.g. cse.mait.ac.in); reject a.b.mait.ac.in
    if (!h.endsWith("." + suffix)) return false;
    const prefix = h.slice(0, -(suffix.length + 1));
    if (!prefix || prefix.includes(".")) return false;
    return true;
  }

  return h === stored;
}

/** Regex for finding student emails that match a stored domain key (@host or @*.suffix). */
export function studentEmailRegexForCollaborationDomain(
  domainKey: string
): RegExp {
  const d = domainKey.startsWith("@") ? domainKey.slice(1) : domainKey;
  if (d.startsWith("*.")) {
    const suffix = d.slice(2);
    const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Apex @suffix OR one-label.@suffix
    return new RegExp(
      `^[^@\\s]+@(?:${escaped}|[^.@]+\\.${escaped})$`,
      "i"
    );
  }
  const escaped = d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^[^@\\s]+@${escaped}$`, "i");
}
