"use client";

import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ApplyPathModalProps = {
  isOpen: boolean;
  onClose: () => void;
  internshipSlug: string;
};

/**
 * Chosen paths from the public internship “Apply” entry point.
 * `flow=entrance` — main merit/entrance flow (default when omitted in backend).
 * `flow=seat` — reserved for direct / non-entrance booking UX (enroll page may read later).
 */
export function ApplyPathModal({
  isOpen,
  onClose,
  internshipSlug,
}: ApplyPathModalProps) {
  const router = useRouter();
  const enrollBase = `/internships/${encodeURIComponent(internshipSlug)}/enroll`;

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How would you like to apply?"
      className="max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]"
      showCloseButton
    >
      <div className="flex flex-col gap-5 -mt-1">
        <p className="text-sm text-gray-500 leading-relaxed">
          Pick the path that fits you. You can always reach out to us if you
          are unsure.
        </p>

        {/* 1 — Primary: entrance */}
        <div className="rounded-2xl border border-primary/15 bg-primary/4 p-1 shadow-sm">
          <div className="flex flex-col gap-3 rounded-[14px] bg-white/90 p-4">
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                aria-hidden
              >
                <GraduationCap className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/90">
                  Recommended
                </p>
                <p className="text-base font-bold text-text-primary leading-snug">
                  Enroll through entrance
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Apply through the standard screening for this program.
                </p>
              </div>
            </div>
            <OrangeButton
              glow={false}
              className="w-full text-base font-bold py-3.5"
              onClick={() => go(enrollBase)}
            >
              Continue with entrance
            </OrangeButton>
          </div>
        </div>

        {/* 3 — Unique: course bundle (visually separate from the primary block) */}
        <Link
          href="/courses"
          onClick={onClose}
          className={cn(
            "group relative block overflow-hidden rounded-2xl border-2 border-dashed border-primary/25",
            "bg-linear-to-br from-amber-50/90 via-white to-orange-50/50",
            "p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-md",
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100/80 text-amber-800"
              aria-hidden
            >
              <Sparkles className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/80">
                Learning bundle
              </p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900 leading-snug group-hover:text-primary transition-colors">
                Purchase a course now to get 1 internship free with it
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Browse courses
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </div>
        </Link>

        {/* 2 — Subtle: pay to reserve a seat without entrance; low-emphasis footnote */}
        <div className="text-center border-t border-gray-100/80 pt-4 mt-0.5">
          <button
            type="button"
            onClick={() => go(`${enrollBase}?flow=seat`)}
            className="mx-auto max-w-sm text-center text-[10px] sm:text-[11px] leading-relaxed text-gray-400/90 hover:text-gray-500 transition-colors font-normal"
          >
            <span className="block">Book your seat now without entrance</span>
            <span className="mt-1.5 block text-[9px] font-normal leading-snug text-gray-300">
              Pay to secure your spot—no entrance step.
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ApplyPathModal;
