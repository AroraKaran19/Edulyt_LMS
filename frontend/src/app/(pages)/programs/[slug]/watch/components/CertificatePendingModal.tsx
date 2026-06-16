"use client";

import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Modal from "@/components/ui/Modal";
import { Award } from "lucide-react";
import Link from "next/link";

interface CertificatePendingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CertificatePendingModal({
  isOpen,
  onClose,
}: CertificatePendingModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Course completed"
      className="max-w-lg border-2 border-[#F77124]/25 shadow-[0_0_0_4px_rgba(247,113,36,0.12)]"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-[#F77124]/10 p-4 ring-2 ring-[#F77124]/20">
          <Award className="h-10 w-10 text-[#F77124]" aria-hidden />
        </div>
        <p className="text-gray-800 leading-relaxed text-[15px]">
          Your certificate will appear in your{" "}
          <span className="font-semibold text-gray-900">dashboard</span> shortly.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          It usually takes about{" "}
          <span className="font-medium text-gray-700">5 minutes</span>. If it
          isn&apos;t there after that, please{" "}
          <Link
            href="/contact"
            className="font-medium text-[#F77124] underline-offset-2 hover:underline"
          >
            contact support
          </Link>
          .
        </p>
        <OrangeButton
          type="button"
          className="w-full mt-1"
          onClick={onClose}
        >
          Got it
        </OrangeButton>
      </div>
    </Modal>
  );
}
