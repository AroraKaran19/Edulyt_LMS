"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import useCaMeetings from "@/hooks/useCaMeetings";
import type { CaMeetingAdminRow } from "@/types/ca-meeting";

type Props = {
  meeting: CaMeetingAdminRow | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function CaMeetingEditModal({ meeting, onClose, onSaved }: Props) {
  const { updateAdmin } = useCaMeetings();
  const [meetingLink, setMeetingLink] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [successPoints, setSuccessPoints] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const applyMeeting = (m: CaMeetingAdminRow) => {
    setMeetingLink(m.meetingLink ?? "");
    setRecordingLink(m.recordingLink ?? "");
    setSuccessPoints(String(m.successPoints ?? 0));
    setSubmitting(false);
  };

  useEffect(() => {
    if (!meeting) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- populates the form from the meeting being opened for edit
    applyMeeting(meeting);
  }, [meeting]);

  const handleSubmit = async () => {
    if (!meeting) return;
    const link = meetingLink.trim();
    if (!/^https?:\/\//.test(link)) {
      toast.error("Meeting URL must start with http:// or https://");
      return;
    }
    const recording = recordingLink.trim();
    if (recording && !/^https?:\/\//.test(recording)) {
      toast.error("Recording URL must start with http:// or https://");
      return;
    }
    const sp = parseInt(successPoints, 10);
    if (!Number.isFinite(sp) || sp < 0 || sp > 1_000_000) {
      toast.error("Success points must be a whole number between 0 and 1,000,000");
      return;
    }
    if (link === meeting.meetingLink && recording === (meeting.recordingLink ?? "") && sp === (meeting.successPoints ?? 0)) {
      onClose();
      return;
    }

    // Only include `successPoints` when actually changed: sending it unchanged
    // would still trip the backend lock once the meeting is finalized, blocking
    // link-only edits.
    const patchBody: { meetingLink: string; recordingLink: string; successPoints?: number } = {
      meetingLink: link,
      recordingLink: recording,
    };
    if (sp !== (meeting.successPoints ?? 0)) {
      patchBody.successPoints = sp;
    }

    setSubmitting(true);
    const result = await updateAdmin(meeting.id, patchBody);
    setSubmitting(false);
    if (!result) return;
    toast.success("Meeting updated");
    onSaved();
    onClose();
  };

  return (
    <Modal isOpen={meeting !== null} onClose={onClose} title="Edit meeting" className="max-w-md w-full mx-4">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-gray-500">
          Editable: meeting URL, recording URL, and success points. To change anything else, delete this meeting and
          create a new one.
        </p>
        <Input
          label="Meeting URL"
          required
          placeholder="https://..."
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
        <Input
          label="Success points (for present CAs)"
          type="number"
          min={0}
          max={1_000_000}
          step={1}
          className="max-sm:text-base"
          value={successPoints}
          onChange={(e) => setSuccessPoints(e.target.value)}
          disabled={Boolean(meeting?.finalizedAt)}
        />
        {meeting?.finalizedAt && (
          <p className="text-xs text-amber-700 -mt-3">
            Locked, attendance was finalized on{" "}
            {new Date(meeting.finalizedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}. Present CAs have
            already been credited at the current value.
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <WhiteButton type="button" glow={false} disabled={submitting} onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton type="button" glow={false} disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? "Saving..." : "Save"}
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
