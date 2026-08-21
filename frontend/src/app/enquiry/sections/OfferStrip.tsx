import { OFFER } from "../plans";
import { useSection } from "../settings";
import { CONTAINER } from "./shared";

export default function OfferStrip() {
  const cms = useSection("offer");
  if (cms.enabled === false) return null;

  return (
    <div className="relative z-[2] bg-[linear-gradient(90deg,#f77124_0%,#f7902a_52%,#f7ad24_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:18px_18px] [mask-image:linear-gradient(90deg,transparent,#000_30%,#000_70%,transparent)]"
      />
      <div
        className={`${CONTAINER} flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 py-2.5 text-center`}
      >
        <span className="inline-flex flex-none items-center gap-2 rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white">
          <i className="relative flex size-1.5 flex-none">
            <i className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75 motion-reduce:animate-none" />
            <i className="relative inline-flex size-1.5 rounded-full bg-white" />
          </i>
          {cms.label || OFFER.label}
        </span>

        <p className="text-[13px] leading-[1.4] font-bold text-white">
          {cms.headline || OFFER.headline}
          <span className="hidden font-semibold text-white/80 md:inline">
            {" · "}
            {cms.body || OFFER.body}
          </span>
        </p>
      </div>
    </div>
  );
}
