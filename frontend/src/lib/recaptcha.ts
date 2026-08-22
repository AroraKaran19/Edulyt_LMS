/**
 * reCAPTCHA v2 checkbox loader.
 *
 * One site key, shared by every public form that wants a visible gate. v3 is
 * deliberately not wired up alongside it: both tiers define `window.grecaptcha`
 * and a page can only ever run one of them.
 */

type RecaptchaRenderParams = {
  sitekey: string;
  theme?: "light" | "dark";
  size?: "normal" | "compact";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

export type Grecaptcha = {
  /** Absent until the API script behind the loader has run. */
  ready?: (cb: () => void) => void;
  render: (container: HTMLElement, params: RecaptchaRenderParams) => number;
  reset: (widgetId?: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

/** Inlined at build time, so a deploy without it ships a page that cannot tick. */
export const RECAPTCHA_SITE_KEY = (
  process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY ?? ""
).trim();

/**
 * `render=explicit` keeps Google from auto-scanning the page on load: that scan
 * runs once, so a widget mounted by a later client-side navigation is missed.
 */
const SCRIPT_URL = "https://www.google.com/recaptcha/api.js?render=explicit";

/** Single-flighted: the widget mounts more than once per visit, the script once. */
let scriptPromise: Promise<void> | null = null;

export function loadRecaptchaScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Dropped so a later mount can retry: the usual cause is an ad blocker or
      // a flaky network, neither of which is permanent.
      scriptPromise = null;
      reject(new Error("Failed to load reCAPTCHA"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Resolves with the API only once it is safe to call render(). */
export async function grecaptchaReady(): Promise<Grecaptcha> {
  if (!RECAPTCHA_SITE_KEY) {
    throw new Error("NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY is not set");
  }

  await loadRecaptchaScript();

  const grecaptcha = window.grecaptcha;
  if (!grecaptcha) throw new Error("reCAPTCHA unavailable");

  // The tag we appended is a loader: at its onload `window.grecaptcha` is a stub
  // with `ready` and nothing else, and the real API arrives a beat later. So the
  // renderer can only be checked for on the far side of ready(), never before.
  if (typeof grecaptcha.ready === "function") {
    await new Promise<void>((resolve) => grecaptcha.ready!(resolve));
  }

  if (typeof window.grecaptcha?.render !== "function") {
    throw new Error("reCAPTCHA became ready without a renderer");
  }

  return window.grecaptcha;
}
