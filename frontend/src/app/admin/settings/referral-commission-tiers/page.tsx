"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import useReferral from "@/hooks/useReferral";
import type { ReferralCommissionTier } from "@/types/referral";

interface EditableTier {
  thresholdSales: string;
  commissionPercent: string;
}

function toEditable(t: ReferralCommissionTier): EditableTier {
  return {
    thresholdSales: String(t.thresholdSales),
    commissionPercent: String(t.commissionPercent),
  };
}

export default function AdminReferralCommissionTiersPage() {
  const { adminGetConfig, adminPutConfig } = useReferral();

  const [tiers, setTiers] = useState<EditableTier[]>([]);
  const [buyerDiscountPercent, setBuyerDiscountPercent] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await adminGetConfig();
      setTiers(cfg.tiers.map(toEditable));
      setBuyerDiscountPercent(String(cfg.buyerDiscountPercent ?? 0));
      setUpdatedAt(cfg.updatedAt);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ?? "Could not load config.",
      );
    } finally {
      setLoading(false);
    }
  }, [adminGetConfig]);

  useEffect(() => {
    void load();
  }, [load]);

  const addRow = () =>
    setTiers((prev) => [
      ...prev,
      { thresholdSales: "", commissionPercent: "" },
    ]);

  const removeRow = (index: number) =>
    setTiers((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (
    index: number,
    field: keyof EditableTier,
    value: string,
  ) =>
    setTiers((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    );

  const handleSave = async () => {
    const cleaned: ReferralCommissionTier[] = [];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const threshold = Math.floor(Number(t.thresholdSales));
      const pct = Number(t.commissionPercent);
      if (!Number.isFinite(threshold) || threshold < 1) {
        toast.error(`Row ${i + 1}: threshold sales must be an integer ≥ 1`);
        return;
      }
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        toast.error(`Row ${i + 1}: commission % must be between 0 and 100`);
        return;
      }
      cleaned.push({ thresholdSales: threshold, commissionPercent: pct });
    }

    // Backend re-validates + sorts, but flag duplicates here for nicer UX.
    const seen = new Set<number>();
    for (const t of cleaned) {
      if (seen.has(t.thresholdSales)) {
        toast.error(`Duplicate threshold ${t.thresholdSales}.`);
        return;
      }
      seen.add(t.thresholdSales);
    }

    const buyerPct = Number(buyerDiscountPercent);
    if (!Number.isFinite(buyerPct) || buyerPct < 0 || buyerPct > 100) {
      toast.error("Buyer discount % must be between 0 and 100");
      return;
    }

    setSaving(true);
    try {
      await adminPutConfig(cleaned, buyerPct);
      toast.success("Referral settings saved.");
      await load();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ?? "Could not save config.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-black">
          Referral Commission Tiers
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Cumulative bracket — once a referrer&apos;s lifetime sale count reaches
          a threshold, the matching percentage applies to{" "}
          <strong>all</strong> their active sales (retroactive). Tiers are
          sorted ascending by threshold on save.
        </p>
        {updatedAt ? (
          <p className="text-xs text-gray-400 mt-1">
            Last updated {new Date(updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        ) : null}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
        <label
          htmlFor="buyerDiscountPercent"
          className="block text-sm font-semibold text-black"
        >
          Buyer discount %
        </label>
        <p className="text-xs text-gray-500">
          Discount a student gets when checking out with another student&apos;s
          referral code. Applies to every code. Set <strong>0</strong> to
          disable. Stacks on top of any coupon (coupon first, then this % off
          the remaining amount).
        </p>
        <div className="relative w-40">
          <input
            id="buyerDiscountPercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={buyerDiscountPercent}
            onChange={(e) => setBuyerDiscountPercent(e.target.value)}
            placeholder="e.g. 20"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-7 text-sm"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            %
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold text-black w-1/3">
                Threshold sales (≥)
              </th>
              <th className="px-4 py-3 font-semibold text-black w-1/3">
                Commission %
              </th>
              <th className="px-4 py-3 font-semibold text-black w-24"></th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  No tiers configured yet. Click &quot;Add tier&quot; to start.
                </td>
              </tr>
            ) : (
              tiers.map((t, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={t.thresholdSales}
                      onChange={(e) =>
                        updateRow(i, "thresholdSales", e.target.value)
                      }
                      placeholder="e.g. 1"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={t.commissionPercent}
                        onChange={(e) =>
                          updateRow(i, "commissionPercent", e.target.value)
                        }
                        placeholder="e.g. 5"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-7 text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        %
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <WhiteButton type="button" glow={false} onClick={addRow}>
          <Plus className="w-3.5 h-3.5" /> Add tier
        </WhiteButton>
        <OrangeButton
          type="button"
          glow={false}
          onClick={() => void handleSave()}
          disabled={saving}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Save settings"}
        </OrangeButton>
      </div>
    </div>
  );
}
