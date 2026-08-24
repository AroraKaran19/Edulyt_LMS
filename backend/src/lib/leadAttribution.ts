import mongoose from "mongoose";
import type { CrmRole, ResolvedCrmCode } from "../services/crmProfile.services";

export interface LeadAttribution {
  creator?: {
    userId: mongoose.Types.ObjectId | null;
    code: string;
    name: string;
    role: CrmRole;
  };
  parent?: { userId: mongoose.Types.ObjectId | null; name: string };
}

/**
 * Turns a resolved code into the snapshot blocks stored on the lead. Pure, so
 * the shape can be pinned without a database: everything it writes is frozen at
 * capture and never recomputed.
 */
export const buildAttribution = (
  resolved: ResolvedCrmCode | null,
  parentName: string,
): LeadAttribution => {
  if (!resolved) return {};

  const attribution: LeadAttribution = {
    creator: {
      userId: new mongoose.Types.ObjectId(resolved.userId),
      code: resolved.code,
      name: resolved.name,
      role: resolved.role,
    },
  };

  // Staff have no owner, so the block is omitted rather than stored empty.
  if (resolved.parentUserId) {
    attribution.parent = {
      userId: new mongoose.Types.ObjectId(resolved.parentUserId),
      name: parentName,
    };
  }

  return attribution;
};
