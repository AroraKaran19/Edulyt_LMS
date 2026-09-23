/** `GET /ca-applications/me/desk`. `isCa` is false for an intern with no CA application. */
export interface CaDesk {
  isCa: boolean;
  designation: string | null;
  kind: string | null;
  collegeName: string | null;
  joiningDate: string | null;
  endDate: string | null;
  durationMonths: number | null;
  caPoints: number;
  /** 0 to 100. Optional until the backend that sends it is live everywhere. */
  thresholdPct?: number | null;
  /** Points on every task and meeting inside the tenure so far. */
  availablePoints?: number | null;
  /** `ceil(availablePoints * thresholdPct / 100)`. */
  requiredPoints?: number | null;
  pointsFromTasks: number;
  pointsFromMeetings: number;
}

export interface CaReferralLead {
  id: string;
  name: string;
  programme: string | null;
  college: string | null;
  createdAt: string;
}

/** `GET /crm/me/leads`: enquiries that came through the caller's link. */
export interface CaReferralLeadsPage {
  leads: CaReferralLead[];
  total: number;
  page: number;
  totalPages: number;
}
