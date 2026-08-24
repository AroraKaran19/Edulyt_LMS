"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Pencil } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import StatusPill from "./StatusPill";
import CopyCampaignLink from "./CopyCampaignLink";
import {
  campaignStatusOf,
  type ScholarshipTestDetail,
} from "@/types/scholarship";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  testId: string | null;
  onEdit: (id: string) => void;
};

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

function formatIst(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

/** Campaign coupon code, held by the campaign rather than per winner. */
function CouponBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy the code");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 px-3 py-2 rounded-xl bg-gray-900 text-white font-mono text-sm tracking-wider select-all">
        {code}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
        aria-label="Copy coupon code"
        title="Copy"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default function ScholarshipTestDetailModal({
  isOpen,
  onClose,
  testId,
  onEdit,
}: Props) {
  const [detail, setDetail] = useState<ScholarshipTestDetail | null>(null);
  const [couponCode, setCouponCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !testId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.scholarshipTests.adminById(testId),
        );
        const d = res.data?.data as
          | (ScholarshipTestDetail & { couponCode?: string })
          | undefined;
        if (cancelled || !d) return;
        setDetail(d);
        setCouponCode(d.couponCode ?? "");
      } catch (error) {
        if (!cancelled) {
          toast.error(errorMessage(error, "Could not load the campaign"));
          onClose();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, testId, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign details"
      className="max-w-2xl w-full mx-4 max-h-[90vh]"
    >
      {isLoading || !detail ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading campaign…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-semibold text-gray-900 min-w-0">
              {detail.title}
            </h4>
            <StatusPill status={campaignStatusOf(detail)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Campaign link
            </span>
            <CopyCampaignLink slug={detail.slug} variant="block" />
            <p className="text-xs text-gray-500">
              Share this with candidates. It is the only way in, so nothing on
              the site links to it yet.
            </p>
          </div>

          {detail.description ? (
            <p className="text-sm text-gray-600">{detail.description}</p>
          ) : null}

          {couponCode ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Coupon code
              </span>
              <CouponBlock code={couponCode} />
              <p className="text-xs text-gray-500">
                One code for the whole campaign, valid on any course. Everyone
                who finishes the test can redeem it, once each.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row label="Discount" value={`${detail.discountPercent}%`} />
            <Row
              label="Questions"
              value={`${detail.questions?.length ?? 0} (no pass mark)`}
            />
            <Row
              label="Attempt clock"
              value={`${detail.durationMinutes} minutes`}
            />
            <Row label="Attempts allowed" value={detail.attemptsAllowed} />
            <Row label="Attempts so far" value={detail.attemptCount ?? 0} />
            <Row
              label="Coupon valid for"
              value={`${detail.couponValidForDays} day${
                detail.couponValidForDays === 1 ? "" : "s"
              } after finishing`}
            />
            <Row label="Created (IST)" value={formatIst(detail.createdAt)} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <WhiteButton type="button" glow={false} onClick={onClose}>
              Close
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              onClick={() => onEdit(detail._id)}
              className="inline-flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </OrangeButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
