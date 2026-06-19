"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import { Button } from "@/components/ui/buttons/button";
import { toast } from "react-toastify";
import useAnnouncements, {
  type Announcement,
  type AnnouncementAudience,
} from "@/hooks/useAnnouncements";

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  student: "Students",
  partner: "Partners",
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
};

export default function AdminAnnouncementsSettingsPage() {
  const { listAll, createAnnouncement, deleteAnnouncement } =
    useAnnouncements();

  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [audienceFilter, setAudienceFilter] = useState<
    "all" | AnnouncementAudience
  >("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("student");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listAll());
    } catch {
      setRows([]);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [listAll]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRows =
    audienceFilter === "all"
      ? rows
      : rows.filter((r) => r.audience === audienceFilter);

  const openCreate = () => {
    setTitle("");
    setMessage("");
    setAudience("student");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    setSaving(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        audience,
      });
      toast.success("Announcement published");
      setModalOpen(false);
      void load();
    } catch {
      toast.error("Failed to publish announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: Announcement) => {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    setDeletingId(a._id);
    try {
      await deleteAnnouncement(a._id);
      setRows((prev) => prev.filter((r) => r._id !== a._id));
      toast.success("Announcement deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-600">
            Publish dashboard announcements for students and partners. Each
            dashboard shows only the latest — older ones move to its
            announcements page.
          </p>
        </div>
        <OrangeButton glow={false} onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New announcement
        </OrangeButton>
      </div>

      <div className="w-full md:w-56">
        <Select
          options={[
            { value: "all", label: "All audiences" },
            { value: "student", label: "Students" },
            { value: "partner", label: "Partners" },
          ]}
          value={audienceFilter}
          onChange={(v) =>
            setAudienceFilter(v as "all" | AnnouncementAudience)
          }
          placeholder="Audience"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Audience
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Message
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Published
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No announcements
                    {audienceFilter !== "all" ? " for this audience" : ""}.
                  </td>
                </tr>
              ) : (
                visibleRows.map((a) => (
                  <tr
                    key={a._id}
                    className="border-b border-gray-100 hover:bg-gray-50/80"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.audience === "partner"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {AUDIENCE_LABEL[a.audience]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {a.title}
                    </td>
                    <td className="max-w-[340px] truncate px-4 py-3 text-gray-600">
                      {a.message}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => void handleDelete(a)}
                        disabled={deletingId === a._id}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Total: {visibleRows.length}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                New announcement
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 hover:bg-gray-100"
                title="Close"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Input
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short headline"
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Announcement details…"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <Select
              label="Audience"
              options={[
                { value: "student", label: "Students" },
                { value: "partner", label: "Partners" },
              ]}
              value={audience}
              onChange={(v) => setAudience(v as AnnouncementAudience)}
            />

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
                {saving ? "Publishing…" : "Publish"}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
