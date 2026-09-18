import { BRANDS, type Brand } from "../constants/brands";
import { edulytCutover } from "../config/brandFlags";

/**
 * Which brands a request is allowed to read. Edulyt only ever sees its own
 * content; Airkrit sees both until cutover.
 */
/**
 * The caller's own brand always comes first: where a key is unique per brand
 * rather than globally, such as a course slug, the tie goes to the site the
 * visitor is actually on.
 */
export const readableBrands = (brand: Brand): Brand[] =>
  brand === "airkrit" && !edulytCutover()
    ? [brand, ...BRANDS.filter((other) => other !== brand)]
    : [brand];

/**
 * Picks the row a reader should get when a key is unique per brand rather than
 * globally, such as a course slug: the caller's own brand first, then whatever
 * else they may read.
 */
export const preferOwnBrand = <T extends { brand?: unknown }>(
  matches: T[],
  brands: Brand[],
): T | undefined =>
  brands.map((brand) => matches.find((row) => row.brand === brand)).find(Boolean) ??
  matches[0];

/** Filter fragment to merge into any query on a branded collection. */
export const brandFilter = (brand: Brand): { brand: { $in: Brand[] } } => ({
  brand: { $in: readableBrands(brand) },
});
