"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { ShieldCheck, TriangleAlert, X } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Select from "@/components/ui/inputs/Select";
import { describePermissionLabels } from "@/config/adminPermissions";
import PermissionPicker from "@/app/admin/access/components/PermissionPicker";

type StaffRole = "marketer" | "sales" | "admin";

const ROLE_COPY: Record<StaffRole, { label: string; blurb: string }> = {
  marketer: {
    label: "Marketer",
    blurb:
      "Gets their own CRM pages and Scholarship campaigns. Anything ticked below is extra.",
  },
  sales: {
    label: "Sales",
    blurb:
      "Gets their own CRM pages, Scholarship campaigns and an inbox of assigned leads. Anything ticked below is extra.",
  },
  admin: {
    label: "Admin",
    blurb: "Has no pages at all until you grant them below.",
  },
};

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

export default function PromoteToStaffModal({
  user,
  onClose,
  onDone,
}: {
  user: { email: string; firstName?: string; lastName?: string };
  onClose: () => void;
  onDone: () => void;
}) {
  const [role, setRole] = useState<StaffRole>("marketer");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // A destructive, irreversible action needs a deliberate second act, not just
  // a button that happens to be under the cursor.
  const [confirmed, setConfirmed] = useState(false);

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email;
  const labels = describePermissionLabels(permissions);

  const submit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post("/admin/staff/admins/promote", {
        email: user.email,
        role,
        permissions,
      });
      toast.success(`${name} is now ${ROLE_COPY[role].label.toLowerCase()}`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error, "Could not change this user's role"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900">Make staff</h2>
              <p className="truncate text-xs text-gray-500">
                {name} · {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <Select
            label="Role"
            options={[
              { value: "marketer", label: "Marketer" },
              { value: "sales", label: "Sales" },
              { value: "admin", label: "Admin" },
            ]}
            value={role}
            onChange={(v) => setRole(v as StaffRole)}
          />
          <p className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-xs text-gray-700">
            {ROLE_COPY[role].blurb}
          </p>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {role === "admin" ? "Pages they can access" : "Extra pages"}
              </label>
              <span className="text-xs text-gray-500">
                {labels.length} selected
              </span>
            </div>
            <PermissionPicker value={permissions} onChange={setPermissions} />
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
            <div className="flex items-start gap-2.5">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-600" />
              <div className="text-xs text-red-900">
                <p className="font-bold">
                  This permanently deletes their learner data
                </p>
                <p className="mt-1 text-red-800">
                  Staff hold no learner records, so promoting {name} queues a
                  job that deletes their course and internship enrollments,
                  orders, certificates, submissions, vouchers, notes, reviews
                  and Q&amp;A. This cannot be undone, and demoting them later
                  does not bring any of it back.
                </p>
                <p className="mt-1 text-red-800">
                  A record of exactly what was deleted is kept against their
                  account, so a mistake can be traced.
                </p>
              </div>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-red-300 text-red-600"
              />
              <span className="text-xs font-medium text-red-900">
                I understand {name}&apos;s learner data will be deleted
              </span>
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-4">
          <WhiteButton type="button" glow={false} onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={submitting || !confirmed}
            onClick={submit}
          >
            {submitting ? "Saving…" : `Make ${ROLE_COPY[role].label}`}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
}
