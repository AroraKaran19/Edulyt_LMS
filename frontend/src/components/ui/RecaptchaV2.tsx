"use client";

import { useEffect, useRef, useState } from "react";
import { grecaptchaReady, RECAPTCHA_SITE_KEY } from "@/lib/recaptcha";

type Props = {
  /**
   * Fires with the solved token, and with null the moment it stops being usable:
   * expiry, an internal error, or this widget going away.
   */
  onChange: (token: string | null) => void;
  /**
   * Clears a solved tick when the number changes. A v2 token is single use, so
   * bump this after every request that spent one, refused or not.
   */
  resetSignal?: number;
  className?: string;
};

/**
 * reCAPTCHA v2 checkbox, one widget per mounted instance.
 *
 * Owning its own widget is what lets a form render one on each step it needs a
 * tick for: React tears the old widget down with its branch and the next
 * instance draws a fresh one, which is exactly the shape a single-use token
 * wants.
 */
export default function RecaptchaV2({
  onChange,
  resetSignal = 0,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const lastResetSignal = useRef(resetSignal);
  const [unavailable, setUnavailable] = useState(!RECAPTCHA_SITE_KEY);

  // Held in a ref so a parent passing an inline callback cannot re-run the
  // render effect and stack a second widget on the same container.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.error("[recaptcha] NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY is not set");
      return;
    }

    let cancelled = false;

    void grecaptchaReady()
      .then((grecaptcha) => {
        const container = containerRef.current;
        if (cancelled || !container || widgetIdRef.current !== null) return;

        widgetIdRef.current = grecaptcha.render(container, {
          sitekey: RECAPTCHA_SITE_KEY,
          theme: "light",
          callback: (token) => onChangeRef.current(token),
          "expired-callback": () => onChangeRef.current(null),
          "error-callback": () => onChangeRef.current(null),
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[recaptcha] could not render the widget", error);
        setUnavailable(true);
      });

    return () => {
      cancelled = true;
      // The token dies with the widget, so the parent must not keep holding one.
      onChangeRef.current(null);
    };
  }, []);

  useEffect(() => {
    if (lastResetSignal.current === resetSignal) return;
    lastResetSignal.current = resetSignal;

    if (widgetIdRef.current !== null) {
      window.grecaptcha?.reset(widgetIdRef.current);
      onChangeRef.current(null);
    }
  }, [resetSignal]);

  return (
    <div className={className}>
      {/* Google fixes the widget at 304x78. Inside the enquiry card that is
          20px of page gutter plus 18px of card padding a side, so it stops
          fitting below a 380px viewport: 0.8 carries it down to 320px. The
          wrapper holds the height a transform does not take back. */}
      <div className="h-[78px] max-[380px]:h-[63px]">
        <div
          ref={containerRef}
          className="origin-top-left max-[380px]:scale-[0.8]"
        />
      </div>

      {unavailable && (
        <p
          role="alert"
          className="mt-1.5 text-xs leading-[1.45] font-semibold text-[#c03c19]"
        >
          The verification box could not load, so the form cannot be sent. Turn
          off any ad blocker for this page and reload.
        </p>
      )}
    </div>
  );
}
