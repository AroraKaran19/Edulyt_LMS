"use client";

import { useEffect, useState } from "react";
import {
  BadgePercent,
  Briefcase,
  GraduationCap,
  Loader2,
  PenLine,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import apiClient from "@/configs/apiConfig";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Rates = {
  loginSuccessPoints: number;
  communityReviewSuccessPoints: number;
  internshipRegistrationSuccessPoints: number;
  successPointRedemptionInr: number;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function EarnRow({
  icon: Icon,
  title,
  desc,
  badge,
}: {
  icon: typeof Star;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#F77124]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {badge && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-gray-500">{desc}</p>
      </div>
    </li>
  );
}

export default function SuccessPointsInfoModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<Rates>({
    loginSuccessPoints: 0,
    communityReviewSuccessPoints: 0,
    internshipRegistrationSuccessPoints: 0,
    successPointRedemptionInr: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    Promise.all([
      apiClient.get("/success-points/reward-rates"),
      apiClient.get("/success-points/redemption-rate"),
    ])
      .then(([rewardRes, redeemRes]) => {
        if (!active) return;
        const r = rewardRes?.data?.data ?? {};
        const d = redeemRes?.data?.data ?? {};
        setRates({
          loginSuccessPoints: num(r.loginSuccessPoints),
          communityReviewSuccessPoints: num(r.communityReviewSuccessPoints),
          internshipRegistrationSuccessPoints: num(
            r.internshipRegistrationSuccessPoints,
          ),
          successPointRedemptionInr: num(d.successPointRedemptionInr),
        });
      })
      .catch(() => {
        /* non-blocking — the modal still explains the basics */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="About Success Points"
      className="max-w-lg w-full mx-4"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Intro */}
          <div className="flex items-start gap-3 rounded-2xl bg-linear-to-br from-orange-50 to-white p-4 ring-1 ring-orange-100">
            <Star className="h-6 w-6 shrink-0 fill-[#F77124] text-[#F77124]" />
            <p className="text-sm leading-relaxed text-gray-700">
              Success Points are Edulyt&apos;s reward currency. Earn them as
              you learn and stay active — then spend them to cut the price of
              your next course, or send them to a friend.
            </p>
          </div>

          {/* Earn */}
          <div>
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-500">
              Ways to earn points
            </h3>
            <ul className="space-y-3.5">
              {rates.loginSuccessPoints > 0 && (
                <EarnRow
                  icon={Sparkles}
                  title="Welcome bonus"
                  badge={`+${rates.loginSuccessPoints}`}
                  desc="Credited once, the very first time you log in."
                />
              )}
              {rates.communityReviewSuccessPoints > 0 && (
                <EarnRow
                  icon={PenLine}
                  title="Share a community review"
                  badge={`+${rates.communityReviewSuccessPoints}`}
                  desc="Post your story with your identity (not anonymous). One reward per learner."
                />
              )}
              {rates.internshipRegistrationSuccessPoints > 0 && (
                <EarnRow
                  icon={Briefcase}
                  title="Register for an internship"
                  badge={`+${rates.internshipRegistrationSuccessPoints}`}
                  desc="Credited once per internship, however you register."
                />
              )}
              <EarnRow
                icon={GraduationCap}
                title="Buy or complete a course"
                desc="Selected courses and plans award points when you purchase or finish them."
              />
              <EarnRow
                icon={Send}
                title="Receive a transfer"
                desc="Any learner can send you points using your account email."
              />
            </ul>
          </div>

          {/* Spend */}
          <div>
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-500">
              What you can do with them
            </h3>
            <ul className="space-y-3.5">
              <EarnRow
                icon={BadgePercent}
                title="Redeem at checkout"
                desc={
                  rates.successPointRedemptionInr > 0
                    ? `Apply your points for a discount — each point is worth ₹${rates.successPointRedemptionInr} off your order.`
                    : "Apply your points for a discount on a course at checkout."
                }
              />
              <EarnRow
                icon={Send}
                title="Transfer to a friend"
                desc="Send points to another learner by email. Transfers are instant and can't be reversed."
              />
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}
