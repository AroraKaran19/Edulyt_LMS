"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, CalendarDays } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { isApplicationWindowOpenIst } from "@/lib/applicationWindow";
import type { Internship, InternshipBatches } from "@/types";

function formatDate(d: Date | string | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: string;
  /** Internship slug — used to fetch the cohort list. */
  internshipSlug: string;
  /** The learner's current batch, excluded from the options. */
  currentBatchId: string | undefined;
  /** Called after a successful switch so the parent can refresh. */
  onSwitched: () => void;
};

export default function SwitchBatchModal({
  isOpen,
  onClose,
  enrollmentId,
  internshipSlug,
  currentBatchId,
  onSwitched,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<InternshipBatches[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!internshipSlug) return;
    setLoading(true);
    try {
      const res = await apiClient.get(
        `${ENDPOINTS.internships.bySlug}/${encodeURIComponent(internshipSlug)}`,
      );
      const internship = res.data?.data as Internship | undefined;
      setBatches(internship?.batches ?? []);
    } catch {
      toast.error("Could not load cohorts.");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [internshipSlug]);

  useEffect(() => {
    if (!isOpen) {
      setBatches([]);
      setSelected("");
      return;
    }
    void load();
  }, [isOpen, load]);

  // Eligible = a different, active, entrance-exam cohort whose application
  // window is still open (a past cohort whose apply-by date has passed can't be
  // joined even if it hasn't started). The server re-validates on submit.
  const options = useMemo(
    () =>
      batches.filter(
        (b) =>
          b._id &&
          String(b._id) !== String(currentBatchId) &&
          b.isActive &&
          Boolean(b.entranceExamTemplateId) &&
          isApplicationWindowOpenIst(
            b.applicationLastDate as unknown as string,
          ),
      ),
    [batches, currentBatchId],
  );

  const handleConfirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post(ENDPOINTS.internshipEnrollments.meSwitchBatch(enrollmentId), {
        batchId: selected,
      });
      toast.success("Moved to the selected cohort.");
      onSwitched();
      onClose();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string; error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not switch cohort.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register for another cohort"
      className="max-w-lg w-full mx-4"
    >
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-600">
          Move your registration to a different cohort of this internship while
          seats are still available. Your current registration will be replaced.
          This is only possible before the entrance exam.
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading cohorts…
          </div>
        ) : options.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 px-4 text-center text-sm text-gray-600">
            No other cohorts are open to switch to right now.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {options.map((b) => {
              const id = String(b._id);
              const active = selected === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setSelected(id)}
                    aria-pressed={active}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500/20"
                        : "border-gray-200 bg-white hover:border-orange-300",
                    )}
                  >
                    <div className="font-semibold text-gray-900">{b.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Starts {formatDate(b.internshipStartDate)}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!selected || submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Switching…" : "Confirm switch"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
