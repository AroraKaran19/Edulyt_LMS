import { Course, CourseModule } from "@/types";
import { PartialAccessControl } from "@/types/enrollment";

/**
 * Restore checkbox state when editing a domain that has explicit partial access.
 */
export function hydratePartialAccessSelections(
  pa: PartialAccessControl,
  courseDetails: Course
): {
  selectedModules: Set<string>;
  selectedLessons: Record<string, Set<string>>;
  selectedContents: Record<string, Set<string>>;
} {
  const selectedModules = new Set<string>();
  const selectedLessons: Record<string, Set<string>> = {};
  const selectedContents: Record<string, Set<string>> = {};

  if (!pa.accessibleModules?.length || !courseDetails.modules) {
    return { selectedModules, selectedLessons, selectedContents };
  }

  const modules = courseDetails.modules as CourseModule[];

  for (const am of pa.accessibleModules) {
    const mod = modules.find(
      (m) => (typeof m === "string" ? m : m._id) === am.moduleId
    );
    if (!mod || typeof mod === "string") continue;

    const allLessonIds: string[] = Array.isArray(mod.lessons)
      ? mod.lessons
          .map((l) => (typeof l === "string" ? l : l._id || ""))
          .filter(Boolean)
      : [];

    const als = am.accessibleLessons || [];

    const coversAll =
      allLessonIds.length > 0 &&
      allLessonIds.every((id) => als.some((l) => l.lessonId === id));
    const noContent =
      als.length > 0 && als.every((l) => !l.accessibleContentIds?.length);

    if (coversAll && noContent && als.length === allLessonIds.length) {
      selectedModules.add(am.moduleId);
      continue;
    }

    for (const l of als) {
      if (l.accessibleContentIds?.length) {
        selectedContents[l.lessonId] = new Set(l.accessibleContentIds);
      } else {
        if (!selectedLessons[am.moduleId]) {
          selectedLessons[am.moduleId] = new Set<string>();
        }
        selectedLessons[am.moduleId].add(l.lessonId);
      }
    }
  }

  return { selectedModules, selectedLessons, selectedContents };
}

/**
 * Same rules as GiftCourseModal partial access — builds enrollment-style
 * partial access for a single course.
 */
export function buildPartialAccessFromSelections(
  courseDetails: Course,
  courseSelectedModules: Set<string>,
  courseSelectedLessons: Record<string, Set<string>>,
  courseSelectedContents: Record<string, Set<string>>
): PartialAccessControl | undefined {
  if (
    !courseDetails.modules ||
    !Array.isArray(courseDetails.modules)
  ) {
    return undefined;
  }

  const lessonToModuleMap = new Map<string, string>();
  const allModulesMap = new Map<string, CourseModule>();

  (courseDetails.modules as CourseModule[]).forEach((module) => {
    const moduleId = typeof module === "string" ? module : module._id || "";
    if (moduleId && typeof module !== "string") {
      allModulesMap.set(moduleId, module);
      if (Array.isArray(module.lessons)) {
        module.lessons.forEach((lesson) => {
          const lessonId =
            typeof lesson === "string" ? lesson : lesson._id || "";
          if (lessonId) lessonToModuleMap.set(lessonId, moduleId);
        });
      }
    }
  });

  const accessibleModules: NonNullable<
    PartialAccessControl["accessibleModules"]
  > = [];

  courseSelectedModules.forEach((moduleId) => {
    const module = allModulesMap.get(moduleId);
    if (module && typeof module !== "string") {
      const moduleAccess: (typeof accessibleModules)[0] = {
        moduleId,
      };
      if (Array.isArray(module.lessons)) {
        const accessibleLessons = module.lessons
          .map((lesson) => {
            const lessonId =
              typeof lesson === "string" ? lesson : lesson._id || "";
            return { lessonId };
          })
          .filter((l) => l.lessonId);
        if (accessibleLessons.length > 0) {
          moduleAccess.accessibleLessons = accessibleLessons;
        }
      }
      accessibleModules.push(moduleAccess);
    }
  });

  Object.keys(courseSelectedLessons).forEach((moduleId) => {
    if (!courseSelectedModules.has(moduleId)) {
      const moduleLessons = courseSelectedLessons[moduleId];
      if (moduleLessons && moduleLessons.size > 0) {
        accessibleModules.push({
          moduleId,
          accessibleLessons: Array.from(moduleLessons).map((lessonId) => ({
            lessonId,
          })),
        });
      }
    }
  });

  Object.keys(courseSelectedContents).forEach((lessonId) => {
    const contents = courseSelectedContents[lessonId];
    if (contents && contents.size > 0) {
      const moduleId = lessonToModuleMap.get(lessonId);
      if (moduleId) {
        let moduleAccess = accessibleModules.find((m) => m.moduleId === moduleId);
        if (!moduleAccess) {
          moduleAccess = { moduleId, accessibleLessons: [] };
          accessibleModules.push(moduleAccess);
        }
        if (!moduleAccess.accessibleLessons) {
          moduleAccess.accessibleLessons = [];
        }
        let lessonAccess = moduleAccess.accessibleLessons.find(
          (l) => l.lessonId === lessonId
        );
        if (!lessonAccess) {
          lessonAccess = { lessonId, accessibleContentIds: [] };
          moduleAccess.accessibleLessons.push(lessonAccess);
        }
        if (!lessonAccess.accessibleContentIds) {
          lessonAccess.accessibleContentIds = [];
        }
        contents.forEach((contentId) => {
          lessonAccess!.accessibleContentIds!.push(contentId);
        });
      }
    }
  });

  return {
    accessType: "partial",
    accessibleModules:
      accessibleModules.length > 0 ? accessibleModules : undefined,
  };
}

export function hasAnyPartialSelection(
  selectedModules: Set<string>,
  selectedLessons: Record<string, Set<string>>,
  selectedContents: Record<string, Set<string>>
): boolean {
  if (selectedModules.size > 0) return true;
  if (
    Object.values(selectedLessons).some((s) => s && s.size > 0)
  )
    return true;
  if (
    Object.values(selectedContents).some((s) => s && s.size > 0)
  )
    return true;
  return false;
}
