import crypto from "crypto";

export function generateCheckpointToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export interface CheckpointLinkState {
  activatedAt?: Date | null;
  expiryMins: number;
}

export type CheckpointPhase = "not-activated" | "link1-active" | "link1-closed" | "link2-active" | "closed";

const isActive = (link: CheckpointLinkState, now: number): boolean =>
  link.activatedAt != null && now < new Date(link.activatedAt).getTime() + link.expiryMins * 60_000;

/** Single source of truth for a meeting's checkpoint phase, shared with `LiveMeeting`'s own (separate) copy. */
export function computeCheckpointPhase(meeting: { link1: CheckpointLinkState; link2: CheckpointLinkState }): CheckpointPhase {
  const now = Date.now();
  const l1Active = isActive(meeting.link1, now);
  const l2Active = isActive(meeting.link2, now);
  const l1Closed = meeting.link1.activatedAt != null && !l1Active;
  const l2Closed = meeting.link2.activatedAt != null && !l2Active;

  if (l2Active) return "link2-active";
  if (l1Active) return "link1-active";
  if (l1Closed && l2Closed) return "closed";
  if (l1Closed) return "link1-closed";
  return "not-activated";
}

/** True once both link windows have been activated and have expired. */
export function bothCheckpointsClosed(meeting: { link1: CheckpointLinkState; link2: CheckpointLinkState }): boolean {
  const now = Date.now();
  const closesAt = (link: CheckpointLinkState) =>
    link.activatedAt ? new Date(link.activatedAt).getTime() + link.expiryMins * 60_000 : Infinity;
  return (
    meeting.link1.activatedAt != null &&
    meeting.link2.activatedAt != null &&
    now >= closesAt(meeting.link1) &&
    now >= closesAt(meeting.link2)
  );
}

export type CheckpointVerdict = "present" | "absent" | "pending";

/** An override wins; otherwise present iff both links were clicked; otherwise absent once both windows closed. */
export function resolveCheckpointVerdict(opts: {
  override?: "present" | "absent";
  clickedBoth: boolean;
  bothClosed: boolean;
}): CheckpointVerdict {
  if (opts.override) return opts.override;
  if (opts.clickedBoth) return "present";
  if (opts.bothClosed) return "absent";
  return "pending";
}

/** Map of an arbitrary key (a userId or applicationId as a string) to its forced verdict. */
export function overrideMapOf(
  overrides: { key: string; verdict: "present" | "absent" }[] | undefined,
): Map<string, "present" | "absent"> {
  return new Map((overrides ?? []).map((o) => [o.key, o.verdict] as const));
}
