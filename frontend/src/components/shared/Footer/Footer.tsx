import Link from "next/link";
import ImageComponent from "@/components/ui/ImageComponent";
import { cn } from "@/lib/utils";
import {
  createElement,
  cloneElement,
  isValidElement,
  type ElementType,
  type ReactElement,
} from "react";
import { Manrope } from "next/font/google";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  ExternalLink,
  Heart,
  Youtube,
} from "lucide-react";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-5 h-5", className)}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-5 h-5", className)}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: "Courses", href: "/courses" },
      {
        label: "Internships",
        href: "https://edulyt.com/internships.php",
        external: true,
      },
      { label: "Contact Us", href: "/contact" },
    ],
    support: [
      { label: "FAQ", href: "/faq" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Use", href: "/terms-of-use" },
      { label: "Security Policy", href: "/security-policy" },
      {
        label: "Cancellation & Refund Policy",
        href: "/cancellation-refund-policy",
      },
    ],
    company: [{ label: "About Us", href: "/about" }],
  };

  const socialLinks = [
    {
      label: "WhatsApp",
      href: "https://www.whatsapp.com/channel/0029VaIBXP347XeJjHqbNi1X",
      icon: WhatsAppIcon,
    },
    {
      label: "Telegram",
      href: "https://t.me/+_XxzFosKYOg2M2I9",
      icon: TelegramIcon,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/edulyt_india/",
      icon: Instagram,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/edulytindia/",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/people/Edulyt-India/100066801796718/",
      icon: Facebook,
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@EdulytIndia",
      icon: Youtube,
    },
  ];

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "info@airkrit.com",
      href: "mailto:info@airkrit.com",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+91-8929252575",
      href: "tel:+918929252575",
    },
    {
      icon: MapPin,
      label: "Address",
      value: "D-160, Sector-8, Dwarka, New Delhi-110077 ",
      href: "https://www.google.com/maps/dir//Block+D,+Sector+8+Dwarka,+Dwarka,+New+Delhi,+Delhi,+110077/@28.56991,76.99041,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x390d1b08879148a5:0x8edcb8606c09a455!2m2!1d77.0728619!2d28.5699176?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D",
    },
  ];

  const linkClass =
    "text-sm text-text-secondary hover:text-primary transition-colors duration-200";

  return (
    <footer
      className={cn(
        "border-t border-primary/15 bg-linear-to-b from-secondary/15 via-primary/5 to-secondary",
        manrope.className,
      )}
    >
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center mb-5">
              <Link href="/" className="flex items-center">
                <ImageComponent
                  src="/logo.svg"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="h-10 sm:h-11 w-auto"
                  loading="eager"
                />
              </Link>
            </div>

            <p className="text-sm leading-relaxed text-text-secondary mb-7 max-w-xs">
              Empowering students and professionals with industry-relevant
              skills through comprehensive online courses and internship
              opportunities.
            </p>

            <div className="space-y-3.5">
              {contactInfo.map((contact, index) => (
                <div key={index} className="flex items-start gap-3">
                  <contact.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <Link
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(linkClass, "wrap-break-word")}
                  >
                    {contact.value}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-text-primary mb-4 tracking-wide uppercase">
              Platform
            </h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, index) => (
                <li key={index}>
                  {link.external ? (
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        linkClass,
                        "inline-flex items-center gap-1.5",
                      )}
                    >
                      {link.label}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    </Link>
                  ) : (
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-text-primary mb-4 tracking-wide uppercase">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-text-primary mb-4 tracking-wide uppercase">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <span className="text-sm font-semibold text-text-primary">
              Follow us
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary/80 transition-colors duration-200 hover:bg-primary/20 hover:text-primary"
                  aria-label={social.label}
                >
                  {isValidElement(social.icon)
                    ? cloneElement(
                        social.icon as ReactElement<{ className?: string }>,
                        {
                          className: cn(
                            "w-[18px] h-[18px] text-current",
                            (
                              social.icon as ReactElement<{
                                className?: string;
                              }>
                            ).props.className,
                          ),
                        },
                      )
                    : createElement(
                        social.icon as ElementType<{ className?: string }>,
                        { className: "w-[18px] h-[18px]" },
                      )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary/10 bg-primary/4">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-text-secondary text-center md:text-left">
              <span>© {currentYear} Edulyt. All rights reserved.</span>
              <Heart
                className="inline w-4 h-4 text-primary shrink-0"
                aria-hidden
              />
              <span>Made with love in India</span>
            </div>

            {/* Additional Links */}
            <div className="flex items-center gap-6 text-sm">
              {/* <Link
                href="/sitemap"
                className="text-gray-600 hover:text-orange-500 transition-colors"
              >
                Sitemap
              </Link> */}
              {/* <Link
                href="/accessibility"
                className="text-gray-600 hover:text-orange-500 transition-colors"
              >
                Accessibility
              </Link> */}
              {/* <Link
                href="/cookies"
                className="text-gray-600 hover:text-orange-500 transition-colors"
              >
                Cookies
              </Link> */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
