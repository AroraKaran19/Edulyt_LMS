"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { NotebookPen } from "lucide-react";
import { Course, CourseLesson, CourseModule, Content } from "@/types";
import { VideoNote } from "@/types/notes";
import useVideoNotes from "@/hooks/useVideoNotes";
import DropDown from "@/components/ui/dropdown/DropDown";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useVideoControls } from "../context/VideoTimeContext";
import NoteComposer from "./NoteComposer";
import NoteCard from "./NoteCard";
import PendingSeekRunner, { PendingSeek } from "./PendingSeekRunner";

type LectureFilter = "all" | "current";
type NoteSort = "course" | "recent";

// `DropDown` takes raw option values plus a display map, so the union types
// above stay the source of truth and the labels never drift from them.
const LECTURE_FILTER_OPTIONS: LectureFilter[] = ["all", "current"];
const LECTURE_FILTER_LABELS: Record<LectureFilter, string> = {
  all: "All Lectures",
  current: "This Lecture",
};

const SORT_OPTIONS: NoteSort[] = ["course", "recent"];
const SORT_LABELS: Record<NoteSort, string> = {
  course: "Course order",
  recent: "Recently added",
};

/** Where a note's lecture sits in the curriculum, for grouping and ordering. */
interface LecturePosition {
  title: string;
  order: number;
}

const REMOVED_LECTURE_TITLE = "Removed lecture";

/**
 * Builds lessonId -> {title, curriculum position} from the course tree that is
 * already in memory.
 *
 * Notes store ids, not titles. Resolving them here rather than populating them
 * server-side keeps the notes query a single flat read with no joins, and
 * means the heading always reflects the course's current naming.
 */
const buildLectureIndex = (course: Course): Map<string, LecturePosition> => {
  const index = new Map<string, LecturePosition>();
  const modules = (course.modules || []) as CourseModule[];
  let order = 0;

  modules.forEach((module) => {
    const lessons = (module.lessons || []) as CourseLesson[];
    lessons.forEach((lesson) => {
      const lessonId = String(lesson._id || "");
      if (!lessonId) return;
      index.set(lessonId, {
        title: `${module.title} | ${lesson.title}`,
        order: order++,
      });
    });
  });

  return index;
};

