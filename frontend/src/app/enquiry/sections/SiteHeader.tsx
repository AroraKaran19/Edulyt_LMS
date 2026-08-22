import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { enquiryButtonClass } from "../components/EnquiryButton";
import { CONTAINER } from "./shared";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#fbe3d2] bg-white/[0.86] backdrop-blur-[14px]">
      <div className={`${CONTAINER} flex h-[78px] items-center gap-4`}>
        <Link
          href="/"
          className="flex flex-none items-center"
          aria-label="Airkrit home"
        >
          <Image
            src="/logo.svg"
            alt="Airkrit"
            width={105}
            height={30}
            priority
            unoptimized
            className="h-11 w-auto sm:h-[52px]"
          />
        </Link>
        <Link
          href="/programs"
          className={`ml-auto ${enquiryButtonClass("ghost")}`}
        >
          Go to platform
          <ArrowUpRight size={15} strokeWidth={2.6} />
        </Link>
      </div>
    </header>
  );
}
