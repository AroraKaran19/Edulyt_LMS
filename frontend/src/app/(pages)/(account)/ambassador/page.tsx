"use client";

import { useEffect, useRef, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AlertCircle, CalendarClock, Users } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "@/hooks/useAuth";
import useCrm, { AMBASSADOR_KIND_TAB_LABELS } from "@/hooks/useCrm";
import useCaTasks from "@/hooks/useCaTasks";
import useCaMeetings from "@/hooks/useCaMeetings";
import useCaDesk from "@/hooks/useCaDesk";
import { useCaVoucher } from "@/hooks/useCaVouchers";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";
import { EMPTY_CA_SETTINGS, getCaPageSettings } from "@/lib/ca-page/getCaPageSettings";
import { caBodyFont, caDisplayFont } from "@/app/digital-marketing-internship/fonts";
import { toDrafts } from "@/components/admin/crm/ExtraQuestionsEditor";
import type { QuestionDraft } from "@/components/admin/crm/ExtraQuestionsEditor";
import type { CaTaskMineRow } from "@/types/ca-task";
import type { CaMeetingMineItem } from "@/types/ca-meeting";
import type { CaDesk, CaReferralLeadsPage } from "@/types/ca-desk";
import type { CaPageSettings } from "@/types/ca-page-settings";
import type { CaVoucherMe } from "@/types/ca-voucher";
import CaTaskList from "./components/CaTaskList";
import CaMeetingsList, { isPastMeeting } from "./components/CaMeetingsList";
import DeskHero from "./components/DeskHero";
import DeskTiles from "./components/DeskTiles";
import type { TileValue } from "./components/DeskTiles";
import DeskLeads from "./components/DeskLeads";
import DeskEarnings from "./components/DeskEarnings";
import CaPayoutCard from "./components/CaPayoutCard";
import DeskQuestions from "./components/DeskQuestions";
import DeskSkeleton from "./components/DeskSkeleton";
import VoucherCard from "./components/VoucherCard";
import { tenureOf } from "./deskTime";
import s from "./desk.module.css";

// Same config as the root layout; the variable lets the desk's buttons use it under Switzer.
const siteFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-desk-site",
});

const NEWLINE = String.fromCharCode(10);
const LEADS_PER_PAGE = 10;

const shareUrl = (code: string) =>
  typeof window === "undefined" ? `/enquiry?ref=${code}` : `${window.location.origin}/enquiry?ref=${code}`;

type Phase = "loading" | "ready" | "not-allowed" | "error";

function useNow(stepMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(id);
  }, [stepMs]);
  return now;
}

