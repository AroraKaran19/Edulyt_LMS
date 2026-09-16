import type { Brand } from "../constants/brands";
import { edulytCutover } from "../config/brandFlags";

const FRONTEND_URL_ENV: Record<Brand, string> = {
  airkrit: "AIRKRIT_FRONTEND_URL",
  edulyt: "EDULYT_FRONTEND_URL",
};

export const brandFrontendUrlEnv = (brand: Brand): string =>
  FRONTEND_URL_ENV[brand];

export const brandFrontendUrl = (brand: Brand): string | undefined =>
  process.env[FRONTEND_URL_ENV[brand]]?.replace(/\/+$/, "") || undefined;

const LOCAL_FRONTEND = "http://localhost:3000";

/**
 * Edulyt's site, whatever the cutover flag says. For pages Airkrit no longer has at all, such as
 * internships, waiting for the flag would mean linking readers to a 404 on a site that dropped them.
 */
export const edulytSiteUrl = (): string =>
  brandFrontendUrl("edulyt") ?? "https://www.edulyt.com";

/**
 * The site that serves this brand's pages today. Edulyt's own site only takes over at cutover:
 * before it, Edulyt is not live and Airkrit serves Edulyt's courses and internships, so a link
 * built for edulyt.com would 404 for the learner holding it.
 */
export const brandPageBaseUrl = (brand: Brand): string => {
  const airkrit = brandFrontendUrl("airkrit") ?? LOCAL_FRONTEND;
  if (brand !== "edulyt" || !edulytCutover()) return airkrit;
  return brandFrontendUrl("edulyt") ?? airkrit;
};
