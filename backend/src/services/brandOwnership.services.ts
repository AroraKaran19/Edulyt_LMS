import mongoose from "mongoose";
import {
  CategoryModel,
  CouponModel,
  CourseModel,
  EnrollmentModel,
} from "../models";
import { AppError } from "../middlewares/error.middleware";
import { BRAND_MAIL, asBrand, isBrand, type Brand } from "../constants/brands";

const brandName = (brand: Brand): string => BRAND_MAIL[brand].fromName;

export const parseBrandInput = (value: unknown, what: string): Brand => {
  if (!isBrand(value)) {
    throw new AppError(`Choose a brand for this ${what}`, 400);
  }
  return value;
};

/**
 * An internship feed is Edulyt's and the partner portal is Airkrit's, so only a
 * course announcement is the admin's to place.
 */
export const assertAnnouncementBrand = (
  audience: "course" | "internship" | "partner",
  brand: Brand,
): void => {
  const owner =
    audience === "internship"
      ? "edulyt"
      : audience === "partner"
        ? "airkrit"
        : null;
  if (owner && brand !== owner) {
    throw new AppError(
      `A ${audience} announcement belongs to ${brandName(owner)}`,
      400,
    );
  }
};

/** The one audience each brand sells to. Only going live is held to it. */
export const AUDIENCE_BY_BRAND: Record<Brand, string> = {
  airkrit: "college-students",
  edulyt: "professionals",
};

const AUDIENCE_LABEL: Record<string, string> = {
  "college-students": "college students",
  professionals: "working professionals",
};

export const audienceMatchesBrand = (audience: unknown, brand: Brand): boolean =>
  audience === AUDIENCE_BY_BRAND[brand];

/**
 * A course may sit on either brand with either audience while it is inactive,
 * so a copy can be made across brands and fixed up. Going live is the gate.
 */
export const assertLiveAudienceOnBrand = (
  audience: unknown,
  brand: Brand,
): void => {
  if (!audienceMatchesBrand(audience, brand)) {
    throw new AppError(
      `A live ${brandName(brand)} course must target ${
        AUDIENCE_LABEL[AUDIENCE_BY_BRAND[brand]]
      }. Change the audience or keep the course inactive.`,
      400,
    );
  }
};

const toIdList = (ids: unknown): string[] =>
  (Array.isArray(ids) ? ids : ids == null ? [] : [ids])
    .map((id) =>
      id && typeof id === "object" && "_id" in id
        ? (id as { _id: unknown })._id
        : id,
    )
    .map((id) => String(id))
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

export const assertAllOnBrand = async (
  kind: "courses" | "categories",
  ids: unknown,
  brand: Brand,
): Promise<void> => {
  const list = toIdList(ids);
  if (list.length === 0) return;

  // `$ne` also counts a row with no brand, which the zero-count gate rules out.
  const filter = { _id: { $in: list }, brand: { $ne: brand } };
  const foreign =
    kind === "courses"
      ? await CourseModel.countDocuments(filter)
      : await CategoryModel.countDocuments(filter);

  if (foreign > 0) {
    const label = kind === "courses" ? "course" : "category";
    throw new AppError(`Every ${label} must belong to ${brandName(brand)}`, 400);
  }
};

export const assertCourseBrandChangeAllowed = async (
  courseId: string,
  current: Brand,
  next: Brand,
): Promise<void> => {
  if (current === next) return;

  // Raw driver on purpose: enrollments hold courseId as an ObjectId or as a
  // string, and a Mongoose query would cast the string form away.
  const enrolled = await EnrollmentModel.collection.findOne(
    { courseId: { $in: [new mongoose.Types.ObjectId(courseId), courseId] } },
    { projection: { _id: 1 } },
  );
  if (enrolled) {
    throw new AppError(
      "This course has enrollments, so its brand can no longer change",
      409,
    );
  }
};

export const validateCourseBrandForCreate = async (
  courseData: Record<string, unknown>,
): Promise<Brand> => {
  const brand = parseBrandInput(courseData.brand, "course");
  // The schema defaults `isActive` to true, so a write that names none is live.
  if (courseData.isActive !== false) {
    assertLiveAudienceOnBrand(courseData.audience, brand);
  }
  await assertAllOnBrand("categories", courseData.category, brand);
  return brand;
};