export default function AmbassadorPage() {
  const { getProfile, saveQuestion, isLoading } = useCrm();
  const { user } = useAuth();
  const { getDesk, listMyLeads } = useCaDesk();
  const { listMine: listMyCaTasks } = useCaTasks();
  const { listMine: listMyCaMeetings } = useCaMeetings();
  const { getMe: getMyVoucher } = useCaVoucher();
  const now = useNow();

  const [phase, setPhase] = useState<Phase>("loading");
  const [attempt, setAttempt] = useState(0);
  const [code, setCode] = useState<string | null>(null);
  const [desk, setDesk] = useState<CaDesk | null>(null);
  const [settings, setSettings] = useState<CaPageSettings>(EMPTY_CA_SETTINGS);
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  /** Granted by their marketer; false means the form asks the marketer's. */
  const [canSetQuestions, setCanSetQuestions] = useState(false);

  const [leads, setLeads] = useState<CaReferralLeadsPage | null>(null);
  const [leadsFailed, setLeadsFailed] = useState(false);
  const [leadsBusy, setLeadsBusy] = useState(false);

  const [caTasks, setCaTasks] = useState<CaTaskMineRow[] | null>(null);
  const [caMeetings, setCaMeetings] = useState<CaMeetingMineItem[] | null>(null);
  const [caBusy, setCaBusy] = useState(false);

  const [voucher, setVoucher] = useState<CaVoucherMe | null>(null);

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Tasks and meetings load alongside the CRM profile: a person can hold a
      // referral code without a CaApplication, or the other way round.
      const [profile, deskData, cms, leadsPage, tasks, meetings, voucherData] = await Promise.all([
        getProfile(),
        getDesk(),
        getCaPageSettings(),
        listMyLeads(1, LEADS_PER_PAGE),
        listMyCaTasks(),
        listMyCaMeetings(),
        getMyVoucher(),
      ]);
      if (cancelled) return;
      if (!profile) {
        setPhase("not-allowed");
        return;
      }
      if (!deskData) {
        setPhase("error");
        return;
      }
      setCode(profile.code);
      setDrafts(toDrafts(profile.questions ?? []));
      setCanSetQuestions(Boolean(profile.canSetQuestions));
      setDesk(deskData);
      setSettings(cms);
      setLeads(leadsPage);
      setLeadsFailed(!leadsPage);
      setCaTasks(tasks);
      setCaMeetings(meetings);
      setVoucher(voucherData);
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, getProfile, getDesk, listMyLeads, listMyCaTasks, listMyCaMeetings, getMyVoucher]);

  const retryAll = () => {
    setPhase("loading");
    setAttempt((n) => n + 1);
  };

  const loadLeads = async (page: number) => {
    setLeadsBusy(true);
    const result = await listMyLeads(page, LEADS_PER_PAGE);
    setLeadsBusy(false);
    if (result) {
      setLeads(result);
      setLeadsFailed(false);
    } else if (leads) {
      toast.error("Could not load that page of enquiries");
    } else {
      setLeadsFailed(true);
    }
  };

  const retryCa = async () => {
    setCaBusy(true);
    const [tasks, meetings] = await Promise.all([
      caTasks ? Promise.resolve(caTasks) : listMyCaTasks(),
      caMeetings ? Promise.resolve(caMeetings) : listMyCaMeetings(),
    ]);
    setCaTasks(tasks);
    setCaMeetings(meetings);
    setCaBusy(false);
  };

  const onSaveQuestions = async () => {
    const result = await saveQuestion(
      drafts.map((d) => ({
        label: d.label,
        type: d.type,
        options: d.options
          .split(NEWLINE)
          .map((o) => o.trim())
          .filter(Boolean),
        required: d.required,
      })),
    );
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.questions.length === 0 ? "Questions removed" : "Questions saved");
  };

  const copyLink = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(shareUrl(code));
    } catch {
      toast.error("Could not copy. Press and hold the link to copy it instead.");
      return;
    }
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const fonts = cn(caDisplayFont.variable, caBodyFont.variable, siteFont.variable, s.desk);

  if (phase === "loading") {
    return (
      <div className={fonts}>
        <DeskSkeleton />
      </div>
    );
  }

  if (phase === "not-allowed") {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <Users className="mx-auto size-10 text-gray-300" />
        <h1 className="mt-3 text-xl font-bold text-gray-900">Not a campus ambassador yet</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ask the person running your campus programme to add you with the email on this account.
        </p>
      </div>
    );
  }

  if (phase === "error" || !desk || !code) {
    return (
      <div className={fonts}>
        <div className={cn(s.wrap, s.pageError)}>
          <div className={s.card}>
            <div className={s.empty} role="alert">
              <span className={cn(s.emptyIc, s.errorIc)}>
                <AlertCircle aria-hidden="true" />
              </span>
              <h1 className={cn(s.display, s.h2)}>We couldn&apos;t load your desk</h1>
              <p>Something went wrong on our side or your connection dropped. Give it another go.</p>
              <WhiteButton className={cn(s.btn, s.btnWhite)} onClick={retryAll}>
                Try again
              </WhiteButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const link = shareUrl(code);
  const tenure = desk.isCa ? tenureOf(desk.joiningDate, desk.endDate, now) : null;
  const firstName = user?.firstName?.trim().split(/\s+/)[0] ?? "";
  const designation =
    desk.designation ||
    (user?.crmAmbassadorKind ? AMBASSADOR_KIND_TAB_LABELS[user.crmAmbassadorKind] : "Campus Ambassador");

  const leadsTile: TileValue = { label: "Enquiries through your link", value: leads ? leads.total : null };
  const opened = caTasks ? caTasks.filter((t) => t.status !== "upcoming") : null;
  const pastMeetings = caMeetings ? caMeetings.filter((m) => isPastMeeting(m, now)) : null;
  const tiles: TileValue[] = desk.isCa
    ? [
        {
          label: "Tasks completed",
          value: opened && opened.length > 0 ? opened.filter((t) => t.status === "passed").length : null,
          of: opened?.length,
          placeholder: opened ? "No tasks yet" : "N/A",
        },
        {
          label: "Meetings attended",
          value:
            pastMeetings && pastMeetings.length > 0
              ? pastMeetings.filter((m) => m.myVerdict === "present").length
              : null,
          of: pastMeetings?.length,
          placeholder: pastMeetings ? "No meetings yet" : "N/A",
        },
        leadsTile,
        tenure && tenure.day === 0
          ? { label: "Days until your tenure starts", value: tenure.daysToStart }
          : { label: "Days left in your tenure", value: tenure ? tenure.daysLeft : null, placeholder: "Not set" },
      ]
    : [leadsTile];

  const notJoined = caTasks !== null && notJoinedYet(caTasks);

  return (
    <div className={fonts}>
      <DeskHero
        firstName={firstName}
        designation={designation}
        collegeName={desk.collegeName}
        link={link}
        copied={copied}
        onCopy={copyLink}
        tenure={tenure}
        desk={desk}
      />

      <div className={s.wrap}>
        <DeskTiles tiles={tiles} />

        {voucher?.hasVoucher ? <VoucherCard
            voucher={voucher}
            voucherNo={user?._id ? `CA-${user._id.slice(-6).toUpperCase()}` : null}
            onChange={setVoucher}
          /> : null}

        {desk.isCa ? (
          <section className={s.section} aria-labelledby="desk-week-title">
            <h2 id="desk-week-title" className={cn(s.display, s.h2)}>
              This week on your desk
            </h2>
            <p className={s.sub}>Finish tasks before their deadline to earn points. Meetings count too.</p>
            {notJoined ? (
              <div className={cn(s.card, s.leadsCard)}>
                <div className={s.empty}>
                  <span className={s.emptyIc}>
                    <CalendarClock aria-hidden="true" />
                  </span>
                  <h3>You haven&apos;t joined yet</h3>
                  <p>
                    Your tasks and meetings appear here once your Campus Ambassador application is approved and your
                    joining date is set.
                  </p>
                </div>
              </div>
            ) : (
              <div className={s.grid2}>
                <div className={s.card}>
                  {caTasks ? (
                    <CaTaskList tasks={caTasks} now={now} />
                  ) : (
                    <CaRetry what="your tasks" busy={caBusy} onRetry={retryCa} />
                  )}
                </div>
                {caMeetings ? (
                  <CaMeetingsList meetings={caMeetings} now={now} />
                ) : (
                  <div className={s.card}>
                    <CaRetry what="your meetings" busy={caBusy} onRetry={retryCa} />
                  </div>
                )}
              </div>
            )}
          </section>
        ) : null}

        <DeskLeads
          data={leads}
          failed={leadsFailed}
          busy={leadsBusy}
          onPage={loadLeads}
          onRetry={() => loadLeads(1)}
        />

        <DeskEarnings settings={settings} />

        <CaPayoutCard />

        {canSetQuestions ? (
          <DeskQuestions drafts={drafts} onChange={setDrafts} onSave={onSaveQuestions} saving={isLoading} />
        ) : null}
      </div>
    </div>
  );
}

function CaRetry({ what, busy, onRetry }: { what: string; busy: boolean; onRetry: () => void }) {
  return (
    <div className={s.empty} role="alert">
      <span className={cn(s.emptyIc, s.errorIc)}>
        <AlertCircle aria-hidden="true" />
      </span>
      <h3>We couldn&apos;t load {what}</h3>
      <p>Check your connection and try again.</p>
      <WhiteButton className={cn(s.btn, s.btnWhite)} onClick={onRetry} disabled={busy}>
        {busy ? "Trying again..." : "Try again"}
      </WhiteButton>
    </div>
  );
}

/**
 * `/ca-tasks/mine` gives every task an `upcoming` status with no `opensAt`
 * when the CA has no joining date yet (the task window has nothing to
 * compute from). Any task carrying a real `opensAt` proves a joining date
 * exists, so this distinguishes "not started" from a genuinely empty or
 * all-upcoming task list.
 */
function notJoinedYet(tasks: CaTaskMineRow[]): boolean {
  return tasks.length > 0 && tasks.every((t) => t.opensAt === null && t.status === "upcoming");
}
