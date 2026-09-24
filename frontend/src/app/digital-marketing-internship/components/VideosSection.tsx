"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CaPageSettings } from "@/types/ca-page-settings";
import styles from "../ca.module.css";
import Icon from "./Icon";

export default function VideosSection({ settings }: { settings: CaPageSettings }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { items } = settings.videos;

  // The play button unmounts in favour of the `<video>`, which would otherwise
  // drop focus to `body`.
  useEffect(() => {
    if (playing !== null) videoRef.current?.focus();
  }, [playing]);

  if (!items.length) return null;

  return (
    <section className={styles.reels} aria-labelledby="ca-reels-title">
      <div className={styles.wrap}>
        <div className={styles.reelsHead}>
          <div>
            <h2 id="ca-reels-title" className={cn(styles.display, styles.sectionTitle)}>
              Hear it from ambassadors.
            </h2>
            <p className={styles.sectionSub}>Short videos from our marketing and social media marketing interns.</p>
          </div>
        </div>
        <div className={styles.reelsRow} role="list">
          {items.map((video, i) => (
            <div key={`${i}-${video.url}`} className={styles.reel} role="listitem">
              {playing === i ? (
                <video
                  ref={videoRef}
                  tabIndex={-1}
                  className={styles.reelVideo}
                  src={video.url}
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <button
                  type="button"
                  className={styles.reelBtn}
                  aria-label={`Play video: ${[video.role, video.college].filter(Boolean).join(", ") || "ambassador"}`}
                  onClick={() => setPlaying(i)}
                >
                  <span className={styles.reelBg} />
                  {video.duration && <span className={styles.reelLen}>{video.duration}</span>}
                  <span className={styles.reelPlay}>
                    <Icon name="play" />
                  </span>
                  <span className={styles.reelCap}>
                    {video.role && <span className={styles.reelRole}>{video.role}</span>}
                    {video.college && <span className={styles.reelCollege}>{video.college}</span>}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
