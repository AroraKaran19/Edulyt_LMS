"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { istDatetimeLocalToUtcIso } from "@/lib/ist";
import { useCourse } from "@/hooks/useCourse";
import CoursePicker from "./CoursePicker";
import type { Instructor } from "@/types";

type Props = {
  isOpen: boolean;
  /** Pre-selects the course when the list is already filtered to one. */
  initialCourseId?: string;
  initialCourseTitle?: string;
  onClose: () => void;
  onCreated: () => void;
};

export default function LiveClassCreateModal({
  isOpen,
  initialCourseId = "",
  initialCourseTitle = "",
  onClose,
  onCreated,
}: Props) {
  const { getCourseById } = useCourse();

  const [courseId, setCourseId] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  const [title, setTitle] = useState("");
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
    setCourseId(initialCourseId);
    setCourseTitle(initialCourseTitle);
    setInstructorId("");
    setTitle("");
    setDescription("");
    setMeetingLink("");
    setRecordingLink("");
    setStartLocal("");
    setEndLocal("");
    setLink1ExpiryMins("10");
    setLink2ExpiryMins("10");
    setSubmitting(false);
  }, [isOpen, initialCourseId, initialCourseTitle]);

  // Load the chosen course's instructors so a host can optionally be named.
  useEffect(() => {
    if (!isOpen || !courseId) {
      setInstructors([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingInstructors(true);
      try {
        const course = await getCourseById(courseId);
        if (cancelled) return;
        const list = Array.isArray(course?.instructor)
          ? (course.instructor.filter(
              (i): i is Instructor =>
                typeof i === "object" && i !== null && "_id" in i,
            ) as Instructor[])
          : [];
        setInstructors(list);
      } catch {
        if (!cancelled) setInstructors([]);
      } finally {
        if (!cancelled) setLoadingInstructors(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, courseId, getCourseById]);

  const handleSubmit = async () => {
    if (!courseId) {
      toast.error("Select a course");
      return;
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      toast.error("Name must be at least 3 characters");
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
    const startIso = istDatetimeLocalToUtcIso(startLocal);
    if (!startIso) {
      toast.error("Start date/time is required");
      return;
    }
    const endIso = istDatetimeLocalToUtcIso(endLocal);
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
      toast.error("Attendance 1 expiry must be a positive integer");
      return;
    }
    if (!Number.isFinite(l2) || l2 < 1) {
      toast.error("Attendance 2 expiry must be a positive integer");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(ENDPOINTS.liveClasses.create, {
        course: courseId,
        title: trimmedTitle,
        description: description.trim() || undefined,
        // Optional — a course may have no instructor assigned, and that must
        // not block scheduling.
        instructor: instructorId || undefined,
        meetingLink: link,
        recordingLink: recording || undefined,
        startDateTime: startIso,
        endDateTime: endIso,
        link1ExpiryMins: l1,
        link2ExpiryMins: l2,
      });
      toast.success("Live class created");
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not create live class";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New live class"
      className="max-w-xl w-full mx-4 max-h-[90vh]"
    >
      <div className="flex flex-col gap-4">
        <CoursePicker
          label="Course"
          required
          value={courseId}
          selectedLabel={courseTitle}
          onChange={(id, titleText) => {
            setCourseId(id);
            setCourseTitle(titleText);
            setInstructorId("");
          }}
        />

        {courseId && (
          <div>
            <Select
              label="Instructor (optional)"
              placeholder={
                loadingInstructors
                  ? "Loading instructors…"
                  : instructors.length === 0
                    ? "No instructors on this course"
                    : "No instructor"
              }
              value={instructorId}
              disabled={loadingInstructors || instructors.length === 0}
              options={instructors.map((i) => ({
                value: i._id ?? "",
                label:
                  `${i.firstName ?? ""} ${i.lastName ?? ""}`.trim() ||
                  i.email ||
                  "Instructor",
              }))}
              onChange={setInstructorId}
            />
            {!loadingInstructors && instructors.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                This course has no instructors assigned. The class will just be
                listed without a host name.
              </p>
            )}
          </div>
        )}

        <Input
          label="Name"
          required
          placeholder="e.g. Week 1 — Kickoff call"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
        <p className="text-xs text-gray-500 -mt-2">
          Times are entered and shown in IST (Asia/Kolkata) for both you and your
          learners, regardless of device timezone.
        </p>
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
          mid-class. The expiry timer starts at activation. A student is marked
          <span className="font-semibold"> present </span>
          only if they open both within their windows.
        </p>

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
            {submitting ? "Creating…" : "Create"}
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
