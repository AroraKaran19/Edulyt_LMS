"use client";

import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { MailX, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { Suspense, useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  reviews: "review notifications",
  referrals: "referral notifications",
  promotions: "offers and programme suggestions",
};

type State = "idle" | "working" | "unsubscribed" | "resubscribed";

/**
 * Landing page for the unsubscribe link in email footers.
 *
 * Nothing happens on load. Inbox scanners at Gmail and Apple prefetch links, so
 * acting on page view would opt out people who never clicked. The change only
 * happens when the button below is pressed.
 */
const UnsubscribeContent = () => {
  const params = useSearchParams();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const uid = params.get("uid");
  const cat = params.get("cat");
  const sig = params.get("sig");

  const label = (cat && CATEGORY_LABELS[cat]) || "these emails";
  const linkIsUsable = Boolean(uid && cat && sig);

  const call = async (path: "unsubscribe" | "resubscribe", next: State) => {
    try {
      setState("working");
      setError(null);
      await apiClient.post(`/email-preferences/${path}`, { uid, cat, sig });
      setState(next);
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          "Something went wrong. Please try again.",
      );
      setState("idle");
    }
  };

  if (!linkIsUsable) {
    return (
      <Shell
        icon={<MailX className="w-7 h-7 text-orange-500" />}
        title="This link is not valid"
      >
        <p className="text-sm sm:text-base text-center text-gray-600">
          The unsubscribe link looks incomplete. You can manage email
          preferences from your account settings instead.
        </p>
        <Link
          href="/login"
          className="text-sm font-bold text-orange-500 hover:underline"
        >
          Go to login
        </Link>
      </Shell>
    );
  }

  if (state === "unsubscribed") {
    return (
      <Shell
        icon={<Check className="w-7 h-7 text-green-600" />}
        title="You're unsubscribed"
      >
        <p className="text-sm sm:text-base text-center text-gray-600">
          You will no longer receive {label}. This does not affect account
          emails such as verification codes, password resets or receipts.
        </p>
        <button
          type="button"
          onClick={() => call("resubscribe", "resubscribed")}
          className="text-sm font-bold text-orange-500 hover:underline"
        >
          Changed your mind? Resubscribe
        </button>
      </Shell>
    );
  }

  if (state === "resubscribed") {
    return (
      <Shell
        icon={<Check className="w-7 h-7 text-green-600" />}
        title="You're subscribed again"
      >
        <p className="text-sm sm:text-base text-center text-gray-600">
          You will keep receiving {label}.
        </p>
        <button
          type="button"
          onClick={() => call("unsubscribe", "unsubscribed")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Unsubscribe instead
        </button>
      </Shell>
    );
  }

  return (
    <Shell
      icon={<MailX className="w-7 h-7 text-orange-500" />}
      title="Unsubscribe"
    >
      <p className="text-sm sm:text-base text-center text-gray-600">
        Stop receiving <span className="font-bold">{label}</span>? You will
        still get account emails such as verification codes, password resets and
        receipts.
      </p>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <OrangeButton
        className="w-full rounded-xl font-bold text-sm sm:text-base py-3"
        onClick={() => call("unsubscribe", "unsubscribed")}
        disabled={state === "working"}
      >
        {state === "working" ? "Working..." : "Unsubscribe me"}
      </OrangeButton>
    </Shell>
  );
};

const Shell = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FFF6EF]">
    <div className="w-full max-w-md bg-white rounded-2xl border border-[#F3E1D4] p-6 sm:p-8 flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
        {icon}
      </div>
      <h1 className="text-2xl sm:text-3xl font-regular font-coolvetica text-center text-text-primary">
        {title}
      </h1>
      {children}
    </div>
  </main>
);

const UnsubscribePage = () => (
  <Suspense fallback={null}>
    <UnsubscribeContent />
  </Suspense>
);

export default UnsubscribePage;
