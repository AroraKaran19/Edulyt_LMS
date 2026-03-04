"use client";

import { useEffect } from "react";

/**
 * Sets 404-specific metadata (title, robots) since not-found.tsx
 * cannot export metadata in Next.js App Router.
 */
export default function NotFoundMeta() {
  useEffect(() => {
    document.title = "404 - Page Not Found | Airkrit";
    const meta = document.querySelector('meta[name="robots"]');
    if (meta) {
      meta.setAttribute("content", "noindex, nofollow");
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "robots";
      newMeta.content = "noindex, nofollow";
      document.head.appendChild(newMeta);
    }
    return () => {
      document.title = "Airkrit India";
      const m = document.querySelector('meta[name="robots"]');
      if (m && m.getAttribute("content") === "noindex, nofollow") {
        m.remove();
      }
    };
  }, []);
  return null;
}
