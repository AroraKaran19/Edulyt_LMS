import mongoose from "mongoose";
import { EnrollmentModel, VideoNoteModel } from "../models";
import { AppError } from "../middlewares/error.middleware";

/** Mirrors the schema's `maxlength`, so the 400 beats Mongoose's ValidationError. */
export const MAX_NOTE_LENGTH = 2000;

/**
 * Ceiling on a single course's note fetch. The tab groups notes by lecture and
 * so needs the whole set at once; this is the safety valve, not an expected
 * limit. Oldest notes beyond it are dropped (the sort is newest-first).
 */
export const NOTES_FETCH_CAP = 500;

export interface CreateVideoNoteInput {
  userId: string;
  courseId: string;
  lessonId: string;
  contentId: string;
  content: string;
  timestamp: number;
}

/**
 * Exactly what the Notes tab renders. Everything else stays server-side.
 *
 * `userId` is the caller's own id and `courseId` is what they queried by, so
 * echoing either back tells the client nothing it does not already have while
 * adding two 24-character ids to every note in the response. `updatedAt` and
 * `__v` are not read by anything.
 */
const CLIENT_FIELDS = "lessonId contentId content timestamp createdAt";

export interface ClientVideoNote {
  _id: string;
  lessonId: string;
  contentId: string;
  content: string;
  timestamp: number;
  createdAt: Date;
}

/**
 * Single choke point for the response shape, so list, create, and update
 * cannot drift apart and leak a field one of them forgot to project.
 */
const toClientNote = (note: {
  _id: unknown;
  lessonId: string;
  contentId: string;
  content: string;
  timestamp: number;
  createdAt?: Date;
}): ClientVideoNote => ({
  _id: String(note._id),
  lessonId: note.lessonId,
  contentId: note.contentId,
  content: note.content,
  timestamp: note.timestamp,
  // `timestamps: true` sets this on every persisted document. The type is
  // optional only because the same interface also describes pre-insert
  // objects, which never reach this mapper.
  createdAt: note.createdAt as Date,
});

const assertObjectId = (value: unknown, label: string): string => {
  const asString = String(value ?? "");
  if (!mongoose.Types.ObjectId.isValid(asString)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return asString;
};

const assertNonEmptyString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${label} is required`, 400);
  }
  return value.trim();
};

/** Trimmed note body, rejected empty or over the schema's ceiling. */
const assertValidContent = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new AppError("Note content is required", 400);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new AppError("Note content is required", 400);
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    throw new AppError(
      `Note must be ${MAX_NOTE_LENGTH} characters or fewer`,
      400
    );
  }
  return trimmed;
};

/**
 * Seconds into the video. `Number()` is deliberate: the value arrives from JSON
 * and a numeric string is a legitimate client. NaN and Infinity are not, and
 * neither is a negative position.
 */
const assertValidTimestamp = (value: unknown): number => {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new AppError(
      "Note timestamp must be a number of seconds, zero or greater",
      400
    );
  }
  return seconds;
};

/**
 * Every note the caller owns in one course, newest first.
 *
 * Served entirely by `{userId, courseId, createdAt: -1}`. Reads are not
 * enrollment-gated: the filter already restricts results to rows the caller
 * wrote, so a lapsed enrollment should not cost someone access to their own
 * writing.
 */
export const listVideoNotesService = async (
  userId: string,
  courseId: string
): Promise<{ notes: ClientVideoNote[]; total: number }> => {
  const validCourseId = assertObjectId(courseId, "course id");

  const notes = await VideoNoteModel.find({ userId, courseId: validCourseId })
    .select(CLIENT_FIELDS)
    .sort({ createdAt: -1 })
    .limit(NOTES_FETCH_CAP)
    .lean();

  return { notes: notes.map(toClientNote), total: notes.length };
};

/**
 * Creates a note. Gated on enrollment, which is the one place it matters: a
 * non-enrolled user has no legitimate route to a course's playback position.
 */
export const createVideoNoteService = async (
  input: CreateVideoNoteInput
): Promise<ClientVideoNote> => {
  const courseId = assertObjectId(input.courseId, "course id");
  const lessonId = assertNonEmptyString(input.lessonId, "Lesson id");
  const contentId = assertNonEmptyString(input.contentId, "Content id");
  const content = assertValidContent(input.content);
  const timestamp = assertValidTimestamp(input.timestamp);

  const isEnrolled = await EnrollmentModel.exists({
    userId: input.userId,
    courseId,
  });
  if (!isEnrolled) {
    throw new AppError("You are not enrolled in this course", 403);
  }

  const note = await VideoNoteModel.create({
    userId: input.userId,
    courseId,
    lessonId,
    contentId,
    content,
    timestamp,
  });

  return toClientNote(note);
};

/**
 * Updates a note's text. The timestamp anchor deliberately does not move.
 *
 * Ownership is part of the filter rather than a separate read-then-check, so
 * this is one indexed write that cannot race.
 */
export const updateVideoNoteService = async (
  noteId: string,
  userId: string,
  content: unknown
): Promise<ClientVideoNote> => {
  const validNoteId = assertObjectId(noteId, "note id");
  const trimmed = assertValidContent(content);

  const note = await VideoNoteModel.findOneAndUpdate(
    { _id: validNoteId, userId },
    { content: trimmed },
    { new: true, runValidators: true, projection: CLIENT_FIELDS }
  ).lean();

  if (!note) {
    throw new AppError("Note not found", 404);
  }

  return toClientNote(note);
};

/** Deletes a note the caller owns. A miss is a 404, never someone else's row. */
export const deleteVideoNoteService = async (
  noteId: string,
  userId: string
): Promise<void> => {
  const validNoteId = assertObjectId(noteId, "note id");

  const note = await VideoNoteModel.findOneAndDelete(
    { _id: validNoteId, userId },
    { projection: "_id" }
  ).lean();

  if (!note) {
    throw new AppError("Note not found", 404);
  }
};
