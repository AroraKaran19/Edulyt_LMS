"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type Props = {
  isOpen: boolean;
  /** Omit to create. */
  programId?: string;
  onClose: () => void;
  onSaved: () => void;
};

type TaskTemplate = { _id: string; title: string };

/** Shape returned by GET /course-internships/:id — task templates arrive populated. */
type ProgramResponse = {
  title?: string;
  description?: string;
  offerLetterDesignation?: string;
  whatsappGroupLink?: string;
  perks?: string[];
  whatYouWillDo?: string[];
  taskTemplateIds?: Array<string | { _id?: string }>;
  documentationRequired?: boolean;
  documentationDueOffsetDays?: number;
  isActive?: boolean;
};

type FormState = {
  title: string;
  description: string;
  offerLetterDesignation: string;
  whatsappGroupLink: string;
  perks: string[];
  whatYouWillDo: string[];
  taskTemplateIds: string[];
  documentationRequired: boolean;
  documentationDueOffsetDays: number;
  isActive: boolean;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  offerLetterDesignation: "",
  whatsappGroupLink: "",
  perks: [],
  whatYouWillDo: [],
  taskTemplateIds: [],
  documentationRequired: true,
  documentationDueOffsetDays: 7,
  isActive: true,
};

/** Free-text list editor used for perks and "what you will do". */
function StringListField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div>
      <label className="font-medium text-black mb-2 block">{label}</label>
      <div className="flex gap-2">
        <Input
          value={draft}
          setChange={setDraft}
          placeholder={placeholder}
          className="flex-1"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <WhiteButton type="button" glow={false} onClick={add}>
          <Plus className="size-4" />
        </WhiteButton>
      </div>
      {values.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {values.map((value, index) => (
            <li
              key={`${value}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProgramUpsertModal({
  isOpen,
  programId,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const loadProgram = useCallback(async () => {
    if (!programId) {
      setForm(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.courseInternships.byId(programId));
      const p = (res.data?.data ?? {}) as ProgramResponse;
      setForm({
        title: p?.title ?? "",
        description: p?.description ?? "",
        offerLetterDesignation: p?.offerLetterDesignation ?? "",
        whatsappGroupLink: p?.whatsappGroupLink ?? "",
        perks: Array.isArray(p?.perks) ? p.perks : [],
        whatYouWillDo: Array.isArray(p?.whatYouWillDo) ? p.whatYouWillDo : [],
        // Populated on read, ids on write.
        taskTemplateIds: Array.isArray(p?.taskTemplateIds)
          ? p.taskTemplateIds.map((t) =>
              typeof t === "string" ? t : String(t?._id ?? ""),
            )
          : [],
        documentationRequired: p?.documentationRequired ?? true,
        documentationDueOffsetDays: p?.documentationDueOffsetDays ?? 7,
        isActive: p?.isActive ?? true,
      });
    } catch {
      toast.error("Failed to load program");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [programId, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    void loadProgram();
  }, [isOpen, loadProgram]);

  useEffect(() => {
    if (!isOpen) return;
    // The task library is shared with Internships — programs reference it,
    // they never author their own templates.
    apiClient
      .get(ENDPOINTS.internshipTasks.adminList, {
        params: { page: 1, limit: 100, status: "active" },
      })
      .then((res) => {
        const rows = (res.data?.data?.tasks ?? []) as TaskTemplate[];
        setTemplates(rows);
      })
      .catch(() => setTemplates([]));
  }, [isOpen]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (programId) {
        await apiClient.patch(
          ENDPOINTS.courseInternships.byId(programId),
          form,
        );
        toast.success("Program updated");
      } else {
        await apiClient.post(ENDPOINTS.courseInternships.all, form);
        toast.success("Program created");
      }
      onSaved();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not save program";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplate = (id: string) =>
    set(
      "taskTemplateIds",
      form.taskTemplateIds.includes(id)
        ? form.taskTemplateIds.filter((t) => t !== id)
        : [...form.taskTemplateIds, id],
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={programId ? "Edit program" : "Create program"}
      className="max-w-2xl w-full mx-4"
    >
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input
            label="Title"
            required
            value={form.title}
            setChange={(v) => set("title", v)}
            placeholder="Analytics Internship"
          />

          <div>
            <label className="font-medium text-black mb-2 block">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="What this internship involves"
            />
          </div>

          <Input
            label="Offer letter designation"
            value={form.offerLetterDesignation}
            setChange={(v) => set("offerLetterDesignation", v)}
            placeholder="Data Analyst Intern"
          />

          <Input
            label="WhatsApp group link"
            value={form.whatsappGroupLink}
            setChange={(v) => set("whatsappGroupLink", v)}
            placeholder="https://chat.whatsapp.com/…"
          />

          <StringListField
            label="Perks"
            values={form.perks}
            onChange={(v) => set("perks", v)}
            placeholder="Certificate of completion"
          />

          <StringListField
            label="What you will do"
            values={form.whatYouWillDo}
            onChange={(v) => set("whatYouWillDo", v)}
            placeholder="Build a sales dashboard"
          />

          <div>
            <label className="font-medium text-black mb-2 block">
              Task templates
            </label>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">
                No active task templates. Create them under Internships → Task
                templates.
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {templates.map((t) => (
                  <label
                    key={t._id}
                    className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-orange-500"
                      checked={form.taskTemplateIds.includes(t._id)}
                      onChange={() => toggleTemplate(t._id)}
                    />
                    {t.title}
                  </label>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="size-4 accent-orange-500"
              checked={form.documentationRequired}
              onChange={(e) => set("documentationRequired", e.target.checked)}
            />
            Require document review
          </label>

          {form.documentationRequired && (
            <Input
              label="Documents due (days after purchase)"
              type="number"
              min={0}
              value={form.documentationDueOffsetDays}
              onChange={(e) =>
                set("documentationDueOffsetDays", Number(e.target.value))
              }
            />
          )}

          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="size-4 accent-orange-500"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            Active — inactive programs stay available to enrolled learners but
            stop being sold
          </label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-200">
        <WhiteButton
          type="button"
          glow={false}
          disabled={saving}
          onClick={onClose}
        >
          Cancel
        </WhiteButton>
        <OrangeButton
          type="button"
          glow={false}
          disabled={saving || loading}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : programId ? "Save changes" : "Create program"}
        </OrangeButton>
      </div>
    </Modal>
  );
}
