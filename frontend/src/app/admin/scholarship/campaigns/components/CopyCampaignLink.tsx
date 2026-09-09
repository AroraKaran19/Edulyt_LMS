"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";

/**
 * Built from `window.location.origin`, not `NEXT_PUBLIC_APP_URL`: that variable
 * is `http://localhost:3000` in every checked-in env file, and copying a
 * localhost URL into a marketing email is a silent, expensive failure. The
 * origin the admin is already browsing is correct by construction.
 *
 * The copier's own referral code rides along. Without it the campaign is a
 * link to nobody: the lead captured when someone starts the test is credited to
 * no one, and the page they are sent to afterwards is the bare `/enquiry`,
 * which is priced by the admin switch rather than by whoever shared the link.
 */
export const campaignUrl = (slug: string, refCode = ""): string => {
  const path = `/scholarship/${slug}${
    refCode ? `?ref=${encodeURIComponent(refCode)}` : ""
  }`;
  return typeof window === "undefined"
    ? path
    : `${window.location.origin}${path}`;
};

/**
 * The viewer's own CRM code, fetched once for however many rows render a copy
 * button. Anyone without a code (a super-admin, say) gets a bare link, which is
 * right: their campaign belongs to the company, not to a rep.
 */
let codeRequest: Promise<string> | null = null;
const myCrmCode = (): Promise<string> => {
  codeRequest ??= apiClient
    .get("/crm/me")
    .then((res) => String(res.data?.data?.code ?? ""))
    .catch(() => "");
  return codeRequest;
};

/**
 * `navigator.clipboard` needs a secure context, so it is absent on a plain-http
 * deployment. The legacy path keeps copy working there rather than failing on
 * the one action marketers use most.
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

type Props = {
  slug: string;
  /** `icon` sits in a table's action column, `block` in the detail panel. */
  variant?: "icon" | "block";
};

export default function CopyCampaignLink({ slug, variant = "icon" }: Props) {
  const [copied, setCopied] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);
  const url = campaignUrl(slug, refCode ?? "");

  useEffect(() => {
    let cancelled = false;
    void myCrmCode().then((code) => {
      if (!cancelled) setRefCode(code);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const copy = async (e: React.MouseEvent) => {
    // The table row is itself clickable; without this, copying also opens the
    // detail modal.
    e.stopPropagation();
    const ok = await writeToClipboard(url);
    if (!ok) {
      toast.error("Could not copy the link");
      return;
    }
    setCopied(true);
    toast.success("Campaign link copied");
    setTimeout(() => setCopied(false), 1600);
  };

  if (variant === "block") {
    return (
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs text-gray-700 select-all">
          {refCode === null ? "Loading your link…" : url}
        </code>
        <button
          type="button"
          onClick={(e) => void copy(e)}
          disabled={refCode === null}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shrink-0 disabled:opacity-40"
          aria-label="Copy campaign link"
          title="Copy link"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => void copy(e)}
      disabled={refCode === null}
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-40"
      aria-label={`Copy the shareable link for ${slug}`}
      title="Copy campaign link"
    >
      {copied ? (
        <Check className="size-4 text-green-600" />
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}
