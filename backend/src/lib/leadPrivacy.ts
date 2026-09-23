/** First name plus last initial: "Jane Doe" -> "Jane D.". A single-word name is left as is. */
export const maskLeadName = (name: string): string => {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
};

export interface AmbassadorLeadSource {
  title?: string;
  program?: { title?: string };
}

export interface AmbassadorLeadDoc {
  _id: unknown;
  name: string;
  collegeName?: string;
  createdAt: Date;
  source?: AmbassadorLeadSource;
}

export interface AmbassadorLeadRow {
  id: string;
  name: string;
  programme: string;
  college: string;
  createdAt: string;
}

/** The privacy-safe shape of a lead for the ambassador who generated it. */
export const toAmbassadorLeadRow = (doc: AmbassadorLeadDoc): AmbassadorLeadRow => ({
  id: String(doc._id),
  name: maskLeadName(doc.name),
  programme: doc.source?.program?.title || doc.source?.title || "",
  college: doc.collegeName || "",
  createdAt: new Date(doc.createdAt).toISOString(),
});
