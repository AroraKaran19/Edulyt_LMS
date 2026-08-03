"use client";

import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { Mail } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

type Preferences = Record<string, boolean>;

/** Order and copy of the toggles. Keys match the backend categories. */
const CATEGORIES: { key: string; title: string; description: string }[] = [
  {
    key: "reviews",
    title: "Review notifications",
    description: "When someone responds to a review you posted",
  },
  {
    key: "referrals",
    title: "Referral notifications",
    description: "When someone signs up using your referral code",
  },
  {
    key: "promotions",
    title: "Offers and suggestions",
    description: "New programmes, offers and recommendations",
  },
];

/**
 * Opt-outs for non-essential email.
 *
 * Deliberately does not list account email. Verification codes, password
 * resets, receipts and certificates cannot be switched off, and showing a
 * disabled toggle for them would only invite the question.
 */
const EmailPreferencesCard = () => {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.emailPreferences.me);
      setPreferences(response.data?.data?.preferences ?? {});
    } catch {
      // Non-fatal: the rest of the settings page still works.
      setPreferences(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (key: string, next: boolean) => {
    const previous = preferences?.[key];

    // Optimistic: a toggle that lags feels broken. Rolled back if the save fails.
    setPreferences((prev) => ({ ...(prev ?? {}), [key]: next }));
    setSaving(key);

    try {
      await apiClient.patch(ENDPOINTS.emailPreferences.update, {
        preferences: { [key]: next },
      });
      toast.success(next ? "Subscribed" : "Unsubscribed");
    } catch (error: any) {
      setPreferences((prev) => ({ ...(prev ?? {}), [key]: previous ?? true }));
      toast.error(
        error?.response?.data?.error?.message ||
          "Could not save that. Please try again.",
      );
    } finally {
      setSaving(null);
    }
  };

  if (loading || !preferences) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Mail className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Email Preferences</h2>
          <p className="text-sm text-gray-600">
            Choose which optional emails you receive
          </p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-gray-100">
        {CATEGORIES.map(({ key, title, description }) => {
          const enabled = preferences[key] !== false;
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {title}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">{description}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={title}
                disabled={saving === key}
                onClick={() => toggle(key, !enabled)}
                className={`relative shrink-0 w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  enabled ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-5 pt-4 border-t border-gray-100 text-xs sm:text-sm text-gray-500">
        Account emails such as verification codes, password resets, receipts and
        certificates are always sent and cannot be turned off.
      </p>
    </div>
  );
};

export default EmailPreferencesCard;
