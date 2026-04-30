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
import type { HomePageSettings } from "@/types/home-page-settings";

type SectionKey = keyof HomePageSettings;

interface HomePageSettingsContextValue {
  settings: HomePageSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => Promise<void>;
  /** Save a single section slice. Backend body: `{ section, value }`. */
  saveSection: <K extends SectionKey>(
    key: K,
    value: HomePageSettings[K]
  ) => Promise<boolean>;
  /** Section page registers a getter so the layout can save the current section without re-rendering it. */
  registerActiveSection: <K extends SectionKey>(
    key: K,
    getValue: () => HomePageSettings[K]
  ) => () => void;
  /** Layout calls this when the Save button is clicked. Returns success. */
  saveActiveSection: () => Promise<boolean>;
  /** Section page calls this when its local state changes/becomes pristine. */
  setActiveDirty: (dirty: boolean) => void;
  isActiveDirty: boolean;
}

const HomePageSettingsContext =
  createContext<HomePageSettingsContextValue | null>(null);

function parseEnvelope(payload: unknown): HomePageSettings | null {
  if (!payload || typeof payload !== "object") return null;
  const env = payload as { data?: unknown };
  const d = env.data;
  if (!d || typeof d !== "object") return null;
  return d as HomePageSettings;
}

export function HomePageSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<HomePageSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActiveDirty, setIsActiveDirty] = useState(false);

  const activeSectionRef = useRef<{
    key: SectionKey;
    getValue: () => HomePageSettings[SectionKey];
  } | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.admin.homePageSettings);
      const parsed = parseEnvelope(res.data);
      setSettings(parsed ?? {});
    } catch {
      toast.error("Could not load home page settings");
      setSettings({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveSection = useCallback(
    async <K extends SectionKey>(
      key: K,
      value: HomePageSettings[K]
    ): Promise<boolean> => {
      setIsSaving(true);
      try {
        await apiClient.patch(ENDPOINTS.admin.homePageSettings, {
          section: key,
          value,
        });
        setSettings((prev) => ({ ...(prev ?? {}), [key]: value }));
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
    []
  );

  const registerActiveSection = useCallback(
    <K extends SectionKey>(
      key: K,
      getValue: () => HomePageSettings[K]
    ): (() => void) => {
      activeSectionRef.current = {
        key,
        getValue: getValue as () => HomePageSettings[SectionKey],
      };
      setIsActiveDirty(false);
      return () => {
        if (activeSectionRef.current?.key === key) {
          activeSectionRef.current = null;
          setIsActiveDirty(false);
        }
      };
    },
    []
  );

  const saveActiveSection = useCallback(async (): Promise<boolean> => {
    const active = activeSectionRef.current;
    if (!active) {
      toast.error("Nothing to save");
      return false;
    }
    const ok = await saveSection(active.key, active.getValue());
    if (ok) setIsActiveDirty(false);
    return ok;
  }, [saveSection]);

  const value = useMemo<HomePageSettingsContextValue>(
    () => ({
      settings,
      isLoading,
      isSaving,
      reload,
      saveSection,
      registerActiveSection,
      saveActiveSection,
      setActiveDirty: setIsActiveDirty,
      isActiveDirty,
    }),
    [
      settings,
      isLoading,
      isSaving,
      reload,
      saveSection,
      registerActiveSection,
      saveActiveSection,
      isActiveDirty,
    ]
  );

  return (
    <HomePageSettingsContext.Provider value={value}>
      {children}
    </HomePageSettingsContext.Provider>
  );
}

export function useHomePageSettings(): HomePageSettingsContextValue {
  const ctx = useContext(HomePageSettingsContext);
  if (!ctx) {
    throw new Error(
      "useHomePageSettings must be used inside HomePageSettingsProvider"
    );
  }
  return ctx;
}

/**
 * Helper hook for a section page: registers itself with the context, exposes a
 * controlled-state setter and flags dirty state on every change.
 *
 * `T` is the page's resolved (non-undefined) state shape. The page supplies
 * a `buildInitial` that fills in defaults, so `state` is always non-null.
 */
export function useSectionState<K extends SectionKey, T>(
  key: K,
  buildInitial: (settings: HomePageSettings | null) => T
) {
  const { settings, registerActiveSection, setActiveDirty, isLoading } =
    useHomePageSettings();
  const [state, setStateRaw] = useState<T>(() => buildInitial(settings));
  const stateRef = useRef(state);
  stateRef.current = state;

  // Re-seed when settings finish loading.
  useEffect(() => {
    if (!isLoading) {
      const next = buildInitial(settings);
      setStateRaw(next);
      stateRef.current = next;
      setActiveDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Register getter so the shell can call `saveActiveSection` without prop drilling.
  useEffect(() => {
    return registerActiveSection(
      key,
      () => stateRef.current as unknown as HomePageSettings[K]
    );
  }, [key, registerActiveSection]);

  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setStateRaw((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (p: T) => T)(prev)
            : updater;
        stateRef.current = next;
        return next;
      });
      setActiveDirty(true);
    },
    [setActiveDirty]
  );

  return { state, setState, isLoading };
}
