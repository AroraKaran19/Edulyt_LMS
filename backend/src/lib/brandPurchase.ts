import { DEFAULT_BRAND, isBrand, type Brand } from "../constants/brands";
import { readableBrands } from "./brandScope";
import { AppError } from "../middlewares/error.middleware";

/**
 * A checkout may only sell what the site it runs on can show. 404 rather than
 * 403: if the site cannot list the product, it does not have it.
 */
export const assertBrandReadable = (
  productBrand: Brand,
  requestBrand: Brand,
  what: string,
): void => {
  if (!readableBrands(requestBrand).includes(productBrand)) {
    throw new AppError(`This ${what} is not available here`, 404);
  }
};

export const couponUsableOnBrand = (
  couponBrand: unknown,
  requestBrand: Brand,
): boolean =>
  readableBrands(requestBrand).includes(
    isBrand(couponBrand) ? couponBrand : DEFAULT_BRAND,
  );
