import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "../ca.module.css";

export type IconName =
  | "file"
  | "doc"
  | "award"
  | "gift"
  | "box"
  | "key"
  | "book"
  | "case"
  | "lock"
  | "check"
  | "plus"
  | "down"
  | "left"
  | "play"
  | "chat"
  | "rupee"
  | "trend";

export const ICON_NAMES: readonly IconName[] = [
  "file", "doc", "award", "gift", "box", "key", "book", "case",
  "lock", "check", "plus", "down", "left", "play", "chat", "rupee", "trend",
];

const paths = (name: IconName): ReactNode => {
  switch (name) {
    case "file":
      return (
        <>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M14 3v6h6M12 12v6M9 15l3 3 3-3" />
        </>
      );
    case "doc":
      return (
        <>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M14 3v6h6M8 13h8M8 17h5" />
        </>
      );
    case "award":
      return (
        <>
          <circle cx="12" cy="9" r="6" />
          <path d="M8.5 14 7 22l5-3 5 3-1.5-8" />
        </>
      );
    case "gift":
      return (
        <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      );
    case "box":
      return (
        <>
          <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
          <path d="m3 8 9 5 9-5M12 13v8" />
        </>
      );
    case "key":
      return (
        <>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 9h18M8 21h8" />
        </>
      );
    case "book":
      return (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
          <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
        </>
      );
    case "case":
      return (
        <>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20" />
        </>
      );
    case "lock":
      return (
        <>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      );
    case "check":
      return <path d="M20 6 9 17l-5-5" />;
    case "plus":
      return <path d="M12 5v14M5 12h14" />;
    case "down":
      return <path d="m6 9 6 6 6-6" />;
    case "left":
      return <path d="m15 18-6-6 6-6" />;
    case "play":
      return <path d="M7 4v16l13-8z" />;
    case "chat":
      return <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />;
    case "rupee":
      return <path d="M6 3h12M6 8h12M6 3h3a5 5 0 0 1 0 10H6l8 8" />;
    case "trend":
      return (
        <>
          <path d="m22 7-8.5 8.5-5-5L2 17" />
          <path d="M16 7h6v6" />
        </>
      );
  }
};

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn(styles.icon, name === "play" && styles.iconFill, className)}
    >
      {paths(name)}
    </svg>
  );
}
