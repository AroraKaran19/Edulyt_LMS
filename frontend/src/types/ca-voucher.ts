export type CaVoucherPlan = "elite" | "essential";

export type CaVoucherStatus = "pending" | "approved" | "declined" | "revoked";

export interface CaVoucherCourse {
  id: string;
  title: string;
  thumbnail: string | null;
  slug: string;
}

export interface CaVoucherRequest {
  id: string;
  status: CaVoucherStatus;
  course: CaVoucherCourse;
  plan: CaVoucherPlan;
  declineReason: string | null;
  decidedAt: string | null;
}

/** `GET /ca-vouchers/me`. */
export interface CaVoucherMe {
  eligible: boolean;
  hasVoucher: boolean;
  cooldownUntil: string | null;
  request: CaVoucherRequest | null;
}

export interface CaVoucherCourseOption extends CaVoucherCourse {
  plan: CaVoucherPlan;
}

/** `GET /ca-vouchers/courses`. */
export interface CaVoucherCoursesPage {
  courses: CaVoucherCourseOption[];
  total: number;
  page: number;
  totalPages: number;
}

export type CaVoucherRequestTab = "pending" | "declined" | "approved" | "all";

export interface CaVoucherRequestRow {
  id: string;
  caName: string;
  caEmail: string;
  internId: string | null;
  courseTitle: string;
  plan: CaVoucherPlan;
  status: CaVoucherStatus;
  requestedAt: string;
  decidedAt: string | null;
  decidedByName: string | null;
  declineReason: string | null;
}

/** `GET /admin/ca-vouchers/requests`. */
export interface CaVoucherRequestsPage {
  rows: CaVoucherRequestRow[];
  total: number;
  page: number;
  totalPages: number;
  counts: { pending: number };
}

export interface CaVoucherEnrollmentRow {
  id: string;
  caName: string;
  caEmail: string;
  internId: string | null;
  courseTitle: string;
  plan: CaVoucherPlan;
  status: "approved" | "revoked";
  grantedAt: string;
  validUntil: string | null;
  decidedByName: string | null;
  revokedAt: string | null;
}

/** `GET /admin/ca-vouchers/enrollments`. */
export interface CaVoucherEnrollmentsPage {
  rows: CaVoucherEnrollmentRow[];
  total: number;
  page: number;
  totalPages: number;
}
