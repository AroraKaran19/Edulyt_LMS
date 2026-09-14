import type { Brand } from "../constants/brands";
import { edulytCutover } from "../config/brandFlags";
import { brandFrontendUrl } from "./brandSiteUrl";

const LOCAL_FRONTEND = "http://localhost:3000";

/**
 * Where a newly issued document's link and QR point. Edulyt documents move to
 * edulyt.com only at cutover, because before it Edulyt has no verify page.
 * Issued documents keep their stored URL, which airkrit.com keeps verifying.
 */
export const verificationBaseUrl = (brand: Brand): string => {
  const airkrit = brandFrontendUrl("airkrit") ?? LOCAL_FRONTEND;
  if (brand !== "edulyt" || !edulytCutover()) return airkrit;
  return brandFrontendUrl("edulyt") ?? airkrit;
};
