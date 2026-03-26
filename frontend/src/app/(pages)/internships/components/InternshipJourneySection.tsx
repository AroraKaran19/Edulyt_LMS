"use client";

import { useEffect, useState } from "react";

const internshipJourneySteps = [
  {
    id: 1,
    title: "Apply",
    side: "right",
    items: [
      "Fill Out The Online Application Form",
      "Upload Resume & Academic Details",
      "Choose Your Preferred Domain",
      "Complete The Assessment Test",
    ],
  },
  {
    id: 2,
    title: "Selection & Offer Letter",
    side: "left",
    items: [
      "Application Reviewed By Our Team",
      "Receive Confirmation & Offer Letter",
      "Sign Internship Agreement",
      "Finish Onboarding Formalities",
    ],
  },
  {
    id: 3,
    title: "Joining & Orientation",
    side: "right",
    items: [
      "Attend Orientation Session",
      "Meet Your Mentor",
      "Get Access To LMS/Learning Tools",
      "Receive Internship Roadmap",
    ],
  },
  {
    id: 4,
    title: "Training & Mentorship",
    side: "left",
    items: [
      "Work On Real Or Simulated Industry Projects",
      "Join Weekly Mentorship Meetings",
      "Work On Guided Exercises",
      "Get Ongoing Doubt-Solving Support",
    ],
  },
  {
    id: 5,
    title: "Project Work",
    side: "right",
    items: [
      "Work On Real Or Simulated Industry Projects",
      "Submit Weekly Deliverables",
      "Attend Mid-Term Project Review",
      "Submit Final Project For Evaluation",
    ],
  },
  {
    id: 6,
    title: "Evaluation",
    side: "left",
    items: [
      "Assessment Of Assignments & Project",
      "Mentor Performance Review",
      "Participation & Professionalism Check",
      "Final Scorecard Issued",
    ],
  },
  {
    id: 7,
    title: "Internship Completion",
    side: "right",
    items: [
      "Present Final Project",
      "Attend Closing Session",
      "Submit Feedback",
      "Optional Exit Interview",
    ],
  },
  {
    id: 8,
    title: "Certification & Recognisation",
    side: "left",
    items: [
      "Internship Completion Certificate",
      "Experience Letter",
      "Letter Of Recommendation (Performance-Based)",
      "Digital Badge For LinkedIn/Resume",
    ],
  },
  {
    id: 9,
    title: "Post-Internship Support",
    side: "right",
    items: [
      "Resume & LinkedIn Enhancement",
      "Interview Preparation Support",
      "Placement Support (Referrals To Top Companies)",
      "PPO Opportunities For Top Performers",
    ],
  },
];

