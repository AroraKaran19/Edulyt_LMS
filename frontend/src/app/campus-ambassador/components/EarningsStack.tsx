"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import styles from "../ca.module.css";
import { inr } from "../content";

const COUNT_DELAY_MS = 1500;
const COUNT_MS = 1100;

export default function EarningsStack({ stipend, incentiveCap }: { stipend: number; incentiveCap: number }) {
  const total = stipend + incentiveCap;
  const totalRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = totalRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    el.textContent = inr(0);
    const timer = window.setTimeout(() => {
      let start: number | null = null;
      const tick = (now: number) => {
        start ??= now;
        const p = Math.min(1, (now - start) / COUNT_MS);
        el.textContent = inr(Math.round(total * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, COUNT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      el.textContent = inr(total);
    };
  }, [total]);

  const notifs = [
    { amount: stipend, text: "Fixed stipend for month 1, from Airkrit" },
    { amount: incentiveCap, text: "Performance incentive for month 1" },
  ];

  return (
    <div className={styles.earnings} role="group" aria-label="What a top month looks like">
      {notifs.map((n, i) => (
        <div key={n.text} className={styles.notif} style={{ "--i": i } as CSSProperties}>
          <span className={styles.notifIcon} aria-hidden="true">
            ₹
          </span>
          <div>
            <p className={styles.notifTitle}>
              <span className={styles.num}>{inr(n.amount)}</span> received
            </p>
            <p className={styles.notifText}>{n.text}</p>
          </div>
          <span className={styles.notifTime}>1 Nov</span>
        </div>
      ))}
      <div className={styles.earningsTotal}>
        <span ref={totalRef} className={styles.num}>
          {inr(total)}
        </span>
        <p>What a top month looks like: your stipend plus the full incentive.</p>
      </div>
    </div>
  );
}
