import type { MouseEvent, ReactNode } from "react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";
import styles from "../ca.module.css";

/**
 * The global `scroll-behavior: smooth` (globals.css) does not know about
 * `prefers-reduced-motion`, so an in-page anchor click has to opt out itself.
 * A no-op for anything that is not a same-page hash link.
 */
export const scrollToHash = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
  if (!href.startsWith("#")) return;
  const target = document.getElementById(href.slice(1));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
};

/** A shared button that navigates. The anchor is the one tab stop, so the inner button is taken out of the order. */
export default function ButtonLink({
  href,
  variant,
  external,
  className,
  buttonClassName,
  tabIndex,
  children,
}: {
  href: string;
  variant: "orange" | "white";
  external?: boolean;
  className?: string;
  buttonClassName?: string;
  tabIndex?: number;
  children: ReactNode;
}) {
  const Button = variant === "orange" ? OrangeButton : WhiteButton;
  return (
    <a
      href={href}
      className={cn(styles.btnLink, className)}
      tabIndex={tabIndex}
      onClick={(event) => scrollToHash(event, href)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <Button
        type="button"
        tabIndex={-1}
        glow
        className={cn("font-semibold leading-[1.2]", variant === "white" && "text-[15px]", buttonClassName)}
      >
        {children}
      </Button>
    </a>
  );
}
