"use client";

import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import { X, Check, ChevronLeft, ShieldCheck, Mail } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import InfiniteScrollSelect from "@/components/ui/dropdown/InfiniteScrollSelect";
import { describePermissionLabels } from "@/config/adminPermissions";
import PermissionPicker from "./PermissionPicker";

interface UserOption {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

const STEPS = ["Select user", "Permissions", "Review"] as const;

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

const nameOf = (u: UserOption) =>
  `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;

const AddAdminModal = ({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) => {
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Cache every user we page through so onChange(id) can resolve the full object.
  const usersCache = useRef<Record<string, UserOption>>({});

  const fetchUsers = async (page: number, search: string) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      // Existing admins/super-admins can't be promoted — keep them out of the list.
      excludeUserTypes: "admin,super-admin",
    });
    if (search) params.append("search", search);
    const res = await apiClient.get(`/users/admin/options?${params.toString()}`);
    const data = res.data.data as { users: UserOption[]; totalPages: number };
    data.users.forEach((u) => (usersCache.current[u._id] = u));
    return { items: data.users, totalPages: data.totalPages };
  };

  const submit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await apiClient.post("/admin/staff/admins/promote", {
        email: selectedUser.email,
        permissions,
      });
      toast.success(`${nameOf(selectedUser)} is now an admin`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to add admin"));
    } finally {
      setSubmitting(false);
    }
  };

  const permissionLabels = describePermissionLabels(permissions);

  return (
    <div className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header + stepper */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Add new admin</h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <React.Fragment key={label}>
                  <button
                    type="button"
                    onClick={() => done && setStep(i)}
                    disabled={!done}
                    title={done ? `Go back to ${label}` : undefined}
                    className={`flex items-center gap-2 ${
                      done ? "cursor-pointer group" : "cursor-default"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                        done
                          ? "bg-orange-500 text-white group-hover:bg-orange-600"
                          : active
                            ? "bg-orange-100 text-orange-600 ring-2 ring-orange-500"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span
                      className={`text-sm font-medium hidden sm:inline transition-colors ${
                        active
                          ? "text-gray-900"
                          : done
                            ? "text-gray-600 group-hover:text-orange-600"
                            : "text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 ${
                        done ? "bg-orange-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-700">
                Select the user to make an admin
              </label>
              <InfiniteScrollSelect<UserOption>
                value={selectedId}
                onChange={(v) => {
                  const id = v as string;
                  setSelectedId(id);
                  setSelectedUser(usersCache.current[id] ?? null);
                }}
                fetchOptions={fetchUsers}
                dropdownPortal
                placeholder="Search users by name or email..."
                searchPlaceholder="Search by name or email..."
                emptyMessage="No users found"
                getOptionValue={(u) => (u as UserOption)._id}
                getOptionLabel={(u) => {
                  const user = u as UserOption;
                  return `${nameOf(user)} · ${user.email}`;
                }}
                renderOption={(u, { selected }) => {
                  const user = u as UserOption;
                  return (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                        {(user.firstName?.[0] || user.email[0] || "U").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-sm truncate ${selected ? "font-semibold text-orange-700" : "text-gray-900"}`}
                        >
                          {nameOf(user)}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <p className="text-xs text-gray-500">
                Only existing users appear here. The user keeps their account and
                gains admin access. Existing admins / super-admins can&apos;t be
                added again.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Choose the pages this admin can access
                </label>
                <span className="text-xs text-gray-500">
                  {permissionLabels.length} selected
                </span>
              </div>
              <PermissionPicker value={permissions} onChange={setPermissions} />
            </div>
          )}

          {step === 2 && selectedUser && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="h-11 w-11 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold shrink-0">
                  {(selectedUser.firstName?.[0] || selectedUser.email[0] || "U").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
                    {nameOf(selectedUser)}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 truncate flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {selectedUser.email}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Page access ({permissionLabels.length})
                </div>
                {permissionLabels.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No pages selected — this admin will start with no access
                    until you grant pages later.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {permissionLabels.map((l) => (
                      <span
                        key={l}
                        className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-2 py-1 rounded-md"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {step === 0 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" /> Back
              </>
            )}
          </button>

          {step < 2 ? (
            <OrangeButton
              glow={false}
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !selectedUser}
            >
              Next
            </OrangeButton>
          ) : (
            <OrangeButton glow={false} onClick={submit} disabled={submitting}>
              {submitting && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              )}
              {submitting ? "Adding..." : "Confirm & Add Admin"}
            </OrangeButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAdminModal;
