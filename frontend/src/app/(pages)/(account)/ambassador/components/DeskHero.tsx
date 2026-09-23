"use client";

import { Check } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import type { CaDesk } from "@/types/ca-desk";
import type { Tenure } from "../deskTime";
import CaProgressCard from "./CaProgressCard";
import s from "../desk.module.css";

interface Props {
  firstName: string;
  designation: string;
  collegeName: string | null;
  link: string;
  copied: boolean;
  onCopy: () => void;
  tenure: Tenure | null;
  desk: CaDesk | null;
}

function TenureBar({ tenure }: { tenure: Tenure }) {
  const pct = tenure.total > 0 ? Math.round((tenure.day / tenure.total) * 100) : 0;
  const left =
    tenure.day === 0
      ? `Starts in ${tenure.daysToStart} day${tenure.daysToStart === 1 ? "" : "s"}`
      : tenure.daysLeft === 0 && tenure.day === tenure.total
        ? "Last day of your tenure"
        : `Day ${tenure.day} of ${tenure.total}`;
  return (
    <div className={s.tenure}>
      <div
        className={s.tenureBar}
        role="progressbar"
        aria-label="Your tenure"
        aria-valuemin={0}
        aria-valuemax={tenure.total}
        aria-valuenow={tenure.day}
        aria-valuetext={left}
      >
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className={s.tenureRow}>
        <span>{left}</span>
        <span>{tenure.day === 0 ? `Starts ${tenure.startLabel}` : `Ends ${tenure.endLabel}`}</span>
      </div>
    </div>
  );
}

export default function DeskHero({ firstName, designation, collegeName, link, copied, onCopy, tenure, desk }: Props) {
  const shown = link.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(link)}`;

  return (
    <header className={s.hero}>
      <div className={cn(s.wrap, s.heroGrid, !desk?.isCa && s.heroSolo)}>
        <div>
          <h1 className={s.display}>{firstName ? `Good to see you, ${firstName}.` : "Good to see you."}</h1>
          <p className={s.heroSub}>
            <b>{designation}</b>
            {collegeName ? ` at ${collegeName}` : null}
          </p>
          {desk?.isCa && tenure ? <TenureBar tenure={tenure} /> : null}
          <div className={s.share}>
            <div className={s.shareLink}>
              <span title={link}>{shown}</span>
            </div>
            <OrangeButton onClick={onCopy} className={cn(s.btn, s.btnOrange, copied && s.copied)}>
              {copied ? <Check aria-hidden="true" /> : null}
              {copied ? "Copied" : "Copy link"}
            </OrangeButton>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={cn(s.btn, s.btnGlass)}>
              Share on WhatsApp
            </a>
            <span className={s.srOnly} aria-live="polite">
              {copied ? "Link copied" : ""}
            </span>
          </div>
        </div>
        {desk?.isCa ? (
          <CaProgressCard
            caPoints={desk.caPoints}
            thresholdPct={desk.thresholdPct}
            availablePoints={desk.availablePoints}
            requiredPoints={desk.requiredPoints}
            pointsFromTasks={desk.pointsFromTasks}
            pointsFromMeetings={desk.pointsFromMeetings}
          />
        ) : null}
      </div>
    </header>
  );
}
