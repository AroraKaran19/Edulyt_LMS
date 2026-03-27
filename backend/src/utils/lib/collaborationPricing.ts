import type { CollaborationBenefit } from "../../types/collaborationDomain";

/** Apply partnership checkout benefit (percentage or fixed) on top of an already-discounted price. */
export function applyCollaborationBenefitToPrice(
  basePrice: number,
  benefit: CollaborationBenefit
): number {
  const p = Math.max(0, basePrice);
  let next: number;
  if (benefit.type === "percentage") {
    next = p * (1 - benefit.value / 100);
  } else {
    next = p - benefit.value;
  }
  return Math.round(Math.max(0, next) * 100) / 100;
}
