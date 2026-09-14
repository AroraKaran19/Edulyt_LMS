import { BRANDS, type Brand } from "../constants/brands";
import { edulytCutover } from "../config/brandFlags";

/**
 * Which brands a request is allowed to read. Edulyt only ever sees its own
 * content; Airkrit sees both until cutover.
 */
export const readableBrands = (brand: Brand): Brand[] =>
  brand === "airkrit" && !edulytCutover() ? [...BRANDS] : [brand];

/** Filter fragment to merge into any query on a branded collection. */
export const brandFilter = (brand: Brand): { brand: { $in: Brand[] } } => ({
  brand: { $in: readableBrands(brand) },
});
