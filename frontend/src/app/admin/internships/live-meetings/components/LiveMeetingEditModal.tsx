"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { AdminLiveMeetingListItem } from "@/types/internship-live-meeting";

type Props = {
  meeting: AdminLiveMeetingListItem | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function LiveMeetingEditModal({ meeting, onClose, onSaved }: Props) {
  const [meetingLink, setMeetingLink] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!meeting) return;
    setMeetingLink(meeting.meetingLink ?? "");
    setRecordingLink(meeting.recordingLink ?? "");
    setSubmitting(false);
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
    if (
      link === meeting.meetingLink &&
      recording === (meeting.recordingLink ?? "")
    ) {
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.patch(
        ENDPOINTS.internshipLiveMeetings.adminUpdate(meeting._id),
        { meetingLink: link, recordingLink: recording },
      );
      toast.success("Meeting updated");
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not update meeting";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={meeting !== null}
      onClose={onClose}
      title="Edit meeting"
      className="max-w-md w-full mx-4"
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-gray-500">
          Only the meeting URL and recording URL can be edited. To change
          anything else, delete this meeting and create a new one.
        </p>
        <Input
          label="Meeting URL"
          required
          placeholder="https://…"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
        />
        <Input
          label="Recording URL (optional)"
          placeholder="https://… link to the recorded session"
          value={recordingLink}
          onChange={(e) => setRecordingLink(e.target.value)}
        />
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
            {submitting ? "Saving…" : "Save"}
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
