import { cn } from "@/lib/utils";
import EnquiryButton from "../components/EnquiryButton";

type Props = {
  planName: string;
  visible: boolean;
  onCta: () => void;
};

export default function MobileDock({ planName, visible, onCta }: Props) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-[#fbe3d2] bg-white/95 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur-[14px] transition-transform duration-300 ease-[cubic-bezier(0.16,0.9,0.28,1)] lg:hidden",
        visible ? "translate-y-0" : "translate-y-[130%]"
      )}
    >
      <span className="min-w-0 text-[11.5px] font-semibold leading-[1.4] text-[#8c7a70]">
        Selected
        <b className="block truncate text-[15px] font-extrabold text-text-primary">
          {planName}
        </b>
      </span>
      <EnquiryButton className="ml-auto h-[46px] flex-none" onClick={onCta}>
        Get details
      </EnquiryButton>
    </div>
  );
}
