/**
 * Collaboration domain matching: exact host (e.g. @college.edu) or one-level wildcard
 * (e.g. @*.test.com → any.test.com, 1.test.com; not test.com or a.b.test.com).
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
    if (h === suffix) return false;
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
    return new RegExp(`^[^@\\s]+@[^.@]+\\.${escaped}$`, "i");
  }
  const escaped = d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^[^@\\s]+@${escaped}$`, "i");
}
