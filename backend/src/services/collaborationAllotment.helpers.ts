import { CollaborationEnrollmentAccess } from "../types/collaborationDomain";
import type { PartialAccessControl } from "../types/enrollment";

/**
 * Maps stored collaboration enrollment rules to enrollment create payload.
 * `validUntil` is written to the enrollment document and is the enrollment
 * expiry date (`isEnrollmentValid` compares `now` to `validUntil`).
 */
export function collaborationAccessToEnrollmentFields(
  ea: CollaborationEnrollmentAccess
): {
  accessControl?: PartialAccessControl;
  collaborationTopNSettings?: { contentsPerLesson: number };
  planType: "elite" | "essential";
  validUntil: Date;
} {
  const enrolledAt = new Date();
  const validUntil = new Date(enrolledAt);
  validUntil.setDate(validUntil.getDate() + ea.durationDays);

  const base = {
    planType: ea.plan,
    validUntil,
  };
  if (ea.mode === "full") {
    return base;
  }

  if (ea.mode === "partial") {
    const mods = ea.partialAccess?.accessibleModules;
    const hasExplicit = Array.isArray(mods) && mods.length > 0;
    const n = ea.topNSettings?.contentsPerLesson;
    const hasTopN = n != null && n >= 1;

    if (hasTopN && !hasExplicit) {
      return {
        ...base,
        collaborationTopNSettings: { contentsPerLesson: n },
      };
    }
    if (hasExplicit && ea.partialAccess) {
      return {
        ...base,
        accessControl: ea.partialAccess as PartialAccessControl,
      };
    }
  }

  return base;
}
