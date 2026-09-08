"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
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


export default function ScholarshipTestDetailModal({
  isOpen,
  onClose,
  testId,
  onEdit,
}: Props) {
  const [detail, setDetail] = useState<ScholarshipTestDetail | null>(null);
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
        const d = res.data?.data as ScholarshipTestDetail | undefined;
        if (cancelled || !d) return;
        setDetail(d);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row
              label="Discount"
              value={
                detail.minDiscountPercent === detail.maxDiscountPercent
                  ? `${detail.minDiscountPercent}%`
                  : `${detail.minDiscountPercent}-${detail.maxDiscountPercent}% (random per winner)`
              }
            />
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
            <Row label="Codes won" value={detail.winnerCount ?? 0} />
            <Row label="Codes redeemed" value={detail.redeemedCount ?? 0} />
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