const CheckIcon = ({ size = 26 }) => (
  <div className="shrink-0 ">
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="10" fill="none" stroke="#F77124" strokeWidth="5.5" />
      <path d="M9.5 13L11.5 15L16.5 10" stroke="#F77124" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const CONNECTOR_ZONE = 14; // left zone for vertical bar + horizontal connectors

// Responsive StepCard Component
const StepCard = ({ step, isMobile = false }: { step: (typeof internshipJourneySteps)[number]; isMobile?: boolean }) => {
  const ICON_SIZE = isMobile ? 22 : 26;
  const GAP = isMobile ? 6 : 7;
  const items = step.items ?? [];
  const lineTop = ICON_SIZE / 2;
  const lineBottom = (items.length - 1) * (ICON_SIZE + GAP) + ICON_SIZE / 2;
  const lineHeight = lineBottom - lineTop + 35;
  const CONNECTOR_ZONE = isMobile ? 32 : 40; // Smaller on mobile
  const lineCenterX = CONNECTOR_ZONE / 2;
  const horizontalWidth = CONNECTOR_ZONE - lineCenterX;

  return (
    <div className={`
      bg-white rounded-lg sm:rounded-2xl border-2 border-[#e8a87c] 
      relative px-3 sm:px-4 py-2.5 sm:py-3.5 
      shadow-[0_0_0_2px_sm:shadow-[0_0_0_4px_rgba(232,168,124,0.30)]
      ${isMobile ? 'w-[280px]' : 'w-[360px] sm:w-[400px]'}
    `}>
      <h3 className="text-[#F77124] font-extrabold text-xs sm:text-sm md:text-base mb-2 sm:mb-2.5 tracking-tight line-clamp-2">
        {step.title}
      </h3>

      <div className="relative pl-3.5 sm:pl-3.5">
        {/* Vertical dashed bar */}
        <div
          className="absolute border-l-2 border-dashed border-gray-300 z-0 w-0"
          style={{
            left: lineCenterX - 1,
            top: lineTop,
            height: lineHeight - 30,
          }}
        />
        {/* Horizontal connector at first point */}
        <div
          className="absolute border-t-2 border-dashed border-gray-300 z-0"
          style={{
            left: lineCenterX - 1,
            top: lineTop - 1,
            width: horizontalWidth,
          }}
        />

        <div className={`flex flex-col gap-[7px]`}>
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center bg-[#fff3ec] -ml-2 md:-ml-1 rounded-full gap-1.5 sm:gap-2 relative z-10"
            >
              <span className="h-full flex items-center justify-center">
                <CheckIcon size={20} />
              </span>
              <div className="bg-[#fff3ec] rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs md:text-[12px] text-gray-900 leading-snug font-medium line-clamp-2">
                  {item}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StepCircle = ({ id }: { id: number }) => (
  <div className="relative w-12 h-12 md:w-[88px] md:h-[88px] shrink-0 z-10 flex items-center justify-center">
    <div className="absolute inset-0 rounded-full bg-[#fffbf8] z-1" />
    <div className="absolute inset-0 rounded-full border border-[#F77124] z-2" />
    <div className="absolute inset-[7px] rounded-full bg-[#F77124] z-2" />
    <div className="absolute inset-4 rounded-full bg-white z-2" />
    <span className="relative z-3 text-[#F77124] font-black md:text-[32px] leading-none">{id}</span>
    <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-[3px] border-[#F77124] z-4" />
    <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-[3px] border-[#F77124] z-4" />
  </div>
);

const ROW_HEIGHT = 190;

export default function InternshipJourneySection() {

  // Add this hook to detect screen size
  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
  };

  // Then in your component:
  const isMobile = useIsMobile();

  return (
    <div className="bg-[#fffbf8] px-6 pt-12 pb-20 min-h-screen">
      {/* Title */}
      <div className="text-center mb-6 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
          <span className="text-gray-900 font-extrabold">Your </span>
          <span className="text-[#F77124] font-extrabold">Internship </span>
          <span className="text-gray-900 font-extrabold">Journey</span>
        </h2>
        <p className="text-black text-sm sm:text-base lg:text-lg max-w-4xl mx-auto px-2">
          A simple, step-by-step process to help you start, learn, and successfully complete your internship.
        </p>
      </div>

      {/* Timeline */}
      <div
        className="max-w-[860px] mx-auto relative md:mt-20"
        style={{ height: internshipJourneySteps.length * ROW_HEIGHT }}
      >
        {/* Vertical dashed center line */}
        <div className="absolute left-10 md:left-1/2 -translate-x-1/2 top-16 md:top-11 bottom-11 border-l-2 border-dashed border-gray-300 z-1" />

        {internshipJourneySteps.map((step, index) => {
          const isRight = step.side === "right";
          const topCenter = index * ROW_HEIGHT + ROW_HEIGHT / 2;

          return (
            <div key={step.id}>
              {/* Circle */}
              <div
                className="absolute md:left-1/2 left-10 z-10"
                style={{ top: topCenter, transform: "translate(-50%, -50%)" }}
              >
                <StepCircle id={step.id} />
              </div>
              {/* Mobile: Always right with responsive spacing */}
              <div className="md:hidden relative w-10 bg-red-500">
                <div
                  className="absolute border-t-2 border-dashed border-gray-300 z-2"
                  style={{ left: "calc(50% + 32px)", top: topCenter, width: 50, transform: "translateY(-50%)" }}
                />
                <div
                  className="absolute z-2"
                  style={{ left: "calc(50% + 80px)", top: topCenter, transform: "translateY(-50%)" }}
                >
                  <StepCard step={step} isMobile />
                </div>
              </div>
              {isMobile || isRight ? (
                // Always right on mobile, or right on desktop when isRight is true
                <>


                  {/* Desktop: Alternate sides */}
                  <div className="hidden md:block">
                    <div
                      className="absolute border-t-2 border-dashed border-gray-300 z-2"
                      style={{ left: "calc(50% + 44px)", top: topCenter, width: 60, transform: "translateY(-50%)" }}
                    />
                    <div
                      className="absolute z-2"
                      style={{ left: "calc(50% + 104px)", top: topCenter, transform: "translateY(-50%)" }}
                    >
                      <StepCard step={step} />
                    </div>
                  </div>
                </>
              ) : (
                // Left side on desktop only
                <>
                  <div
                    className="absolute border-t-2 border-dashed border-gray-300 z-2"
                    style={{ right: "calc(50% + 44px)", top: topCenter, width: 60, transform: "translateY(-50%)" }}
                  />
                  <div
                    className="absolute z-2"
                    style={{ right: "calc(50% + 104px)", top: topCenter, transform: "translateY(-50%)" }}
                  >
                    <StepCard step={step} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
