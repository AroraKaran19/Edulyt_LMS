"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import {
  FileText,
  Download,
  CheckCircle2,
  Phone,
} from "lucide-react";
import {
  SiTelegram,
  SiFacebook,
  SiYoutube,
} from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { RiWhatsappFill } from "react-icons/ri";
import { internshipDetails, socialLinks } from "@/constants/internshipData";

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  WhatsApp: RiWhatsappFill,
  Telegram: SiTelegram,
  LinkedIn: FaLinkedin,
  Facebook: SiFacebook,
  YouTube: SiYoutube,
};

const socialImages: Record<string, string> = {
  Instagram: "/assets/internships/instagram.svg",
};

const HeroSection = () => {
  return (
    <section
    className="relative px-4 sm:px-6 lg:px-16 py-6 sm:py-8 lg:py-12 overflow-hidden"
    style={{
      backgroundColor: "#FCF9F6",
      backgroundImage: `
        linear-gradient(45deg, rgba(247,113,36,0.14) 2px, transparent 2px),
        linear-gradient(-45deg, rgba(247,113,36,0.14) 2px, transparent 2px),
        linear-gradient(135deg, rgba(247,113,36,0.14) 2px, transparent 2px),
        linear-gradient(-135deg, rgba(247,113,36,0.14) 2px, transparent 2px)
      `,
      backgroundSize: "34px 34px",
    }}
  >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch">
        {/* Left Section - Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-transparent p-4 sm:p-6 lg:p-10 h-full flex flex-col justify-between min-h-[360px] sm:min-h-[420px] lg:min-h-[460px]">
          {/* 1. Title - Figma order */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
              <span className="text-gray-900 font-bold">Intensive</span>
              <div className="text-[#F77124] font-bold mt-1.5 sm:mt-2">
                Internship Program
              </div>
            </h1>
          </div>

          {/* 2. Key Features - orange check, dark text */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-5 mt-3 sm:mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 fill-[#F77124] text-white shrink-0 rounded-full" />
              <span className="text-[#2E2E2E] font-extrabold text-sm sm:text-base">
                Mentor-Led Live Sessions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 fill-[#F77124] text-white shrink-0 rounded-full" />
              <span className="text-[#2E2E2E] font-extrabold text-sm sm:text-base">
                Real Industry projects
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 fill-[#F77124] text-white shrink-0 rounded-full" />
              <span className="text-[#2E2E2E] font-extrabold text-sm sm:text-base">
                Online + Offline Modes
              </span>
            </div>
          </div>

          {/* 3. Description paragraph */}
          <p className="text-[#000000] text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed mt-4 font-medium">
            Gain hands-on experience, real project exposure, and learn
            directly from industry mentors- all in one structured,
            beginner-friendly internship program.
          </p>

          {/* 4. CTA Buttons - Job Description (solid), Download Brochure (outline) */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
            <button className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base text-white rounded-xl cursor-pointer bg-[#F77124] hover:bg-[#e86510] transition-colors font-semibold">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
              Job Description
            </button>
            <WhiteButton className="inline-flex items-center bg-[#FFF6F2] justify-center px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold border-2 border-[#F77124] text-[#F77124] rounded-xl hover:bg-[#F77124]/10">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
              Download Brochure
            </WhiteButton>
          </div>

          {/* 5. Bottom line - Figma */}
          <p className="text-[#000000] text-xs sm:text-xl mt-4 sm:mt-6">
            1000+ Students Trained | Beginner Friendly | Certification Included
          </p>
        </div>
      </div>

      {/* Right Section - Internship Details Panel */}
      <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl sm:rounded-3xl lg:rounded-[40px] shadow-xl border border-black/5 overflow-hidden">
          {/* Top White Section - Internship Details */}
          <div className="px-2 sm:px-6 lg:px-8 pt-2 sm:pt-4 lg:pt-6 space-y-3">
            <div className="flex items-center justify-between border-b border-black/5 pb-2 gap-2">
              <p className="text-xs sm:text-sm text-[#434343]/95 font-medium">Application Last Date</p>
              <div className="bg-[#D9D9D933] px-2 sm:px-6 py-1 sm:py-1.5 rounded-full shrink-0">
                <p className="text-xs sm:text-xs text-[#282727] font-semibold whitespace-nowrap">
                  {internshipDetails.applicationLastDate}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-black/5 pb-2 gap-2">
              <p className="text-xs sm:text-sm text-[#434343]/95 font-medium">Exam Date</p>
              <div className="bg-[#D9D9D933] px-2 sm:px-6 py-1 sm:py-1.5 rounded-full shrink-0">
                <p className="text-xs sm:text-xs text-[#282727] font-semibold whitespace-nowrap">
                  {internshipDetails.examDate}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-black/5 pb-2 gap-2">
              <p className="text-xs sm:text-sm text-[#434343]/95 font-medium">Internship Start Date</p>
              <div className="bg-[#D9D9D933] px-2 sm:px-6 py-1 sm:py-1.5 rounded-full shrink-0">
                <p className="text-xs sm:text-xs text-[#282727] font-semibold whitespace-nowrap">
                  {internshipDetails.internshipStartDate}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-black/5 pb-2 gap-2">
              <p className="text-xs sm:text-sm text-[#434343]/95 font-medium">WhatsApp Link</p>
              <Link
                href={internshipDetails.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-semibold bg-[#22C55E] text-white px-3 sm:px-5 py-1 sm:py-1.5 rounded-full cursor-pointer shrink-0 whitespace-nowrap"
              >
                Join Now
              </Link>
            </div>
            <div className="flex items-center justify-between border-b border-black/5 pb-2 gap-2">
              <p className="text-xs sm:text-sm text-[#434343]/95 font-medium">Certificate</p>
              <div className="bg-[#D9D9D933] px-2 sm:px-6 py-1 sm:py-1.5 rounded-full shrink-0">
                <p className="text-xs sm:text-xs text-[#282727] font-semibold whitespace-nowrap">
                  {internshipDetails.certificate}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-black/5 pb-2 gap-2">
              <p className="text-xs sm:text-sm text-[#434343]/95 font-medium">Mode</p>
              <div className="bg-[#D9D9D933] px-2 sm:px-6 py-1 sm:py-1.5 rounded-full shrink-0">
                <p className="text-xs sm:text-xs text-[#282727] font-semibold whitespace-nowrap">
                  {internshipDetails.mode}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-black/5 pb-6 gap-2">
              <p className="text-xs sm:text-sm text-[#434343]/95 font-medium">Language</p>
              <div className="bg-[#D9D9D933] px-2 sm:px-6 py-1 sm:py-1.5 rounded-full shrink-0">
                <p className="text-xs sm:text-xs text-[#282727] font-semibold whitespace-nowrap">
                  {internshipDetails.language}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Light Orange Section */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4">
            {/* Social Media Icons */}
            <div className="flex items-center justify-center gap-2 sm:gap-7 flex-wrap">
              {socialLinks.map((social, index) => {
                const iconImage = socialImages[social.label];
                const IconComponent = socialIcons[social.label] || null;
                if (!iconImage && !IconComponent) return null;

                const hasRadius = social.label === "Instagram" || social.label === "LinkedIn";

                return (
                  <Link
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "transition-colors duration-200 inline-flex",
                      hasRadius && "rounded-lg",
                      social.color
                    )}
                    aria-label={social.label}
                  >
                    {iconImage ? (
                      <Image
                        src={iconImage}
                        alt={social.label}
                        width={24}
                        height={24}
                        className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6 object-contain",
                          hasRadius && "rounded-lg"
                        )}
                      />
                    ) : (
                      IconComponent && <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* For Enquiry Text */}
            <p className="text-xs sm:text-sm font-bold text-gray-900 text-center">
              For Enquiry!
            </p>

            {/* Action Buttons - Figma order: Apply Now (solid) left, Call Us (outline) right */}
            <div className="flex flex-col items-stretch sm:flex-row gap-2 sm:gap-3">
              <button className="inline-flex items-center justify-center py-2.5 sm:py-3 text-xs sm:text-sm rounded-full px-3 sm:px-5 cursor-pointer font-semibold bg-[#F77124] text-white hover:bg-[#e86510] transition-colors">
                Apply Now
              </button>
              <button className="inline-flex items-center justify-center py-2.5 sm:py-3 text-xs sm:text-sm rounded-full px-3 sm:px-5 cursor-pointer font-semibold border-2 border-[#F77124] text-[#F77124] bg-white hover:bg-[#F77124]/5 transition-colors">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
                Call Us: {internshipDetails.phoneNumber}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default HeroSection;
