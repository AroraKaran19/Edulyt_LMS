import type { ReactNode } from "react";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";

/**
 * Fonts load here rather than in the page because `next/font` belongs in a
 * server component: it is resolved at build time, and putting it behind
 * "use client" makes the bundler chase it into the browser graph.
 *
 * Fraunces carries the display voice. It has a soft, slightly wonky warmth that
 * reads as generous rather than institutional, which is the right register for
 * something being given away. Plex Mono handles the timer, the coupon code, and
 * the small labels, where it reads as instrument and voucher.
 */
const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export default function ScholarshipLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className={`${display.variable} ${mono.variable}`}>{children}</div>;
}
