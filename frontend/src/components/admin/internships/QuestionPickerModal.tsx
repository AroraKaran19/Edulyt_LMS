"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { QUESTION_CATEGORY_OPTIONS } from "@/constants/questionCategories";

export type PickerQuestion = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  category: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Filters which questions are eligible — passed through to the list endpoint. */
  usageFor: "exam" | "task";
  /** The current selection from the parent modal. */
  selected: PickerQuestion[];
  /** Called when the user clicks Apply with the new accumulated selection. */
  onApply: (questions: PickerQuestion[]) => void;
};

type ListResponse = {
  questions?: PickerQuestion[];
  total?: number;
  page?: number;
  totalPages?: number;
};

type RandomResponse = {
  questions?: PickerQuestion[];
  requested?: number;
  returned?: number;
};

const PAGE_SIZE = 15;
const RANDOM_PICK_MAX = 200;

export default function QuestionPickerModal({
  isOpen,
  onClose,
  usageFor,
  selected,
  onApply,
}: Props) {
  const [tab, setTab] = useState<"auto" | "manual">("manual");

  // Pending selection — what the user is building inside this picker session.
  const [pending, setPending] = useState<PickerQuestion[]>(selected);

  // ── Auto tab ────────────────────────────────────────────────────────────────
  const [autoCategory, setAutoCategory] = useState<string>("");
  const [autoCount, setAutoCount] = useState("10");
  const [autoLoading, setAutoLoading] = useState(false);

  // ── Manual tab ──────────────────────────────────────────────────────────────
  const [manualSearch, setManualSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualPage, setManualPage] = useState(1);
  const [manualRows, setManualRows] = useState<PickerQuestion[]>([]);
  const [manualTotalPages, setManualTotalPages] = useState(1);
  const [manualTotal, setManualTotal] = useState(0);
  const [manualLoading, setManualLoading] = useState(false);

  // Reset on each open so re-opening picks up the latest parent selection.
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setPending(selected);
      setTab("manual");
      setAutoCategory("");
      setAutoCount("10");
      setManualSearch("");
      setDebouncedSearch("");
      setManualCategory("");
      setManualPage(1);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, selected]);

  // Debounce search.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(manualSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [manualSearch]);

  // Reset to page 1 whenever a manual filter changes.
  useEffect(() => {
    setManualPage(1);
  }, [debouncedSearch, manualCategory]);

  const fetchManual = useCallback(async () => {
    setManualLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.internshipQuestions.adminList, {
        params: {
          page: manualPage,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          usageFor,
          category: manualCategory || undefined,
        },
      });
      const d = res.data?.data as ListResponse | undefined;
      setManualRows(Array.isArray(d?.questions) ? d!.questions! : []);
      setManualTotalPages(
        typeof d?.totalPages === "number" && d.totalPages >= 1
          ? d.totalPages
          : 1,
      );
      setManualTotal(typeof d?.total === "number" ? d.total : 0);
    } catch {
      toast.error("Could not load questions");
      setManualRows([]);
      setManualTotalPages(1);
      setManualTotal(0);
    } finally {
      setManualLoading(false);
    }
  }, [manualPage, debouncedSearch, usageFor, manualCategory]);

  useEffect(() => {
    if (!isOpen || tab !== "manual") return;
    void fetchManual();
  }, [isOpen, tab, fetchManual]);

  const pendingIds = useMemo(
    () => new Set(pending.map((q) => q._id)),
    [pending],
  );

  const togglePending = (q: PickerQuestion) => {
    setPending((prev) =>
      prev.some((x) => x._id === q._id)
        ? prev.filter((x) => x._id !== q._id)
        : [...prev, q],
    );
  };

  const removeFromPending = (id: string) => {
    setPending((prev) => prev.filter((q) => q._id !== id));
  };

  const handleAutoAdd = async () => {
    if (!autoCategory) {
      toast.error("Pick a category first");
      return;
    }
    const n = parseInt(autoCount, 10);
    if (!Number.isFinite(n) || n < 1) {
      toast.error("Enter a positive number of questions");
      return;
    }
    if (n > RANDOM_PICK_MAX) {
      toast.error(`Maximum ${RANDOM_PICK_MAX} per pick`);
      return;
    }

    setAutoLoading(true);
    try {
      const res = await apiClient.get(
        ENDPOINTS.internshipQuestions.adminRandom,
        {
          params: {
            category: autoCategory,
            usageFor,
            limit: n,
            exclude: Array.from(pendingIds).join(",") || undefined,
          },
        },
      );
      const d = res.data?.data as RandomResponse | undefined;
      const picked = Array.isArray(d?.questions) ? d!.questions! : [];
      if (picked.length === 0) {
        toast.info(
          `No more active ${autoCategory} questions available for ${usageFor}.`,
        );
        return;
      }
      setPending((prev) => {
        const seen = new Set(prev.map((q) => q._id));
        return [...prev, ...picked.filter((q) => !seen.has(q._id))];
      });
      if (picked.length < n) {
        toast.info(
          `Added ${picked.length} questions from ${autoCategory} — only ${picked.length} were available.`,
        );
      } else {
        toast.success(`Added ${picked.length} questions from ${autoCategory}.`);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not pick questions";
      toast.error(msg);
    } finally {
      setAutoLoading(false);
    }
  };

  const handleApply = () => {
    onApply(pending);
    onClose();
  };

  const totalScore = pending.reduce((s, q) => s + (q.score || 0), 0);
  const summaryLabel = `${pending.length} selected · Total score ${totalScore}`;

  const tabBtn = (id: "auto" | "manual", label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={[
        "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
        tab === id
          ? "border-orange-500 text-orange-600"
          : "border-transparent text-gray-500 hover:text-gray-700",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select questions"
      className="max-w-3xl w-full mx-4 max-h-[90vh]"
    >
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabBtn("manual", "Manual")}
          {tabBtn("auto", "Auto (random by category)")}
        </div>

        {tab === "auto" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Randomly add active questions from a single category. Already-selected
              questions are excluded automatically. If fewer questions exist than
              you ask for, the picker adds as many as it can.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
              <Select
                label="Category"
                searchable
                searchPlaceholder="Search categories…"
                options={QUESTION_CATEGORY_OPTIONS}
                value={autoCategory}
                onChange={setAutoCategory}
                placeholder="Pick a category"
              />
              <Input
                label="How many"
                type="number"
                min={1}
                step={1}
                value={autoCount}
                onChange={(e) => setAutoCount(e.target.value)}
              />
              <OrangeButton
                type="button"
                glow={false}
                disabled={autoLoading}
                onClick={() => void handleAutoAdd()}
                className="inline-flex items-center gap-2 h-[46px]"
              >
                <Plus className="w-4 h-4" />
                {autoLoading ? "Adding…" : "Add"}
              </OrangeButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search question text…"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <Select
                searchable
                searchPlaceholder="Search categories…"
                options={[
                  { value: "", label: "All categories" },
                  ...QUESTION_CATEGORY_OPTIONS,
                ]}
                value={manualCategory}
                onChange={setManualCategory}
                placeholder="Filter by category"
              />
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {manualLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
                </div>
              ) : manualRows.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No questions match these filters.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {manualRows.map((q) => {
                    const isPicked = pendingIds.has(q._id);
                    return (
                      <li key={q._id}>
                        <button
                          type="button"
                          onClick={() => togglePending(q)}
                          className={[
                            "w-full flex items-start gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors",
                            isPicked ? "bg-orange-50/60" : "",
                          ].join(" ")}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={isPicked}
                            className="mt-1 w-4 h-4 accent-orange-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 line-clamp-2">
                              {q.questionText || "Untitled"}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {q.category ? (
                                <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                  {q.category}
                                </span>
                              ) : null}
                              <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">
                                {q.type}
                              </span>
                              <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-50 text-gray-600 tabular-nums">
                                {q.score} pts
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {manualTotal > 0
                  ? `${manualTotal} matching question${manualTotal === 1 ? "" : "s"}`
                  : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={manualPage <= 1 || manualLoading}
                  onClick={() => setManualPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page {manualPage} / {manualTotalPages}
                </span>
                <button
                  type="button"
                  disabled={manualPage >= manualTotalPages || manualLoading}
                  onClick={() =>
                    setManualPage((p) => Math.min(manualTotalPages, p + 1))
                  }
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Running selection */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/40">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase">
              Pending selection
            </p>
            <p className="text-xs text-gray-600 tabular-nums">{summaryLabel}</p>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Nothing selected yet. Use the Manual or Auto tab above.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[180px] overflow-y-auto">
              {pending.map((q) => (
                <li
                  key={q._id}
                  className="flex items-start gap-3 px-3 py-2 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 line-clamp-1">
                      {q.questionText || "Untitled"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {q.category ? (
                        <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {q.category}
                        </span>
                      ) : null}
                      <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-50 text-gray-600 tabular-nums">
                        {q.score} pts
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromPending(q._id)}
                    className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <WhiteButton type="button" glow={false} onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton type="button" glow={false} onClick={handleApply}>
            Apply ({pending.length})
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
