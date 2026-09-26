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

/** What a sales person's lead reads leave out: pipeline history and who brought the lead in. */
export const SALES_LEAD_PROJECTION = {
  statusHistory: 0,
  assignmentHistory: 0,
  creator: 0,
  parent: 0,
  pageQuery: 0,
  submittedByUserId: 0,
  "source.fileName": 0,
  "source.importedBy": 0,
  "source.importJobId": 0,
  "source.importRow": 0,
} as const;

/** Form, import and referral leads must read alike to sales; scholarship keeps its own panel. */
export const toSalesLeadView = <T extends { source?: { kind?: string } }>(lead: T): T => {
  if (!lead.source || lead.source.kind === "scholarship") return lead;
  const { kind: _kind, ...source } = lead.source;
  return { ...lead, source };
};
