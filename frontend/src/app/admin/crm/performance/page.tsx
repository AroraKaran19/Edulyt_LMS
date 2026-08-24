"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DateRangeFilter, {
  type DateRange,
} from "@/components/admin/DateRangeFilter";
import useCrm, { type CrmStats } from "@/hooks/useCrm";

const Tile = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5">
    <div className="text-3xl font-bold text-gray-900">{value}</div>
    <div className="mt-1 text-sm text-gray-600">{label}</div>
  </div>
);

export default function CrmPerformancePage() {
  const { getStats, getProfile } = useCrm();

  const [range, setRange] = useState<DateRange>({});
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [isSales, setIsSales] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().then((p) => setIsSales(p?.role === "sales"));
  }, [getProfile]);

  useEffect(() => {
    // `cancelled` guards against a slow response for an old range landing
    // after a newer one and overwriting it.
    let cancelled = false;
    (async () => {
      const next = await getStats(range);
      if (cancelled) return;
      setStats(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [getStats, range]);

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My performance</h1>
        <p className="text-sm text-gray-600">
          How many leads you and your ambassadors generated over a period.
        </p>
      </div>

      <DateRangeFilter onChange={setRange} />

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Leads I generated" value={stats?.generated ?? 0} />
          <Tile label="My team generated" value={stats?.teamGenerated ?? 0} />
          {isSales ? (
            <>
              <Tile label="Assigned to me" value={stats?.assigned ?? 0} />
              <Tile label="I converted" value={stats?.converted ?? 0} />
            </>
          ) : null}
        </div>
      )}

      <p className="text-xs text-gray-500">
        {isSales
          ? "Lead details live under My leads, and only for the leads assigned to you."
          : "Lead details are handled by the sales team, so only counts appear here."}
      </p>
    </div>
  );
}
