"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type Props = {
  isOpen: boolean;
  internshipId: string;
  batchId: string;
  onClose: () => void;
  onCreated: () => void;
};

function toIsoFromLocalInput(localValue: string): string {
  // Browser datetime-local input gives "YYYY-MM-DDTHH:mm" in local time.
  if (!localValue) return "";
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default function LiveMeetingCreateModal({
  isOpen,
  internshipId,
  batchId,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [link1ExpiryMins, setLink1ExpiryMins] = useState("10");
  const [link2ExpiryMins, setLink2ExpiryMins] = useState("10");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setDescription("");
    setMeetingLink("");
    setRecordingLink("");
    setStartLocal("");
    setEndLocal("");
    setLink1ExpiryMins("10");
    setLink2ExpiryMins("10");
    setSubmitting(false);
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }
    const link = meetingLink.trim();
    if (!/^https?:\/\//.test(link)) {
      toast.error("Meeting link must start with http:// or https://");
      return;
    }
    const recording = recordingLink.trim();
    if (recording && !/^https?:\/\//.test(recording)) {
      toast.error("Recording link must start with http:// or https://");
      return;
    }
    const startIso = toIsoFromLocalInput(startLocal);
    if (!startIso) {
      toast.error("Start date/time is required");
      return;
    }
    const endIso = toIsoFromLocalInput(endLocal);
    if (!endIso) {
      toast.error("End date/time is required");
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      toast.error("End date/time must be after start");
      return;
    }
    const l1 = parseInt(link1ExpiryMins, 10);
    const l2 = parseInt(link2ExpiryMins, 10);
    if (!Number.isFinite(l1) || l1 < 1) {
      toast.error("Link 1 expiry minutes must be a positive integer");
      return;
    }
    if (!Number.isFinite(l2) || l2 < 1) {
      toast.error("Link 2 expiry minutes must be a positive integer");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(ENDPOINTS.internshipLiveMeetings.create, {
        internshipId,
        batchId,
        name: trimmedName,
        description: description.trim() || undefined,
        meetingLink: link,
        recordingLink: recording || undefined,
        startDateTime: startIso,
        endDateTime: endIso,
        link1ExpiryMins: l1,
        link2ExpiryMins: l2,
      });
      toast.success("Live meeting created");
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not create meeting";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New live meeting"
      className="max-w-xl w-full mx-4 max-h-[90vh]"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          required
          placeholder="e.g. Week 1 — Kickoff call"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Description (optional)"
          placeholder="Agenda / what to bring"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Meeting URL (Teams / Meet / etc.)"
          required
          placeholder="https://teams.microsoft.com/j/123…"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
        />
        <Input
          label="Recording URL (optional)"
          placeholder="https://… link to the recorded session"
          value={recordingLink}
          onChange={(e) => setRecordingLink(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start"
            required
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
          />
          <Input
            label="End"
            required
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Attendance 1 expiry (minutes)"
            required
            type="number"
            min={1}
            value={link1ExpiryMins}
            onChange={(e) => setLink1ExpiryMins(e.target.value)}
          />
          <Input
            label="Attendance 2 expiry (minutes)"
            required
            type="number"
            min={1}
            value={link2ExpiryMins}
            onChange={(e) => setLink2ExpiryMins(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Each attendance link is dormant until you activate it manually
          mid-meeting. The expiry timer starts at activation. A student is
          marked <span className="font-semibold"> present </span>
          only if they open both within their windows.
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <WhiteButton type="button" glow={false} disabled={submitting} onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Creating…" : "Create"}
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
