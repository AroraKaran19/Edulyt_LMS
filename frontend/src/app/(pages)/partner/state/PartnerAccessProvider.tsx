"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import usePartner, {
  type PartnerAccessFlags,
  type PartnerCollegeContext,
} from "@/hooks/usePartner";

interface PartnerAccessValue {
  college: PartnerCollegeContext | null;
  access: PartnerAccessFlags;
  loading: boolean;
}

/** Defaults to full access so the sidebar never hides links before /me loads. */
const DEFAULT_VALUE: PartnerAccessValue = {
  college: null,
  access: { courseAnalytics: true, internshipAnalytics: true },
  loading: true,
};

const PartnerAccessContext = createContext<PartnerAccessValue>(DEFAULT_VALUE);

export function PartnerAccessProvider({ children }: { children: ReactNode }) {
  const { getMe } = usePartner();
  const [value, setValue] = useState<PartnerAccessValue>(DEFAULT_VALUE);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        setValue({ college: me.college, access: me.access, loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setValue((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [getMe]);

  return (
    <PartnerAccessContext.Provider value={value}>
      {children}
    </PartnerAccessContext.Provider>
  );
}

export function usePartnerAccess(): PartnerAccessValue {
  return useContext(PartnerAccessContext);
}
