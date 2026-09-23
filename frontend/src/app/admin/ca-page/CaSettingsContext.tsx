"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  CaPageAdminSectionKey,
  CaPageAdminSettings,
} from "@/types/ca-page-admin-settings";

interface ContextValue {
  settings: CaPageAdminSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => Promise<void>;
  saveSection: <K extends CaPageAdminSectionKey>(
    key: K,
    value: CaPageAdminSettings[K],
  ) => Promise<boolean>;
  registerActiveSection: <K extends CaPageAdminSectionKey>(
    key: K,
    getValue: () => CaPageAdminSettings[K],
  ) => () => void;
  saveActiveSection: () => Promise<boolean>;
  reportDirty: (key: CaPageAdminSectionKey, dirty: boolean) => void;
  isActiveDirty: boolean;
  /** Bumped on every successful save so the open section can rebase. */
  saveNonce: number;
}

const Ctx = createContext<ContextValue | null>(null);

function parseEnvelope(payload: unknown): CaPageAdminSettings | null {
  if (!payload || typeof payload !== "object") return null;
  const d = (payload as { data?: unknown }).data;
  if (!d || typeof d !== "object") return null;
  return d as CaPageAdminSettings;
}

export function CaSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CaPageAdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActiveDirty, setIsActiveDirty] = useState(false);
  const [saveNonce, setSaveNonce] = useState(0);

  const activeSectionRef = useRef<{
    key: CaPageAdminSectionKey;
    getValue: () => CaPageAdminSettings[CaPageAdminSectionKey];
  } | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.admin.caPageSettings);
      setSettings(parseEnvelope(res.data));
    } catch {
      toast.error("Could not load CA page settings");
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveSection = useCallback(
    async <K extends CaPageAdminSectionKey>(
      key: K,
      value: CaPageAdminSettings[K],
    ): Promise<boolean> => {
      setIsSaving(true);
      try {
        const res = await apiClient.patch(ENDPOINTS.admin.caPageSettings, {
          section: key,
          value,
        });
        // Rebase on what the server actually stored, not the value just sent:
        // `sanitizeSection` can silently drop rows (an invalid video URL, an
        // incomplete FAQ), and echoing the local value would show those as
        // saved until the next reload.
        const saved = parseEnvelope(res.data);
        if (saved) setSettings(saved);
        toast.success("Section saved");
        return true;
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ?? "Save failed";
        toast.error(msg);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  /** Keyed, so a section that has already been navigated away from cannot flip
   *  the flag the shell reads for the one now on screen. */
  const reportDirty = useCallback(
    (key: CaPageAdminSectionKey, dirty: boolean) => {
      if (activeSectionRef.current?.key !== key) return;
      setIsActiveDirty(dirty);
    },
    [],
  );

  const registerActiveSection = useCallback(
    <K extends CaPageAdminSectionKey>(
      key: K,
      getValue: () => CaPageAdminSettings[K],
    ): (() => void) => {
      activeSectionRef.current = {
        key,
        getValue: getValue as () => CaPageAdminSettings[CaPageAdminSectionKey],
      };
      setIsActiveDirty(false);
      return () => {
        if (activeSectionRef.current?.key === key) {
          activeSectionRef.current = null;
          setIsActiveDirty(false);
        }
      };
    },
    [],
  );

  const saveActiveSection = useCallback(async (): Promise<boolean> => {
    const active = activeSectionRef.current;
    if (!active) {
      toast.error("Nothing to save");
      return false;
    }
    const ok = await saveSection(active.key, active.getValue());
    if (ok) {
      setIsActiveDirty(false);
      setSaveNonce((n) => n + 1);
    }
    return ok;
  }, [saveSection]);

  const value = useMemo<ContextValue>(
    () => ({
      settings,
      isLoading,
      isSaving,
      reload,
      saveSection,
      registerActiveSection,
      saveActiveSection,
      reportDirty,
      isActiveDirty,
      saveNonce,
    }),
    [
      settings,
      isLoading,
      isSaving,
      reload,
      saveSection,
      registerActiveSection,
      saveActiveSection,
      reportDirty,
      isActiveDirty,
      saveNonce,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCaSettings(): ContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useCaSettings must be used inside CaSettingsProvider");
  }
  return ctx;
}

/** Structural comparison, since every section value is plain JSON. */
function isSameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((item, i) => isSameValue(item, b[i]))
    );
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
  for (const k of keys) {
    if (!isSameValue(ao[k], bo[k])) return false;
  }
  return true;
}

/**
 * Registers the page with the shell's Save button and tracks dirty state.
 * `buildInitial` fills defaults so `state` is never null.
 */
export function useSectionState<K extends CaPageAdminSectionKey, T>(
  key: K,
  buildInitial: (settings: CaPageAdminSettings | null) => T,
) {
  const { settings, registerActiveSection, reportDirty, isLoading, saveNonce } =
    useCaSettings();
  const [state, setStateRaw] = useState<T>(() => buildInitial(settings));
  const stateRef = useRef(state);
  stateRef.current = state;
  /** What is on the server: the yardstick for "unsaved changes". */
  const savedRef = useRef(state);

  useEffect(() => {
    if (!isLoading) {
      const next = buildInitial(settings);
      setStateRaw(next);
      stateRef.current = next;
      savedRef.current = next;
      reportDirty(key, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // A save can come back with a sanitized value that differs from what was
  // sent (a dropped row, a cleared field), so the section rebases from the
  // server's answer rather than treating what it sent as the new baseline.
  useEffect(() => {
    const next = buildInitial(settings);
    setStateRaw(next);
    stateRef.current = next;
    savedRef.current = next;
    reportDirty(key, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveNonce]);

  useEffect(() => {
    return registerActiveSection(
      key,
      () => stateRef.current as unknown as CaPageAdminSettings[K],
    );
  }, [key, registerActiveSection]);

  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const next =
        typeof updater === "function"
          ? (updater as (p: T) => T)(stateRef.current)
          : updater;
      stateRef.current = next;
      setStateRaw(next);
      // A widget that rewrites its own value on mount is not an edit, so the
      // flag follows the value, not the fact that a setter ran.
      reportDirty(key, !isSameValue(next, savedRef.current));
    },
    [key, reportDirty],
  );

  return { state, setState, isLoading };
}
