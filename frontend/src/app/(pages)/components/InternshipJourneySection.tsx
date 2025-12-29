import Image from "next/image";
import { internshipJourneySteps } from "@/constants/internshipData";

const InternshipJourneySection = () => {
  // Show all 6 steps including certificate
  const displaySteps = internshipJourneySteps.slice(0, 6);

  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:pt-12 bg-[#fffbf8]">
      {/* Title Section */}
      <div className="text-center mb-12 max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-900 font-extrabold">Your</span>{" "}
          <span className="text-[#F77124] font-extrabold">Internship </span>
          <span className="text-gray-900 font-extrabold">Journey</span>
        </h2>
        <p className="text-black text-base lg:text-lg mt-4">
          A simple, step-by-step process to help you start, learn, and
          successfully complete your internship.
        </p>
      </div>

      {/* Timeline Section */}
      <div className="max-w-7xl mx-auto">
        {/* Mobile (stacked timeline) */}
        <div className="md:hidden">
          <div className="relative pl-14">
            {/* Left vertical dashed line - only between first and last circle centers */}
            <div className="absolute left-7 top-[60px] bottom-[60px] w-px border-l-2 border-dashed border-gray-200" />

            <div className="space-y-8">
              {displaySteps.map((step) => (
                <div key={step.id} className="relative">
                  {/* Circle */}
                  <div className="absolute -left-7 top-[33%] -translate-x-1/2 z-10">
                    <Image
                      src="/assets/Circle1.png"
                      alt="Circle"
                      width={56}
                      height={56}
                      className="w-12 h-12"
                      priority
                    />
                  </div>

                  {/* Connecting Line from circle to box */}
                  <div className="absolute left-0 top-[50%] z-0">
                    <div className="border-t-2 border-dashed border-gray-200 w-2"></div>
                  </div>

                  {/* Card */}
                  <div className="ml-2">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-[#F77124]">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop (keep exactly same as current) */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Steps */}
            <div className="relative space-y-12">
              {/* Vertical Dotted Line - only between first and last circle centers */}
              <div className="absolute left-1/2 top-[40px] bottom-[40px] w-0.5 border-l-2 border-dashed border-gray-200 transform -translate-x-1/2 hidden md:block z-0"></div>

              {displaySteps.map((step, index) => (
                <div key={step.id} className="flex items-center relative">
                  {/* Circle - Absolutely positioned at center */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                    <Image
                      src="/assets/Circle1.png"
                      alt="Circle"
                      width={64}
                      height={64}
                      className="w-24 h-24"
                      priority
                    />
                  </div>

                  {/* Right Box (for even indices: 0, 2, 4) - swapped from left */}
                  {index % 2 === 0 ? (
                    <>
                      {/* Empty space for alignment */}
                      <div className="flex-1 hidden md:block"></div>

                      {/* Connecting Line from center circle to right box */}
                      <div className="absolute left-1/2 z-0 flex items-center w-40 lg:w-48">
                        <div className="border-t-2 border-dashed border-gray-200 w-full"></div>
                      </div>

                      {/* Right Box */}
                      <div className="flex-1 ml-16 lg:ml-96 text-left">
                        <div className="bg-white rounded-xl p-6 shadow-sm inline-block max-w-md">
                          <h3 className="text-xl font-bold text-[#F77124] mb-2">
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Left Box (for odd indices: 1, 3, 5) - swapped from right */}
                      <div className="flex-1 mr-16 lg:mr-96 text-left">
                        <div className="bg-white rounded-xl p-6 shadow-sm inline-block max-w-md">
                          <h3 className="text-xl font-bold text-[#F77124] mb-2">
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* Connecting Line from left box to center circle */}
                      <div className="absolute left-1/2 transform -translate-x-full z-0 flex items-center w-40 lg:w-48">
                        <div className="border-t-2 border-dashed border-gray-200 w-full"></div>
                      </div>

                      {/* Empty space for alignment */}
                      <div className="flex-1 hidden md:block"></div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipJourneySection;
