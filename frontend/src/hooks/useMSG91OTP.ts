"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Loads the MSG91 OTP widget and wraps its callback API in promises.
 *
 * The widget is a third-party script that attaches `sendOtp` / `retryOtp` /
 * `verifyOtp` to `window` once initialised, and it is a singleton: a second
 * init on the same page throws. So the script tag, the init call, and the
 * "methods are ready" wait are all tracked at module scope and shared by every
 * component that calls this hook.
 *
 * The widget owns the code end to end. A successful `verifyOtp` returns a
 * signed access token, and that token is the only thing worth sending to our
 * backend: everything else the widget reports is client-side and unproven.
 */

declare global {
  interface Window {
    sendOtp?: (
      identifier: string,
      success?: (data: any) => void,
      failure?: (error: any) => void,
    ) => void;
    retryOtp?: (
      channel: string | null,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string,
    ) => void;
    verifyOtp?: (
      otp: string,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string,
    ) => void;
    initSendOTP?: (config: any) => void;
  }
}

const SCRIPT_SRC = "https://verify.msg91.com/otp-provider.js";
const SCRIPT_ID = "msg91-otp-provider";
/** How long to wait for the script to publish its methods, in 100ms ticks. */
const READY_TIMEOUT_TICKS = 100;

const WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "";
const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || "";

/**
 * Digits the widget asks for. MSG91 sends 4 by default; if the widget is
 * configured for 6, set NEXT_PUBLIC_MSG91_OTP_LENGTH to match or the form will
 * hold back a code the widget considers complete.
 */
export const OTP_LENGTH = Number(
  process.env.NEXT_PUBLIC_MSG91_OTP_LENGTH || 4,
);

/** MSG91's retry channel codes. */
export const OTP_CHANNEL = {
  sms: "11",
  whatsapp: "12",
  voice: "4",
  email: "3",
} as const;

export type OtpChannel = (typeof OTP_CHANNEL)[keyof typeof OTP_CHANNEL];

/** Both are public by design: the widget ships them to the browser anyway. */
export const isMSG91Configured = Boolean(WIDGET_ID && TOKEN_AUTH);

let initialised = false;
let readyPromise: Promise<void> | null = null;

const methodsReady = (): boolean =>
  typeof window !== "undefined" &&
  Boolean(window.sendOtp && window.retryOtp && window.verifyOtp);

/** Polls for the widget's methods, since the script exposes them after load. */
const waitForMethods = (): Promise<void> =>
  new Promise((resolve, reject) => {
    let ticks = 0;
    const timer = setInterval(() => {
      ticks += 1;
      if (methodsReady()) {
        clearInterval(timer);
        resolve();
      } else if (ticks >= READY_TIMEOUT_TICKS) {
        clearInterval(timer);
        reject(new Error("MSG91 widget did not finish loading"));
      }
    }, 100);
  });

/**
 * Hands the widget its configuration. `otp-provider.js` defines `initSendOTP`
 * on load and publishes `sendOtp` / `retryOtp` / `verifyOtp` only in response to
 * it, so nothing works until this has run once.
 */
const initWidget = () => {
  if (initialised) return;
  if (!window.initSendOTP) {
    throw new Error("MSG91 widget script loaded without initSendOTP");
  }
  try {
    window.initSendOTP({
      widgetId: WIDGET_ID,
      tokenAuth: TOKEN_AUTH,
      exposeMethods: true,
      // Both are handled at the call site, where the promise settles.
      success: () => {},
      failure: () => {},
    });
  } catch {
    // Already initialised by another mount; the methods still work.
  }
  initialised = true;
};

