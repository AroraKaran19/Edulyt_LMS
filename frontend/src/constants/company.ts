/** Company-wide facts, for any page that states them. */

export const FOUNDED_YEAR = 2016;

/** Derived so the figure is never a hardcoded number that goes stale. */
export const yearsInBusiness = (now: Date = new Date()): number =>
  now.getFullYear() - FOUNDED_YEAR;
