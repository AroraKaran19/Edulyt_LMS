"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import {
  istDatetimeLocalToUtcIso,
  utcToIstDatetimeLocalValue,
} from "@/lib/ist";
import type { LiveClass, UpdateLiveClassData } from "@/types/live-classes";

type Props = {
  liveClass: LiveClass | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function LiveClassEditModal({
  liveClass,
  onClose,
  onSaved,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [link1ExpiryMins, setLink1ExpiryMins] = useState("10");
  const [link2ExpiryMins, setLink2ExpiryMins] = useState("10");
  const [submitting, setSubmitting] = useState(false);

  // An activated window is locked — re-timing it after learners have opened it
  // would silently rewrite who counts as present.
  const link1Locked = Boolean(liveClass?.link1.activatedAt);
  const link2Locked = Boolean(liveClass?.link2.activatedAt);

  useEffect(() => {
    if (!liveClass) return;
    setTitle(liveClass.title ?? "");
    setDescription(liveClass.description ?? "");
    setMeetingLink(liveClass.meetingLink ?? "");
    setRecordingLink(liveClass.recordingLink ?? "");
    setStartLocal(utcToIstDatetimeLocalValue(liveClass.startDateTime));
    setEndLocal(utcToIstDatetimeLocalValue(liveClass.endDateTime));
    setLink1ExpiryMins(String(liveClass.link1.expiryMins || 10));
    setLink2ExpiryMins(String(liveClass.link2.expiryMins || 10));
    setSubmitting(false);
  }, [liveClass]);

  const handleSubmit = async () => {
    if (!liveClass) return;

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }
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
    const startIso = istDatetimeLocalToUtcIso(startLocal);
    const endIso = istDatetimeLocalToUtcIso(endLocal);
    if (!startIso || !endIso) {
      toast.error("Enter a valid start and end date/time");
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      toast.error("End date/time must be after start");
      return;
    }

    // Only send what actually changed — sending an unchanged expiry for an
    // already-activated link would trip the backend's window lock and block
    // an otherwise-valid edit.
    const body: UpdateLiveClassData = {};
    if (trimmedTitle !== liveClass.title) body.title = trimmedTitle;
    if (description.trim() !== (liveClass.description ?? "")) {
      body.description = description.trim();
    }
    if (link !== liveClass.meetingLink) body.meetingLink = link;
    if (recording !== (liveClass.recordingLink ?? "")) {
      body.recordingLink = recording;
    }
    if (startIso !== new Date(liveClass.startDateTime).toISOString()) {
      body.startDateTime = startIso;
    }
    if (endIso !== new Date(liveClass.endDateTime).toISOString()) {
      body.endDateTime = endIso;
    }
    if (!link1Locked) {
      const l1 = parseInt(link1ExpiryMins, 10);
      if (!Number.isFinite(l1) || l1 < 1) {
        toast.error("Attendance 1 expiry must be a positive integer");
        return;
      }
      if (l1 !== liveClass.link1.expiryMins) body.link1ExpiryMins = l1;
    }
    if (!link2Locked) {
      const l2 = parseInt(link2ExpiryMins, 10);
      if (!Number.isFinite(l2) || l2 < 1) {
        toast.error("Attendance 2 expiry must be a positive integer");
        return;
      }
      if (l2 !== liveClass.link2.expiryMins) body.link2ExpiryMins = l2;
    }

    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.put(ENDPOINTS.liveClasses.update(liveClass._id), body);
      toast.success("Live class updated");
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not update live class";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={liveClass !== null}
      onClose={onClose}
      title="Edit live class"
      className="max-w-xl w-full mx-4 max-h-[90vh]"
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-gray-500">
          The course can&apos;t be changed — delete this class and create a new
          one if it belongs elsewhere.
        </p>

        <Input
          label="Name"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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
          <div>
            <Input
              label="Attendance 1 expiry (minutes)"
              type="number"
              min={1}
              value={link1ExpiryMins}
              disabled={link1Locked}
              onChange={(e) => setLink1ExpiryMins(e.target.value)}
            />
            {link1Locked && (
              <p className="text-xs text-gray-500 mt-1">
                Locked — already activated.
              </p>
            )}
          </div>
          <div>
            <Input
              label="Attendance 2 expiry (minutes)"
              type="number"
              min={1}
              value={link2ExpiryMins}
              disabled={link2Locked}
              onChange={(e) => setLink2ExpiryMins(e.target.value)}
            />
            {link2Locked && (
              <p className="text-xs text-gray-500 mt-1">
                Locked — already activated.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <WhiteButton
            type="button"
            glow={false}
            disabled={submitting}
            onClick={onClose}
          >
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
