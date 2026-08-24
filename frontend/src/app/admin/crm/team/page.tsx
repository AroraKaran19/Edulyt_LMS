"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Search, Users } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import Input from "@/components/ui/inputs/Input";
import Pagination from "@/components/admin/Pagination";

interface Person {
  userId: string;
  name: string;
  email: string;
  userType: "marketer" | "sales";
  code: string | null;
  active: boolean;
  ambassadors: number;
  generated: number;
  teamGenerated: number;
  converted: number;
}

const ROLE_STYLES: Record<string, string> = {
  marketer: "bg-emerald-100 text-emerald-800",
  sales: "bg-teal-100 text-teal-800",
};

export default function CrmTeamPage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/crm/people", {
          params: { page, limit: 20, search: debounced || undefined },
        });
        if (cancelled) return;
        const data = res.data?.data;
        setPeople(data?.people ?? []);
        setTotalPages(data?.totalPages ?? 1);
        setTotal(data?.total ?? 0);
      } catch {
        if (!cancelled) setPeople([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debounced]);

  return (
    <div className="w-full space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team</h1>
          <p className="text-xs text-gray-600">
            Every marketer and sales person. Open one to see their leads.
          </p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
          {total} people
        </span>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or code"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2.5 sm:px-4">Person</th>
                <th className="px-3 py-2.5 sm:px-4">Role</th>
                <th className="px-3 py-2.5 sm:px-4">Code</th>
                <th className="px-3 py-2.5 text-right sm:px-4">Ambassadors</th>
                <th className="px-3 py-2.5 text-right sm:px-4">Generated</th>
                <th className="px-3 py-2.5 text-right sm:px-4">Team</th>
                <th className="px-3 py-2.5 text-right sm:px-4">Converted</th>
                <th className="w-8 px-3 py-2.5 sm:px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : people.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Users className="mx-auto size-8 text-gray-300" />
                    <p className="mt-1 text-gray-500">No one yet</p>
                  </td>
                </tr>
              ) : (
                people.map((p) => (
                  <tr
                    key={p.userId}
                    onClick={() => router.push(`/admin/crm/team/${p.userId}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-3 py-2.5 sm:px-4">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-[11px] text-gray-500">{p.email}</div>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_STYLES[p.userType]}`}
                      >
                        {p.userType === "sales" ? "Sales" : "Marketer"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-700 sm:px-4">
                      {p.code ?? "—"}
                      {!p.active && p.code ? (
                        <span className="ml-1 text-[10px] text-amber-600">
                          off
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700 sm:px-4">
                      {p.ambassadors}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-gray-900 sm:px-4">
                      {p.generated}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700 sm:px-4">
                      {p.teamGenerated}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-gray-900 sm:px-4">
                      {p.converted}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <ChevronRight className="size-4 text-gray-400" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="border-t border-gray-200 px-4 py-3">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading}
            />
          </div>
        ) : null}
      </div>

      <p className="text-[11px] text-gray-500">
        Converted counts the leads this person closed, whoever generated them.
        Team counts leads their ambassadors generated.
      </p>
    </div>
  );
}
