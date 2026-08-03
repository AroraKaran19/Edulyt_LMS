/**
 * A learner's private note against a playback position in a course video.
 *
 * Mirrors exactly what `GET /api/notes` projects. There is no `userId` or
 * `courseId` here on purpose: the reader is always the writer, and the course
 * is what the client queried by, so returning either would be payload the UI
 * cannot use. `createdAt` arrives as an ISO string because the API returns
 * lean documents as JSON.
 */
export interface VideoNote {
  _id: string;
  lessonId: string;
  contentId: string;
  content: string;
  /** Seconds into the video. */
  timestamp: number;
  createdAt: string;
}
