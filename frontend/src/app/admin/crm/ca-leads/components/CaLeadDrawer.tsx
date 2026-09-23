"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Info, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import Select from "@/components/ui/inputs/Select";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { formatStoredPhone } from "@/lib/phone";
import { formatIstDate } from "@/lib/ist";
import useCaApplications from "@/hooks/useCaApplications";
import type { CaApplicationRow, CaOwner } from "@/types/ca-application";

const formatApplied = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-gray-500">{label}</dt>
    <dd className="text-right text-gray-900">{value}</dd>
  </div>
);

const Section = ({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) => (
  <div>
    <h3 className="mb-2 text-xs font-semibold text-gray-500">{heading}</h3>
    <dl className="space-y-2 rounded-xl bg-gray-50 px-3.5 py-3 text-sm">{children}</dl>
  </div>
);

interface Props {
  id: string;
  isOwner: boolean;
  owners: CaOwner[];
  /** True while the Approve or Decline modal is open on top of the drawer, so Escape closes that instead. */
  suspended?: boolean;
  onClose: () => void;
  onApprove: (row: CaApplicationRow) => void;
  onDecline: (row: CaApplicationRow) => void;
  onChanged: () => void;
}

/**
 * Right-side detail panel. Reloaded from `detail(id)` rather than reusing the
 * table row, so admins get the address the row list never carries.
 */
export default function CaLeadDrawer({
  id,
  isOwner,
  owners,
  suspended = false,
  onClose,
  onApprove,
  onDecline,
  onChanged,
}: Props) {
  const { detail, reveal, changeOwner, retryDocuments } = useCaApplications();
  const [row, setRow] = useState<CaApplicationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [payout, setPayout] = useState<{ method: "upi" | "details"; value: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [moveOwnerId, setMoveOwnerId] = useState("");
  const [moving, setMoving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = await detail(id);
      if (cancelled) return;
      setRow(found);
      setPayout(null);
      setMoveOwnerId("");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [detail, id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !suspended) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, suspended]);

  // Matches the shared Modal's body-scroll lock, and starts focus on the
  // close button since this overlay isn't rendered through that component.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const onReveal = async () => {
    setRevealing(true);
    const result = await reveal(id);
    setPayout(result?.payout ?? null);
    setRevealed(true);
    setRevealing(false);
  };

  const move = async () => {
    if (!moveOwnerId) return;
    setMoving(true);
    const updated = await changeOwner(id, moveOwnerId);
    setMoving(false);
    if (updated) {
      setRow(updated);
      setMoveOwnerId("");
      toast.success("Moved to another team");
      onChanged();
    }
  };

  const retry = async () => {
    setRetrying(true);
    const result = await retryDocuments(id);
    setRetrying(false);
    if (result) {
      setRow((prev) => (prev ? { ...prev, failedDocumentJobs: [] } : prev));
      toast.success("Queued again. The worker will retry shortly.");
      onChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ca-lead-drawer-title"
        className="fixed inset-y-0 right-0 flex h-full w-full max-w-[480px] flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="ca-lead-drawer-title" className="truncate text-lg font-bold text-gray-900">
              {loading ? "Loading…" : (row?.name ?? "Application")}
            </h2>
            {row ? (
              <p className="text-xs text-gray-500">Applied {formatApplied(row.createdAt)}</p>
            ) : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : !row ? (
            <div className="py-16 text-center text-gray-500">
              This application could not be loaded.
            </div>
          ) : (
            <div className="space-y-5">
              <div
                className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ${
                  row.hasAccount ? "bg-green-50 text-green-800" : "bg-blue-50 text-blue-800"
                }`}
              >
                {row.hasAccount ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <Info className="mt-0.5 size-4 shrink-0" />
                )}
                <p>
                  {row.hasAccount
                    ? "They already have an account and join the team as soon as you approve."
                    : `No account yet. Once approved, they join the team automatically when they sign up with ${row.email}.`}
                </p>
              </div>

              <Section heading="Contact">
                <Row label="Email" value={row.email} />
                <Row
                  label="Mobile"
                  value={
                    <span>
                      {formatStoredPhone(row.phone)}{" "}
                      <span className="text-xs font-semibold text-green-600">Verified</span>
                    </span>
                  }
                />
                <Row label="College email" value={row.collegeEmail || "-"} />
                <Row label="WhatsApp group" value={row.whatsappJoined ? "Joined" : "Not joined"} />
              </Section>

              <Section heading="College">
                <Row label="College" value={row.collegeName || "-"} />
                <Row label="Course" value={row.degree || "-"} />
                <Row label="Career stage" value={row.careerStage || "-"} />
                <Row
                  label="Languages"
                  value={
                    row.languages.length ? (
                      <span className="flex flex-wrap justify-end gap-1">
                        {row.languages.map((language) => (
                          <span
                            key={language}
                            className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200"
                          >
                            {language}
                          </span>
                        ))}
                      </span>
                    ) : (
                      "-"
                    )
                  }
                />
              </Section>

              <Section heading="Batch">
                <Row label="Joining" value={row.joiningDate ? formatIstDate(row.joiningDate) : "-"} />
                <Row label="Duration" value={`${row.durationMonths} months`} />
                <Row label="Ends" value={row.endDate ? formatIstDate(row.endDate) : "-"} />
              </Section>

              {!isOwner && row.failedDocumentJobs?.length ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-gray-500">Documents</h3>
                  <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm">
                    {row.failedDocumentJobs.map((job) => (
                      <div key={job.kind}>
                        <p className="font-medium text-red-700">
                          {job.kind === "offer-letter"
                            ? "The offer letter could not be generated"
                            : "The completion documents could not be generated"}
                        </p>
                        {job.error ? <p className="mt-0.5 text-xs text-red-600/80">{job.error}</p> : null}
                      </div>
                    ))}
                    <WhiteButton
                      type="button"
                      glow={false}
                      className="w-full justify-center"
                      disabled={retrying}
                      onClick={() => void retry()}
                    >
                      {retrying ? "Retrying…" : "Retry"}
                    </WhiteButton>
                  </div>
                </div>
              ) : null}

              {!isOwner && row.status === "approved" ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-gray-500">Team</h3>
                  <div className="space-y-3 rounded-xl bg-gray-50 px-3.5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500">Current</span>
                      <span className="font-medium text-gray-900">{row.owner?.name ?? "-"}</span>
                    </div>
                    <Select
                      label="Move to another team"
                      options={owners
                        .filter((o) => o.userId !== row.owner?.userId)
                        .map((o) => ({ value: o.userId, label: o.name }))}
                      value={moveOwnerId}
                      onChange={setMoveOwnerId}
                      placeholder="Choose a team"
                    />
                    <WhiteButton
                      type="button"
                      glow={false}
                      className="w-full justify-center"
                      disabled={moving || !moveOwnerId}
                      onClick={() => void move()}
                    >
                      {moving ? "Moving…" : "Move"}
                    </WhiteButton>
                  </div>
                </div>
              ) : null}

              {!isOwner ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-gray-500">Payout and delivery</h3>
                  <p className="mb-1.5 text-xs text-gray-500">
                    The UPI ID is encrypted. Only admins can reveal it.
                  </p>
                  <div className="space-y-3 rounded-xl bg-gray-50 px-3.5 py-3 text-sm">
                    <div className="text-gray-900">
                      {row.address ? (
                        <>
                          <div>{row.address.line}</div>
                          <div>
                            {row.address.city}, {row.address.state} {row.address.pincode}
                          </div>
                          <div>{row.address.country}</div>
                        </>
                      ) : (
                        <span className="text-gray-500">No address on file</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-3">
                      <div>
                        <div className="text-xs text-gray-500">
                          {revealed && payout ? (payout.method === "upi" ? "UPI ID" : "Payout details") : "Payout"}
                        </div>
                        <div className="mt-0.5 font-mono text-sm text-gray-900">
                          {revealed ? (payout ? payout.value : "Not provided") : "•••• •••• ••••"}
                        </div>
                      </div>
                      {!revealed ? (
                        <WhiteButton type="button" glow={false} disabled={revealing} onClick={onReveal}>
                          {revealing ? "Revealing…" : "Reveal"}
                        </WhiteButton>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!loading && row && row.status === "pending" ? (
          <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
            <WhiteButton
              type="button"
              glow={false}
              className="text-red-600 border-red-300 hover:border-red-400"
              onClick={() => onDecline(row)}
            >
              Decline
            </WhiteButton>
            <OrangeButton type="button" glow={false} onClick={() => onApprove(row)}>
              {isOwner ? "Accept" : "Approve"}
            </OrangeButton>
          </div>
        ) : !loading && row && row.status === "approved" && !isOwner && !row.internId ? (
          <div className="flex justify-end border-t border-gray-200 px-5 py-4">
            <WhiteButton
              type="button"
              glow={false}
              className="text-red-600 border-red-300 hover:border-red-400"
              onClick={() => onDecline(row)}
            >
              Decline
            </WhiteButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
