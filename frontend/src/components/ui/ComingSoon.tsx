"use client";
import Link from "next/link";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { usePathname } from "next/navigation";

const SITE_NAME = "Airkrit India";

const defaultComingSoonDescription =
  "We're preparing something new. This page will be available soon.";

function comingSoonMetadataBase(): URL {
  return new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://www.airkrit.com/"
        : "http://localhost:3000"),
  );
}

export function buildComingSoonMetadata(options?: {
  title?: string;
  description?: string;
}): Metadata {
  const pageTitle = options?.title?.trim();
  const title = pageTitle
    ? `${pageTitle} | ${SITE_NAME}`
    : `Coming soon | ${SITE_NAME}`;
  const description = options?.description ?? defaultComingSoonDescription;

  return {
    title,
    description,
    robots: { index: false, follow: true },
    metadataBase: comingSoonMetadataBase(),
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: "https://www.airkrit.com/logo.png",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const comingSoonMetadata = buildComingSoonMetadata();

export type ComingSoonProps = {
  title?: string;
  description?: string;
  homeLabel?: string;
  homeHref?: string;
  showHomeButton?: boolean;
  className?: string;
};

const ComingSoon = ({
  title = "Coming soon",
  description = "We’re putting the finishing touches on this experience. Check back shortly — it’ll be worth the wait.",
  homeLabel = "Back to home",
  homeHref = "/",
  showHomeButton = true,
  className,
}: ComingSoonProps) => {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "w-full min-h-[min(85vh,720px)] flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <div
        className="max-w-lg w-full flex flex-col items-center gap-8"
        role="status"
        aria-live="polite"
      >
        <div className="relative">
          <div
            className="size-28 sm:size-32 rounded-full bg-linear-to-br from-primary/15 via-[#FFE9DB] to-primary/5 flex items-center justify-center shadow-[0_0_0_1px_rgba(247,113,36,0.15)]"
            aria-hidden
          >
            <Sparkles
              className="size-14 sm:size-16 text-primary"
              strokeWidth={1.5}
            />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-secondary text-xs font-bold shadow-md">
            !
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed text-balance">
            {description}
          </p>
        </div>

        <div className="w-full h-px max-w-xs bg-linear-to-r from-transparent via-primary/25 to-transparent" />

        {showHomeButton ? (
          <Link
            href={pathname == "/" ? "/programs" : "/"}
            className="inline-flex"
          >
            <OrangeButton className="px-8 py-3 text-sm font-semibold" blinkIcon>
              {pathname == "/" ? "Browse Courses" : homeLabel}
            </OrangeButton>
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default ComingSoon;
