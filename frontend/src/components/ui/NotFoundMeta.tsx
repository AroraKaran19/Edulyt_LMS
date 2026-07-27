"use client";

import { useEffect } from "react";

export default function NotFoundMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "404 - Page Not Found | Airkrit";

    const existing = document.querySelector('meta[name="robots"]');
    const previousContent = existing?.getAttribute("content") ?? null;

    // Only a tag created here is ours to remove later.
    let createdMeta: HTMLMetaElement | null = null;
    if (existing) {
      existing.setAttribute("content", "noindex, nofollow");
    } else {
      createdMeta = document.createElement("meta");
      createdMeta.name = "robots";
      createdMeta.content = "noindex, nofollow";
      document.head.appendChild(createdMeta);
    }

    return () => {
      document.title = previousTitle;

      if (createdMeta) {
        // Guard against the node already being detached (fast refresh, or
        // strict-mode double-invoked effects).
        createdMeta.parentNode?.removeChild(createdMeta);
        return;
      }
      // Pre-existing tag: restore its value rather than deleting it.
      if (existing && previousContent !== null) {
        existing.setAttribute("content", previousContent);
      }
    };
  }, []);

  return null;
}
