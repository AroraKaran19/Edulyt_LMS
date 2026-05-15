"use client";

import { useEffect, useState } from "react";
import { Briefcase, GraduationCap, Users } from "lucide-react";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import {
  PartnerEnrollmentActivityChart,
  PartnerNewStudentsTrendChart,
} from "@/components/ui/partner/PartnerDashboardCharts";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import Loader from "@/components/ui/Loader";
import PartnerAnnouncementCard from "@/components/ui/partner/PartnerAnnouncementCard";
import usePartner, {
  type PartnerDashboardResponse,
} from "@/hooks/usePartner";
import { toast } from "react-toastify";

const STAT_ICONS = [
  <Users key="a" className="size-5" />,
  <Briefcase key="b" className="size-5" />,
  <GraduationCap key="c" className="size-5" />,
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function ymdTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

type DashboardStatCard = {
  key: string;
  label: string;
  value: number;
  deltaText?: string;
};

export default function CollegePartnerDashboardPage() {
  const { getDashboard } = usePartner();
  const [data, setData] = useState<PartnerDashboardResponse | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  /** When set, dashboard stats/charts use backend `from`/`to` (UTC day bounds). */
  const [appliedRange, setAppliedRange] = useState<{
    from: string;
    to: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);
    (async () => {
      try {
        const d = await getDashboard({
          trendMonths: 6,
          ...(appliedRange ? { from: appliedRange.from, to: appliedRange.to } : {}),
        });
        if (!cancelled) setData(d);
      } catch (e) {
        console.error("Partner dashboard load failed:", e);
        if (!cancelled) {
          toast.error("Could not load dashboard. Try refreshing.");
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appliedRange, getDashboard]);

  function applyDraftRange() {
    if (!draftFrom.trim() || !draftTo.trim()) {
      toast.error("Choose a start date and an end date.");
      return;
    }
    const from = draftFrom.trim();
    const to = draftTo.trim();
    if (from > to) {
      toast.error("Start date must be on or before end date.");
      return;
    }
    setAppliedRange({ from, to });
  }

  function clearRangeFilter() {
    setAppliedRange(null);
    setDraftFrom("");
    setDraftTo("");
  }

  if (!data && isFetching) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader size="xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <PartnerCard className="p-6 text-center">
          <h2 className="text-base font-semibold text-gray-900">
            Dashboard unavailable
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We couldn&apos;t load your dashboard. Please refresh or contact
            support.
          </p>
        </PartnerCard>
      </div>
    );
  }

  const { college, stats, trends } = data;

  const monthlyTrend = trends?.monthlyTrend ?? [];
  const rangeActive = appliedRange !== null;

  const statCards: DashboardStatCard[] = [
    {
      key: "students",
      label: rangeActive
        ? "New student sign-ups"
        : "Total Students",
      value: stats.totalStudents,
      deltaText:
        rangeActive && stats.rosterAllTimeCount != null
          ? `College roster ${stats.rosterAllTimeCount} students`
          : undefined,
    },
    {
      key: "courses",
      label: rangeActive
        ? "Course learners (distinct)"
        : "Students Enrolled in Courses",
      value: stats.studentsEnrolledInCourses,
    },
    {
      key: "internships",
      label: rangeActive
        ? "Internship learners (distinct)"
        : "Students in Internships",
      value: stats.studentsEnrolledInInternships,
    },
  ];

  const todayMax = ymdTodayLocal();

  return (
    <div className="p-2 sm:p-4 py-6 space-y-4 relative">
      {data && isFetching ? (
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-white/60 flex items-start justify-center pt-24"
          aria-hidden
        >
          <Loader size="lg" />
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <h1 className="text-lg sm:text-2xl font-semibold text-black">
          Welcome Back
        </h1>
        <p className="text-sm text-[#475467]">
          {college.name}
          {college.location ? `, ${college.location}` : ""}
        </p>
      </div>

      <PartnerAnnouncementCard />

      <PartnerCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <p className="text-sm font-semibold text-[#101828] shrink-0">
            Date filter
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <Input
              label="From"
              labelClassName="text-xs font-medium text-[#344054] mb-1"
              type="date"
              value={draftFrom}
              max={draftTo ? draftTo : todayMax}
              onChange={(e) => setDraftFrom(e.target.value)}
              disabled={isFetching}
              variant="small"
              className="w-full shrink-0 sm:w-44"
            />
            <Input
              label="To"
              labelClassName="text-xs font-medium text-[#344054] mb-1"
              type="date"
              value={draftTo}
              min={draftFrom || undefined}
              max={todayMax}
              onChange={(e) => setDraftTo(e.target.value)}
              disabled={isFetching}
              variant="small"
              className="w-full shrink-0 sm:w-44"
            />
            <div className="flex flex-wrap items-center gap-2 pb-0.5 sm:pb-[2px]">
              <OrangeButton
                type="button"
                glow={false}
                disabled={isFetching}
                onClick={() => applyDraftRange()}
                className="rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm lg:py-2.5 lg:px-5!"
              >
                Apply range
              </OrangeButton>
              <WhiteButton
                type="button"
                disabled={isFetching}
                onClick={() => clearRangeFilter()}
                className="rounded-full border-[#D0D5DD] px-5 py-2.5 text-sm font-semibold text-[#344054] shadow-none active:scale-100 lg:py-2.5 lg:px-5!"
              >
                Clear
              </WhiteButton>
            </div>
          </div>
        </div>
        {rangeActive && appliedRange ? (
          <p className="mt-3 text-xs font-medium text-[#039855]">
            Showing {appliedRange.from} through {appliedRange.to}.
          </p>
        ) : null}
      </PartnerCard>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {statCards.map((s, i) => (
          <PartnerStatCard
            key={s.key}
            icon={STAT_ICONS[i] ?? STAT_ICONS[0]}
            value={String(s.value)}
            label={s.label}
            deltaText={s.deltaText}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PartnerNewStudentsTrendChart monthlyTrend={monthlyTrend} />
        <PartnerEnrollmentActivityChart monthlyTrend={monthlyTrend} />
      </div>

      <PartnerCard className="p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-semibold text-black">
          About your college
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">
              Name
            </dt>
            <dd className="mt-1 text-[#1D2939]">{college.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">
              Location
            </dt>
            <dd className="mt-1 text-[#1D2939]">{college.location || "—"}</dd>
          </div>
          {college.website && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">
                Website
              </dt>
              <dd className="mt-1 break-all text-[#1D4ED8]">
                <a
                  href={college.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {college.website}
                </a>
              </dd>
            </div>
          )}
        </dl>
        <p className="mt-4 text-xs text-[#667085]">
          Use the Courses and Internships tabs to view enrolment analytics.
        </p>
      </PartnerCard>
    </div>
  );
}
