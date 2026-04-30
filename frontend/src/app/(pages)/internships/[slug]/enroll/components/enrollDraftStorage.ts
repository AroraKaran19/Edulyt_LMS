export const ENROLL_DRAFT_STORAGE_V = 1 as const;

export type StoredEnrollDraft = {
  v: typeof ENROLL_DRAFT_STORAGE_V;
  slug: string;
  flow: "entrance" | "paid";
  values: Record<string, unknown>;
};

export function enrollDraftStorageKey(slug: string): string {
  return `edulyt:enroll-form:${encodeURIComponent(slug)}`;
}

export function readEnrollDraft(slug: string): StoredEnrollDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(enrollDraftStorageKey(slug));
    if (!raw) return null;
    const doc = JSON.parse(raw) as StoredEnrollDraft;
    if (doc.v !== ENROLL_DRAFT_STORAGE_V || doc.slug !== slug) return null;
    if (!doc.values || typeof doc.values !== "object") return null;
    return doc;
  } catch {
    return null;
  }
}

export function writeEnrollDraftDoc(doc: StoredEnrollDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(enrollDraftStorageKey(doc.slug), JSON.stringify(doc));
  } catch {
    /* quota / private mode */
  }
}

export function clearEnrollDraft(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(enrollDraftStorageKey(slug));
  } catch {
    /* noop */
  }
}
