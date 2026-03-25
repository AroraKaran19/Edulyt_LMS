"use client";

import React from "react";
import Image from "next/image";
import { SiCodementor } from "react-icons/si";
import { PiCertificate } from "react-icons/pi";

/* ─── Orange label bar at bottom of each card ─── */
const LabelBar = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="bg-[#F77124] px-5 py-3.5 flex items-center gap-3 shrink-0">
    <span className="shrink-0 text-white">{icon}</span>
    <span className="text-sm font-bold text-white leading-tight">{label}</span>
  </div>
);

/* ─── Image card: image fills all space above the label bar ─── */
const ImageCard = ({
  src,
  alt,
  label,
  icon,
  className = "",
}: {
  src: string;
  alt: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)] ${className}`}
    style={{ position: "relative" }}
  >
    {/* img is a direct flex child — no wrapper div between it and label bar */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt={alt}
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        objectFit: "cover",
        display: "block",
        margin: 0,
        padding: 0,
        border: 0,
      }}
    />
    <LabelBar icon={icon} label={label} />
  </div>
);

const GlobalIcon = () => (
  /* eslint-disable-next-line @next/next/no-img-element */
  <img
    src="/assets/internships/Global-Learning.png"
    alt=""
    style={{ width: 28, height: 28, objectFit: "contain", filter: "brightness(0) invert(1)", display: "block" }}
  />
);

const MediaCertificateSection = () => {
  return (
    <section className="bg-[#FFFCFA] py-16 px-4 sm:px-6 lg:px-12 mt-16 lg:mt-24">
      {/* ── Title ── */}
      <div className="text-center mb-6 sm:mb-8 mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl max-w-lg mx-auto font-bold mb-3 sm:mb-4">
          <span className="text-[#F77124] font-extrabold">Media Section</span>{" "}
          <span className="text-gray-900 font-extrabold">with certificate</span>
        </h2>
        <p className="text-black text-sm sm:text-base lg:text-lg px-2 max-w-2xl mx-auto">
          Meet the industry professionals and mentors who will guide you through
          the internship, helping you build real skills and understand how the
          industry works.
        </p>
      </div>

      {/* ── Grid ──
          3 equal columns. Left col has 2 stacked cards. Center & right are single tall cards.
          Key: fixed height on the row container, flex children stretch to fill it.
      ── */}
      <div className="max-w-6xl mx-auto">
        <div
          className="hidden md:flex gap-5 lg:gap-7"
          style={{ height: 700 }}
        >
          {/* ── LEFT COLUMN: two cards stacked ── */}
          <div className="flex-1 flex flex-col gap-5 lg:gap-7">
            <ImageCard
              src="/assets/internships/MediaTL.png"
              alt="Student success story"
              label="See students success stories"
              icon={<GlobalIcon />}
              className="flex-1"
            />
            <ImageCard
              src="/assets/internships/MediaBL.png"
              alt="Student using laptop"
              label="See students success stories"
              icon={<GlobalIcon />}
              className="flex-1"
            />
          </div>

          {/* ── CENTER COLUMN: certificate card ── */}
          <ImageCard
            src="/assets/internships/MediaM.png"
            alt="Internship certificate"
            label="Earn industry recognised certificate"
            icon={<PiCertificate size={26} />}
            className="flex-1"
          />

          {/* ── RIGHT COLUMN: mentor card ── */}
          <ImageCard
            src="/assets/internships/MediaL.png"
            alt="Mentored by industry expert"
            label="Get mentored by industry experts"
            icon={<SiCodementor size={24} />}
            className="flex-1"
          />
        </div>

        {/* ── MOBILE: single column ── */}
        <div className="flex flex-col gap-4 md:hidden">
          {[
            { src: "/assets/internships/MediaTL.png", alt: "Student story", label: "See students success stories", icon: <GlobalIcon /> },
            { src: "/assets/internships/MediaBL.png", alt: "Student laptop", label: "See students success stories", icon: <GlobalIcon /> },
            { src: "/assets/internships/MediaM.png", alt: "Certificate", label: "Earn industry recognised certificate", icon: <PiCertificate size={24} /> },
            { src: "/assets/internships/MediaL.png", alt: "Mentor", label: "Get mentored by industry experts", icon: <SiCodementor size={22} /> },
          ].map((c, i) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
              <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.src} alt={c.alt}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <LabelBar icon={c.icon} label={c.label} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MediaCertificateSection;