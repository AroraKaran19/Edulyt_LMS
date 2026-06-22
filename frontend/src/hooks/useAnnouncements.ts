"use client";

import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";

export type AnnouncementAudience = "course" | "internship" | "partner";

/** Learner dashboards that can request a scoped announcement feed. */
export type LearnerFeedAudience = "course" | "internship";

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  createdAt: string;
}

interface ApiSuccessBody<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** REST client for dashboard announcements (admin CRUD + viewer feed). */
export default function useAnnouncements() {
  /**
   * Announcements for the current user's dashboard, newest first. Partners
   * always receive the partner feed; learners pass `course` (default) or
   * `internship` to scope to a specific dashboard.
   */
  const getFeed = useCallback(
    async (audience?: LearnerFeedAudience): Promise<Announcement[]> => {
      const qs = audience ? `?audience=${audience}` : "";
      const res = await apiClient.get<
        ApiSuccessBody<{ announcements: Announcement[] }>
      >(`/announcements/feed${qs}`);
      return res.data.data.announcements;
    },
    [],
  );

  /** Admin: every announcement, newest first. */
  const listAll = useCallback(async (): Promise<Announcement[]> => {
    const res = await apiClient.get<
      ApiSuccessBody<{ announcements: Announcement[] }>
    >("/announcements/admin");
    return res.data.data.announcements;
  }, []);

  /** Admin: create an announcement. */
  const createAnnouncement = useCallback(
    async (input: {
      title: string;
      message: string;
      audience: AnnouncementAudience;
    }): Promise<Announcement> => {
      const res = await apiClient.post<ApiSuccessBody<Announcement>>(
        "/announcements",
        input,
      );
      return res.data.data;
    },
    [],
  );

  /** Admin: delete an announcement. */
  const deleteAnnouncement = useCallback(async (id: string): Promise<void> => {
    await apiClient.delete(`/announcements/${id}`);
  }, []);

  return { getFeed, listAll, createAnnouncement, deleteAnnouncement };
}
