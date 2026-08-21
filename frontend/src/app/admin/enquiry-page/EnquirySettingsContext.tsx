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
  EnquiryPageSettings,
  EnquirySectionKey,
} from "@/types/enquiry-page-settings";

interface ContextValue {
  settings: EnquiryPageSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => Promise<void>;
  saveSection: <K extends EnquirySectionKey>(
    key: K,
    value: EnquiryPageSettings[K],
  ) => Promise<boolean>;
  registerActiveSection: <K extends EnquirySectionKey>(
    key: K,
    getValue: () => EnquiryPageSettings[K],
  ) => () => void;
  saveActiveSection: () => Promise<boolean>;
  setActiveDirty: (dirty: boolean) => void;
  isActiveDirty: boolean;
}

const Ctx = createContext<ContextValue | null>(null);

function parseEnvelope(payload: unknown): EnquiryPageSettings | null {
  if (!payload || typeof payload !== "object") return null;
  const d = (payload as { data?: unknown }).data;
  if (!d || typeof d !== "object") return null;
  return d as EnquiryPageSettings;
}

export function EnquirySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<EnquiryPageSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActiveDirty, setIsActiveDirty] = useState(false);

  const activeSectionRef = useRef<{
    key: EnquirySectionKey;
    getValue: () => EnquiryPageSettings[EnquirySectionKey];
  } | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.admin.enquiryPageSettings);
      setSettings(parseEnvelope(res.data) ?? {});
    } catch {
      toast.error("Could not load enquiry page settings");
      setSettings({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveSection = useCallback(
    async <K extends EnquirySectionKey>(
      key: K,
      value: EnquiryPageSettings[K],
    ): Promise<boolean> => {
      setIsSaving(true);
      try {
        await apiClient.patch(ENDPOINTS.admin.enquiryPageSettings, {
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
    [],
  );

  const registerActiveSection = useCallback(
    <K extends EnquirySectionKey>(
      key: K,
      getValue: () => EnquiryPageSettings[K],
    ): (() => void) => {
      activeSectionRef.current = {
        key,
        getValue: getValue as () => EnquiryPageSettings[EnquirySectionKey],
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
    if (ok) setIsActiveDirty(false);
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
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEnquirySettings(): ContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useEnquirySettings must be used inside EnquirySettingsProvider",
    );
  }
  return ctx;
}

/**
 * Registers the page with the shell's Save button and tracks dirty state.
 * `buildInitial` fills defaults so `state` is never null.
 */
export function useSectionState<K extends EnquirySectionKey, T>(
  key: K,
  buildInitial: (settings: EnquiryPageSettings | null) => T,
) {
  const { settings, registerActiveSection, setActiveDirty, isLoading } =
    useEnquirySettings();
  const [state, setStateRaw] = useState<T>(() => buildInitial(settings));
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!isLoading) {
      const next = buildInitial(settings);
      setStateRaw(next);
      stateRef.current = next;
      setActiveDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    return registerActiveSection(
      key,
      () => stateRef.current as unknown as EnquiryPageSettings[K],
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
    [setActiveDirty],
  );

  return { state, setState, isLoading };
}
