"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Hourglass, Loader2, IndianRupee, Save, Star } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Input from "@/components/ui/inputs/Input";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Container from "@/app/admin/components/ui/Container";

type PointsSettings = {
  internshipSuccessPointInr: number;
  successPointRedemptionInr: number;
  successPointsMaxUtilizationPercent: number;
  loginSuccessPoints: number;
  communityReviewSuccessPoints: number;
  internshipRegistrationSuccessPoints: number;
  successPointsExpiryDays: number;
  successPointsMonthlyTransferLimit: number;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parsePointsPayload(axiosData: unknown): PointsSettings | null {
  if (!axiosData || typeof axiosData !== "object") return null;
  const d = (axiosData as { data?: unknown }).data;
  if (!d || typeof d !== "object") return null;
  const p = d as Record<string, unknown>;
  return {
    internshipSuccessPointInr: num(p.internshipSuccessPointInr),
    successPointRedemptionInr: num(p.successPointRedemptionInr),
    successPointsMaxUtilizationPercent: num(
      p.successPointsMaxUtilizationPercent,
    ),
    loginSuccessPoints: num(p.loginSuccessPoints),
    communityReviewSuccessPoints: num(p.communityReviewSuccessPoints),
    internshipRegistrationSuccessPoints: num(
      p.internshipRegistrationSuccessPoints,
    ),
    successPointsExpiryDays: num(p.successPointsExpiryDays),
    successPointsMonthlyTransferLimit: num(p.successPointsMonthlyTransferLimit),
  };
}

export default function AdminPointsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [internshipSuccessPointInr, setInternshipSuccessPointInr] =
    useState("");
  const [successPointRedemptionInr, setSuccessPointRedemptionInr] =
    useState("");
  const [
    successPointsMaxUtilizationPercent,
    setSuccessPointsMaxUtilizationPercent,
  ] = useState("");
  const [loginSuccessPoints, setLoginSuccessPoints] = useState("");
  const [communityReviewSuccessPoints, setCommunityReviewSuccessPoints] =
    useState("");
  const [
    internshipRegistrationSuccessPoints,
    setInternshipRegistrationSuccessPoints,
  ] = useState("");
  const [successPointsExpiryDays, setSuccessPointsExpiryDays] = useState("");
  const [
    successPointsMonthlyTransferLimit,
    setSuccessPointsMonthlyTransferLimit,
  ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.admin.pointsSettings);
      const d = parsePointsPayload(res.data);
      if (d) {
        setInternshipSuccessPointInr(String(d.internshipSuccessPointInr));
        setSuccessPointRedemptionInr(String(d.successPointRedemptionInr));
        setSuccessPointsMaxUtilizationPercent(
          String(d.successPointsMaxUtilizationPercent),
        );
        setLoginSuccessPoints(String(d.loginSuccessPoints));
        setCommunityReviewSuccessPoints(
          String(d.communityReviewSuccessPoints),
        );
        setInternshipRegistrationSuccessPoints(
          String(d.internshipRegistrationSuccessPoints),
        );
        setSuccessPointsExpiryDays(String(d.successPointsExpiryDays));
        setSuccessPointsMonthlyTransferLimit(
          String(d.successPointsMonthlyTransferLimit),
        );
      }
    } catch {
      toast.error("Could not load points settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    const values = {
      internshipSuccessPointInr: parseFloat(internshipSuccessPointInr),
      successPointRedemptionInr: parseFloat(successPointRedemptionInr),
      successPointsMaxUtilizationPercent: parseFloat(
        successPointsMaxUtilizationPercent,
      ),
      loginSuccessPoints: parseFloat(loginSuccessPoints),
      communityReviewSuccessPoints: parseFloat(communityReviewSuccessPoints),
      internshipRegistrationSuccessPoints: parseFloat(
        internshipRegistrationSuccessPoints,
      ),
      successPointsExpiryDays: parseFloat(successPointsExpiryDays),
      successPointsMonthlyTransferLimit: parseFloat(
        successPointsMonthlyTransferLimit,
      ),
    };
    if (
      Object.values(values).some((v) => Number.isNaN(v) || v < 0)
    ) {
      toast.error("Enter valid non-negative numbers for every field");
      return;
    }
    if (values.successPointsMaxUtilizationPercent > 100) {
      toast.error("Max success-points utilisation can't exceed 100%");
      return;
    }
    if (
      !Number.isInteger(values.successPointsExpiryDays) ||
      !Number.isInteger(values.successPointsMonthlyTransferLimit)
    ) {
      toast.error("Expiry days and the transfer limit must be whole numbers");
      return;
    }
    if (values.successPointsExpiryDays > 3650) {
      toast.error("Points expiry can't be more than 3650 days");
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch(ENDPOINTS.admin.pointsSettings, values);
      toast.success("Points settings saved");
      void load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center gap-2 text-stone-500 p-6">
        <Loader2 className="h-6 w-6 animate-spin shrink-0" />
        <span>Loading points settings…</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-stone-50/90 p-4 sm:p-6 lg:p-8 space-y-6">
      <Container
        icon={IndianRupee}
        title="Points values (INR)"
        description="Configure the internship success-points purchase rate and the user success-points redemption rate (used when buyers tick 'Use my success points' at course checkout)."
        className="w-full h-fit border-stone-200 shadow-sm"
        classNameBody="flex flex-col gap-6"
      >
        <div className="grid gap-6 sm:grid-cols-1">
          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">
              1 internship success point = ? ₹
            </label>
            <p className="text-xs text-stone-500">
              Used when enrolled learners buy internship success points (Paytm) to meet the
              program’s certification threshold. Total = points × this rate (e.g. 120 points ×
              ₹1 = ₹120).
            </p>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={internshipSuccessPointInr}
              onChange={(e) => setInternshipSuccessPointInr(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">
              1 success point redeemed = ? ₹ discount
            </label>
            <p className="text-xs text-stone-500">
              How much each user success point is worth as a discount when redeemed at course
              checkout. Set to 0 to disable redemption globally.
            </p>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={successPointRedemptionInr}
              onChange={(e) => setSuccessPointRedemptionInr(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">
              Max success-points utilisation (% of order)
            </label>
            <p className="text-xs text-stone-500">
              The most of a course order&apos;s payable amount (after any coupon &amp;
              referral discount) a buyer may settle with success points when they tick
              &quot;Use my success points&quot; at checkout. E.g. 20 = up to 20% off via
              points. Set to 0 to disable redemption globally. Success points apply only to
              course purchases.
            </p>
            <Input
              type="number"
              min={0}
              max={100}
              step="1"
              value={successPointsMaxUtilizationPercent}
              onChange={(e) =>
                setSuccessPointsMaxUtilizationPercent(e.target.value)
              }
              placeholder="0"
            />
          </div>
        </div>
      </Container>

      <Container
        icon={Hourglass}
        title="Expiry & transfers"
        description="How long wallet success points stay usable, and how many a user can send to others."
        className="w-full h-fit border-stone-200 shadow-sm"
        classNameBody="flex flex-col gap-6"
      >
        <div className="grid gap-6 sm:grid-cols-1">
          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">
              Points expire after (days)
            </label>
            <p className="text-xs text-stone-500">
              Every credit (course completion, plan purchase, rewards, admin grants) gets an
              expiry this many days after it lands, at the end of that day (IST). Changing it
              only affects new credits. Transferred points keep their original expiry. Set to
              0 so new points never expire.
            </p>
            <Input
              type="number"
              min={0}
              max={3650}
              step={1}
              value={successPointsExpiryDays}
              onChange={(e) => setSuccessPointsExpiryDays(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">
              Monthly transfer limit per user
            </label>
            <p className="text-xs text-stone-500">
              The most points one user can send to others in a calendar month (IST). Set to 0
              for no limit.
            </p>
            <Input
              type="number"
              min={0}
              step={1}
              value={successPointsMonthlyTransferLimit}
              onChange={(e) =>
                setSuccessPointsMonthlyTransferLimit(e.target.value)
              }
              placeholder="0"
            />
          </div>
        </div>
      </Container>

      <Container
        icon={Star}
        title="Reward points"
        description="Success points credited to a user's wallet when they reach these milestones. Set any value to 0 to disable that reward."
        className="w-full h-fit border-stone-200 shadow-sm"
        classNameBody="flex flex-col gap-6"
      >
        <div className="grid gap-6 sm:grid-cols-1">
          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">
              Points on first login
            </label>
            <p className="text-xs text-stone-500">
              One-time welcome bonus, credited the very first time a user logs in.
            </p>
            <Input
              type="number"
              min={0}
              step={1}
              value={loginSuccessPoints}
              onChange={(e) => setLoginSuccessPoints(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">
              Points for a community review
            </label>
            <p className="text-xs text-stone-500">
              Credited when a user submits a community review with their identity (not
              anonymous). Limited to one review per user.
            </p>
            <Input
              type="number"
              min={0}
              step={1}
              value={communityReviewSuccessPoints}
              onChange={(e) =>
                setCommunityReviewSuccessPoints(e.target.value)
              }
              placeholder="0"
            />
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">
              Points on internship registration
            </label>
            <p className="text-xs text-stone-500">
              Credited when a user registers for an internship (any path). Once per
              internship.
            </p>
            <Input
              type="number"
              min={0}
              step={1}
              value={internshipRegistrationSuccessPoints}
              onChange={(e) =>
                setInternshipRegistrationSuccessPoints(e.target.value)
              }
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 pt-2 border-t border-stone-100">
          <OrangeButton
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            glow={false}
            className="w-full sm:w-auto min-w-[140px]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Save className="h-4 w-4 shrink-0" />
            )}
            Save
          </OrangeButton>
        </div>
      </Container>
    </div>
  );
}
