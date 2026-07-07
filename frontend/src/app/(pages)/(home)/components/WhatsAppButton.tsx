import Image from "next/image";

// WhatsApp contact number in international format, no "+" or spaces.
// Defaults to the site contact number (+91-8929252575); update here if the
// WhatsApp line differs.
const WHATSAPP_NUMBER = "918929252575";

/**
 * Small floating WhatsApp button. Rendered on the homepage only (see
 * Homepage.tsx). Opens a wa.me chat with our number in a new tab.
 */
const WHATSAPP_DEFAULT_MESSAGE = encodeURIComponent("Hello! I need help.");

const WhatsAppButton = () => {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_DEFAULT_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 rounded-full transition-transform duration-200 hover:scale-110"
    >
      <Image
        src="/assets/whatsapp_icon.png"
        alt="WhatsApp"
        width={56}
        height={56}
        className="h-12 w-12 md:h-14 md:w-14"
        quality={100}
        priority={true}
        loading="eager"
        unoptimized={true}
      />
    </a>
  );
};

export default WhatsAppButton;