const NotesSection = ({
  course,
  selectedLessonId,
  selectedContentId,
  selectedContentType,
  navigateToContent,
}: {
  course: Course;
  selectedLessonId: string;
  selectedContentId: string;
  /** Undefined when nothing is open. */
  selectedContentType?: Content["type"];
  navigateToContent: (contentId: string) => void;
}) => {
  const courseId = String(course._id || "");
  const {
    notes,
    isLoading,
    error,
    refetch,
    createNote,
    updateNote,
    deleteNote,
  } = useVideoNotes(courseId);

  // Controls never change identity, so subscribing here costs no re-renders.
  const { seekTo, getConnectionSeq } = useVideoControls();

  const [filter, setFilter] = useState<LectureFilter>("all");
  const [sort, setSort] = useState<NoteSort>("course");

  const pendingSeekRef = useRef<PendingSeek | null>(null);

  const lectureIndex = useMemo(() => buildLectureIndex(course), [course]);

  const isVideoOpen = selectedContentType === "video";

  const handleCreate = useCallback(
    async (content: string, timestamp: number) => {
      if (!courseId || !selectedLessonId || !selectedContentId) return false;
      const created = await createNote({
        courseId,
        lessonId: selectedLessonId,
        contentId: selectedContentId,
        content,
        timestamp,
      });
      return created !== null;
    },
    [courseId, selectedLessonId, selectedContentId, createNote]
  );

  const handleUpdate = useCallback(
    async (noteId: string, content: string) => {
      const updated = await updateNote(noteId, content);
      return updated !== null;
    },
    [updateNote]
  );

  const handleDelete = useCallback(
    async (noteId: string) => deleteNote(noteId),
    [deleteNote]
  );

  /**
   * Same lecture seeks immediately. A different lecture has to navigate first,
   * so the jump is queued and `PendingSeekRunner` fires it once the destination
   * player is attached and knows its duration.
   */
  const handleSeek = useCallback(
    (note: VideoNote) => {
      if (note.contentId === selectedContentId) {
        seekTo(note.timestamp);
        return;
      }
      pendingSeekRef.current = {
        contentId: note.contentId,
        timestamp: note.timestamp,
        seq: getConnectionSeq(),
      };
      navigateToContent(note.contentId);
    },
    [selectedContentId, seekTo, getConnectionSeq, navigateToContent]
  );

  /** Notes bucketed by lecture, both buckets and contents already ordered. */
  const groups = useMemo(() => {
    const visible =
      filter === "current"
        ? notes.filter((note) => note.lessonId === selectedLessonId)
        : notes;

    const byLesson = new Map<string, VideoNote[]>();
    visible.forEach((note) => {
      const bucket = byLesson.get(note.lessonId);
      if (bucket) bucket.push(note);
      else byLesson.set(note.lessonId, [note]);
    });

    return Array.from(byLesson.entries())
      .map(([lessonId, lessonNotes]) => {
        const position = lectureIndex.get(lessonId);
        return {
          lessonId,
          title: position?.title ?? REMOVED_LECTURE_TITLE,
          // Notes whose lesson has been deactivated have no curriculum
          // position, so they sort to the end rather than jumping to the top.
          order: position?.order ?? Number.MAX_SAFE_INTEGER,
          canSeek: position !== undefined,
          notes: [...lessonNotes].sort((a, b) =>
            sort === "recent"
              ? new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              : a.timestamp - b.timestamp
          ),
        };
      })
      .sort((a, b) => {
        if (sort === "recent") {
          const latest = (group: { notes: VideoNote[] }) =>
            new Date(group.notes[0].createdAt).getTime();
          return latest(b) - latest(a);
        }
        return a.order - b.order;
      });
  }, [notes, filter, selectedLessonId, lectureIndex, sort]);

  const hasAnyNotes = notes.length > 0;
  const hasVisibleNotes = groups.length > 0;

  return (
    <div>
      <PendingSeekRunner
        pendingRef={pendingSeekRef}
        selectedContentId={selectedContentId}
      />

      {isVideoOpen ? (
        <NoteComposer onCreate={handleCreate} />
      ) : (
        <div className="w-full bg-[#F5F5F5] rounded-xl border border-black/10 px-4 py-3 flex items-center gap-2 text-black/50">
          <NotebookPen className="size-5 shrink-0" />
          <span>Open a video lesson to add a note.</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-red-700 text-sm">{error}</span>
          <WhiteButton
            type="button"
            glow={false}
            className="shrink-0 rounded-xl"
            onClick={() => void refetch()}
          >
            Retry
          </WhiteButton>
        </div>
      )}

      {hasAnyNotes && (
        <div className="flex flex-wrap justify-start gap-4 my-5">
          <DropDown
            className="w-auto min-w-[180px]"
            options={LECTURE_FILTER_OPTIONS}
            optionLabels={LECTURE_FILTER_LABELS}
            value={filter}
            onChange={(e) => setFilter(e.target.value as LectureFilter)}
          />
          <DropDown
            className="w-auto min-w-[180px]"
            options={SORT_OPTIONS}
            optionLabels={SORT_LABELS}
            value={sort}
            onChange={(e) => setSort(e.target.value as NoteSort)}
          />
        </div>
      )}

      {isLoading && !hasAnyNotes && (
        <p className="mt-6 text-black/50">Loading your notes...</p>
      )}

      {!isLoading && !hasAnyNotes && !error && (
        <div className="mt-8 text-center">
          <NotebookPen className="size-12 text-black/20 mx-auto mb-3" />
          <p className="text-black font-bold text-lg">No notes yet</p>
          <p className="text-black/50">
            {isVideoOpen
              ? "Jot something down and it will be saved against the exact moment you were watching."
              : "Open a video lesson to write your first note."}
          </p>
        </div>
      )}

      {!hasVisibleNotes && hasAnyNotes && (
        <p className="mt-6 text-black/50">No notes in this lecture yet.</p>
      )}

      <div className="flex flex-col gap-6 mt-4">
        {groups.map((group) => (
          <div key={group.lessonId} className="flex flex-col gap-3">
            <h3
              className={`font-bold text-lg ${
                group.canSeek ? "text-black" : "text-black/40 italic"
              }`}
            >
              {group.title}
            </h3>
            {group.notes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onSeek={handleSeek}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                canSeek={group.canSeek}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesSection;
