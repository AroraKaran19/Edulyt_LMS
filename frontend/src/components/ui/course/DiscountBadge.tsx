import { cn } from "@/lib/utils";
import { Discount } from "@/types";

const DiscountBadge = ({
  discount,
  className,
}: {
  discount: Discount;
  className?: string;
}) => {
  const discountText =
    discount && discount.discount && discount.discount === "percentage"
      ? `${discount.value}% off`
      : discount && discount.value
      ? `₹${discount.value} off`
      : "";

  return (
    <div
      className={cn(
        "bg-[#F7AD24] rounded-xl px-2 py-1 text-white text-xs font-bold",
        className
      )}
    >
      {discountText}
    </div>
  );
};

export default DiscountBadge;
