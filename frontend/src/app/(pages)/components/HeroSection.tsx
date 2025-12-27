"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import {
  FileText,
  Download,
  CheckCircle2,
  Phone,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";
import { internshipDetails, socialLinks } from "@/constants/internshipData";

// Custom WhatsApp SVG Icon
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-6 h-6", className)}
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
    className={cn("w-6 h-6", className)}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  WhatsApp: WhatsAppIcon,
  Telegram: TelegramIcon,
  Instagram,
  LinkedIn: Linkedin,
  Facebook,
  YouTube: Youtube,
};

const HeroSection = () => {
  return (
    <div className=" px-4 bg-white lg:px-8 xl:px-12 py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Section - Main Content */}
      <div className="lg:col-span-2 relative overflow-hidden">
        <div className="relative bg-white z-10 lg:p-12 h-full flex flex-col justify-between min-h-[500px]">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold">
              <span className="text-[#F77124] font-extrabold ">Intensive</span>{" "}
              <div className="text-gray-900 font-extrabold mt-3">Internship Program</div>
            </h1>
            <p className="text-black text-md lg:text-lg max-w-2xl leading-relaxed">
              Gain hands-on experience, real project exposure, and learn
              directly from industry mentors- all in one structured,
              beginner-friendly internship program.
            </p>
          </div>

          {/* Key Features */}
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 fill-[#F77124] text-[#fff] flex-shrink-0" />
              <span className="text-gray-800 font-bold text-base lg:text-lg">
                Mentor-Led Live Sessions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 fill-[#F77124] text-[#fff] flex-shrink-0" />
              <span className="text-gray-800 font-bold text-base lg:text-lg">
                Real Industry projects
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 fill-[#F77124] text-[#fff] flex-shrink-0" />
              <span className="text-gray-800 font-bold text-base lg:text-lg">
                Online + Offline Modes
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <div className="px-8 py-4 text-lg text-[#fff] rounded-2xl cursor-pointer bg-[#F77124] hover:bg-[#F77124]/90 transition-all duration-300 ease-in-out font-semibold">
              <FileText className="w-5 h-5 mr-2 inline" />
              Job Description
            </div>
            <WhiteButton className="px-8 py-4 text-lg font-semibold border-2 border-[#F77124] text-[#F77124] hover:bg-[#F77124]/10">
              <Download className="w-5 h-5 mr-2 inline" />
              Download Brochure
            </WhiteButton>
          </div>

          {/* Key Benefits */}
          <div className="mt-4">
            <p className="text-black text-sm lg:text-base">
              <span className="">1000+ Students Trained</span> |{" "}
              <span className="">Beginner Friendly</span> |{" "}
              <span className="">Certification Included</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Internship Details Panel */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-[40px] shadow-xl border border-gray-800/5 overflow-hidden">
          {/* Top White Section - Internship Details */}
          <div className="p-6 lg:p-8 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-800/10 pb-2">
              <p className="text-sm text-black/50 font-medium">Application Last Date</p>
              <div className="bg-[#D9D9D933] px-3 py-1.5 rounded-full">
                <p className="text-sm text-[#BCBCBC] font-semibold">
                  {internshipDetails.applicationLastDate}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-800/10 pb-2">
              <p className="text-sm text-black/50 font-medium">Exam Date</p>
              <div className="bg-[#D9D9D933] px-3 py-1.5 rounded-full">
                <p className="text-sm text-[#BCBCBC] font-semibold">
                  {internshipDetails.examDate}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-800/10 pb-2">
              <p className="text-sm text-black/50 font-medium">Internship Start Date</p>
              <div className="bg-[#D9D9D933] px-3 py-1.5 rounded-full">
                <p className="text-sm text-[#BCBCBC] font-semibold">
                  {internshipDetails.internshipStartDate}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-800/10 pb-2">
              <p className="text-sm text-black/50 font-medium">WhatsApp Link</p>
              <Link
                href={internshipDetails.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#BCBCBC] font-semibold bg-[#D9D9D933] px-3 py-1.5 rounded-full cursor-pointer"
              >
                  Join Now
              </Link>
            </div>
            <div className="flex items-center justify-between border-b border-gray-800/10 pb-2">
              <p className="text-sm text-black/50 font-medium">Certificate</p>
              <div className="bg-[#D9D9D933] px-3 py-1.5 rounded-full">
                <p className="text-sm text-[#BCBCBC] font-semibold">
                  {internshipDetails.certificate}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-800/10 pb-2">
              <p className="text-sm text-black/50 font-medium">Mode</p>
              <div className="bg-[#D9D9D933] px-3 py-1.5 rounded-full">
                <p className="text-sm text-[#BCBCBC] font-semibold">
                  {internshipDetails.mode}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/50 font-medium">Language</p>
              <div className="bg-[#D9D9D933] px-3 py-1.5 rounded-full">
                <p className="text-sm text-[#BCBCBC] font-semibold">
                  {internshipDetails.language}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Light Orange Section */}
          <div className="bg-[#F5691D1A] p-6 lg:p-8 space-y-4">
            {/* Social Media Icons */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {socialLinks.map((social, index) => {
                const IconComponent = socialIcons[social.label] || null;
                if (!IconComponent) return null;

                return (
                  <Link
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "transition-colors duration-200",
                      social.color
                    )}
                    aria-label={social.label}
                  >
                    <IconComponent className="w-6 h-6" />
                  </Link>
                );
              })}
            </div>

            {/* For Enquiry Text */}
            <p className="text-sm font-bold text-gray-900 text-center">
              For Enquiry!
            </p>

            {/* Action Buttons - Side by Side */}
            <div className="flex flex-col items-center justify-center sm:flex-row gap-3">
              <div className="py-3 border-2 border-[#F77124] hover:bg-[#F77124]/90 text-xs sm:text-sm rounded-full px-4 cursor-pointer font-semibold bg-[#F77124] text-[#fff]">
                <Phone className="w-4 h-4 mr-2 inline" />
                Call Us: {internshipDetails.phoneNumber}
              </div>
              <div className="py-3 text-xs sm:text-sm rounded-full text-center px-4 cursor-pointer font-semibold border-2 border-[#F77124] text-[#F77124] hover:bg-[#F77724]/10">
                <FileText className="w-4 h-4 mr-2 inline" />
                Apply Now
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default HeroSection;
