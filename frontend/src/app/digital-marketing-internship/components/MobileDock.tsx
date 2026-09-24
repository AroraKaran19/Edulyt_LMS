"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "../ca.module.css";
import { inr } from "../content";
import ButtonLink from "./ButtonLink";

export default function MobileDock({ stipend }: { stipend: number }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("ca-hero");
    const apply = document.getElementById("apply");
    if (!hero || !("IntersectionObserver" in window)) return;

    let heroVisible = true;
    let applyVisible = Boolean(apply);
    const sync = () => setShown(!heroVisible && !applyVisible);

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    heroObserver.observe(hero);

    const applyObserver = new IntersectionObserver(([entry]) => {
      applyVisible = entry.isIntersecting;
      sync();
    });
    if (apply) applyObserver.observe(apply);

    return () => {
      heroObserver.disconnect();
      applyObserver.disconnect();
    };
  }, []);

  return (
    <div className={cn(styles.dock, shown && styles.dockShown)} aria-hidden={!shown}>
      <span className={styles.dockTxt}>
        <span className={styles.num}>{inr(stipend)}</span> a month
        <br />
        plus incentives
      </span>
      <ButtonLink
        href="#apply"
        variant="orange"
        tabIndex={shown ? 0 : -1}
        buttonClassName="px-[18px] py-[11px] text-[15px]"
      >
        Apply now
      </ButtonLink>
    </div>
  );
}
