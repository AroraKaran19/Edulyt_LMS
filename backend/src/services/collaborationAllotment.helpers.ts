import { CollaborationEnrollmentAccess } from "../types/collaborationDomain";
import type { PartialAccessControl } from "../types/enrollment";

/**
 * Maps stored collaboration enrollment rules to enrollment create payload.
 */
export function collaborationAccessToEnrollmentFields(
  ea: CollaborationEnrollmentAccess
): {
  accessControl?: PartialAccessControl;
  collaborationTopNSettings?: { contentsPerLesson: number };
} {
  if (ea.mode === "full") {
    return {};
  }

  if (ea.mode === "partial") {
    const mods = ea.partialAccess?.accessibleModules;
    const hasExplicit = Array.isArray(mods) && mods.length > 0;
    const n = ea.topNSettings?.contentsPerLesson;
    const hasTopN = n != null && n >= 1;

    if (hasTopN && !hasExplicit) {
      return { collaborationTopNSettings: { contentsPerLesson: n } };
    }
    if (hasExplicit && ea.partialAccess) {
      return { accessControl: ea.partialAccess as PartialAccessControl };
    }
  }

  return {};
}