/** Loads the script once per page, no matter how many fields mount. */
const loadWidget = (): Promise<void> => {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise<void>((resolve, reject) => {
    if (methodsReady()) {
      resolve();
      return;
    }

    // Init first, then wait: the methods are what init produces, so polling for
    // them before configuring the widget would wait forever.
    const start = () => {
      try {
        initWidget();
      } catch (error) {
        reject(error);
        return;
      }
      waitForMethods().then(resolve).catch(reject);
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      // A previous mount already added the tag. It may or may not have
      // finished, so only wait on `load` when the script has yet to run.
      if (window.initSendOTP) start();
      else existing.addEventListener("load", start, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = start;
    script.onerror = () => reject(new Error("Failed to load MSG91 widget"));
    document.head.appendChild(script);
  }).catch((error) => {
    // Let a later mount retry rather than caching the failure forever.
    readyPromise = null;
    throw error;
  });

  return readyPromise;
};

/**
 * Turns one of the widget's callback pairs into a promise.
 *
 * MSG91 is inconsistent about where it puts the payload: `reqId` after a send
 * and the access token after a verify both arrive in `message` on some widget
 * versions and in their own field on others, so callers read both.
 */
const promisify = (
  invoke: (
    onSuccess: (data: any) => void,
    onFailure: (error: any) => void,
  ) => void,
): Promise<any> =>
  new Promise((resolve, reject) => {
    invoke(resolve, reject);
  });

export interface UseMSG91OTP {
  /** True once the widget's methods are callable. */
  ready: boolean;
  /** Set when the script could not be loaded at all. */
  loadError: string | null;
  /**
   * Sends a code. `identifier` is country code + number with no "+", which is
   * what `toMsg91Identifier` in `lib/phone` produces. Not prefixed here: the
   * country cannot be assumed, and a wrong one defeats the widget's
   * country-wise channel routing.
   */
  sendOtp: (identifier: string) => Promise<string | null>;
  /** Omit `channel` to repeat on whichever the widget picked for this number. */
  retryOtp: (
    reqId?: string | null,
    channel?: OtpChannel,
  ) => Promise<string | null>;
  /** Checks the code. Resolves with the access token to hand the backend. */
  verifyOtp: (otp: string, reqId?: string | null) => Promise<string>;
}

/** MSG91 returns `{type: "success", message: <payload>}` on older widgets. */
const payloadOf = (data: any): string | null => {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.reqId) return String(data.reqId);
  if (data.token) return String(data.token);
  if (data.type === "success" && data.message) return String(data.message);
  return null;
};

const messageOf = (error: any, fallback: string): string => {
  const raw = error?.message ?? error?.error ?? error;
  return typeof raw === "string" && raw.trim() ? raw : fallback;
};

export const useMSG91OTP = (): UseMSG91OTP => {
  const [ready, setReady] = useState(false);
  // Missing credentials are knowable before the first render, so this starts as
  // the error rather than being set from the effect.
  const [loadError, setLoadError] = useState<string | null>(() =>
    isMSG91Configured ? null : "Phone verification is not configured.",
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!isMSG91Configured) return;

    loadWidget()
      .then(() => {
        if (mounted.current) setReady(true);
      })
      .catch((error) => {
        if (mounted.current) {
          setLoadError(messageOf(error, "Could not load phone verification."));
        }
      });

    return () => {
      mounted.current = false;
    };
  }, []);

  const requireReady = useCallback(() => {
    if (!methodsReady()) {
      throw new Error("Phone verification is still loading. Try again.");
    }
  }, []);

  const sendOtp = useCallback(
    async (identifier: string): Promise<string | null> => {
      requireReady();
      const data = await promisify((ok, fail) =>
        window.sendOtp!(identifier, ok, fail),
      ).catch((error) => {
        throw new Error(messageOf(error, "Could not send the code."));
      });
      return payloadOf(data);
    },
    [requireReady],
  );

  const retryOtp = useCallback(
    async (
      reqId?: string | null,
      channel?: OtpChannel,
    ): Promise<string | null> => {
      requireReady();
      const data = await promisify((ok, fail) =>
        // null lets the widget use its configured channel, which is what
        // country-wise routing depends on.
        window.retryOtp!(channel ?? null, ok, fail, reqId || undefined),
      ).catch((error) => {
        throw new Error(messageOf(error, "Could not resend the code."));
      });
      return payloadOf(data);
    },
    [requireReady],
  );

  const verifyOtp = useCallback(
    async (otp: string, reqId?: string | null): Promise<string> => {
      requireReady();
      const data = await promisify((ok, fail) =>
        window.verifyOtp!(otp, ok, fail, reqId || undefined),
      ).catch((error) => {
        throw new Error(messageOf(error, "That code did not work."));
      });

      const token = payloadOf(data);
      if (!token) {
        throw new Error("That code did not work.");
      }
      return token;
    },
    [requireReady],
  );

  return useMemo(
    () => ({ ready, loadError, sendOtp, retryOtp, verifyOtp }),
    [ready, loadError, sendOtp, retryOtp, verifyOtp],
  );
};

export default useMSG91OTP;
