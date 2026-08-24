"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { toast } from "react-toastify";
import { KeyRound, ShieldCheck, Pencil, Trash2, X, UserPlus } from "lucide-react";
import { fetcher } from "@/lib/utils";
import apiClient from "@/configs/apiConfig";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Pagination from "@/components/admin/Pagination";
import { ADMIN_PERMISSION_CATALOG } from "@/config/adminPermissions";
import PermissionPicker from "./components/PermissionPicker";
import AddAdminModal from "./components/AddAdminModal";

interface AdminUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  // Marketers and sales are staff too, so the list endpoint returns them here.
  userType: "admin" | "super-admin" | "marketer" | "sales";
  permissions?: string[];
}

const ADMINS_KEY = "/admin/staff/admins";
const PAGE_LIMIT = 10;

/** Human-readable chips for a permission-key list. */
const describePermissions = (keys: string[] = []): string[] => {
  const labels: string[] = [];
  for (const section of ADMIN_PERMISSION_CATALOG) {
    if (!section.single && keys.includes(section.key)) {
      labels.push(`${section.label} (all)`);
      continue;
    }
    for (const page of section.pages) {
      if (keys.includes(page.key) || keys.includes(section.key)) {
        labels.push(
          section.single ? section.label : `${section.label}: ${page.label}`,
        );
      }
    }
  }
  return labels;
};

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

const fullName = (u: AdminUser) =>
  `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—";

const AdminAccessPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, mutate } = useSWR(
    `${ADMINS_KEY}?page=${page}&limit=${PAGE_LIMIT}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );
  const payload = data?.data?.data;
  const admins: AdminUser[] = payload?.admins ?? [];
  const total: number = payload?.total ?? 0;
  const totalPages: number = payload?.totalPages ?? 1;

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [revoking, setRevoking] = useState<AdminUser | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="w-full p-4 sm:p-6 mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <KeyRound className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Access
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage admins and control which admin pages each one can access.
            </p>
          </div>
        </div>
      </div>

      {/* Admins table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            Admins <span className="text-gray-400 font-medium">({total})</span>
          </h2>
          <OrangeButton
            glow={false}
            className="flex items-center gap-2"
            onClick={() => setAdding(true)}
          >
            <UserPlus className="w-4 h-4" />
            <span className="font-medium hidden sm:inline">Add New Admin</span>
            <span className="font-medium sm:hidden">Add</span>
          </OrangeButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Page Access
                </th>
                <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3" />
                      <span className="text-sm text-gray-500">
                        Loading admins...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No admins yet.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isSuper = admin.userType === "super-admin";
                  const isRoleGated =
                    admin.userType === "marketer" || admin.userType === "sales";
                  const chips = isSuper
                    ? ["Full access"]
                    : describePermissions(admin.permissions);
                  return (
                    <tr key={admin._id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {(admin.firstName?.[0] || admin.email[0] || "A").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {fullName(admin)}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-700">
                            <ShieldCheck className="w-3 h-3" /> Super Admin
                          </span>
                        ) : isRoleGated ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                            {admin.userType === "sales" ? "Sales" : "Marketer"}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {isRoleGated ? (
                            <span className="text-xs text-gray-500">
                              Scholarship campaigns only, set by the role
                            </span>
                          ) : chips.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">
                              No pages granted
                            </span>
                          ) : (
                            <>
                              {chips.slice(0, 6).map((c) => (
                                <span
                                  key={c}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                >
                                  {c}
                                </span>
                              ))}
                              {chips.length > 6 && (
                                <span className="text-xs text-gray-400">
                                  +{chips.length - 6} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        {isSuper ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            {/* No Edit for a role-gated staff member: its access comes from the
                                role, so there are no page keys to change. */}
                            {!isRoleGated && (
                              <button
                                type="button"
                                onClick={() => setEditing(admin)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setRevoking(admin)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Revoke
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6">
            <p className="text-sm text-gray-700">{total} total</p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      {adding && (
        <AddAdminModal
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            mutate();
          }}
        />
      )}

      {editing && (
        <EditPermissionsModal
          admin={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            mutate();
          }}
        />
      )}

      {revoking && (
        <RevokeDialog
          admin={revoking}
          onClose={() => setRevoking(null)}
          onDone={() => {
            setRevoking(null);
            mutate();
          }}
        />
      )}
    </div>
  );
};

/* --------------------------- Edit permissions ----------------------------- */

const EditPermissionsModal = ({
  admin,
  onClose,
  onSaved,
}: {
  admin: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [permissions, setPermissions] = useState<string[]>(
    admin.permissions ?? [],
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/admin/staff/admins/${admin._id}/permissions`, {
        permissions,
      });
      toast.success("Permissions updated");
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update permissions"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-gray-900">Edit page access</h3>
            <p className="text-sm text-gray-500">{admin.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <PermissionPicker value={permissions} onChange={setPermissions} />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <OrangeButton glow={false} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------ Revoke dialog ----------------------------- */

const RevokeDialog = ({
  admin,
  onClose,
  onDone,
}: {
  admin: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [busy, setBusy] = useState(false);

  const revoke = async () => {
    setBusy(true);
    try {
      await apiClient.post(`/admin/staff/admins/${admin._id}/revoke`, {});
      toast.success("Admin access revoked");
      onDone();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to revoke admin"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-2">Revoke admin?</h3>
        <p className="text-sm text-gray-600 mb-6">
          <span className="font-medium">{fullName(admin)}</span> ({admin.email})
          will be demoted to a normal student and lose all admin access. This can
          be redone by promoting them again.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={revoke}
            disabled={busy}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-60"
          >
            {busy ? "Revoking..." : "Revoke access"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAccessPage;
