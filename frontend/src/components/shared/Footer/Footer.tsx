import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Instagram,
  Facebook,
  ExternalLink,
  Heart,
  Youtube,
} from "lucide-react";

// Custom WhatsApp SVG Icon
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

// Custom Telegram SVG Icon
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
      color: "hover:text-green-500",
    },
    {
      label: "Telegram",
      href: "https://t.me/+_XxzFosKYOg2M2I9",
      icon: TelegramIcon,
      color: "hover:text-blue-500",
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/edulyt_india/",
      icon: Instagram,
      color: "hover:text-pink-500",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/edulytindia/",
      icon: Linkedin,
      color: "hover:text-blue-600",
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/people/Edulyt-India/100066801796718/",
      icon: Facebook,
      color: "hover:text-blue-700",
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@EdulytIndia",
      icon: Youtube,
      color: "hover:text-red-500",
    },
  ];

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "info@edulyt.com",
      href: "mailto:info@edulyt.com",
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

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.svg"
                  alt="Edulyt"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-xs">
              Empowering students and professionals with industry-relevant
              skills through comprehensive online courses and internship
              opportunities.
            </p>

            {/* Contact Information */}
            <div className="space-y-3">
              {contactInfo.map((contact, index) => (
                <div key={index} className="flex items-center gap-3">
                  <contact.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <Link
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-orange-500 transition-colors"
                  >
                    {contact.value}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
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
                      className="text-sm text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-orange-500 transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900">
                Follow us:
              </span>
              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => (
                  <Link
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "text-gray-400 hover:text-gray-600 transition-colors",
                      social.color
                    )}
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>© {currentYear} Edulyt. All rights reserved.</span>
              <Heart className="w-4 h-4 text-red-500" />
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
