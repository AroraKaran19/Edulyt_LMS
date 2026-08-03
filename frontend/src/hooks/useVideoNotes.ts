"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { VideoNote } from "@/types/notes";

export const MAX_NOTE_LENGTH = 2000;

export interface CreateVideoNoteData {
  courseId: string;
  lessonId: string;
  contentId: string;
  content: string;
  timestamp: number;
}

const errorMessageFrom = (err: unknown, fallback: string): string => {
  const response = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
    ?.response;
  return (
    response?.data?.error?.message ||
    response?.data?.message ||
    (err as { message?: string })?.message ||
    fallback
  );
};

/**
 * Owns the caller's note set for a single course.
 *
 * The whole set is fetched in one request rather than paginated: the Notes tab
 * groups by lecture, and a page of notes cannot be grouped or sorted correctly
 * without the rest of them. Mutations patch local state in place so the list
 * never refetches on every keystroke-sized change.
 */
const useVideoNotes = (courseId: string) => {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slow response for a previous course overwriting the list
  // after the user has navigated to another one.
  const requestIdRef = useRef(0);

  const fetchNotes = useCallback(async () => {
    if (!courseId) {
      setNotes([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(ENDPOINTS.notes.list, {
        params: { courseId },
      });
      if (requestId !== requestIdRef.current) return;
      setNotes(response.data?.data?.notes ?? []);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(errorMessageFrom(err, "Failed to load your notes"));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  /** Returns the created note, or null if the request failed. */
  const createNote = useCallback(
    async (data: CreateVideoNoteData): Promise<VideoNote | null> => {
      try {
        const response = await apiClient.post(ENDPOINTS.notes.create, data);
        const created: VideoNote = response.data?.data;
        if (!created) return null;
        setNotes((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        setError(errorMessageFrom(err, "Failed to save your note"));
        return null;
      }
    },
    []
  );

  const updateNote = useCallback(
    async (noteId: string, content: string): Promise<VideoNote | null> => {
      try {
        const response = await apiClient.put(
          `${ENDPOINTS.notes.update}/${noteId}`,
          { content }
        );
        const updated: VideoNote = response.data?.data;
        if (!updated) return null;
        setNotes((prev) =>
          prev.map((note) => (note._id === noteId ? updated : note))
        );
        return updated;
      } catch (err) {
        setError(errorMessageFrom(err, "Failed to update your note"));
        return null;
      }
    },
    []
  );

  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`${ENDPOINTS.notes.delete}/${noteId}`);
      setNotes((prev) => prev.filter((note) => note._id !== noteId));
      return true;
    } catch (err) {
      setError(errorMessageFrom(err, "Failed to delete your note"));
      return false;
    }
  }, []);

  /** Client-side mirror of the server's rules, for immediate feedback. */
  const validateNote = useCallback((content: string): string | null => {
    const trimmed = content.trim();
    if (trimmed.length === 0) return "Write something before saving.";
    if (trimmed.length > MAX_NOTE_LENGTH) {
      return `Notes are limited to ${MAX_NOTE_LENGTH} characters.`;
    }
    return null;
  }, []);

  return {
    notes,
    isLoading,
    error,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    validateNote,
    clearError: useCallback(() => setError(null), []),
  };
};

export default useVideoNotes;
