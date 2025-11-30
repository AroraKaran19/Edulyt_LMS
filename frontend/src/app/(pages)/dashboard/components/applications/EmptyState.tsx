"use client";
import ImageComponent from "@/components/ui/ImageComponent";
import { useRouter } from "next/navigation";

const EmptyState = ({
  title,
  description,
  buttonText,
  href,
  onClick,
}: {
  title: string;
  description: string;
  buttonText: string;
  href?: string;
  onClick?: () => void;
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-10">
      <ImageComponent
        src="/dashboard/scholars-icon.svg"
        alt={`No ${title} Yet!`}
        width={100}
        height={100}
      />
      <h2 className="text-xl font-bold mt-4">
        You Don't Have Any {title} Yet!
      </h2>
      <p className="text-gray-600">{description}</p>
      <button
        type="button"
        title="Edit"
        className="bg-[#F5691D] border-2 border-[#E9750000] text-white px-4 py-2 rounded-2xl shadow-[0px_0px_0px_4px_#F68C2238,0px_0px_0px_2px_#F68C2238,0px_4px_13px_0px_#FFFFFF69_inset] cursor-pointer mt-4"
        onClick={handleClick}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default EmptyState;
