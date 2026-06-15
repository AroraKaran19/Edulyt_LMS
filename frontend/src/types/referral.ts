export interface ReferralCommissionTier {
  thresholdSales: number;
  commissionPercent: number;
}

export type ReferralSaleStatus = "active" | "reversed";

export interface ReferralRecentSaleRow {
  _id: string;
  courseName: string;
  buyerName: string;
  amount: number;
  commission: number;
  status: ReferralSaleStatus;
  createdAt: string;
}

export interface ReferralOverview {
  code: string;
  upiId: string;
  tiers: ReferralCommissionTier[];
  activeCount: number;
  currentTierPct: number;
  lifetimeEarned: number;
  heldOrPaid: number;
  availableBalance: number;
  recentSales: ReferralRecentSaleRow[];
}

export interface ReferralCodeValidationResult {
  valid: boolean;
  referrerName?: string;
  reason?: "not-found" | "self" | "empty";
  /** Buyer discount % to apply at checkout when this code is valid. */
  buyerDiscountPercent?: number;
}

export type ReferralWithdrawalStatus =
  | "pending"
  | "processing"
  | "success"
  | "rejected";

export interface ReferralWithdrawalRow {
  _id: string;
  amount: number;
  upiIdSnapshot: string;
  status: ReferralWithdrawalStatus;
  notes?: string;
  decidedAt: string | null;
  createdAt: string;
}

export interface AdminReferralWithdrawalRow extends ReferralWithdrawalRow {
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedReferral<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
