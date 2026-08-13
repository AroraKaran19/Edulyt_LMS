export interface LeadAnswer {
  key: string;
  label: string;
  value: string;
}

export interface LeadPlatformUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userType?: string;
  createdAt?: string;
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export interface Lead {
  _id: string;
  source: string;
  name: string;
  email: string;
  phone: string;
  answers: LeadAnswer[];
  /** `null` means the platform check has not resolved yet. */
  emailOnPlatform: boolean | null;
  emailCheckedAt?: string;
  platformUserId?: LeadPlatformUser | string | null;
  submittedByUserId?: string | null;
  status: LeadStatus;
  note?: string;
  pageQuery?: string;
  createdAt: string;
  updatedAt: string;
}

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  "enquiry-form": "Enquiry form",
};

export const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-600/20",
  contacted: "bg-amber-50 text-amber-700 ring-amber-600/20",
  qualified: "bg-purple-50 text-purple-700 ring-purple-600/20",
  converted: "bg-green-50 text-green-700 ring-green-600/20",
  lost: "bg-gray-100 text-gray-600 ring-gray-500/20",
};
