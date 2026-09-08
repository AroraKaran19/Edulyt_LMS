import { CorsOptions } from "cors";

/** Add deploy previews or extra properties via CORS_ALLOWED_ORIGINS. */
const PRODUCTION_ORIGINS = [
  "https://airkrit.com",
  "https://www.airkrit.com",
  "https://edulyt.com",
  "https://www.edulyt.com",
];

const stripTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

/** Any port, so a dev server moving to :3001 needs no config change. */
const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const isDevelopment = () => process.env.NODE_ENV !== "production";

const allowedOrigins = (): Set<string> => {
  const configured = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map(stripTrailingSlash)
    .filter(Boolean);

  const frontend = process.env.FRONTEND_URL
    ? [stripTrailingSlash(process.env.FRONTEND_URL)]
    : [];

  return new Set([...PRODUCTION_ORIGINS, ...configured, ...frontend]);
};

export const isOriginAllowed = (origin: string): boolean => {
  if (isDevelopment() && LOCALHOST.test(origin)) return true;
  return allowedOrigins().has(stripTrailingSlash(origin));
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Server-to-server, curl and native apps send no Origin, and CORS does not
    // govern them.
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) return callback(null, true);

    // `false`, not an Error: the headers are omitted and the browser blocks it.
    // An Error would surface as a 500.
    console.warn(`[cors] refused origin ${origin}`);
    return callback(null, false);
  },
  credentials: true,
};
