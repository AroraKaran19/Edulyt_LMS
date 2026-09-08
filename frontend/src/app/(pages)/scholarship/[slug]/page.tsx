"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import scholarshipClient, { schAuth } from "@/configs/scholarshipApiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { REF_STORAGE_KEY } from "@/constants/crm";
import useAuth from "@/hooks/useAuth";
import EmailGate from "./components/EmailGate";
import PhoneGate from "./components/PhoneGate";
import AttemptRunner from "./components/AttemptRunner";
import ResultCard from "./components/ResultCard";
import Seal from "./components/Seal";
import type {
  AttemptView,
  PublicCampaign,
  ScholarshipResult,
} from "@/types/scholarship";

type Stage = "gate" | "preflight" | "running" | "result" | "dead";

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

/** For refusals the page has to act on rather than print. */
const errorCode = (error: unknown): string =>
  String(
    (error as { response?: { data?: { error?: { code?: string } } } })?.response
      ?.data?.error?.code ?? "",
  );

const EYEBROW =
  "font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-gold";
const DISPLAY =
  "font-sch-display font-semibold leading-[0.96] tracking-[-0.03em] text-[clamp(2.5rem,6vw,5rem)]";
const DISPLAY_SM =
  "font-sch-display font-semibold leading-[1.05] tracking-[-0.02em] text-[clamp(1.75rem,4vw,3rem)]";
const GHOST_LINK =
  "inline-flex w-fit items-center justify-center rounded-2xl border-[1.5px] border-sch-ink-line px-6 py-3.5 text-[0.9375rem] font-semibold transition-colors hover:border-sch-on-ink-dim";

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-sch-ink-line py-3">
      <span className="font-sch-mono text-[0.6875rem] uppercase tracking-[0.16em] text-sch-on-ink-dim">
        {label}
      </span>
      <span className="text-[0.9375rem] font-medium">{value}</span>
    </div>
  );
}

