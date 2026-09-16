import type { Brand } from "../constants/brands";
import { brandPageBaseUrl } from "./brandSiteUrl";

/**
 * Where an attendance link opens.
 *
 * Nothing emails these: an admin activates a link and drops the URL into the
 * live session, so it has to point at the site that serves that brand's pages
 * rather than at whichever site the backend was first written for.
 */

/** Internships are Edulyt's: the model fixes their brand. */
export const internshipAttendanceUrl = (token: string): string =>
  `${brandPageBaseUrl("edulyt")}/live-meeting/attend/${token}`;

/** A live class follows its course's brand. */
export const liveClassAttendanceUrl = (brand: Brand, token: string): string =>
  `${brandPageBaseUrl(brand)}/live-class/attend/${token}`;
