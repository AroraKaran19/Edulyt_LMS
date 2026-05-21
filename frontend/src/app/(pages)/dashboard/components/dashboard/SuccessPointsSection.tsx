"use client";

import { useEffect, useState } from "react";
import { Send, Star } from "lucide-react";
import useSuccessPoints from "@/hooks/useSuccessPoints";
import TransferPointsModal from "@/components/shared/SuccessPoints/TransferPointsModal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

const SuccessPointsSection = () => {
  const { getBalance } = useSuccessPoints();
  const [balance, setBalance] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { balance: b } = await getBalance();
        if (!cancelled) setBalance(b);
      } catch {
        if (!cancelled) setBalance(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getBalance]);

  return (
    <>
      <div className="flex w-full flex-col h-max gap-4 border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5">
        <div className="flex w-full justify-between items-center">
          <h2 className="text-sm sm:text-base font-bold">Success Points</h2>
          <Star className="size-4 sm:size-5 text-[#F77124] fill-[#F77124]" />
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {balance === null ? "—" : balance}
          </span>
          <span className="text-xs font-semibold text-[#667085]">points</span>
        </div>

        <OrangeButton
          onClick={() => setIsModalOpen(true)}
          className="w-full text-xs sm:text-sm font-bold py-2.5"
        >
          <Send className="size-4" />
          Transfer Points
        </OrangeButton>
      </div>

      <TransferPointsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialBalance={balance ?? 0}
      />
    </>
  );
};

export default SuccessPointsSection;
