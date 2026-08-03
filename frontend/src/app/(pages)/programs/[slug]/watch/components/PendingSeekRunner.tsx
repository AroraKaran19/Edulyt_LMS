"use client";

import { useEffect } from "react";
import { useVideoControls, useVideoTimeState } from "../context/VideoTimeContext";

export interface PendingSeek {
  contentId: string;
  timestamp: number;
  /** Attached-player sequence at the moment the jump was queued. */
  seq: number;
}

/**
 * Fires a cross-lecture jump once the destination video is genuinely ready.
 *
 * Jumping to a note in another lecture navigates first and seeks second, and
 * the gap between those is where this gets subtle. `isLoaded` alone is not a
 * safe trigger: it stays true from the outgoing video until the incoming one
 * reports metadata, so a seek fired in that window lands on the element being
 * unmounted and is silently lost. Requiring `connectionSeq` to have advanced
 * past the value captured when the jump was queued proves a *different* player
 * is attached; requiring `isLoaded` on top of that proves it knows its own
 * duration, without which `seekTo` would clamp the position to zero.
 *
 * Renders nothing. It exists as a separate component purely so that the
 * subscription to the ticking context stays here instead of spreading to the
 * notes list.
 */
const PendingSeekRunner = ({
  pendingRef,
  selectedContentId,
}: {
  pendingRef: React.MutableRefObject<PendingSeek | null>;
  selectedContentId: string;
}) => {
  const { seekTo } = useVideoControls();
  const { isLoaded, connectionSeq } = useVideoTimeState();

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (!isLoaded || connectionSeq <= pending.seq) return;

    if (pending.contentId === selectedContentId) {
      seekTo(pending.timestamp);
    }

    // Either the jump just landed, or a different video loaded first because
    // the student navigated elsewhere. Drop it either way, so a stale seek can
    // never fire against the wrong lecture later.
    pendingRef.current = null;
  }, [isLoaded, connectionSeq, selectedContentId, seekTo, pendingRef]);

  return null;
};

export default PendingSeekRunner;
