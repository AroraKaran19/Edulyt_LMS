"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "react-toastify";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import useCrm from "@/hooks/useCrm";

const shareUrl = (code: string) =>
  typeof window === "undefined"
    ? `/digital-marketing-internship?ref=${code}`
    : `${window.location.origin}/digital-marketing-internship?ref=${code}`;

export default function CaLinkCard() {
  const { getProfile } = useCrm();
  const [code, setCode] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProfile().then((p) => {
      if (cancelled) return;
      setCode(p?.code ?? null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [getProfile]);

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(shareUrl(code));
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-orange-200 bg-linear-to-br from-orange-50 to-white p-5">
      <h2 className="text-sm font-bold text-gray-900">Your CA link</h2>
      <p className="mt-0.5 text-xs text-gray-500">
        Share it with students who want to become ambassadors. Applications through it land here.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="flex-1 overflow-x-auto rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800">
          {code ? shareUrl(code) : loaded ? "-" : "Loading…"}
        </code>
        <WhiteButton type="button" glow={false} disabled={!code} onClick={() => void copy()}>
          {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
          Copy
        </WhiteButton>
      </div>
    </div>
  );
}
