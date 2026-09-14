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

export const assertAudienceOnBrand = (audience: unknown, brand: Brand): void => {
  if (brand === "airkrit" && audience !== "college-students") {
    throw new AppError("Airkrit courses are for college students", 400);
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
  assertAudienceOnBrand(courseData.audience, brand);
  await assertAllOnBrand("categories", courseData.category, brand);
  return brand;
};

export const validateCourseBrandForUpdate = async (
  courseId: string,
  courseData: Record<string, unknown>,
): Promise<void> => {
  const touches = ["brand", "audience", "category"].some((key) => key in courseData);
  if (!touches) return;

  if ("brand" in courseData) {
    parseBrandInput(courseData.brand, "course");
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError("Course not found", 404);
  }

  const existing = await CourseModel.findById(courseId)
    .select("brand audience category")
    .lean<{ brand?: unknown; audience?: unknown; category?: unknown } | null>();
  if (!existing) {
    throw new AppError("Course not found", 404);
  }

  const current = asBrand(existing.brand);
  const next = isBrand(courseData.brand) ? courseData.brand : current;

  await assertCourseBrandChangeAllowed(courseId, current, next);
  assertAudienceOnBrand(courseData.audience ?? existing.audience, next);
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
  source: { brand?: unknown; audience?: unknown },
  target?: { brand?: unknown; category?: unknown },
): Promise<{ brand: Brand; category: unknown[] } | null> => {
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
  assertAudienceOnBrand(source.audience, brand);
  await assertAllOnBrand("categories", category, brand);
  return { brand, category };
};

/** The schema's own defaults name Airkrit, so an Edulyt course needs its own. */
export const defaultCourseMeta = (
  brand: Brand,
): { metaTitle: string; metaDescription: string } => ({
  metaTitle: `Course | ${brandName(brand)} India`,
  metaDescription: `Course ${brandName(brand)} India`,
});
