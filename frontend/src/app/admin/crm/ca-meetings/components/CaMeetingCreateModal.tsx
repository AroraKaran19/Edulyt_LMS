"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import useCaMeetings from "@/hooks/useCaMeetings";
import { istDatetimeLocalToUtcIso } from "@/lib/ist";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function toIsoFromLocalInput(localValue: string): string {
  // The datetime-local input is entered as IST wall-clock; store the UTC instant.
  return istDatetimeLocalToUtcIso(localValue) ?? "";
}

export default function CaMeetingCreateModal({ isOpen, onClose, onCreated }: Props) {
  const { createAdmin } = useCaMeetings();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [link1ExpiryMins, setLink1ExpiryMins] = useState("10");
  const [link2ExpiryMins, setLink2ExpiryMins] = useState("10");
  const [successPoints, setSuccessPoints] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setMeetingLink("");
    setRecordingLink("");
    setStartLocal("");
    setEndLocal("");
    setLink1ExpiryMins("10");
    setLink2ExpiryMins("10");
    setSuccessPoints("0");
    setSubmitting(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the form to blank defaults when the modal opens
    resetForm();
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
    const sp = parseInt(successPoints, 10);
    if (!Number.isFinite(sp) || sp < 0 || sp > 1_000_000) {
      toast.error("Success points must be a whole number between 0 and 1,000,000");
      return;
    }

    setSubmitting(true);
    const result = await createAdmin({
      name: trimmedName,
      description: description.trim() || undefined,
      meetingLink: link,
      recordingLink: recording || undefined,
      startDateTime: startIso,
      endDateTime: endIso,
      link1ExpiryMins: l1,
      link2ExpiryMins: l2,
      successPoints: sp,
    });
    setSubmitting(false);
    if (!result) return;
    toast.success("CA meeting created");
    onCreated();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New CA meeting" className="max-w-xl w-full mx-4 max-h-[90vh]">
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          required
          placeholder="e.g. October kickoff call"
          className="max-sm:text-base"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Description (optional)"
          placeholder="Agenda / what to bring"
          className="max-sm:text-base"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Meeting URL (Teams / Meet / etc.)"
          required
          placeholder="https://teams.microsoft.com/j/123..."
          className="max-sm:text-base"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
        />
        <Input
          label="Recording URL (optional)"
          placeholder="https://... link to the recorded session"
          className="max-sm:text-base"
          value={recordingLink}
          onChange={(e) => setRecordingLink(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start"
            required
            type="datetime-local"
            className="max-sm:text-base"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
          />
          <Input
            label="End"
            required
            type="datetime-local"
            className="max-sm:text-base"
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
            className="max-sm:text-base"
            value={link1ExpiryMins}
            onChange={(e) => setLink1ExpiryMins(e.target.value)}
          />
          <Input
            label="Attendance 2 expiry (minutes)"
            required
            type="number"
            min={1}
            className="max-sm:text-base"
            value={link2ExpiryMins}
            onChange={(e) => setLink2ExpiryMins(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Each attendance link is dormant until you activate it manually mid-meeting. The expiry timer starts at
          activation. A CA is marked <span className="font-semibold">present</span> only if they open both within
          their windows.
        </p>

        <Input
          label="Success points (for present CAs)"
          type="number"
          min={0}
          max={1_000_000}
          step={1}
          className="max-sm:text-base"
          value={successPoints}
          onChange={(e) => setSuccessPoints(e.target.value)}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Awarded to the wallet, and toward the CA&apos;s completion total, for every CA marked present.
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <WhiteButton type="button" glow={false} disabled={submitting} onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton type="button" glow={false} disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? "Creating..." : "Create"}
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
