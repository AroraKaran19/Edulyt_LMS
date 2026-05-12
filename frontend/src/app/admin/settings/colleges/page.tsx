"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import useColleges, { College } from "@/hooks/useColleges";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/buttons/button";

const PAGE_SIZE = 20;

export default function AdminCollegesSettingsPage() {
  const {
    listCollegesAdmin,
    createCollege,
    updateCollege,
    deleteCollege,
    isLoading,
  } = useColleges();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">(
    "all",
  );
  const [rows, setRows] = useState<College[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<College | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (pageOverride?: number) => {
      const res = await listCollegesAdmin({
        page: pageOverride ?? page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        isActive: statusFilter,
      });
      if (res) {
        setRows(res.colleges);
        setTotalPages(res.totalPages || 1);
        setTotal(res.total);
      } else {
        setRows([]);
        toast.error("Failed to load colleges");
      }
    },
    [listCollegesAdmin, page, debouncedSearch, statusFilter],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setLocation("");
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (c: College) => {
    setEditing(c);
    setName(c.name);
    setLocation(c.location || "");
    setIsActive(c.isActive);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!location.trim()) {
      toast.error("Location is required");
      return;
    }
    setSaving(true);
    try {
      if (editing?._id) {
        const updated = await updateCollege(editing._id, {
          name: name.trim(),
          location: location.trim(),
          isActive,
        });
        if (updated) {
          toast.success("College updated");
          setModalOpen(false);
          void load();
        } else toast.error("Update failed");
      } else {
        const created = await createCollege({
          name: name.trim(),
          location: location.trim(),
          isActive,
        });
        if (created) {
          toast.success("College created");
          setModalOpen(false);
          setPage(1);
          await load(1);
        } else toast.error("Create failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: College) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    setDeletingId(c._id);
    try {
      const ok = await deleteCollege(c._id);
      if (ok) {
        toast.success("College deleted");
        void load();
      } else toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full p-6 mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Colleges List</h1>
            <p className="text-sm text-gray-600">
              Manage colleges for student profiles.
            </p>
          </div>
        </div>
        <OrangeButton glow={false} onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Add college
        </OrangeButton>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <Select
            options={[
              { value: "all", label: "All statuses" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as "all" | "true" | "false");
              setPage(1);
            }}
            placeholder="Status"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Location
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No colleges found.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-gray-100 hover:bg-gray-50/80"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.location.trim() || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-blue-600"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => void handleDelete(c)}
                        disabled={deletingId === c._id}
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-red-50 text-red-600 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          <span>
            Total: {total} · Page {page} of {Math.max(1, totalPages)}
          </span>
          <div className="flex gap-2">
            <WhiteButton
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </WhiteButton>
            <OrangeButton
              glow={false}
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </OrangeButton>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "Edit college" : "Add college"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Input
              label="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Indian Institute of Technology Roorkee"
            />
            <Input
              label="Location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Roorkee, Uttarakhand, India"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-800">Active</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <WhiteButton
                glow={false}
                onClick={() => setModalOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                glow={false}
                onClick={() => void handleSave()}
                disabled={saving}
                className="cursor-pointer"
              >
                {saving ? "Saving…" : "Save"}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
