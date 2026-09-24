"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FocusEvent } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import type { CaPageSettings, CaSamples } from "@/types/ca-page-settings";
import styles from "../ca.module.css";
import { DEFAULT_SAMPLES } from "../content";
import Icon from "./Icon";

type DocKey = keyof CaSamples;
type PauseReason = "offscreen" | "hidden" | "pointer" | "focus" | "viewer";

const ROTATE_MS = 4000;
const ON_SCREEN_RATIO = 0.3;

const DOCS: { key: DocKey; name: string; when: string; tag: string; soon?: boolean; icon: "doc" | "award" }[] = [
  {
    key: "offerLetter",
    name: "Offer letter",
    when: "Your role, joining date and duration",
    tag: "Within 24 hours",
    soon: true,
    icon: "doc",
  },
  {
    key: "lor",
    name: "Letter of recommendation",
    when: "From our HR team, for what you apply to next",
    tag: "When you finish",
    icon: "doc",
  },
  {
    key: "internshipCertificate",
    name: "Internship certificate",
    when: "Proof of your internship and its dates",
    tag: "When you finish",
    icon: "award",
  },
  {
    key: "trainingCertificate",
    name: "Training certificate",
    when: "For the training you complete with us",
    tag: "When you finish",
    icon: "award",
  },
];

const withFront = (order: DocKey[], key: DocKey) => [key, ...order.filter((k) => k !== key)];

export default function DocumentsSection({ settings }: { settings: CaPageSettings }) {
  // `cycle` counts activations, so re-picking the front row still restarts its countdown.
  const [{ order, cycle }, setStack] = useState({ order: DOCS.map((d) => d.key), cycle: 0 });
  const [paused, setPaused] = useState(true);
  const pauseReasons = useRef(new Set<PauseReason>(["offscreen"]));
  const progress = useRef({ cycle: -1, elapsed: 0 });
  const sectionRef = useRef<HTMLElement>(null);
  const viewerRef = useRef<HTMLDialogElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const src = (key: DocKey) => settings.samples[key] || DEFAULT_SAMPLES[key];
  const bring = (key: DocKey) => setStack((s) => ({ order: withFront(s.order, key), cycle: s.cycle + 1 }));
  const front = DOCS.find((d) => d.key === order[0]) ?? DOCS[0];

  const setPause = useCallback((reason: PauseReason, on: boolean) => {
    const reasons = pauseReasons.current;
    if (on) reasons.add(reason);
    else reasons.delete(reason);
    setPaused(reasons.size > 0);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPause("offscreen", entry.intersectionRatio < ON_SCREEN_RATIO),
      { threshold: ON_SCREEN_RATIO },
    );
    observer.observe(section);
    const onVisibility = () => {
      flushSync(() => setPause("hidden", document.hidden));
      // Hidden tabs skip style recalcs: force one so the CSS fill registers the pause instead of jumping on return.
      if (document.hidden) barRef.current?.getBoundingClientRect();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [setPause]);

  // A pause banks the elapsed time, so the countdown resumes where the progress bar froze.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (progress.current.cycle !== cycle) progress.current = { cycle, elapsed: 0 };
    const current = progress.current;
    const startedAt = performance.now();
    const timer = window.setTimeout(
      () =>
        setStack((s) => {
          const next = DOCS[(DOCS.findIndex((d) => d.key === s.order[0]) + 1) % DOCS.length].key;
          return { order: withFront(s.order, next), cycle: s.cycle + 1 };
        }),
      Math.max(0, ROTATE_MS - current.elapsed),
    );
    return () => {
      window.clearTimeout(timer);
      current.elapsed += performance.now() - startedAt;
    };
  }, [cycle, paused]);

  // Mouse focus stays on a clicked row, so only keyboard focus pauses; otherwise a click would stop rotation.
  const onFocus = (e: FocusEvent<HTMLElement>) => {
    if (e.target instanceof Element && e.target.matches(":focus-visible")) setPause("focus", true);
  };
  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setPause("focus", false);
  };

  const openViewer = () => {
    setPause("viewer", true);
    viewerRef.current?.showModal();
  };

  return (
    <section
      ref={sectionRef}
      className={styles.papers}
      aria-labelledby="ca-papers-title"
      onPointerEnter={() => setPause("pointer", true)}
      onPointerLeave={() => setPause("pointer", false)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className={cn(styles.wrap, styles.papersGrid)}>
        <div>
          <h2 id="ca-papers-title" className={cn(styles.display, styles.sectionTitle)}>
            Paperwork with your name on it.
          </h2>
          <p className={styles.sectionSub}>
            These are the real Airkrit templates. Yours carry your name, your intern ID and your dates.
          </p>
          <ul className={styles.doclist}>
            {DOCS.map((doc) => (
              <li key={doc.key}>
                <button type="button" aria-pressed={order[0] === doc.key} onClick={() => bring(doc.key)}>
                  <span className={styles.doclistIcon}>
                    <Icon name={doc.icon} />
                  </span>
                  <span>
                    <span className={styles.doclistName}>{doc.name}</span>
                    <span className={styles.doclistWhen}>{doc.when}</span>
                  </span>
                  <span className={cn(styles.doclistTag, doc.soon && styles.doclistTagSoon)}>{doc.tag}</span>
                  {order[0] === doc.key && (
                    <span
                      key={cycle}
                      ref={barRef}
                      className={styles.doclistProgress}
                      data-paused={paused ? "" : undefined}
                      style={{ "--dwell": `${ROTATE_MS}ms` } as CSSProperties}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.stack}>
          {DOCS.map((doc) => {
            const depth = order.indexOf(doc.key);
            return (
              <button
                key={doc.key}
                type="button"
                className={styles.paper}
                data-depth={depth}
                aria-label={depth === 0 ? `${doc.name} sample, open full size` : `${doc.name} sample`}
                onClick={() => (depth === 0 ? openViewer() : bring(doc.key))}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(doc.key)} alt="" />
              </button>
            );
          })}
          <p className={styles.stackHint}>Tap the letter in front to read it in full.</p>
        </div>
      </div>

      <dialog
        ref={viewerRef}
        className={styles.viewer}
        aria-labelledby="ca-viewer-title"
        onClose={() => setPause("viewer", false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className={styles.viewerBar}>
          <span id="ca-viewer-title">{front.name}</span>
          <button
            type="button"
            className={styles.viewerClose}
            aria-label="Close"
            onClick={() => viewerRef.current?.close()}
          >
            <Icon name="plus" />
          </button>
        </div>
        <div className={styles.viewerPaper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(front.key)} alt={`${front.name} sample`} />
        </div>
      </dialog>
    </section>
  );
}
