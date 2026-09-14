import type { Brand } from "../constants/brands";

const FRONTEND_URL_ENV: Record<Brand, string> = {
  airkrit: "AIRKRIT_FRONTEND_URL",
  edulyt: "EDULYT_FRONTEND_URL",
};

export const brandFrontendUrlEnv = (brand: Brand): string =>
  FRONTEND_URL_ENV[brand];

export const brandFrontendUrl = (brand: Brand): string | undefined =>
  process.env[FRONTEND_URL_ENV[brand]]?.replace(/\/+$/, "") || undefined;
