import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * wa.me needs a country-coded, digits-only number. Numbers stored without a
 * country code are assumed Indian, matching how they're collected at signup.
 */
export const buildWhatsAppLink = (rawNumber?: string | null): string | null => {
  const digits = (rawNumber ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length < 10) return null;

  return `https://wa.me/+${digits.length > 10 ? digits : `91${digits}`}`;
};

/** Opens a WhatsApp chat with the given number. Renders nothing without one. */
const WhatsAppButton = ({
  number,
  label = "Message on WhatsApp",
  className,
}: {
  number?: string | null;
  label?: string;
  className?: string;
}) => {
  const href = buildWhatsAppLink(number);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 cursor-pointer",
        "hover:bg-emerald-50 hover:border-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 transition-colors",
        className
      )}
    >
      <Image
        src="/assets/whatsapp_icon.png"
        alt=""
        width={16}
        height={16}
        className="w-4 h-4"
      />
    </a>
  );
};

export default WhatsAppButton;
