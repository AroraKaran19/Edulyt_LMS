import Image from "next/image";
import {
  technologyRequirements,
  whoCanJoinOptions,
  internshipKeyBenefits,
} from "@/constants/internshipData";
import {
  FaLaptop,
  FaWifi,
  FaGlobe,
  FaMicrophone,
  FaGraduationCap,
  FaUsers,
  FaCheck,
} from "react-icons/fa";

const PrerequisitesSection = () => {
  const techItems = [
    { label: technologyRequirements[0], Icon: FaLaptop },
    { label: technologyRequirements[1], Icon: FaWifi },
    { label: technologyRequirements[2], Icon: FaGlobe },
    { label: technologyRequirements[3], Icon: FaMicrophone },
  ];

  const whoItems = [
    { label: whoCanJoinOptions[0], Icon: FaGraduationCap },
    { label: whoCanJoinOptions[1], Icon: FaUsers },
    { label: whoCanJoinOptions[2], Icon: FaGraduationCap, iconImage: "/assets/internships/Begiineers.svg" },
  ];

  const benefits = internshipKeyBenefits.map((label) => ({ label }));

  return (
    <section className="px-4 sm:px-6 lg:px-24 mt-12 sm:mt-16 lg:mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-center">
        {/* Left Section - Text Content */}
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            <span className="text-[#F77124] font-extrabold">Pre-Requisites:</span>
            <div className="text-gray-900 font-extrabold mt-1 sm:mt-2">
              Technology Requirements
            </div>
          </h2>
          <p className="text-black text-sm sm:text-base mt-3 sm:mt-4 max-w-3xl leading-relaxed">
            To Ensure A Smooth Learning Experience During The Internship, Students Are
            Expected To Have The Following Basic Technology Setup.
          </p>

          {/* Technology Requirements */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            {techItems.map(({ label, Icon }, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F77124] text-white shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-black text-sm sm:text-base font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Who Can Join */}
          <div className="mt-12">
            <h3 className="text-lg sm:text-2xl font-extrabold">
              <span className="text-[#F77124]">Who</span>{" "}
              <span className="text-gray-900">Can Join ?</span>
            </h3>
            <div className="mt-4 flex flex-wrap gap-4 sm:gap-6">
              {whoItems.map(({ label, Icon, iconImage }, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F77124] text-white shrink-0 p-1.5">
                    {iconImage ? (
                      <Image
                        src={iconImage}
                        alt={label}
                        width={20}
                        height={20}
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <p className="text-black text-sm sm:text-base font-medium">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div className="mt-8">
            <div className="max-w-3xl rounded-3xl border-2 border-[#F77124] bg-white shadow-[0_0_0_2px_rgba(247,113,36,0.08)] px-4 sm:px-6 py-4 sm:py-5">
              <p className="text-sm sm:text-lg font-bold">
                <span className="text-[#F77124]">Key</span>{" "}
                <span className="text-gray-900">Benefits</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                {benefits.map(({ label }, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F77124] text-white">
                      <FaCheck className="h-2.5 w-2.5" />
                    </span>
                    <p className="text-xs sm:text-base text-black font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Image */}
        <div className="h-full w-full flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-md lg:max-w-lg">
            <Image
              src="/assets/PreRequisiteImage.png"
              alt="Technology requirements"
              width={640}
              height={640}
              className="object-cover rounded- w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrerequisitesSection;