export default function ScholarshipCampaignPage() {
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const { user, isAuthenticated } = useAuth();

  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [token, setToken] = useState("");
  const [stage, setStage] = useState<Stage>("gate");
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [result, setResult] = useState<ScholarshipResult | null>(null);
  /**
   * The address this session belongs to. Held here because the result screen
   * names the inbox the coupon went to and carries it into the enquiry form,
   * and because it arrives from three different entry paths.
   */
  const [sessionEmail, setSessionEmail] = useState("");
  const [deadReason, setDeadReason] = useState("");
  /** Set when the dead end is a spent attempt, which has no coupon behind it. */
  const [deadTitle, setDeadTitle] = useState("");
  const [starting, setStarting] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  /**
   * Both channels have to be proved before an attempt may start, and the server
   * refuses either way. This only decides which half of the gate to show.
   */
  const [needsPhone, setNeedsPhone] = useState(false);

  const viewPinged = useRef(false);
  const autoTried = useRef(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await scholarshipClient.get(
          ENDPOINTS.scholarshipPublic.campaign(slug),
        );
        if (!cancelled) setCampaign(res.data?.data as PublicCampaign);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    // Client side and once per session, so prefetches and crawlers do not
    // inflate what the funnel calls a view.
    if (!slug || viewPinged.current) return;
    const key = `sch-view-${slug}`;
    if (sessionStorage.getItem(key)) return;
    viewPinged.current = true;
    sessionStorage.setItem(key, "1");
    void scholarshipClient
      .post(ENDPOINTS.scholarshipPublic.view(slug))
      .catch(() => {});
  }, [slug]);

  /**
   * With a session in hand, the result is checked before anything else. A
   * returning finisher must land on the confirmation, not be pushed into an
   * attempt the server will refuse to start. It answers a bare yes/no now: the
   * coupon itself was emailed.
   */
  const resolveStage = useCallback(
    async (sessionToken: string) => {
      const auth = schAuth(sessionToken);
      try {
        const res = await scholarshipClient.get(
          ENDPOINTS.scholarshipPublic.result(slug),
          auth,
        );
        const existing = res.data?.data as ScholarshipResult | null;
        if (existing) {
          setResult(existing);
          setStage("result");
          return;
        }
      } catch {
        // A failed lookup must not block someone who has not taken it yet.
      }

      try {
        const res = await scholarshipClient.get(
          ENDPOINTS.scholarshipPublic.attempt(slug),
          auth,
        );
        const live = res.data?.data as AttemptView | null;
        if (live) {
          setAttempt(live);
          setStage("running");
          return;
        }
      } catch {
        // Same reasoning as above.
      }

      setStage("preflight");
    },
    [slug],
  );

  /**
   * The one landing point for every way into a session: the email gate, and the
   * signed-in shortcut. A session that has no number yet stops at the phone
   * step; one that inherited a proved number from its account walks straight
   * past it.
   */
  const afterSession = useCallback(
    async (sessionToken: string, phoneVerified: boolean, email: string) => {
      setToken(sessionToken);
      setSessionEmail(email);
      if (!phoneVerified) {
        setNeedsPhone(true);
        return;
      }
      await resolveStage(sessionToken);
    },
    [resolveStage],
  );

  /**
   * A signed-in account proved its address at signup, so mailing another code
   * asks for the same proof twice. The address comes from the account, which is
   * what stops this being a way to pick any address you like.
   */
  useEffect(() => {
    if (autoTried.current) return;
    if (!campaign || campaign.state !== "live") return;
    if (!isAuthenticated || !user?.email) return;
    autoTried.current = true;

    (async () => {
      setAutoVerifying(true);
      try {
        const res = await apiClient.post(
          ENDPOINTS.scholarshipPublic.session(slug),
          {},
        );
        await afterSession(
          res.data?.data?.sessionToken,
          Boolean(res.data?.data?.phoneVerified),
          // From the account, not the form: the endpoint reads it off the user
          // record, which is what stops this being a way to name any address.
          String(res.data?.data?.email ?? user?.email ?? ""),
        );
      } catch {
        // Fall back to the email gate rather than stranding them.
      } finally {
        setAutoVerifying(false);
      }
    })();
  }, [campaign, isAuthenticated, user?.email, slug, afterSession]);

  /*
   * Same handling as the enquiry form: sessionStorage rather than localStorage,
   * because it is per tab, so two tabs opened from two different people's links
   * keep their own attribution.
   */
  const [refCode] = useState(() => {
    if (typeof window === "undefined") return "";
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    const clean = (fromUrl ?? "").trim().slice(0, 32);
    if (clean) {
      try {
        sessionStorage.setItem(REF_STORAGE_KEY, clean);
      } catch {
        /* private mode: this render's value still works */
      }
      return clean;
    }
    try {
      return sessionStorage.getItem(REF_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  /** Drop it from the address bar without a navigation. */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("ref")) return;
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const begin = async () => {
    setStarting(true);
    try {
      const res = await scholarshipClient.post(
        ENDPOINTS.scholarshipPublic.attempt(slug),
        // Raw code only; the server resolves it. Sent at attempt start because
        // that is where the lead is captured.
        { ref: refCode || undefined },
        schAuth(token),
      );
      setAttempt(res.data?.data as AttemptView);
      setStage("running");
    } catch (error) {
      /*
       * A refused start is a dead end, not a transient failure, so it gets the
       * screen rather than a toast that vanishes and leaves the button armed.
       * Which dead end it is decides whether we can honestly say a coupon is
       * waiting in their inbox.
       */
      const code = errorCode(error);
      if (code === "ALREADY_FINISHED") {
        setResult({ submitted: true });
        setStage("result");
        return;
      }
      if (code === "NO_ATTEMPTS_LEFT") {
        setDeadTitle("You have used all your attempts.");
        setDeadReason(
          "Every attempt counts, including one that ran out of time, and this test only issues a code to someone who finishes it. Nothing was emailed to you.",
        );
        setStage("dead");
        return;
      }
      toast.error(errorMessage(error, "Could not start the test"));
    } finally {
      setStarting(false);
    }
  };

  const revealed = stage === "result" && !!result;

  /**
   * `narrow` is for the short dead ends, where a wide column would leave one
   * sentence stranded across a whole screen.
   */
  const shell = (children: React.ReactNode, narrow = false) => (
    <main
      className={`min-h-screen transition-colors duration-700 ease-out motion-reduce:transition-none ${
        revealed
          ? "bg-sch-paper text-sch-on-paper"
          : "bg-sch-ink text-sch-on-ink"
      }`}
    >
      <div
        className={`mx-auto w-full px-6 py-14 sm:px-8 lg:py-20 ${
          narrow ? "max-w-2xl" : "max-w-6xl"
        }`}
      >
        {children}
      </div>
    </main>
  );

  if (loading) {
    return shell(
      <p className="py-24 text-center font-sch-mono text-xs uppercase tracking-[0.2em] text-sch-on-ink-dim">
        Loading
      </p>,
      true,
    );
  }

  if (notFound || !campaign) {
    return shell(
      <>
        <span className={EYEBROW}>Dead link</span>
        <h1 className={`${DISPLAY_SM} mt-3`}>
          This link does not lead anywhere.
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-sch-on-ink-dim">
          The campaign may have been taken down. Check the link you were sent.
        </p>
        <Link href="/programs" className={`${GHOST_LINK} mt-7`}>
          Browse courses
        </Link>
      </>,
      true,
    );
  }

  if (campaign.state === "paused") {
    return shell(
      <>
        <span className={EYEBROW}>Closed</span>
        <h1 className={`${DISPLAY_SM} mt-3`}>This test has closed.</h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-sch-on-ink-dim">
          It is no longer accepting attempts.
        </p>
        <Link href="/programs" className={`${GHOST_LINK} mt-7`}>
          Browse courses
        </Link>
      </>,
      true,
    );
  }

  return shell(
    <>
      {stage === "gate" ? (
        <div className="grid gap-10 lg:min-h-[72vh] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
          <div className="flex flex-col gap-8">
            <div>
              <span className={EYEBROW}>Airkrit scholarship</span>
              {campaign.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={campaign.imageUrl}
                  alt=""
                  className="mt-4 w-full max-w-md rounded-2xl border border-sch-ink-line object-cover"
                />
              ) : null}
              {/* Names the bargain without naming the prize: the size of the
                  reward is the thing they are playing for.

                  Drops to the smaller size when there is an image, so the two
                  together do not push the email field below the fold. */}
              <h1
                className={`${campaign.imageUrl ? DISPLAY_SM : DISPLAY} mt-4`}
              >
                {campaign.questionCount} questions stand between you and it.
              </h1>
              {campaign.description ? (
                <p className="mt-5 max-w-md text-base leading-relaxed text-sch-on-ink-dim">
                  {campaign.description}
                </p>
              ) : null}
            </div>

            <div className="max-w-md">
              <Rule label="Questions" value={String(campaign.questionCount)} />
              <Rule label="Time" value={`${campaign.durationMinutes} minutes`} />
              <Rule label="Reward" value="Earn when you finish" />
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <Seal />
            {autoVerifying ? (
              <p className="font-sch-mono text-xs tracking-wider text-sch-on-ink-dim">
                USING YOUR ACCOUNT…
              </p>
            ) : needsPhone ? (
              // Same slot as the email gate, so the second proof reads as the
              // next step rather than a new obstacle.
              <PhoneGate
                slug={slug}
                token={token}
                onVerified={() => {
                  setNeedsPhone(false);
                  void resolveStage(token);
                }}
              />
            ) : (
              <EmailGate slug={slug} onVerified={afterSession} />
            )}
          </div>
        </div>
      ) : null}

      {stage === "preflight" ? (
        <div className="grid gap-10 lg:min-h-[72vh] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
          <div className="flex flex-col gap-8">
            <div>
              <span className={EYEBROW}>Verified</span>
              <h1 className={`${DISPLAY} mt-4`}>Ready when you are.</h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-sch-on-ink-dim">
                The clock starts when you press start, not before.
              </p>
            </div>

            <div className="max-w-md">
              <Rule label="Questions" value={String(campaign.questionCount)} />
              <Rule label="Time" value={`${campaign.durationMinutes} minutes`} />
              <Rule
                label="Yours for"
                value={`${campaign.couponValidForDays} days`}
              />
            </div>

            {/* Reassurance framed as a promise. Saying "there is no pass mark"
                would tell them the test does not count, which takes the earning
                out of a reward built entirely on feeling earned. */}
            <p className="max-w-md text-base leading-relaxed text-sch-on-ink-dim">
              You do not need a perfect score. Cross the finish line before the
              clock runs out and the reward is yours to keep.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            <Seal />
            <button
              type="button"
              disabled={starting}
              onClick={() => void begin()}
              className="w-full rounded-2xl bg-gradient-to-br from-sch-foil to-[#f0763c] px-6 py-4 text-[0.9375rem] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {starting ? "Starting…" : "Start the test"}
            </button>
          </div>
        </div>
      ) : null}

      {stage === "running" && attempt ? (
        <AttemptRunner
          slug={slug}
          token={token}
          attempt={attempt}
          onFinished={(r) => {
            setResult(r);
            setStage("result");
          }}
          onDead={(message) => {
            setDeadReason(message);
            setStage("dead");
          }}
        />
      ) : null}

      {stage === "result" && result ? (
        <div className="mx-auto w-full max-w-xl">
          <ResultCard email={sessionEmail} />
        </div>
      ) : null}

      {stage === "dead" ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
          <span className="font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-foil">
            {deadTitle ? "No attempts left" : "Time up"}
          </span>
          <h1 className={DISPLAY_SM}>
            {deadTitle || "You ran out of time."}
          </h1>
          <p className="text-[0.9375rem] leading-relaxed text-sch-on-ink-dim">
            {deadReason}
          </p>
          {/* Only offered when a retry is actually possible. The default
              `attemptsAllowed` is 1, so telling everyone to reload and try
              again sends most people back to the same refusal. */}
          {deadTitle ? null : (
            <p className="text-[0.9375rem] leading-relaxed text-sch-on-ink-dim">
              If you have attempts left, reload this page and use the same email
              to try again.
            </p>
          )}
          <Link href="/programs" className={GHOST_LINK}>
            Browse courses
          </Link>
        </div>
      ) : null}
    </>,
  );
}
