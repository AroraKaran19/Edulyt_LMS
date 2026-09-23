"use client";

import { useState } from "react";
import { CalendarClock, Play } from "lucide-react";
import Pagination from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";
import type { CaMeetingMineItem } from "@/types/ca-meeting";
import { formatDate, formatTime, formatWeekday } from "../deskTime";
import s from "../desk.module.css";

const VERDICT: Record<CaMeetingMineItem["myVerdict"], { label: string; pill: string }> = {
  present: { label: "Present", pill: s.chipPts },
  absent: { label: "Absent", pill: s.chipFail },
  pending: { label: "Attendance not recorded", pill: s.chipSoon },
};

const isLive = (m: CaMeetingMineItem) => m.phase === "link1-active" || m.phase === "link2-active";
const isUnderway = (m: CaMeetingMineItem) => isLive(m) || m.phase === "link1-closed";

export function isPastMeeting(m: CaMeetingMineItem, now: number): boolean {
  if (m.phase === "closed") return true;
  if (isUnderway(m)) return false;
  return new Date(m.endDateTime ?? m.startDateTime).getTime() < now;
}

function schedule(m: CaMeetingMineItem): string {
  const end = m.endDateTime ? ` to ${formatTime(m.endDateTime)}` : "";
  return `${formatWeekday(m.startDateTime)}, ${formatDate(m.startDateTime)} · ${formatTime(m.startDateTime)}${end}`;
}

function Status({ m }: { m: CaMeetingMineItem }) {
  if (isLive(m)) {
    return (
      <span className={cn(s.live, s.livePulse)}>
        <i aria-hidden="true" />
        Live now
      </span>
    );
  }
  return (
    <span className={s.live}>
      <i aria-hidden="true" />
      {isUnderway(m) ? "In progress" : "Coming up next"}
    </span>
  );
}

const PAST_PER_PAGE = 5;

export default function CaMeetingsList({ meetings, now }: { meetings: CaMeetingMineItem[]; now: number }) {
  const [page, setPage] = useState(1);
  const [seen, setSeen] = useState(meetings);
  if (seen !== meetings) {
    setSeen(meetings);
    setPage(1);
  }

  const byStart = [...meetings].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime(),
  );
  const past = byStart.filter((m) => isPastMeeting(m, now)).reverse();
  const ahead = byStart.filter((m) => !isPastMeeting(m, now));
  const featured = ahead.find(isLive) ?? ahead.find(isUnderway) ?? ahead[0] ?? null;
  const later = ahead.filter((m) => m !== featured);
  const pastPages = Math.ceil(past.length / PAST_PER_PAGE);
  const pastPage = Math.min(page, Math.max(pastPages, 1));
  const pastRows = past.slice((pastPage - 1) * PAST_PER_PAGE, pastPage * PAST_PER_PAGE);

  return (
    <div>
      <div className={s.meet}>
        {featured ? (
          <>
            <Status m={featured} />
            <h3>{featured.name}</h3>
            <p>{schedule(featured)}</p>
            {isLive(featured) ? (
              <p className={s.meetNote}>Your host will share the attendance links during the meeting.</p>
            ) : null}
            {featured.meetingLink ? (
              <div className={s.meetBtns}>
                <a
                  href={featured.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(s.btn, s.btnGlass)}
                >
                  Join meeting
                </a>
              </div>
            ) : null}
          </>
        ) : (
          <div className={cn(s.empty, s.emptyDark)}>
            <span className={s.emptyIc}>
              <CalendarClock aria-hidden="true" />
            </span>
            <h3>No meetings coming up</h3>
            <p>When a meeting is scheduled, it shows up here.</p>
          </div>
        )}
      </div>

      <div className={cn(s.card, s.pastCard)}>
        <h3>Past meetings</h3>
        {past.length === 0 ? (
          <p className={s.pastEmpty}>No past meetings yet.</p>
        ) : (
          <>
            <ul className={s.past}>
              {pastRows.map((m) => (
                <li key={m.id} className={s.pastRow}>
                  <span className={s.pastName}>
                    <span className={s.clamp2} title={m.name}>{m.name}</span>
                    <small>
                      {formatDate(m.startDateTime)}, {formatTime(m.startDateTime)}
                      {m.endDateTime ? ` to ${formatTime(m.endDateTime)}` : ""}
                    </small>
                  </span>
                  <span className={cn(s.chip, VERDICT[m.myVerdict].pill)}>{VERDICT[m.myVerdict].label}</span>
                  {m.recordingLink ? (
                    <a
                      href={m.recordingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(s.btn, s.btnWhite, s.btnSmall, s.recording)}
                    >
                      <Play aria-hidden="true" />
                      Watch recording
                      <span className={s.srOnly}> of {m.name} (opens in a new tab)</span>
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
            <Pagination
              page={pastPage}
              totalPages={pastPages}
              onPageChange={setPage}
              windowSize={3}
              className={s.deskPager}
            />
          </>
        )}
      </div>

      {later.length > 0 ? (
        <div className={cn(s.card, s.pastCard)}>
          <h3>Coming up later</h3>
          <ul className={s.past}>
            {later.map((m) => (
              <li key={m.id}>
                <span className={s.pastName}>
                  <span className={s.clamp2} title={m.name}>{m.name}</span>
                </span>
                <span className={s.verdict}>
                  {formatDate(m.startDateTime)}, {formatTime(m.startDateTime)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
