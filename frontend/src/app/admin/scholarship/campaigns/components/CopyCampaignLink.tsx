"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "react-toastify";

/**
 * Built from `window.location.origin`, not `NEXT_PUBLIC_APP_URL`: that variable
 * is `http://localhost:3000` in every checked-in env file, and copying a
 * localhost URL into a marketing email is a silent, expensive failure. The
 * origin the admin is already browsing is correct by construction.
 */
export const campaignUrl = (slug: string): string =>
  typeof window === "undefined"
    ? `/scholarship/${slug}`
    : `${window.location.origin}/scholarship/${slug}`;

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
  const url = campaignUrl(slug);

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
          {url}
        </code>
        <button
          type="button"
          onClick={(e) => void copy(e)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
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
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
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