export const validateCourseBrandForUpdate = async (
  courseId: string,
  courseData: Record<string, unknown>,
): Promise<void> => {
  const touches = ["brand", "audience", "category", "isActive"].some(
    (key) => key in courseData,
  );
  if (!touches) return;

  if ("brand" in courseData) {
    parseBrandInput(courseData.brand, "course");
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError("Course not found", 404);
  }

  const existing = await CourseModel.findById(courseId)
    .select("brand audience category isActive")
    .lean<{
      brand?: unknown;
      audience?: unknown;
      category?: unknown;
      isActive?: unknown;
    } | null>();
  if (!existing) {
    throw new AppError("Course not found", 404);
  }

  const current = asBrand(existing.brand);
  const next = isBrand(courseData.brand) ? courseData.brand : current;

  await assertCourseBrandChangeAllowed(courseId, current, next);

  const live =
    typeof courseData.isActive === "boolean"
      ? courseData.isActive
      : existing.isActive !== false;
  // A course that is already live on the wrong audience predates this rule and
  // stays editable; only a course newly put into that state is refused.
  const alreadyLiveMismatch =
    existing.isActive !== false && !audienceMatchesBrand(existing.audience, current);
  if (live && !alreadyLiveMismatch) {
    assertLiveAudienceOnBrand(courseData.audience ?? existing.audience, next);
  }

  await assertAllOnBrand("categories", courseData.category ?? existing.category, next);
};

export const validateCouponBrandForCreate = async (
  couponData: Record<string, unknown>,
): Promise<Brand> => {
  const brand = parseBrandInput(couponData.brand, "coupon");
  await Promise.all([
    assertAllOnBrand("courses", couponData.applicableCourses, brand),
    assertAllOnBrand("categories", couponData.applicableCategories, brand),
  ]);
  return brand;
};

export const validateCouponBrandForUpdate = async (
  couponId: string,
  couponData: Record<string, unknown>,
): Promise<void> => {
  const touches = ["brand", "applicableCourses", "applicableCategories"].some(
    (key) => key in couponData,
  );
  if (!touches) return;

  if ("brand" in couponData) {
    parseBrandInput(couponData.brand, "coupon");
  }

  const existing = await CouponModel.findById(couponId)
    .select("brand applicableCourses applicableCategories")
    .lean<{
      brand?: unknown;
      applicableCourses?: unknown;
      applicableCategories?: unknown;
    } | null>();
  if (!existing) {
    throw new AppError("Coupon not found", 404);
  }

  const brand = isBrand(couponData.brand) ? couponData.brand : asBrand(existing.brand);
  await Promise.all([
    assertAllOnBrand(
      "courses",
      couponData.applicableCourses ?? existing.applicableCourses,
      brand,
    ),
    assertAllOnBrand(
      "categories",
      couponData.applicableCategories ?? existing.applicableCategories,
      brand,
    ),
  ]);
};

/**
 * Where a copy of a course should land. Null means "same brand as the source",
 * which is what every existing duplicate does.
 */
export const resolveDuplicateTarget = async (
  source: { brand?: unknown },
  target?: { brand?: unknown; category?: unknown },
): Promise<{ brand: Brand; category: unknown[]; audience: string } | null> => {
  if (target?.brand === undefined || target.brand === asBrand(source.brand)) {
    return null;
  }

  const brand = parseBrandInput(target.brand, "copy");
  const category = Array.isArray(target.category) ? target.category : [];
  if (category.length === 0) {
    throw new AppError(
      `Choose at least one ${brandName(brand)} category for the copy`,
      400,
    );
  }
  await assertAllOnBrand("categories", category, brand);
  // Any course may be copied to the other brand; the copy takes that brand's
  // audience so it is ready to go live there.
  return { brand, category, audience: AUDIENCE_BY_BRAND[brand] };
};

/** The schema's own defaults name Airkrit, so an Edulyt course needs its own. */
export const defaultCourseMeta = (
  brand: Brand,
): { metaTitle: string; metaDescription: string } => ({
  metaTitle: `Course | ${brandName(brand)} India`,
  metaDescription: `Course ${brandName(brand)} India`,
});
