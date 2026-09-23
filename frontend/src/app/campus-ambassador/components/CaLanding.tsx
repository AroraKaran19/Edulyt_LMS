"use client";

import { useEffect, useState } from "react";
import styles from "../ca.module.css";
import { money } from "../content";
import { CA_REF_STORAGE_KEY } from "@/constants/crm";
import type { CaPageSettings } from "@/types/ca-page-settings";
import ApplyForm from "./ApplyForm";
import ClosingSection from "./ClosingSection";
import DocumentsSection from "./DocumentsSection";
import FaqSection from "./FaqSection";
import HeroSection from "./HeroSection";
import KitSection from "./KitSection";
import MobileDock from "./MobileDock";
import StatementSection from "./StatementSection";
import VideosSection from "./VideosSection";

/**
 * Owns the `?ref=` code for the whole visit. Lazy state plus sessionStorage, so a
 * reload or the Google sign-in round trip keeps the attribution it arrived with.
 */
const readRef = (): string => {
  if (typeof window === "undefined") return "";
  const fromUrl = (new URLSearchParams(window.location.search).get("ref") ?? "").trim().slice(0, 32);
  try {
    if (fromUrl) {
      sessionStorage.setItem(CA_REF_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    return sessionStorage.getItem(CA_REF_STORAGE_KEY) ?? "";
  } catch {
    return fromUrl;
  }
};

export default function CaLanding({ settings }: { settings: CaPageSettings }) {
  const [refCode] = useState(readRef);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("ref")) return;
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.toString());
  }, []);

  return (
    <div className={styles.page}>
      <HeroSection settings={settings} form={<ApplyForm settings={settings} refCode={refCode || null} />} />
      <StatementSection settings={settings} />
      <DocumentsSection settings={settings} />
      <KitSection settings={settings} />
      <VideosSection settings={settings} />
      <FaqSection settings={settings} />
      <ClosingSection settings={settings} />
      <MobileDock stipend={money(settings).stipend} />
    </div>
  );
}
