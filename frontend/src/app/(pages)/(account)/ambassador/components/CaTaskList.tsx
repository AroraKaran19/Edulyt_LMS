"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ClipboardList } from "lucide-react";
import Pagination from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";
import type { CaTaskMineRow, CaTaskMineStatus } from "@/types/ca-task";
import { dueIn, formatDate, formatTime } from "../deskTime";
import type { DueTone } from "../deskTime";
import s from "../desk.module.css";

const ORDER: Record<CaTaskMineStatus, number> = {
  open: 0,
  "in-review": 1,
  upcoming: 2,
  passed: 3,
  failed: 4,
  missed: 5,
};

const TONE_CLASS: Record<DueTone, string> = {
  calm: s.chipSoon,
  near: s.chipDue,
  urgent: s.chipUrgent,
};

function detail(t: CaTaskMineRow): string {
  switch (t.status) {
    case "open":
      return t.deadline ? `Due ${formatDate(t.deadline)}, ${formatTime(t.deadline)}` : "Open now";
    case "upcoming":
      return t.opensAt ? `Opens ${formatDate(t.opensAt)}` : "Not open yet";
    case "in-review":
      return "Submitted, waiting for review";
    case "passed":
      return t.score === null ? "Passed" : `Passed with a score of ${t.score}`;
    case "failed":
      return "Did not pass this time";
    case "missed":
      return "Deadline passed";
  }
}

function Chip({ task, now }: { task: CaTaskMineRow; now: number }) {
  switch (task.status) {
    case "open": {
      const due = dueIn(task.deadline, now);
      return <span className={cn(s.chip, TONE_CLASS[due.tone])}>{due.label}</span>;
    }
    case "passed":
      return <span className={cn(s.chip, s.chipPts)}>+{task.successPoints} pts</span>;
    case "in-review":
      return <span className={cn(s.chip, s.chipDue)}>In review</span>;
    case "failed":
      return <span className={cn(s.chip, s.chipFail)}>Not passed</span>;
    case "missed":
      return <span className={cn(s.chip, s.chipSoon)}>Missed</span>;
    default:
      return <span className={cn(s.chip, s.chipSoon)}>Upcoming</span>;
  }
}

const PER_PAGE = 5;

const deadlineMs = (t: CaTaskMineRow) => (t.deadline ? new Date(t.deadline).getTime() : Number.POSITIVE_INFINITY);

export default function CaTaskList({ tasks, now }: { tasks: CaTaskMineRow[]; now: number }) {
  const [page, setPage] = useState(1);
  const [seen, setSeen] = useState(tasks);
  if (seen !== tasks) {
    setSeen(tasks);
    setPage(1);
  }

  if (tasks.length === 0) {
    return (
      <div className={s.empty}>
        <span className={s.emptyIc}>
          <ClipboardList aria-hidden="true" />
        </span>
        <h3>No tasks yet</h3>
        <p>New tasks show up here as they open.</p>
      </div>
    );
  }

  const number = new Map(
    [...tasks].sort((a, b) => a.startFromDay - b.startFromDay).map((t, i) => [t.id, i + 1]),
  );
  const sorted = [...tasks].sort(
    (a, b) =>
      ORDER[a.status] - ORDER[b.status] ||
      (a.status === "open" ? deadlineMs(a) - deadlineMs(b) : 0) ||
      a.startFromDay - b.startFromDay,
  );
  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const current = Math.min(page, totalPages);
  const rows = sorted.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <>
    <ul className={s.taskList}>
      {rows.map((t) => {
        const href = `/ambassador/tasks/${t.id}`;
        return (
          <li key={t.id} className={cn(s.task, t.status === "missed" && s.taskMuted)}>
            <span className={cn(s.taskIc, t.status === "passed" && s.taskIcDone)} aria-hidden="true">
              {t.status === "passed" ? <Check strokeWidth={3} /> : number.get(t.id)}
            </span>
            <div>
              <h3 className={s.clamp2} title={t.title}>
                <Link href={href} className={s.taskLink}>
                  {t.title}
                </Link>
              </h3>
              <p>{detail(t)}</p>
            </div>
            <Chip task={t} now={now} />
            {t.status === "open" ? (
              <div className={s.taskCta}>
                <Link href={href} className={cn(s.btn, s.btnOrange, s.btnSmall)} tabIndex={-1} aria-hidden="true">
                  Start task
                </Link>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
    <Pagination page={current} totalPages={totalPages} onPageChange={setPage} windowSize={3} className={s.deskPager} />
    </>
  );
}
