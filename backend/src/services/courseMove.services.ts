import { CourseModel } from "../models";
import { isBrand, type Brand } from "../constants/brands";

/**
 * The brand an active course lives on when the request cannot read it, so the
 * old site can send a visitor to the new one.
 */
export const findCourseBrandOutside = async (
  slug: string,
  readable: Brand[],
): Promise<Brand | null> => {
  const hit = await CourseModel.findOne({
    slug,
    isActive: true,
    brand: { $nin: readable },
  })
    .select("brand")
    .lean<{ brand?: unknown } | null>();
  return hit && isBrand(hit.brand) ? hit.brand : null;
};
