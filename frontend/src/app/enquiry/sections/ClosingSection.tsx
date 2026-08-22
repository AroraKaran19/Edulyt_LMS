import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import EnquiryButton from "../components/EnquiryButton";
import { useSection } from "../settings";
import { CONTAINER, REVEAL, SECTION } from "./shared";

type Props = {
  planName: string;
  onCta: () => void;
};

export default function ClosingSection({ planName, onCta }: Props) {
  const cms = useSection("closing");

  return (
    <section className={`${SECTION} pb-20 lg:pb-24`}>
      <div className={CONTAINER}>
        <div
          data-reveal
          className={cn(
            REVEAL,
            "relative z-[1] overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#f77124_0%,#f7902a_55%,#f7ad24_100%)] px-6 py-11 text-center shadow-[0_24px_50px_-24px_rgba(247,113,36,0.7)] sm:px-11 sm:py-16"
          )}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.22)_1.2px,transparent_1.2px)] bg-[size:22px_22px] [mask-image:radial-gradient(70%_70%_at_50%_0%,#000,transparent)]"
          />
          <h2 className="relative mb-3 text-[clamp(1.8rem,4.6vw,2.7rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-white">
            {cms.heading || "Three plans. One short form."}
          </h2>
          <p className="relative mx-auto mb-[26px] max-w-[50ch] text-base leading-[1.6] text-white/[0.92]">
            {cms.body ||
              "Share your name, email and number. A counsellor calls you back to walk through the plan, the fees and the MNC certification add-on."}
          </p>
          <EnquiryButton variant="onColor" className="relative" onClick={onCta}>
            {cms.ctaLabel || `Get ${planName} details`}
            <ArrowRight size={16} strokeWidth={2.6} />
          </EnquiryButton>
        </div>

        <footer className="relative z-[1] mt-11 flex flex-wrap items-center gap-x-[22px] gap-y-3 border-t border-[#fbe3d2] pt-6 text-[13px] font-semibold text-[#8c7a70]">
          <span>© {new Date().getFullYear()} Airkrit India</span>
          <Link
            href="/terms-of-use"
            className="text-text-secondary hover:text-primary"
          >
            Terms
          </Link>
          <Link
            href="/privacy-policy"
            className="text-text-secondary hover:text-primary"
          >
            Privacy
          </Link>
          <Link
            href="/cancellation-refund-policy"
            className="text-text-secondary hover:text-primary"
          >
            Refunds
          </Link>
          <Link href="/" className="text-text-secondary hover:text-primary">
            airkrit.com
          </Link>
        </footer>
      </div>
    </section>
  );
}
