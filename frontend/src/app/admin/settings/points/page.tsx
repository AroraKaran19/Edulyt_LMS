"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, IndianRupee, Save } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Input from "@/components/ui/inputs/Input";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Container from "@/app/admin/components/ui/Container";

type PointsSettings = {
  successPointInr: number;
  internshipSuccessPointInr: number;
};

/** Backend: `{ success, message, data: { successPointInr, internshipSuccessPointInr } }` */
function parsePointsPayload(axiosData: unknown): PointsSettings | null {
  if (!axiosData || typeof axiosData !== "object") return null;
  const envelope = axiosData as { data?: unknown };
  const d = envelope.data;
  if (!d || typeof d !== "object") return null;
  const p = d as Record<string, unknown>;
  if (!("successPointInr" in p) && !("internshipSuccessPointInr" in p))
    return null;
  return {
    successPointInr: Number(p.successPointInr) || 0,
    internshipSuccessPointInr: Number(p.internshipSuccessPointInr) || 0,
  };
}

export default function AdminPointsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successPointInr, setSuccessPointInr] = useState("");
  const [internshipSuccessPointInr, setInternshipSuccessPointInr] =
    useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.admin.pointsSettings);
      const d = parsePointsPayload(res.data);
      if (d) {
        setSuccessPointInr(String(d.successPointInr));
        setInternshipSuccessPointInr(String(d.internshipSuccessPointInr));
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
    const sp = parseFloat(successPointInr);
    const isp = parseFloat(internshipSuccessPointInr);
    if (Number.isNaN(sp) || sp < 0 || Number.isNaN(isp) || isp < 0) {
      toast.error("Enter valid non-negative numbers for both fields");
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch(ENDPOINTS.admin.pointsSettings, {
        successPointInr: sp,
        internshipSuccessPointInr: isp,
      });
      toast.success("Points values saved");
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
    <div className="w-full min-h-full bg-stone-50/90 p-4 sm:p-6 lg:p-8">
      <Container
        icon={IndianRupee}
        title="Points values (INR)"
        description="Prices used at checkout when learners purchase points. Course success points use the first rate; internship success points use the second — for example if internship points are ₹1 each, buying 120 points to reach a certification threshold of 120 costs ₹120 (before payment gateway)."
        className="w-full border-stone-200 shadow-sm"
        classNameBody="flex flex-col gap-6"
      >
        <div className="grid gap-6 sm:grid-cols-1">
          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 space-y-2">
            <label className="block text-sm font-semibold text-stone-800">
              1 success point = ? ₹
            </label>
            <p className="text-xs text-stone-500">
              Course / platform success points on the user account.
            </p>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={successPointInr}
              onChange={(e) => setSuccessPointInr(e.target.value)}
              placeholder="0"
            />
          </div>

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
