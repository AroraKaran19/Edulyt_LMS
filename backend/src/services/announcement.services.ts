import mongoose from "mongoose";
import { AnnouncementModel } from "../models/announcement.schema";
import { AnnouncementAudience } from "../types";
import type { Brand } from "../constants/brands";

export interface AnnouncementInput {
  title: string;
  message: string;
  audience: AnnouncementAudience;
}

/** Create an announcement. `createdBy` is the admin's user id (audit only). */
export const createAnnouncementService = async (
  input: AnnouncementInput,
  createdBy?: mongoose.Types.ObjectId | string,
) => {
  const doc = await AnnouncementModel.create({
    title: input.title.trim(),
    message: input.message.trim(),
    audience: input.audience,
    createdBy: createdBy ?? undefined,
  });
  return doc.toObject();
};

/**
 * Announcements newest-first. Pass an `audience` to scope to one dashboard;
 * omit it to list everything (admin management view).
 */
export const listAnnouncementsService = async (
  audience?: AnnouncementAudience,
  brands?: Brand[],
) => {
  const filter: Record<string, unknown> = {};
  if (audience) filter.audience = audience;
  if (brands && brands.length > 0) filter.brand = { $in: brands };
  return AnnouncementModel.find(filter).sort({ createdAt: -1 }).lean();
};

export const deleteAnnouncementService = async (id: string) => {
  return AnnouncementModel.findByIdAndDelete(id).lean();
};
