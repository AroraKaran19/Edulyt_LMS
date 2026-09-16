import type { Brand } from "../constants/brands";
import { brandPageBaseUrl } from "./brandSiteUrl";

/**
 * Where a newly issued document's link and QR point. Edulyt documents move to
 * edulyt.com only at cutover, because before it Edulyt has no verify page.
 * Issued documents keep their stored URL, which airkrit.com keeps verifying.
 */
export const verificationBaseUrl = (brand: Brand): string =>
  brandPageBaseUrl(brand);
